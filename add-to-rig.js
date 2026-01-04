
let selectedPedalId = null;
let catalogReady = false;

$(document).ready(() => {
  $('#goToRigs').hide();
  $('#addToRig').hide();
});

// Show "Add to Rig" button when catalog is ready
function observeCatalogLoaded() {
  const catalogNode = document.getElementById('catalog');

  if (!catalogNode) return;

  const observer = new MutationObserver(() => {
    if (catalogNode.children.length > 0) {
      catalogReady = true;
      $('#goToRigs').fadeIn();
      observer.disconnect();
    }
  });

  observer.observe(catalogNode, { childList: true });
}

document.addEventListener('DOMContentLoaded', observeCatalogLoaded);

// Detect pedal ID from URL and show "Add to Rig" button
function detectPedalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');

  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').fadeIn();
  }
}

document.addEventListener('DOMContentLoaded', detectPedalFromUrl);




// Global function to ensure that a pedalboard exists for the current user (guest or logged in)
async function ensurePedalboardExists() {
  const role = window.currentUser?.role || 'guest';

  // ---------------- GUEST ----------------
  if (role === 'guest') {
    let boards = JSON.parse(localStorage.getItem('guestPedalboard') || '[]');

    // guest può avere MAX 1 board
    if (boards.length === 0) {
      const { value: boardName } = await Swal.fire({
        title: 'Create your Rig',
        input: 'text',
        inputPlaceholder: 'My first Rig',
        showCancelButton: true,
        confirmButtonText: 'Create',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary',
          cancelButton: 'bx--btn bx--btn--secondary'
        },
        inputValidator: v => !v && 'Rig name required'
      });

      if (!boardName) throw 'cancelled';

      const newBoard = {
        board_name: boardName,
        pedals: []
      };

      boards = [newBoard];
      localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    }

    return {
      mode: 'guest',
      boardIndex: 0
    };
  }

  // ---------------- LOGGED USER ----------------
  const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: window.currentUser.userid })
  });

  const data = await res.json();
  const boards = data.docs || [];

  // Nessuna pedaliera → creane una
  if (boards.length === 0) {
    const { value: boardName } = await Swal.fire({
      title: 'Create your first Rig',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Create',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary'
      },
      inputValidator: v => !v && 'Rig name required'
    });

    if (!boardName) throw 'cancelled';

    const token = localStorage.getItem('authToken');

    await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_PEDALBOARD.php', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        board_name: boardName,
        user_id: window.currentUser.userid
      })
    });

    return {
      mode: 'logged',
      boardIndex: 0
    };
  }

  // Più pedaliere → scegli
  if (boards.length > 1) {
    const options = {};
    boards.forEach((b, i) => options[i] = b.board_name || `Rig ${i + 1}`);

    const { value } = await Swal.fire({
      title: 'Select Rig',
      input: 'select',
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: 'Add',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary'
      }
    });

    if (value === undefined) throw 'cancelled';

    return {
      mode: 'logged',
      boardIndex: parseInt(value, 10)
    };
  }

  // Una sola pedaliera
  return {
    mode: 'logged',
    boardIndex: 0
  };
}


// Main function to add a pedal to a rig from gears page
async function addPedalToRig(pedalId) {
  try {
    const { mode, boardIndex } = await ensurePedalboardExists();

    // ---------------- GUEST ----------------
    if (mode === 'guest') {
      const boards = JSON.parse(localStorage.getItem('guestPedalboard'));
      boards[0].pedals.push({
        pedal_id: pedalId,
        rotation: 0,
        row: 1
      });
      localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    }

    // ---------------- LOGGED ----------------
    if (mode === 'logged') {
      localStorage.setItem('lastPedalboardId', boardIndex);
      localStorage.setItem('pendingPedalAdd', JSON.stringify({
        pedal_id: pedalId,
        rotation: 0,
        row: 1
      }));
    }

    // Redirect
    window.location.href = `${window.location.origin}/PedalPlex/rigs`;

  } catch (e) {
    if (e !== 'cancelled') console.error(e);
  }
}

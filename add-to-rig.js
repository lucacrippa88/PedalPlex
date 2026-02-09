let selectedPedalId = null;
let catalogReady = false;

$(document).ready(() => {
  $('#goToRigs').hide();
  $('#addToRig').hide();

  // Get gear from url and show "Add to Rig" if present
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');
  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show();
  }
});

// Observer to show "Go to Rigs" button when catalog is loaded
function observeCatalogLoaded() {
  const catalogNode = document.getElementById('catalog');
  if (!catalogNode) return;

  const observer = new MutationObserver(() => {
    if (catalogNode.children.length > 0) {
      catalogReady = true;
      $('#goToRigs').show();
      observer.disconnect();
    }
  });

  observer.observe(catalogNode, { childList: true });
}

document.addEventListener('DOMContentLoaded', observeCatalogLoaded);

// Detect pedal from url and add to rig
function detectPedalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');

  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show();
  }
}

document.addEventListener('DOMContentLoaded', detectPedalFromUrl);

// Reset selected pedal when category filter changes
$('#categoryFilter').on('change', () => {
  selectedPedalId = null;
  $('#addToRig').hide();
});

// Check rig existance
async function ensurePedalboardExists() {
  const role = window.currentUser?.role || 'guest';

  // Guest =======
  if (role === 'guest') {
    let boards = JSON.parse(localStorage.getItem('guestPedalboard') || '[]');

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

    return { mode: 'guest', boardIndex: 0 };
  }

  // Logged-in =======
  const res = await fetch('https://api.pedalplex.com/GET_PEDALBOARD.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: window.currentUser.userid })
  });

  const data = await res.json();
  const boards = data.docs || [];

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
    await fetch('https://api.pedalplex.com/CREATE_PEDALBOARD.php', {
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

    return { mode: 'logged', boardIndex: 0 };
  }

  // Select rig from list if multiple are present
  if (boards.length > 1) {
    const options = {};
    boards.forEach(b => options[b._id] = b.board_name);

    const { value: selectedBoardId } = await Swal.fire({
      title: 'Select Rig',
      input: 'select',
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: 'Add',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary'
      },
      willOpen: () => {
        const defaultId = Object.keys(options)[0];
        localStorage.setItem('lastPedalboardId', defaultId);
        localStorage.setItem('lastPedalboardText', options[defaultId]);
      }
    });

    if (!selectedBoardId) throw 'cancelled';

    localStorage.setItem('lastPedalboardId', selectedBoardId);
    localStorage.setItem('lastPedalboardText', options[selectedBoardId]);

    return {
      mode: 'logged',
      boardIndex: selectedBoardId
    };
  }

  // Select only rig if one is present
  return { mode: 'logged', boardIndex: boards[0]._id };
}

// Add a pedal to rig
async function addPedalToRig(pedalId) {
  console.log('addPedalToRig CALLED', pedalId);

  try {
    const { mode, boardIndex } = await ensurePedalboardExists();
    console.log('MODE:', mode, 'BOARD:', boardIndex);

    if (mode === 'guest') {
      const boards = JSON.parse(localStorage.getItem('guestPedalboard'));
      boards[0].pedals.push({ pedal_id: pedalId, rotation: 0, row: 1 });
      localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    }

    if (mode === 'logged') {
      // Localstorage set data
      localStorage.setItem('pendingPedalAdd', JSON.stringify({
        pedal_id: pedalId,
        rotation: 0,
        row: 1
      }));
      localStorage.setItem('lastPedalboardId', boardIndex); // For coherence
    }

    // Finally go to Rigs page
    window.location.href = `${window.location.origin}/rigs`;

  } catch (e) {
    if (e !== 'cancelled') console.error(e);
  }
}

// Click handler for "Add to Rig" button
$('#addToRig').on('click', function (e) {
  e.preventDefault();
  if (!selectedPedalId) return;
  addPedalToRig(selectedPedalId);
});

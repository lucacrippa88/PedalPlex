// ===============================
// add-to-rig.js
// ===============================

let selectedPedalId = null;
let catalogReady = false;

$(document).ready(() => {
  $('#goToRigs').hide();
  $('#addToRig').hide();

  // Rileva subito il pedale da URL
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');
  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show(); // mostra secco
  }
});

// Observer catalogo per mostrare "Go to Rigs"
function observeCatalogLoaded() {
  const catalogNode = document.getElementById('catalog');
  if (!catalogNode) return;

  const observer = new MutationObserver(() => {
    if (catalogNode.children.length > 0) {
      catalogReady = true;
      $('#goToRigs').show(); // mostra secco
      observer.disconnect();
    }
  });

  observer.observe(catalogNode, { childList: true });
}

document.addEventListener('DOMContentLoaded', observeCatalogLoaded);

// ===============================
// Rileva pedal selezionato dall'URL e mostra "Add to Rig"
// ===============================
function detectPedalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');

  if (pedalId) {
    selectedPedalId = pedalId;

    // Mostra subito il pulsante "Add to Rig" anche se il catalogo non è pronto
    $('#addToRig').show();
  }
}

document.addEventListener('DOMContentLoaded', detectPedalFromUrl);

// ===============================
// Click sul pulsante Add to Rig
// ===============================
$('#addToRig').on('click', function (e) {
  e.preventDefault();
  if (!selectedPedalId) return;
  addPedalToRig(selectedPedalId);
});

// ===============================
// Reset pedal selezionato quando si cambia categoria
// ===============================
$('#categoryFilter').on('change', () => {
  selectedPedalId = null;
  $('#addToRig').hide();
});

// ===============================
// Assicura che esista una pedalboard
// ===============================
async function ensurePedalboardExists() {
  const role = window.currentUser?.role || 'guest';

  // ---------------- GUEST ----------------
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

  // Più pedaliere → scegli quale usare
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

// ===============================
// Aggiunge un pedale alla pedalboard
// ===============================
async function addPedalToRig(pedalId) {
  console.log('addPedalToRig CALLED', pedalId);

  try {
    const { mode, boardIndex } = await ensurePedalboardExists();
    console.log('MODE:', mode, 'BOARD:', boardIndex);

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
      console.log('WRITING pendingPedalAdd');
      localStorage.setItem('lastPedalboardId', boardIndex);
      localStorage.setItem('pendingPedalAdd', JSON.stringify({
        pedal_id: pedalId,
        rotation: 0,
        row: 1
      }));
    }

    localStorage.getItem('pendingPedalAdd') // test

    // Redirect alla pagina rig
    window.location.href = `${window.location.origin}/PedalPlex/rigs`;

  } catch (e) {
    if (e !== 'cancelled') console.error(e);
  }
}





$(document).on('click', '#addToRig', function (e) {
  e.preventDefault();

  console.log('ADD TO RIG CLICK');

  if (!selectedPedalId) {
    console.warn('No selectedPedalId');
    return;
  }

  addPedalToRig(selectedPedalId);
});

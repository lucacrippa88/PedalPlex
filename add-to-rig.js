// ===============================
// add-to-rig.js
// ===============================

let selectedPedalId = null;
let catalogReady = false;

$(document).ready(() => {
  $('#goToRigs').hide();
  $('#addToRig').hide();

  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');
  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show();
  }
});

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

function detectPedalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');

  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show();
  }
}

document.addEventListener('DOMContentLoaded', detectPedalFromUrl);

$('#addToRig').on('click', function (e) {
  e.preventDefault();
  if (!selectedPedalId) return;
  addPedalToRig(selectedPedalId);
});

$('#categoryFilter').on('change', () => {
  selectedPedalId = null;
  $('#addToRig').hide();
});

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

      const newBoard = { board_name: boardName, pedals: [] };
      boards = [newBoard];
      localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    }

    return { mode: 'guest', boardId: boards[0].board_id || 'guest-0', boardName: boards[0].board_name };
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
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ board_name: boardName, user_id: window.currentUser.userid })
    });

    return { mode: 'logged', boardId: 'new', boardName };
  }

  // Più pedaliere → scegli quale usare
  if (boards.length > 1) {
    const options = {};
    const idMap = {}; // map indice → id
    boards.forEach((b, i) => {
      options[i] = b.board_name || `Rig ${i+1}`;
      idMap[i] = b._id;
    });

    const { value } = await Swal.fire({
      title: 'Select Rig',
      input: 'select',
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: 'Add',
      customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' },
      didOpen: () => {
        const selectEl = document.querySelector('.swal2-select');
        if (selectEl) {
          selectEl.addEventListener('change', (e) => {
            const idx = e.target.value;
            localStorage.setItem('lastPedalboardId', idMap[idx]);
            localStorage.setItem('lastPedalboardText', boards[idx].board_name);
          });
        }
      }
    });

    if (value === undefined) throw 'cancelled';

    const selectedId = idMap[value];
    const selectedName = boards[value].board_name;

    // Aggiorna localStorage
    localStorage.setItem('lastPedalboardId', selectedId);
    localStorage.setItem('lastPedalboardText', selectedName);

    return { mode: 'logged', boardId: selectedId, boardName: selectedName };
  }

  // Una sola pedaliera
  const onlyBoard = boards[0];
  localStorage.setItem('lastPedalboardId', onlyBoard._id);
  localStorage.setItem('lastPedalboardText', onlyBoard.board_name);
  return { mode: 'logged', boardId: onlyBoard._id, boardName: onlyBoard.board_name };
}

// ===============================
// Aggiunge un pedale alla pedalboard
// ===============================
async function addPedalToRig(pedalId) {
  console.log('addPedalToRig CALLED', pedalId);

  try {
    const { mode, boardId, boardName } = await ensurePedalboardExists();
    console.log('MODE:', mode, 'BOARD_ID:', boardId, 'BOARD_NAME:', boardName);

    if (mode === 'guest') {
      const boards = JSON.parse(localStorage.getItem('guestPedalboard'));
      boards[0].pedals.push({ pedal_id: pedalId, rotation: 0, row: 1 });
      localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    }

    if (mode === 'logged') {
      localStorage.setItem('pendingPedalAdd', JSON.stringify({ pedal_id: pedalId, rotation: 0, row: 1 }));
    }

    window.location.href = `${window.location.origin}/PedalPlex/rigs`;
  } catch (e) {
    if (e !== 'cancelled') console.error(e);
  }
}

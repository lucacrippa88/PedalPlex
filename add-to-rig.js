// ===============================
// add-to-rig.js
// ===============================

let selectedPedalId = null;

$(document).ready(() => {
  $('#goToRigs').hide();
  $('#addToRig').hide();

  // Pedale da URL
  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');
  if (pedalId) {
    selectedPedalId = pedalId;
    $('#addToRig').show();
  }
});

// Mostra Go to Rigs quando il catalogo è pronto
(function observeCatalogLoaded() {
  const catalogNode = document.getElementById('catalog');
  if (!catalogNode) return;

  const observer = new MutationObserver(() => {
    if (catalogNode.children.length > 0) {
      $('#goToRigs').show();
      observer.disconnect();
    }
  });

  observer.observe(catalogNode, { childList: true });
})();

// Click Add to Rig — UNO SOLO
$('#addToRig').on('click', async function (e) {
  e.preventDefault();
  if (!selectedPedalId) return;
  await addPedalToRig(selectedPedalId);
});

// Reset quando cambia categoria
$('#categoryFilter').on('change', () => {
  selectedPedalId = null;
  $('#addToRig').hide();
});

// ===============================
// CORE LOGIC
// ===============================
async function addPedalToRig(pedalId) {
  const role = window.currentUser?.role || 'guest';

  // ---------------- GUEST ----------------
  if (role === 'guest') {
    let boards = JSON.parse(localStorage.getItem('guestPedalboard') || '[]');

    if (boards.length === 0) {
      const { value: name } = await Swal.fire({
        title: 'Create your Rig',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Create'
      });
      if (!name) return;

      boards = [{ board_name: name, pedals: [] }];
    }

    boards[0].pedals.push({
      pedal_id: pedalId,
      rotation: 0,
      row: 1
    });

    localStorage.setItem('guestPedalboard', JSON.stringify(boards));
    window.location.href = `${window.location.origin}/PedalPlex/rigs`;
    return;
  }

  // ---------------- LOGGED ----------------
  const res = await fetch(
    'https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: window.currentUser.userid })
    }
  );

  const data = await res.json();
  const boards = data.docs || [];

  let selectedBoard = null;

  if (boards.length === 0) {
    const { value: name } = await Swal.fire({
      title: 'Create your first Rig',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'Create'
    });
    if (!name) return;

    await fetch(
      'https://www.cineteatrosanluigi.it/plex/CREATE_PEDALBOARD.php',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          board_name: name,
          user_id: window.currentUser.userid
        })
      }
    );

    window.location.href = `${window.location.origin}/PedalPlex/rigs`;
    return;
  }

  if (boards.length === 1) {
    selectedBoard = boards[0];
  } else {
    const options = {};
    boards.forEach(b => options[b._id] = b.board_name);

    const { value } = await Swal.fire({
      title: 'Select Rig',
      input: 'select',
      inputOptions: options,
      showCancelButton: true,
      confirmButtonText: 'Add'
    });

    if (!value) return;
    selectedBoard = boards.find(b => b._id === value);
  }

  // 🔴 QUI È IL FIX CHIAVE
  localStorage.setItem('lastPedalboardId', selectedBoard._id);
  localStorage.setItem('lastPedalboardText', selectedBoard.board_name);
  localStorage.setItem(
    'pendingPedalAdd',
    JSON.stringify({
      pedal_id: pedalId,
      rotation: 0,
      row: 1
    })
  );

  window.location.href = `${window.location.origin}/PedalPlex/rigs`;
}

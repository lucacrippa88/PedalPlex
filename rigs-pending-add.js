// ===============================
// rigs-pending-add.js
// ===============================

(async function () {

  const pendingRaw = localStorage.getItem('pendingPedalAdd');
  if (!pendingRaw) return;

  const pending = JSON.parse(pendingRaw);
  const boardId = localStorage.getItem('lastPedalboardId');

  if (!boardId) {
    cleanup();
    return;
  }

  // Attendiamo che rigs.js abbia caricato tutto
  const waitForRigs = setInterval(async () => {

    if (!window.pedalboards || !Array.isArray(window.pedalboards)) {
      return;
    }

    const board = window.pedalboards.find(
      b => String(b.board_id) === String(boardId)
    );

    if (!board) return;

    clearInterval(waitForRigs);

    // Inserimento pedale
    board.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    // Salvataggio (usa la tua funzione esistente)
    await savePedalboard(board);

    cleanup();

    Swal.fire({
      icon: 'success',
      title: 'Pedal added to your Rig',
      toast: true,
      timer: 1200,
      position: 'top-end',
      showConfirmButton: false
    });

  }, 100);

  function cleanup() {
    localStorage.removeItem('pendingPedalAdd');
  }

})();


// ===============================
// rigs-pending-add.js
// ===============================

(async function () {

  const pendingRaw = localStorage.getItem('pendingPedalAdd');
  if (!pendingRaw) return;

  const pending = JSON.parse(pendingRaw);
  const boardId = localStorage.getItem('lastPedalboardId');
  if (!boardId) return cleanup();

  const waitForRigs = setInterval(() => {
    // aspettiamo che rigs.js abbia completato bootstrap
    if (
      !window.allPedalboards ||
      !Array.isArray(window.allPedalboards) ||
      !window.allPedalboards[boardId] ||
      typeof savePedalboard !== 'function'
    ) {
      return;
    }

    clearInterval(waitForRigs);

    // aggiungiamo il pedale nella pedalboard selezionata dal localStorage
    const board = window.allPedalboards[boardId];
    board.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    // Salviamo usando la funzione nativa di rigs.js
    savePedalboard(board);

    Swal.fire({
      icon: 'success',
      title: 'Pedal added to your Rig',
      toast: true,
      timer: 1200,
      position: 'top-end',
      showConfirmButton: false
    });

    cleanup();

  }, 100);

  function cleanup() {
    localStorage.removeItem('pendingPedalAdd');
    localStorage.removeItem('lastPedalboardId');
  }

})();

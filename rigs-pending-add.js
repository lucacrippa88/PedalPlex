(async function () {

  const pendingRaw = localStorage.getItem('pendingPedalAdd');
  if (!pendingRaw) return;

  const boardIndex = parseInt(localStorage.getItem('lastPedalboardId'), 10);
  if (isNaN(boardIndex)) {
    cleanup();
    return;
  }

  const pending = JSON.parse(pendingRaw);

  /**
   * ATTENDIAMO che rigs.js abbia finito:
   * - caricare le pedaliere
   * - renderizzarle
   *
   * Nel tuo progetto questo avviene quando esiste:
   * window.currentPedalboards (o simile)
   */
  const waitForPedalboards = setInterval(async () => {

    if (!window.pedalboards || !window.pedalboards[boardIndex]) {
      return;
    }

    clearInterval(waitForPedalboards);

    const board = window.pedalboards[boardIndex];

    // INSERIMENTO PEDALE
    board.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    // SALVATAGGIO
    await savePedalboard(board);

    cleanup();

    Swal.fire({
      icon: 'success',
      title: 'Pedal added to your Rig',
      timer: 1200,
      toast: true,
      position: 'top-end',
      showConfirmButton: false
    });

  }, 100);

  function cleanup() {
    localStorage.removeItem('pendingPedalAdd');
    localStorage.removeItem('lastPedalboardId');
  }

})();

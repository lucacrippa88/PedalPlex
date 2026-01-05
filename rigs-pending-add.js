// ===============================
// rigs-pending-add.js
// ===============================

(async function () {

  const raw = localStorage.getItem('pendingPedalAdd');
  const boardId = localStorage.getItem('lastPedalboardId');

  if (!raw || !boardId) return;

  const pending = JSON.parse(raw);

  const wait = setInterval(async () => {
    if (!window.pedalboards) return;

    const board = window.pedalboards.find(b => b._id === boardId);
    if (!board) return;

    clearInterval(wait);

    board.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    await savePedalboard(board);

    localStorage.removeItem('pendingPedalAdd');

    Swal.fire({
      icon: 'success',
      title: 'Pedal added to your Rig',
      toast: true,
      timer: 1200,
      position: 'top-end',
      showConfirmButton: false
    });

  }, 100);

})();

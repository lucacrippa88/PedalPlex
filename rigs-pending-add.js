// ===============================
// rigs-pending-add.js
// ===============================

(async function () {

  const pendingRaw = localStorage.getItem('pendingPedalAdd');
  if (!pendingRaw) return;

  const pending = JSON.parse(pendingRaw);
  const boardId = localStorage.getItem('lastPedalboardId'); // ora contiene il _id cloudant
  if (!boardId) return cleanup();

  const waitForRigs = setInterval(() => {
    // aspettiamo che rigs.js abbia completato bootstrap
    if (
      !window.allPedalboards ||
      !Array.isArray(window.allPedalboards) ||
      typeof savePedalboard !== 'function'
    ) {
      return;
    }

    // troviamo la pedalboard selezionata dal _id
    const board = window.allPedalboards.find(b => String(b._id) === String(boardId));
    if (!board) return; // aspettiamo ancora

    clearInterval(waitForRigs);

    // sincronizziamo lo stato interno di rigs.js
    window.pedalboard = structuredClone(board);
    if (typeof selectPedalboard === 'function') {
      const index = window.allPedalboards.findIndex(b => String(b._id) === String(boardId));
      selectPedalboard(index);
    }

    // ➕ aggiunta del pedale
    window.pedalboard.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    // 💾 salva usando la funzione nativa
    savePedalboard(window.pedalboard);

    cleanup();

  }, 100);

  function cleanup() {
    localStorage.removeItem('pendingPedalAdd');
    localStorage.removeItem('lastPedalboardId');
  }

})();

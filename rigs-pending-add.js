(async function () {

  const pendingRaw = localStorage.getItem('pendingPedalAdd');
  if (!pendingRaw) return;

  const boardIndex = parseInt(localStorage.getItem('lastPedalboardId'), 10);
  if (isNaN(boardIndex)) {
    cleanup();
    return;
  }

  const pending = JSON.parse(pendingRaw);

  const waitForRigs = setInterval(() => {

    // aspettiamo rigs.js
    if (
      !window.allPedalboards ||
      !Array.isArray(window.allPedalboards) ||
      !window.allPedalboards[boardIndex] ||
      typeof savePedalboard !== 'function'
    ) {
      return;
    }

    clearInterval(waitForRigs);

    // 🔑 allineiamo lo stato interno di rigs.js
    // forziamo la pedaliera DOPO il bootstrap completo
    selectedBoardIndex = boardIndex;

    // sincronizziamo anche il localStorage usato da rigs.js
    localStorage.setItem('selectedPedalboardIndex', boardIndex);

    // ricostruiamo lo stato attivo
    window.pedalboard = structuredClone(window.allPedalboards[boardIndex]);

    // se esiste una funzione di cambio pedaliera, usiamola
    if (typeof selectPedalboard === 'function') {
    selectPedalboard(boardIndex);
    }


    // ➕ aggiunta pedale
    window.pedalboard.pedals.push({
      pedal_id: pending.pedal_id,
      rotation: pending.rotation || 0,
      row: pending.row || 1
    });

    // 💾 salva usando il flusso NATIVO
    savePedalboard();

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

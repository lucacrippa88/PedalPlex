/**
 * TEST MODE
 * Renderizza una pedalboard fake con UN SOLO pedale preso dall'URL (?id=)
 * senza caricare la pedaliera reale
 */

(function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return; // modalità normale

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  // Flag globale per bloccare il rendering standard
  window.__SINGLE_PEDAL_MODE__ = true;

  // Aspetta che il catalogo sia caricato
  function waitForCatalog(cb) {
    const check = setInterval(() => {
      if (window.catalog && Array.isArray(window.catalog)) {
        clearInterval(check);
        cb();
      }
    }, 50);
  }

  waitForCatalog(() => {
    const container = document.getElementById('preset');
    if (!container) return;

    // Trova pedale
    const pedal = window.catalog.find(
      p => p._id === pedalId || p.id === pedalId
    );

    if (!pedal) {
      container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
      return;
    }

    // Pulisce tutto
    container.innerHTML = '';

    // Fake pedalboard
    const fakeBoard = {
      _id: "fake-board",
      name: `TEST – ${pedalId}`,
      pedals: [pedal]
    };

    console.log("[TEST-PLEX] Rendering fake board:", fakeBoard);

    // Renderizza SOLO questo pedale
    renderFullPedalboard(fakeBoard);
  });

})();







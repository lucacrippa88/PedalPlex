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






async function initSinglePedalMode(pedalId) {

  document.getElementById("pageLoader").style.display = "flex";

  // Stato minimo
  window.catalog = [];
  window.catalogMap = {};
  window.pedalboard = {
    _id: "single_pedal_board",
    board_name: pedalId,
    pedals: [{ pedal_id: pedalId }]
  };

  try {
    const res = await fetch(
      "https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [pedalId] })
      }
    );

    const json = await res.json();
    const docs = Array.isArray(json.docs) ? json.docs : json;

    if (!docs.length) {
      console.error("Pedal not found:", pedalId);
      document.getElementById("pageLoader").style.display = "none";
      return;
    }

    window.catalog = docs;
    window.catalogMap[pedalId] = docs[0];

    document.getElementById("pageLoader").style.display = "none";

    // 🔥 QUI riusi la funzione ESISTENTE
    renderFullPedalboard(window.pedalboard.pedals);

  } catch (err) {
    console.error("Single pedal fetch error:", err);
    document.getElementById("pageLoader").style.display = "none";
  }
}

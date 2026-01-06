/**
 * TEST MODE
 * Renderizza una pedalboard fake con UN SOLO pedale (?id=)
 */

(async function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  window.__SINGLE_PEDAL_MODE__ = true; // Flag globale per bloccare il rendering standard

  // Helper: aspetta che il catalogo sia pronto
  function waitForCatalog() {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (window.catalog && Array.isArray(window.catalog)) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  // Helper: aspetta che resultsDiv sia pronto
  function waitForResultsDiv() {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (window.resultsDiv) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  // Scarica il pedale dal DB se non presente nel catalogo
  async function fetchPedalById(id) {
    // Controlla se già presente
    if (window.catalogMap && window.catalogMap[id]) {
      return window.catalogMap[id];
    }

    const token = localStorage.getItem("authToken") || "";
    try {
      const res = await fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ ids: [id] })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      if (data.docs && data.docs.length) return data.docs[0];

      return null;
    } catch (err) {
      console.error("[TEST-PLEX] Error fetching pedal:", err);
      return null;
    }
  }

  // Attendi DOM e catalogo
  await waitForCatalog();
  await waitForResultsDiv();

  // Recupera pedale
  const pedal = await fetchPedalById(pedalId);

  if (!pedal) {
    document.getElementById('preset').innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
    return;
  }

  // Assicurati che catalogMap esista e contenga il pedale
  window.catalogMap = window.catalogMap || {};
  window.catalogMap[pedal._id] = pedal;

  // Fake pedalboard
  const fakeBoard = {
    _id: "fake-board",
    name: `TEST – ${pedalId}`,
    pedals: [
      {
        pedal_id: pedal._id,
        row: 1,
        rotation: 0
      }
    ]
  };

  console.log("[TEST-PLEX] Rendering fake board:", fakeBoard);

  // Render sicuro
  renderFullPedalboard(fakeBoard);

})();

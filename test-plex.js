/**
 * TEST MODE
 * Renderizza una pedalboard fake con UN SOLO pedale passato via URL (?id=)
 * Scarica il pedale dal DB se non è già presente
 */

(function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  // Flag globale per bloccare il rendering standard
  window.__SINGLE_PEDAL_MODE__ = true;

  // Funzione per fare fetch del pedale dal DB
  async function fetchPedalById(id) {
    try {
      const token = localStorage.getItem("authToken") || "";
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
      if (!data.docs || data.docs.length === 0) return null;
      return data.docs[0];
    } catch (err) {
      console.error("[TEST-PLEX] Error fetching pedal:", err);
      return null;
    }
  }

  async function init() {

    // 1️⃣ Controlla se il pedale esiste già nel catalogMap
    if (window.catalogMap && window.catalogMap[pedalId]) {
      renderFakeBoard(window.catalogMap[pedalId]);
      return;
    }

    // 2️⃣ Scarica il pedale dal DB
    const pedal = await fetchPedalById(pedalId);

    if (!pedal) {
      Swal.fire({
        icon: 'error',
        title: 'Missing gear on Rig',
        text: `Pedale non trovato: ${pedalId}`,
        confirmButtonText: 'OK'
      });
      return;
    }

    // 3️⃣ Popola catalogMap con il pedale scaricato
    window.catalogMap = window.catalogMap || {};
    window.catalogMap[pedalId] = pedal;

    renderFakeBoard(pedal);
  }

  function renderFakeBoard(pedal) {
    const container = document.getElementById('preset');
    if (!container) return;

    container.innerHTML = '';

    const fakeBoard = {
      _id: "fake-board",
      name: `TEST – ${pedalId}`,
      pedals: [
        {
          pedal_id: pedalId,
          row: 1,
          rotation: 0
        }
      ]
    };

    console.log("[TEST-PLEX] Rendering fake board:", fakeBoard);

    // Renderizza il pedale
    renderFullPedalboard(fakeBoard);
  }

  // Avvia
  init();

})();

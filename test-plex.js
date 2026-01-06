/**
 * TEST MODE
 * Renderizza una pedalboard con UN SOLO pedale passato via URL (?id=)
 * Scarica sempre il pedale dal DB
 */
(async function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  window.__SINGLE_PEDAL_MODE__ = true;

  // 1️⃣ Scarica il pedale dal DB
  async function fetchPedalById(id) {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch("/plex/GET_PEDALS_BY_IDS.php", {
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

  // 2️⃣ Renderizza il fake board
  async function init() {
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

    // Aggiorna catalogMap così renderFullPedalboard funziona con subplex
    window.catalogMap = window.catalogMap || {};
    window.catalogMap[pedalId] = pedal;

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

    // 🔹 Renderizza con subplex
    renderFullPedalboard(fakeBoard);
  }

  init();

})();

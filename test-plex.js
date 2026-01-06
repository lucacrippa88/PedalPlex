/**
 * TEST MODE – Render single pedal from URL
 */
(async function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  /**
   * Funzione per fare POST a GET_PEDALS_BY_IDS.php e recuperare il pedale
   */
  async function fetchPedalById(id) {
    try {
      const token = localStorage.getItem("authToken") || ""; // opzionale
      const res = await fetch("/plex/GET_PEDALS_BY_IDS.php", {
        method: "POST", // POST obbligatorio
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? "Bearer " + token : ""
        },
        body: JSON.stringify({ ids: [id] })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      if (!data.docs || data.docs.length === 0) {
        console.warn("[TEST-PLEX] Pedal not found in DB:", id);
        return null;
      }
      return data.docs[0];

    } catch (err) {
      console.error("[TEST-PLEX] Error fetching pedal:", err);
      return null;
    }
  }

  /**
   * Aspetta che resultsDiv sia pronto
   */
  function waitForResultsDiv(cb) {
    const check = setInterval(() => {
      if (window.resultsDiv) {
        clearInterval(check);
        cb();
      }
    }, 50);
  }

  /**
   * Main logic
   */
  waitForResultsDiv(async () => {

    // Scarica pedale dal DB
    const pedalDoc = await fetchPedalById(pedalId);
    if (!pedalDoc) {
      Swal.fire({
        icon: "error",
        title: "Missing gear on Rig",
        text: pedalId
      });
      return;
    }

    // Inizializza catalogMap se non esiste
    if (!window.catalogMap) window.catalogMap = {};
    window.catalogMap[pedalId] = pedalDoc;

    // Crea fake board con il pedale richiesto
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

    // Renderizza la pedalboard (la tua funzione globale)
    await renderFullPedalboard(fakeBoard);

  });

})();

/**
 * TEST MODE – Single pedal rendering
 * URL: ?id=PedalId&preset=PresetId (preset optional)
 */

(function () {

  const params = new URLSearchParams(window.location.search);
  const pedalId = params.get('id');
  const presetId = params.get('preset'); // opzionale

  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  // --- Fetch pedal dal DB ---
  async function fetchPedalById(id) {
    try {
      const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      if (!data.docs || !data.docs.length) throw new Error("Pedal not found in DB");
      return data.docs[0];
    } catch (err) {
      console.error("[TEST-PLEX] Error fetching pedal:", err);
      return null;
    }
  }

  // --- Fetch preset dal DB (solo se specificato) ---
  async function fetchPresetById(pedalId, presetId) {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      const res = await fetch("https://www.cineteatrosanluigi.it/plex/GET_PRESETS_BY_PEDAL.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ pedalId })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data.presets)) return null;

      return data.presets.find(p => p._id === presetId) || null;

    } catch (err) {
      console.error("[TEST-PLEX] Error fetching preset:", err);
      return null;
    }
  }

  // --- Init rendering ---
  async function init() {
    const pedal = await fetchPedalById(pedalId);
    const container = document.getElementById('preset');

    if (!pedal || !container) {
      if (container) container.innerHTML = `<p style="color:red;">Pedale non trovato nel DB: ${pedalId}</p>`;
      return;
    }

    // Crea fake pedalboard
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

    // Attende che renderFullPedalboard sia pronta
    const wait = setInterval(async () => {
      if (typeof renderFullPedalboard === 'function') {
        clearInterval(wait);

        // Render della pedalboard fake
        await renderFullPedalboard(fakeBoard);

        // Applica preset se presente
        if (presetId) {
          const preset = await fetchPresetById(pedal._id, presetId);
          if (preset) {
            const $pedalDiv = $(`.pedal-catalog[data-pedal-id="${pedal._id}"]`);
            if ($pedalDiv.length) applyCatalogPresetToSinglePedal(pedal._id, preset);
          } else {
            console.warn("[TEST-PLEX] Preset non trovato:", presetId);
          }
        }
      }
    }, 50);
  }

  init();

})();

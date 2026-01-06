(function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  function waitForCatalog(cb) {
    const check = setInterval(() => {
      if (window.catalogMap || window.catalog) {
        clearInterval(check);
        cb();
      }
    }, 50);
  }

  waitForCatalog(() => {

    const pedalExists =
      window.catalogMap?.[pedalId] ||
      window.catalog?.find(p => p._id === pedalId || p.id === pedalId);

    if (!pedalExists) {
      const container = document.getElementById('preset');
      if (container) {
        container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
      }
      console.warn("[TEST-PLEX] Pedal not found in catalog:", pedalId);
      return;
    }

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

    renderFullPedalboard(fakeBoard);
  });

})();

/**
 * TEST MODE
 * Renderizza una pedalboard fake con UN SOLO pedale (?id=)
 */

(function () {

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode:", pedalId);

  function waitForCatalog(cb) {
    const check = setInterval(() => {
      if (window.catalogMap && window.catalogMap[pedalId]) {
        clearInterval(check);
        cb();
      }
    }, 50);
  }

  waitForCatalog(() => {

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

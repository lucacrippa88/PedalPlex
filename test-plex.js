/**
 * TEST MODE – Single Pedal
 * Questo file NON fa fetch
 * NON crea fakeBoard
 * NON chiama renderFullPedalboard
 * 
 * I dati arrivano da test.html
 */
(function () {

  const pedalId = new URLSearchParams(window.location.search).get("id");
  if (!pedalId) return;

  console.log("[TEST-PLEX] Single pedal mode enabled for:", pedalId);

  // Flag globale utile se in utils.js vuoi comportamenti diversi
  window.__TEST_SINGLE_PEDAL__ = true;
  window.__TEST_PEDAL_ID__ = pedalId;

})();

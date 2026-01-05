/**
 * Test Plex: mostra un solo pedale (con tutti i SubPlex) usando renderFullPedalboard
 */

(async function() {
  const container = document.getElementById('preset');
  if (!container) return console.warn("No #preset container found");

  // Prendi pedalId dalla query string
  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) {
    container.innerHTML = `<p style="color:red;">Nessun pedale specificato</p>`;
    return;
  }

  // Trova il pedale nel catalog
  const pedalData = window.catalogMap[pedalId] || window.catalog.find(p => p._id === pedalId || p.id === pedalId);
  if (!pedalData) {
    container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
    return;
  }

  // --- Soluzione 1: filtrare catalog temporaneamente ---
  const originalCatalog = window.catalog;
  window.catalog = [pedalData]; // solo il pedale selezionato

  try {
    // Chiama la funzione originale: mostrerà solo questo pedale e i suoi SubPlex
    await renderFullPedalboard(container);
  } finally {
    // Ripristina catalog originale per non rompere altre parti dell'app
    window.catalog = originalCatalog;
  }
})();

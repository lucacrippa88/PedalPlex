/**
 * Renderizza una pedalboard fake con un solo pedale preso dall'URL
 */
(async function() {
  const container = document.getElementById('preset');
  if (!container) return console.warn("No #preset container found");

  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (!pedalId) return;

  // Trova il pedale nel catalogo globale
  const pedalData = window.catalog?.find(p => p._id === pedalId || p.id === pedalId);
  if (!pedalData) {
    container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
    return;
  }

  // Costruisci una pedalboard fake in memoria
  const fakeBoard = {
    name: `Fake board - ${pedalId}`,
    pedals: [pedalData],  // solo il pedale scelto
  };

  // Pulisci il container
  container.innerHTML = '';

  // Chiama renderFullPedalboard con la fake board
  renderFullPedalboard(fakeBoard);
})();

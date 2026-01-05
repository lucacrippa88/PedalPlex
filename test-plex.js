/**
 * Test Plex: renderizza un "plex fake" con un solo pedale e tutti i suoi subplex
 */
async function renderFakePlex(pedalId) {
  const container = document.getElementById('preset');
  if (!container) return console.warn("No #preset container found");
  container.innerHTML = ''; // pulisci container

  // Trova il pedale nel catalogo
  const pedalData = (window.catalog || []).find(p => p._id === pedalId || p.id === pedalId);
  if (!pedalData) {
    container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
    return;
  }

  // Crea una pedalboard finta con un solo pedale
  const fakeBoard = {
    _id: `fake-${pedalData._id}`,
    name: `Fake board - ${pedalData._id}`,
    pedals: [pedalData], // solo il pedale scelto
  };

  // renderFullPedalboard accetta la pedalboard completa
  // Passiamo il nostro fakeBoard
  renderFullPedalboard(fakeBoard, container);
}

/**
 * Assicura che il catalogo sia pronto prima di chiamare renderFakePlex
 */
async function initTestPlex() {
  // Attendi catalogMap/catalog se necessario
  while (!window.catalog || window.catalog.length === 0) {
    await new Promise(r => setTimeout(r, 50));
  }

  // Prendi pedalId dalla query string
  const pedalId = new URLSearchParams(window.location.search).get('id');
  if (pedalId) {
    renderFakePlex(pedalId);
  } else {
    console.warn("Nessun parametro ?id= trovato nell'URL");
  }
}

// Avvia
initTestPlex();

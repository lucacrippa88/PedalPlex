/**
 * Renderizza un plex fake con un solo pedale (con tutti i subplex)
 * @param {string} pedalId - ID del pedale da mostrare
 */
async function renderFakePlex(pedalId) {
  const container = document.getElementById('preset');
  if (!container) return console.warn("No #preset container found");
  container.innerHTML = ''; // pulisci

  // Trova il pedale dal catalogo
  const pedalData = window.catalogMap[pedalId] || window.catalog.find(p => p._id === pedalId || p.id === pedalId);
  if (!pedalData) {
    container.innerHTML = `<p style="color:red;">Pedale non trovato: ${pedalId}</p>`;
    return;
  }

  // Render pedale
  const $pedalDiv = renderPedal(pedalData, window.currentUser?.role || 'guest');

  // Wrapper come nelle pedalboards
  const $wrapper = $("<div>")
    .addClass("pedal-wrapper")
    .css({ display: 'inline-block', position: 'relative' })
    .append($pedalDiv);

  container.appendChild($wrapper[0]);

  // --- Carica SubPlex ---
  if (window.currentUser && window.currentUser.role === 'admin') {
    const $presetContainer = $(`
      <div class="preset-container">
        <div class="preset-dropdown-wrapper">
          <ul class="preset-dropdown"></ul>
        </div>
      </div>
    `);
    $wrapper.append($presetContainer);

    const $ul = $presetContainer.find('.preset-dropdown');
    await buildPresetDropdown($ul, pedalId); // fetch SubPlex
  }
}




// Controlla query string
const pedalId = new URLSearchParams(window.location.search).get('id');
if (pedalId) {
  renderFakePlex(pedalId);
}

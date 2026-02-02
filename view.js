function renderBackToCatalogButton() {
  const wrapper = document.createElement('div');
  wrapper.style.marginTop = '24px';
  wrapper.style.textAlign = 'center';

  wrapper.innerHTML = `
    <a id="backToCatalog" href="gears" class="bx--btn bx--btn--tertiary" style="margin-left:8px; max-width:500px!important;">
      Not found? Browse Catalog
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
        <path d="M14 26L15.41 24.59 7.83 17 28 17 28 15 7.83 15 15.41 7.41 14 6 4 16 14 26z"></path>
      </svg>
    </a>
  `;

  return wrapper;
}




(async function () {

  const resultsDiv = document.getElementById('results');
  window.resultsDiv = resultsDiv;

  let token = localStorage.getItem('authToken');

  // ===================== GESTIONE FUZZY SEARCH =====================
  const urlParams = new URLSearchParams(location.search);
  const searchQuery = urlParams.get('search');

  if (searchQuery) {
    resultsDiv.textContent = 'Searching...';

    try {
      const res = await fetch('https://api.pedalplex.com/SEARCH_GEAR.php?q=' + encodeURIComponent(searchQuery), {
        method: 'GET',
        headers: {
          'Authorization': token ? 'Bearer ' + token : ''
        }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {

        // ✅ 1 SOLO RISULTATO → render diretto
        if (data.length === 1) {
          const pedalId = data[0]._id;
          window.location.replace(
            window.location.pathname + '?id=' + encodeURIComponent(pedalId)
          );
          return;
        }

        // ✅ PIÙ RISULTATI → lista cliccabile
        resultsDiv.innerHTML = '<h3>Search results</h3><br>';
        const ul = document.createElement('ul');

        data.forEach(pedal => {
          const li = document.createElement('li');
          const link = document.createElement('a');

          link.href =
            window.location.pathname +
            '?id=' +
            encodeURIComponent(pedal._id);

          link.innerHTML = pedal._id || pedal.name;

          link.style.color = '#ffffff';
          link.style.textDecoration = 'none';
          link.style.fontSize = '1.1rem';

          li.appendChild(link);
          ul.appendChild(li);
        });

        resultsDiv.appendChild(ul);
        resultsDiv.appendChild(renderBackToCatalogButton());
        return;

      } else if (data.error) {
        resultsDiv.innerHTML = `<p>No pedal matched your search query: <b>${searchQuery}</b></p>`;
        resultsDiv.appendChild(renderBackToCatalogButton());
        return;
      } else {
        resultsDiv.textContent = 'Unexpected response from server';
        return;
      }

    } catch (err) {
      console.error('Error resolving search link:', err);
      resultsDiv.textContent = 'Failed to resolve search: ' + err.message;
      return;
    }
  }

  // ===================== CARICAMENTO PEDALE =====================
  const pedalId = urlParams.get('id');
  if (!pedalId) {
    resultsDiv.textContent = 'Usa ?id=<PEDAL_ID>';
    return;
  }

  async function fetchPedals(ids) {
    try {
      const res = await fetch('https://api.pedalplex.com/GET_PEDALS_BY_IDS.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          ids
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return (await res.json()).docs || [];
    } catch (err) {
      console.error('[TEST-PLEX] Error fetching pedals:', err);
      resultsDiv.textContent = 'Error fetching pedals: ' + err.message;
      return [];
    }
  }

  // Fetch pedale principale
  const [pedal] = await fetchPedals([pedalId]);
  if (!pedal) {
    resultsDiv.textContent = 'Gear not found!';
    return;
  }

  // Fetch subplex
  let subplexDocs = [];
  if (pedal.subplex?.length) {
    const subIds = pedal.subplex.map(s => s.pedal_id);
    subplexDocs = await fetchPedals(subIds);
  }

  /* ================= CATALOG ================= */
  window.catalogMap = {};
  window.catalogMap[pedalId] = pedal;
  subplexDocs.forEach(p => window.catalogMap[p._id] = p);

  window.catalog = [pedal, ...subplexDocs]; // necessario per renderFullPedalboard

  /* ================= FAKE BOARD ================= */
  const fakeBoard = {
    _id: 'test-board',
    name: 'TEST',
    pedals: [{
      pedal_id: pedalId,
      row: 1,
      rotation: 0,
      subplex: pedal.subplex || []
    }]
  };

  /* ================= RENDER ================= */
  try {
    $('#gearName').text(pedalId);
    await renderFullPedalboard(fakeBoard);
  } catch (err) {
    console.error('[TEST-PLEX] Render error:', err);
    resultsDiv.textContent = 'Errore nel render: ' + err.message;
  }

})();

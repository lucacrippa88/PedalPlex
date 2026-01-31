// (async function () {

//   const resultsDiv = document.getElementById('results');
//   window.resultsDiv = resultsDiv;

//   let token = localStorage.getItem('authToken');


  // /* ================= DATA ================= */
  // const pedalId = new URLSearchParams(location.search).get('id');
  // if (!pedalId) {
  //   resultsDiv.textContent = 'Usa ?id=<PEDAL_ID>';
  //   return;
  // }

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
          // Chiamata alla nuova RESOLVE_LINK.php
          const res = await fetch('https://api.pedalplex.com/SEARCH_GEAR.php?q=' + encodeURIComponent(searchQuery), {
              method: 'GET',
              headers: {
                  'Authorization': token ? 'Bearer ' + token : ''
              }
          });

          if (!res.ok) throw new Error('HTTP ' + res.status);

          const data = await res.json();

          if (data && data._id) {
              // Redirect automatico su ?id=
              window.location.replace(window.location.pathname + '?id=' + encodeURIComponent(data._id));
              return; // blocca il resto del caricamento
          } else if (data.error) {
              resultsDiv.textContent = 'No pedal matched your search query: ' + searchQuery;
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
      const res = await fetch(
        'https://api.pedalplex.com/GET_PEDALS_BY_IDS.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ ids })
        }
      );
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
function renderBackToCatalogButton() {
  const wrapper = document.createElement('div');
  wrapper.style.marginTop = '24px';
  wrapper.style.textAlign = 'center';

  wrapper.innerHTML = `
    <a id="backToCatalog" href="/gears" class="bx--btn bx--btn--tertiary" style="margin-left:8px; max-width:500px!important;">
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
        },
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

          link.textContent = gearLabel(pedal) || pedal.name;

          link.style.color = 'inherit';
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
  const pedalId = urlParams.get('id') || window.PEDAL_ID;
  if (!pedalId) {
    resultsDiv.textContent = 'Pedal ID missing';
    return;
  }

  async function fetchPedals(ids) {

    try {
      const res = await fetch('https://api.pedalplex.com/GET_GEARS_BY_IDS.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': 'Bearer ' + token } : {})
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
      rotation: 0
    }]
  };


  // ======= fallback catalog statico minimo =======
if (!window.catalogMap || !window.catalogMap[pedalId]) {
  window.catalogMap = window.catalogMap || {};
  window.catalogMap[pedalId] = {
    _id: pedalId,
    name: pedalId
  };
  window.catalog = [window.catalogMap[pedalId]]; // necessario per renderFullPedalboard
  // console.log('[VIEW.JS] Fallback catalog aggiunto per pedale statico');
}
// ==============================================

  /* ================= HERO (live refresh from the DB; the page already carries the same data statically) ================= */
  const categories = (pedal.category || '').split('/').map(c => c.trim()).filter(Boolean);
  let $catTags = $('#gear-category-tags');
  if (!$catTags.length) {
    // pages without the hero container (e.g. 404): replace hardcoded tags
    const $old = $('.bx--tag--teal');
    $catTags = $('<span id="gear-category-tags"></span>');
    if ($old.length) $old.first().before($catTags); else $('.bx--tag--purple').first().after($catTags);
    $old.remove();
  }
  $catTags.empty();
  categories.forEach(c => {
    $catTags.append($('<span style="font-size:12px" class="bx--tag bx--tag--teal"></span>').text(c));
  });

  const $brand = $('#gearBrand');
  if ($brand.length) {
    // hero layout: brand on top, gear name as title
    $brand.text(pedal.brand || '').prop('hidden', !pedal.brand);
    $('#gearName').text(gearShortName(pedal));
  } else {
    $('#gearName').text(gearLabel(pedal));
  }

  const $desc = $('#gearDesc');
  if ($desc.length && pedal.description) $desc.text(pedal.description).prop('hidden', false);

  // Effects Database link: shown only when the gear has one (affiliate_links.fxdb)
  const fxdbUrl = pedal.affiliate_links && typeof pedal.affiliate_links.fxdb === 'string' ? pedal.affiliate_links.fxdb : '';
  const $fxdb = $('.js-openFXDB');
  if (/^https?:\/\//i.test(fxdbUrl)) {
    $fxdb.attr({ href: fxdbUrl, target: '_blank', rel: 'noopener noreferrer' }).prop('hidden', false);
  }

  $('#gearAbout').prop('hidden', !(pedal.description || /^https?:\/\//i.test(fxdbUrl)));

  // Product schema: set category for crawlers that execute JS
  $('script[type="application/ld+json"]').each(function () {
    try {
      const data = JSON.parse(this.textContent);
      if (data['@type'] !== 'Product') return;
      if (categories.length) data.category = categories.join('/'); else delete data.category;
      this.textContent = JSON.stringify(data, null, 2);
    } catch (e) { /* ignore invalid JSON-LD */ }
  });

  /* ================= RENDER ================= */
  // renderFullPedalboard builds the gear together with its SubPlex dropdown (.preset-container)
  try {
    await renderFullPedalboard(fakeBoard);
    // renderFullPedalboard always shows Reset: hide it until a SubPlex is applied
    $('.pedal-catalog').each(function () { updateSubplexButtonsUI($(this)); });
    $('#presetSpinner').hide();
  } catch (err) {
    resultsDiv.textContent = 'Errore nel render: ' + err.message;
  }

})();

// === nav-catalog + catalog lazy loading ===

// --- GLOBAL STATE ---
let catalogMeta = null;     // metadata globali (totali veri da server)
let catalogData = [];       // pedali realmente scaricati (lazy)
let displayedCount = 0;     // quanti pedali sono stati renderizzati
let lazyPage = 0;           // pagina lazy per GET_CATALOG_LAZY.php
let hasMore = true;         // se il server dice "continua c'è ancora roba"

const PAGE_SIZE = 200;      // QUANTI pedali scaricare per pagina
let currentFilter = 'all';  // filtro corrente (all / draft / private / ecc.)
let currentSearch = '';     // testo della ricerca local client-side

//------------------------------------------------------------
// 1. INIT NAV BAR
//------------------------------------------------------------
function initNavCatalog(userRole) {
  const navHtml = `
  <header style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
        <div class="pedalplex-logo"></div>
      </button>
      <div class="title">PedalPlex</div>
      <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Gears</span>
    </div>
    <div style="display: flex; align-items: center; gap: 1rem;">
      <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>
      <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
        <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <input 
        type="text" 
        id="pedalFilterInput" 
        placeholder="Filter gears..." 
        style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
        aria-label="Filter pedals"/>
      <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
          <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add gear
      </button>
    </div>
  </header>
  `;
  $("body").prepend(navHtml);

  // toggle search visibility
  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) input.hide().val("");
    else input.css("display", "flex").focus();
  });

  $("#pedalFilterInput").on("input", function () {
    currentSearch = $(this).val().toLowerCase();
    displayedCount = 0;
    $("#catalog").empty();
    renderNextBatch();
    updatePedalCounts(currentFilter);
  });
}

//------------------------------------------------------------
// 2. FETCH METADATA (contatori globali reali)
//------------------------------------------------------------
function fetchCatalogMeta(userRole) {
  const token = localStorage.getItem('authToken');
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";

  return fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG_META.php?role=${roleParam}&username=${usernameParam}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(meta => {
    catalogMeta = meta;        // memorizza metadata globali veri
    updatePedalCounts();       // mostra subito i contatori corretti
  })
  .catch(err => {
    console.error("Error fetching meta:", err);
    catalogMeta = null;
  });
}

//------------------------------------------------------------
// 3. FETCH PEDALI (LAZY PAGINATO)
//------------------------------------------------------------
function fetchCatalogLazy(userRole) {
  if (!hasMore) return Promise.resolve();

  const token = localStorage.getItem('authToken');
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";

  return fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG_LAZY.php?role=${roleParam}&username=${usernameParam}&page=${lazyPage}&pageSize=${PAGE_SIZE}&filter=${currentFilter}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(result => {

    if (!result || !Array.isArray(result.items)) {
      console.error("Invalid response from GET_CATALOG_LAZY.php", result);
      return;
    }

    // aggiungi i nuovi pedali scaricati
    catalogData = catalogData.concat(result.items);

    // ordina globalmente
    catalogData.sort((a,b)=> (a._id || "").localeCompare(b._id || ""));

    hasMore = !!result.hasMore;
    lazyPage++;

    renderNextBatch();   // renderizza la parte visiva
  })
  .catch(err => console.error("Error fetching pedals:", err));
}

//------------------------------------------------------------
// 4. RENDER BATCH (client-side)
//------------------------------------------------------------
function renderNextBatch() {
  const resultsDiv = $("#catalog");
  const filtered = catalogData.filter(p => {

    let ok = true;

    // filtro server-side già fatto: client-side è solo una sicurezza
    if (currentFilter !== 'all') {
      const pub = (p.published || '').toLowerCase();
      const author = (p.author || '').toLowerCase();
      const me = (window.currentUser?.username || '').toLowerCase();

      if (currentFilter === 'draft') ok = pub === 'draft';
      else if (currentFilter === 'private') ok = pub === 'private';
      else if (currentFilter === 'reviewing') ok = pub === 'reviewing';
      else if (currentFilter === 'publicByMe') ok = pub === 'public' && author === me;
      else if (currentFilter === 'user') ok = pub === 'public' && author !== 'admin';
    }

    if (currentSearch) {
      ok = ok && (p._id || "").toLowerCase().includes(currentSearch);
    }

    return ok;
  });

  const next = filtered.slice(displayedCount, displayedCount + PAGE_SIZE);

  next.forEach(pedal => {
    const div = renderPedal(pedal, window.currentUser?.role || 'guest', false);
    resultsDiv.append(div);
  });

  displayedCount += next.length;
}

//------------------------------------------------------------
// 5. INFINITE SCROLL
//------------------------------------------------------------
function setupInfiniteScroll(userRole) {
  $(window).on("scroll", function() {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 200) {

      // serve nuova pagina?
      if (displayedCount >= catalogData.length) {
        if (hasMore) {
          fetchCatalogLazy(userRole);
        }
      } else {
        renderNextBatch();
      }
    }
  });
}

//------------------------------------------------------------
// 6. CONTATORI (USANO SOLO catalogMeta)
//------------------------------------------------------------
function updatePedalCounts(activeFilter = null) {
  if (!catalogMeta) return;

  let countsHtml = `(All: <span class="status-filter ${activeFilter==='all'?'active-filter':''}" data-filter="all">${catalogMeta.total}</span>`;

  if (window.currentUser?.role !== 'guest') {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter==='draft'?'active-filter':''}" data-filter="draft">${catalogMeta.draft}</span>`;
    countsHtml += `, Private: <span class="status-filter ${activeFilter==='private'?'active-filter':''}" data-filter="private">${catalogMeta.private}</span>`;
    countsHtml += `, Reviewing: <span class="status-filter ${activeFilter==='reviewing'?'active-filter':''}" data-filter="reviewing">${catalogMeta.reviewing}</span>`;
    countsHtml += `, Public by me: <span class="status-filter ${activeFilter==='publicByMe'?'active-filter':''}" data-filter="publicByMe">${catalogMeta.publicByMe}</span>`;

    if (window.currentUser?.role === 'admin') {
      countsHtml += `, Published by Users: <span class="status-filter ${activeFilter==='user'?'active-filter':''}" data-filter="user">${catalogMeta.userCreated}</span>`;
    }
  }

  countsHtml += `)`;
  $("#pedalCount").html(countsHtml);

  // --- click sui contatori ---
  $(".status-filter").off("click").on("click", function(){
    currentFilter = $(this).data("filter");

    // reset completo
    catalogData = [];
    displayedCount = 0;
    lazyPage = 0;
    hasMore = true;

    $("#catalog").empty();

    fetchCatalogLazy(window.currentUser?.role || "guest").then(() => {
      renderNextBatch();
    });

    updatePedalCounts(currentFilter);
  });
}

//------------------------------------------------------------
// 7. INIT CATALOG (chiamato dopo metadata!)
//------------------------------------------------------------
function initCatalog(userRole) {
  if ($("#catalog").length === 0) $("body").append('<div id="catalog"></div>');

  $("#catalog").html('<div class="bx--loading-overlay">Loading...</div>');

  fetchCatalogLazy(userRole).then(() => {
    setupInfiniteScroll(userRole);
  });
}

//------------------------------------------------------------
// CSS (solo per contatori)
//------------------------------------------------------------
const style = document.createElement("style");
style.textContent = `
.status-filter { cursor:pointer; text-decoration: underline; color:#ddd; }
.status-filter.active-filter { font-weight:bold; color:#fff; text-decoration:none; border-bottom:2px solid #fff; }
@media (max-width:768px){ #pedalCount span.status-filter:not([data-filter="all"]){display:none!important;} }
`;
document.head.appendChild(style);

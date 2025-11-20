// === nav-catalog + catalog lazy loading ===

// === GLOBALS ===
let catalogData = [];      // tutti i pedali scaricati finora
let displayedCount = 0;    // quanti pedali sono renderizzati sullo schermo
const PAGE_SIZE = 200;      // quanti pedali per pagina (lazy)
let currentFilter = 'all';
let currentSearch = '';

let lazyPage = 0;          // pagina attuale del lazy loader
let hasMore = true;        // se il server ha ancora pagine
let isLoading = false;     // evita duplicati durante scroll


// === NAV CATALOG HEADER ===
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");

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

  // toggle search input
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
    updatePedalCounts();
  });
}


// === FETCH LAZY (pagina per pagina) ===
function fetchCatalogLazy(userRole) {
  if (isLoading || !hasMore) return Promise.resolve();
  isLoading = true;

  const token = localStorage.getItem('authToken');
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";

  return fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG_LAZY.php?page=${lazyPage}&limit=${PAGE_SIZE}&role=${roleParam}&username=${usernameParam}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(result => {

    if (!result || !Array.isArray(result.items)) {
      console.error("Invalid lazy result", result);
      isLoading = false;
      return;
    }

    // Aggiungi nuovi pedali al dataset globale
    catalogData = catalogData.concat(result.items);

    // Ordina sempre tutto
    catalogData.sort((a,b)=> (a._id || "").localeCompare(b._id || ""));

    // Renderizza un altro blocco se serve
    renderNextBatch();

    // Aggiorna lazy loader
    hasMore = !!result.hasMore;
    lazyPage++;
    isLoading = false;

    updatePedalCounts();

  })
  .catch(err => {
    console.error("Lazy loading error:", err);
    isLoading = false;
  });
}


// === RENDER BATCH ===
function renderNextBatch() {
  const resultsDiv = $("#catalog");

  const filtered = catalogData.filter(p => {
    let keep = true;
    if (currentFilter !== 'all') {
      const pub = (p.published||'draft').toLowerCase();
      const author = (p.author||'').toLowerCase();
      const currentUsername = (window.currentUser?.username || '').toLowerCase();
      switch(currentFilter){
        case 'draft': keep = pub==='draft'; break;
        case 'private': keep = pub==='private'; break;
        case 'reviewing': keep = pub==='reviewing'; break;
        case 'publicByMe': keep = pub==='public' && author===currentUsername; break;
        case 'user': keep = pub==='public' && author!=='admin'; break;
      }
    }
    if (currentSearch) keep = keep && (p._id||p.id||'').toLowerCase().includes(currentSearch);
    return keep;
  });

  const nextBatch = filtered.slice(displayedCount, displayedCount + PAGE_SIZE);
  nextBatch.forEach(pedal => {
    const $pedalDiv = renderPedal(pedal, window.currentUser?.role || 'guest', false);
    resultsDiv.append($pedalDiv);
  });

  displayedCount += nextBatch.length;
}


// === INFINITE SCROLL ===
function setupInfiniteScroll(userRole) {
  $(window).on("scroll", function() {

    const nearBottom = $(window).scrollTop() + $(window).height() >= $(document).height() - 300;

    if (!nearBottom) return;

    if (displayedCount < catalogData.length) {
      // Ho ancora pedali locali da renderizzare
      renderNextBatch();
      return;
    }

    // Non ho più pedali locali → carico una nuova pagina dal server
    fetchCatalogLazy(userRole);
  });
}


// === UPDATE COUNTS ===
function updatePedalCounts(activeFilter = null) {
  const currentUsername = (window.currentUser?.username || '').toLowerCase();
  const totalAbsolute = catalogData.length;

  const statusCounts = { draft:0, private:0, reviewing:0, publicByMe:0, user:0 };
  catalogData.forEach(p => {
    const status = (p.published||'draft').toLowerCase();
    const author = (p.author||'').toLowerCase();
    if(statusCounts.hasOwnProperty(status)) statusCounts[status]++;
    if(status==='public' && author===currentUsername) statusCounts.publicByMe++;
    if(author && author!=='admin') statusCounts.user++;
  });

  let countsHtml = `(All: <span class="status-filter ${activeFilter==='all'?'active-filter':''}" data-filter="all">${totalAbsolute}</span>`;
  if(window.currentUser?.role!=='guest') {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter==='draft'?'active-filter':''}" data-filter="draft">${statusCounts.draft}</span>`;
    countsHtml += `, Private: <span class="status-filter ${activeFilter==='private'?'active-filter':''}" data-filter="private">${statusCounts.private}</span>`;
    countsHtml += `, Reviewing: <span class="status-filter ${activeFilter==='reviewing'?'active-filter':''}" data-filter="reviewing">${statusCounts.reviewing}</span>`;
    countsHtml += `, Public by me: <span class="status-filter ${activeFilter==='publicByMe'?'active-filter':''}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;
    if(window.currentUser?.role==='admin') {
      countsHtml += `, Published by Users: <span class="status-filter ${activeFilter==='user'?'active-filter':''}" data-filter="user">${statusCounts.user}</span>`;
    }
  }
  countsHtml += `)`;
  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click", function(){
    currentFilter = $(this).data("filter");
    displayedCount = 0;
    $("#catalog").empty();
    renderNextBatch();
    updatePedalCounts(currentFilter);
  });
}


// === INIT CATALOG ===
function initCatalog(userRole) {
  const resultsDiv = $("#catalog");
  if(resultsDiv.length===0) $("body").append('<div id="catalog"></div>');
  resultsDiv.html('<div class="bx--loading-overlay">Loading...</div>');

  fetchCatalogLazy(userRole).then(()=> {
    setupInfiniteScroll(userRole);
  });
}


// === CSS inject ===
const style = document.createElement("style");
style.textContent = `
.status-filter { cursor:pointer; text-decoration: underline; color:#ddd; }
.status-filter.active-filter { font-weight:bold; color:#fff; text-decoration:none; border-bottom:2px solid #fff; }
@media (max-width:768px){ #pedalCount span.status-filter:not([data-filter="all"]){display:none!important;} }
`;
document.head.appendChild(style);

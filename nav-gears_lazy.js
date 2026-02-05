window.catalogInitialized = false;
window.isSearching = false;
window.catalogPage = 0;
window.catalogLoading = false;

function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); 
}

// ================== NAV BAR ==================
function renderNavBar(userRole) {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <div class="title">PedalPlex</div>
        <a href="gears" class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600; text-decoration:none">Gears</a>
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

  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button">Login</button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click","#loginBtn",()=>window.location.href="login");
  } else {
    $(document).on('click','#createPedalBtn', createNewPedal);
    $(document).on('click','#createOwnPedalBtn', createNewPedal);
  }

  $("#toggleFilterBtn").on("click", function(){
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) input.hide().val("").trigger('input');
    else input.css("display","flex").focus();
  });

  // ===== SEARCH PEDALS WITH SERVER CALL =====
  let searchTimeout = null;
  $("#pedalFilterInput").on("input", function(){
    const query = $(this).val().trim();
    if(searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(query), 500);
  });
}

// ================== PERFORM SEARCH ==================
function performSearch(query) {
  const resultsDiv = $("#catalog");
  const token = localStorage.getItem("authToken");
  window.isSearching = query.length > 0;

  if(!window.isSearching){
    // Reset catalog completely
    resultsDiv.empty();
    window.catalogPage = 0;
    setupCatalogObserver();
    loadNextCatalogPage();
    return;
  }

  resultsDiv.empty();
  resultsDiv.append('<div id="catalog-global-loader"></div>');

  // Step 1: Search IDs
  $.ajax({
    url: 'https://api.pedalplex.com/SEARCH_GEAR.php',
    method: 'GET',
    data: { q: query },
    headers: { "Authorization": token ? "Bearer " + token : "" },
    success: function(data){
      $("#catalog-global-loader").remove();

      if(!data || data.error || !data.length){
        resultsDiv.html('<p style="text-align:center;color:#aaa;">No matching pedals found</p>');
        return;
      }

      // Step 2: Fetch full pedals
      const ids = data.map(d => d._id);
      fetchPedalsByIds(ids, token, resultsDiv);
    },
    error: function(xhr){
      $("#catalog-global-loader").remove();
      console.error('Search error', xhr);
    }
  });
}

// ================== FETCH PEDALS BY IDS ==================
function fetchPedalsByIds(ids, token, containerDiv){
  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token ? "Bearer "+token : "" },
    body: JSON.stringify({ ids: ids })
  })
  .then(r => r.json())
  .then(data => {
    containerDiv.empty();
    const pedals = data.docs || [];
    if(pedals.length === 0){
      containerDiv.html('<p style="text-align:center;color:#aaa;">No matching pedals found</p>');
      return;
    }
    renderCatalogIncremental(pedals, 'catalog', window.currentUserRole || 'guest', 50);
    if(window.currentUserRole !== 'guest') setupEditPedalHandler(pedals);
  })
  .catch(err => {
    console.error('Fetch pedals error', err);
    containerDiv.html('<p style="text-align:center;color:#aaa;">Error loading pedals</p>');
  });
}

// ================== SINGLE PEDAL VIEW ==================
function initSinglePedalView(pedalId, userRole){
  window.singlePedalMode = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.empty();
  resultsDiv.append('<div id="catalog-global-loader"></div>');

  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token ? "Bearer "+token : ""
    },
    body: JSON.stringify({ids:[decodeURIComponent(pedalId.trim())]})
  })
  .then(r=>r.json())
  .then(data=>{
    $("#catalog-global-loader").remove();
    const pedals = data.docs || [];
    if(pedals.length===0){
      Swal.fire({icon:"error", title:"Pedal not found", confirmButtonText:"Back to Catalog"})
        .then(()=>window.location.href="gears");
      return;
    }
    renderCatalogIncremental(pedals,'catalog',userRole,50);
    if(userRole!=="guest") setupEditPedalHandler(pedals);
  });
}

// ================== LAZY LOAD ==================
function setupCatalogObserver() {
  const sentinel = document.createElement('div');
  sentinel.id = 'catalog-sentinel';
  $("#catalog").append(sentinel);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting && !window.catalogLoading && !window.isSearching){
        loadNextCatalogPage();
      }
    });
  }, { root: null, rootMargin: '0px', threshold: 1.0 });

  observer.observe(sentinel);
}

function loadNextCatalogPage() {
  if(window.catalogLoading) return;
  window.catalogLoading = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.append('<div class="catalog-page-loader"></div>');

  $.ajax({
    url: 'https://api.pedalplex.com/GET_CATALOG_LAZY.php',
    method: 'GET',
    data: { page: window.catalogPage },
    headers: { "Authorization": token ? "Bearer " + token : "" },
    success: function(data){
      $(".catalog-page-loader").remove();
      if(!data || !data.docs || !data.docs.length){
        // Fine catalogo
        window.catalogLoading = false;
        return;
      }
      renderCatalogIncremental(data.docs, 'catalog', window.currentUserRole || 'guest', 50);
      if(window.currentUserRole !== 'guest') setupEditPedalHandler(data.docs);
      window.catalogPage++;
      window.catalogLoading = false;
    },
    error: function(xhr){
      $(".catalog-page-loader").remove();
      console.error('Lazy load error', xhr);
      window.catalogLoading = false;
    }
  });
}

// ================== INIT NAV + CATALOG ==================
function initNavCatalog(userRole){
  window.currentUserRole = userRole;
  renderNavBar(userRole);
  updatePedalCountsFromServer(); 
  const pedalIdFromURL = getPedalIdFromURL();
  if(pedalIdFromURL) initSinglePedalView(pedalIdFromURL,userRole);
  else {
    setupCatalogObserver();
    loadNextCatalogPage();
  }
}

window.catalogInitialized = false;
let currentSearchQuery = null; // null = catalogo normale


function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); 
}

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
    if (input.is(":visible")) input.hide().val("");
    else input.css("display","flex").focus();
  });

  // ===== SEARCH PEDALS WITH SERVER CALL =====
let searchTimeout = null;

$("#pedalFilterInput").on("input", function(){
  const query = $(this).val().trim();

  if(searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(function(){
    if(query === "") {
      resetCatalogState();
      loadNextCatalogPage();
      return;
    }

    resetCatalogState();
    currentSearchQuery = query;
    loadNextCatalogPage();
  }, 500);
});


function performSearch(query) {
  const resultsDiv = $("#catalog");
  const token = localStorage.getItem("authToken");
  
  if(query === "") {
    // Se campo vuoto, ripristina catalogo lazy load
    resultsDiv.empty();
    setupCatalogObserver();
    loadNextCatalogPage();
    return;
  }

  // Mostra spinner globale
  resultsDiv.empty();
  resultsDiv.append('<div id="catalog-global-loader"></div>');

  // Chiamata server SEARCH_GEAR.php
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

      // Ottieni i pedali completi dai loro _id
      const ids = data.map(d => d._id);
      fetchPedalsByIds(ids, token, resultsDiv);
    },
    error: function(xhr){
      $("#catalog-global-loader").remove();
      console.error('Search error', xhr);
    }
  });
}

// Funzione helper: GET_PEDALS_BY_IDS + render completo
function fetchPedalsByIds(ids, token, containerDiv){
  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? "Bearer "+token : ""
    },
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

    // Renderizza pedali completi
    renderCatalogIncremental(pedals, 'catalog', window.currentUserRole || 'guest', 50);
    if(window.currentUserRole !== 'guest') setupEditPedalHandler(pedals);
  })
  .catch(err => {
    console.error('Fetch pedals error', err);
    containerDiv.html('<p style="text-align:center;color:#aaa;">Error loading pedals</p>');
  });
}


  // $("#pedalFilterInput").on("input", function(){
  //   const filterValue = $(this).val().toLowerCase();
  //   $(".pedal-catalog").each(function(){
  //     const name = $(this).data("pedal-id")?.toLowerCase() || "";
  //     $(this).toggle(name.includes(filterValue));
  //   });
  // });
}

// ===== SINGLE PEDAL VIEW =====
function initSinglePedalView(pedalId, userRole){
  window.singlePedalMode = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.empty();

  const globalSpinner = $('<div id="catalog-global-loader"></div>'); 
  resultsDiv.append(globalSpinner);

  const cleanId = decodeURIComponent(pedalId.trim());

  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token ? "Bearer "+token : ""
    },
    body: JSON.stringify({ids:[cleanId]})
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

// ===== INIT NAV + CATALOG =====
function initNavCatalog(userRole){
  renderNavBar(userRole);
  updatePedalCountsFromServer(); // <- qui chiamiamo subito i counts fissi
  const pedalIdFromURL = getPedalIdFromURL();
  if(pedalIdFromURL) initSinglePedalView(pedalIdFromURL,userRole);
  else {
    setupCatalogObserver();
    loadNextCatalogPage();
  }
}
// --------------------
// NAV
// --------------------
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

  // Guest vs Logged-in
  if(userRole==="guest"){
    $("#createPedalBtn").hide();
    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm">Login</button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click","#loginBtn",()=>window.location.href="login");
  } else {
    $(document).on("click","#createPedalBtn",()=>createNewPedal());
  }

  $("body").append(window.fullscreenMenuHtml);
  $("#menuToggle").on("click",()=>$("#fullscreenMenu").addClass("active"));
  $("#closeMenu").on("click",()=>$("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click",function(){
    const input=$("#pedalFilterInput");
    input.is(":visible")?input.hide().val(""):input.css("display","flex").focus();
  });

  const style=document.createElement("style");
  style.textContent=`
    .status-filter{cursor:pointer;text-decoration:underline;color:#ddd;}
    .status-filter.active-filter{font-weight:bold;color:#fff;text-decoration:none;border-bottom:2px solid #fff;}
    @media(max-width:768px){#pedalCount span.status-filter:not([data-filter="all"]){display:none!important;}}
  `;
  document.head.appendChild(style);
}

// --------------------
// CATALOG + Lazy Load + Server-side search/filter
// --------------------
function initCatalog(userRole){
  const resultsDiv=document.getElementById("catalog");
  resultsDiv.innerHTML=`<div class="bx--loading-overlay"><div class="bx--loading" role="status"><svg class="bx--loading__svg" viewBox="-75 -75 150 150"><circle class="bx--loading__background" cx="0" cy="0" r="37.5"/><circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/></svg></div></div>`;

  const roleParam=userRole==="guest"?"guest":userRole;
  const usernameParam=window.currentUser?.username||"";
  const token=localStorage.getItem('authToken');
  const limit=20;

  // Stato globale catalog
  window.catalogState={
    offset:0,
    limit,
    loading:false,
    allLoaded:false,
    search:"",
    status:"all",
  };

  // Build URL
  function buildUrl(){
    const url=new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
    url.searchParams.set("role",roleParam);
    url.searchParams.set("username",usernameParam);
    url.searchParams.set("limit",catalogState.limit);
    url.searchParams.set("offset",catalogState.offset);
    if(catalogState.search) url.searchParams.set("search",catalogState.search);
    if(catalogState.status && catalogState.status!=="all") url.searchParams.set("status",catalogState.status);
    return url.toString();
  }

  // Load batch
  async function loadPage(){
    if(catalogState.loading || catalogState.allLoaded) return;
    catalogState.loading=true;
    showBatchLoader(true);

    try{
      const res=await fetch(buildUrl(),{ headers:{ 'Authorization':'Bearer '+token }});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const body=await res.json();
      const items=Array.isArray(body)?body:body.items||[];
      if(items.length===0) { catalogState.allLoaded=true; showBatchLoader(false); catalogState.loading=false; return; }

      items.forEach(pedal=>{
        const $pedalDiv=renderPedal(pedal,userRole);
        $pedalDiv.attr("data-author", pedal.author||"");
        $pedalDiv.attr("data-published",(pedal.published||"draft").toLowerCase());
        $(resultsDiv).append($pedalDiv);
      });

      catalogState.offset+=items.length;
      if(items.length<catalogState.limit) catalogState.allLoaded=true;

    }catch(err){
      console.error("Catalog load error:",err);
    }finally{
      catalogState.loading=false;
      showBatchLoader(false);
      updatePedalCountsFromServer();
    }
  }

  function showBatchLoader(show){
    let el=document.getElementById("batchLoader");
    if(show){
      if(!el){
        el=document.createElement("div");
        el.id="batchLoader";
        el.style.padding="12px"; el.style.textAlign="center";
        el.innerText="Loading more…";
        resultsDiv.appendChild(el);
      }
    } else { if(el) el.remove(); }

    const sentinel=document.getElementById("lazySentinel")||createSentinel();
    resultsDiv.appendChild(sentinel);
  }

  function createSentinel(){
    const s=document.createElement("div");
    s.id="lazySentinel"; s.style.height="1px";
    resultsDiv.appendChild(s);
    return s;
  }

  // IntersectionObserver
  const observer=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting) loadPage();
  },{ rootMargin:"200px" });

  observer.observe(createSentinel());

  // Reset + Load (usato da search e filter)
  window.resetAndLoad=function({search="",status="all"}={}){
    resultsDiv.innerHTML="";
    catalogState.offset=0;
    catalogState.allLoaded=false;
    catalogState.loading=false;
    catalogState.search=search;
    catalogState.status=status;
    observer.disconnect();
    observer.observe(createSentinel());
    loadPage();
  }

  // Search input
  function debounce(fn,delay){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn(...args),delay); }; }
  $("#pedalFilterInput").off("input").on("input",debounce(function(){
    const val=$(this).val().trim();
    resetAndLoad({ search: val, status: catalogState.status });
  },350));

  // Status filters (delegation)
  $(document).on("click",".status-filter",function(){
    const filter=$(this).data("filter")||"all";
    resetAndLoad({ search: catalogState.search, status: filter });
  });

  // Edit button delegation
  $(document).on("click",".edit-btn",function(){
    const pedalId=$(this).data("id");
    editPedal(pedalId);
  });

} // end initCatalog

// --------------------
// Update counters
// --------------------
function updatePedalCountsFromServer(){
  const cs=window.catalogState;
  const totalVisible=$(".pedal-catalog").length;
  const totalAbsolute=totalVisible; // fallback senza server counts

  const countsHtml=`${totalVisible} gear${totalVisible===1?"":"s"} available (All: <span class="status-filter ${cs.status==="all"?"active-filter":""}" data-filter="all">${totalAbsolute}</span>)`;
  $("#pedalCount").html(countsHtml);
}

// nav-catalog.js

// Initialize navigation catalog
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");

  // Nav HTML
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

  // Hide Add Gear button for guests
  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    // Add Login button
    const loginBtnHtml = `
        <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login" style="display: flex; align-items: center; gap: 0.5rem;">
          Login
        </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click", "#loginBtn", function() { window.location.href = "login"; });
  } else {
    // Logged-in users
    function isTokenValid() {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        return payload.exp && payload.exp > Math.floor(Date.now()/1000);
      } catch { return false; }
    }
    function handleCreatePedalClick() {
      if (!isTokenValid()) {
        Swal.fire({ icon:'warning', title:'Login Required', text:'Please log in to create a pedal.', confirmButtonText:'Login' })
          .then(()=>window.location.href="login");
        return;
      }
      createNewPedal();
    }
    $(document).on('click','#createPedalBtn',handleCreatePedalClick);
  }

  // Fullscreen menu
  $("body").append(window.fullscreenMenuHtml);
  $("#menuToggle").on("click",()=>$("#fullscreenMenu").addClass("active"));
  $("#closeMenu").on("click",()=>$("#fullscreenMenu").removeClass("active"));

  // Toggle search input
  $("#toggleFilterBtn").on("click",function(){
    const input=$("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.css("display","flex").focus();
  });

  // -- CSS --
  const style=document.createElement("style");
  style.textContent=`
    .status-filter{cursor:pointer;text-decoration:underline;color:#ddd;}
    .status-filter.active-filter{font-weight:bold;color:#fff;text-decoration:none;border-bottom:2px solid #fff;}
    @media(max-width:768px){#pedalCount span.status-filter:not([data-filter="all"]){display:none!important;}}
  `;
  document.head.appendChild(style);
}

// --------------------
// Pedal counts + filter
// --------------------
function updatePedalCounts(activeFilter=null){
  if(!window.allPedals) return;
  const totalVisible=$(".pedal-catalog:visible").length;
  const totalAbsolute=window.allPedals.length;

  const statusCounts={draft:0,private:0,reviewing:0,publicByMe:0};
  let userPedalsCount=0;
  const currentUsername=(window.currentUser?.username||"").toLowerCase();

  window.allPedals.forEach(p=>{
    const status=(p.published||"draft").toLowerCase();
    const author=(p.author||"").toLowerCase();
    if(status in statusCounts) statusCounts[status]++;
    if(status==="public" && author===currentUsername) statusCounts.publicByMe++;
    if(author && author!=="admin") userPedalsCount++;
  });

  const reviewingBadge=statusCounts.reviewing>0
    ? `<span class="status-filter ${activeFilter==="reviewing"?"active-filter":""}" data-filter="reviewing" style="background:#f00;color:white;border-radius:50%;padding:1px 5px;font-size:0.75rem;font-weight:bold;min-width:18px;text-align:center;">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter==="reviewing"?"active-filter":""}" data-filter="reviewing">0</span>`;

  let countsHtml=`${totalVisible} gear${totalVisible===1?"":"s"} available (All: <span class="status-filter ${activeFilter==="all"?"active-filter":""}" data-filter="all">${totalAbsolute}</span>`;
  if(window.currentUser?.role!=="guest"){
    countsHtml+=`, Draft: <span class="status-filter ${activeFilter==="draft"?"active-filter":""}" data-filter="draft">${statusCounts.draft}</span>, Private: <span class="status-filter ${activeFilter==="private"?"active-filter":""}" data-filter="private">${statusCounts.private}</span>, Reviewing: ${reviewingBadge}, Published by me: <span class="status-filter ${activeFilter==="publicByMe"?"active-filter":""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;
    if(window.currentUser?.role==="admin")
      countsHtml+=`, Published by Users: <span class="status-filter ${activeFilter==="user"?"active-filter":""}" data-filter="user">${userPedalsCount}</span>`;
  }
  countsHtml+=`)`;
  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click",function(){
    const filter=$(this).data("filter");
    filterPedalsByStatus(filter);
  });
}

function filterPedalsByStatus(filter){
  const currentUsername=(window.currentUser?.username||"").toLowerCase();
  const filtered=window.allPedals.filter(p=>{
    const status=(p.published||"draft").toLowerCase();
    const author=(p.author||"").toLowerCase();
    if(filter==="all") return true;
    if(filter==="publicByMe") return status==="public" && author===currentUsername;
    if(filter==="user") return author && author!=="admin";
    return status===filter;
  });
  renderFiltered(filtered);
  updatePedalCounts(filter);
}

// --------------------
// initCatalog con lazy load + search + status filters lato server
// --------------------
function initCatalog(userRole){
  const resultsDiv = document.getElementById("catalog");
  resultsDiv.innerHTML = `<div class="bx--loading-overlay"><div class="bx--loading" role="status"><svg class="bx--loading__svg" viewBox="-75 -75 150 150"><circle class="bx--loading__background" cx="0" cy="0" r="37.5"/><circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/></svg></div></div>`;

  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem('authToken');
  const limit = 40;

  // stato globale
  window.catalogState = {
    offset: 0,
    limit,
    search: "",
    status: "all",
    loading: false,
    allLoaded: false,
    loadedIds: new Set(),
  };

  // crea (o trova) sentinel per lazy load
  function ensureSentinel(){
    let s = document.getElementById("lazySentinel");
    if(!s){
      s = document.createElement("div");
      s.id = "lazySentinel";
      s.style.height = "1px";
      resultsDiv.appendChild(s);
    }
    return s;
  }

  // costruisci URL per la chiamata al backend
  function buildUrl(){
    const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
    url.searchParams.set("role", roleParam);
    url.searchParams.set("username", usernameParam);
    url.searchParams.set("limit", window.catalogState.limit);
    url.searchParams.set("offset", window.catalogState.offset);
    if (window.catalogState.search) url.searchParams.set("search", window.catalogState.search);
    if (window.catalogState.status && window.catalogState.status !== "all") url.searchParams.set("status", window.catalogState.status);
    return url.toString();
  }

  // carica pagina dal server
  async function loadPage(){
    const cs = window.catalogState;
    if(cs.loading || cs.allLoaded) return;
    cs.loading = true;

    const url = buildUrl();
    try{
      const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();

      // normalizza risposta
      const items = Array.isArray(body) ? body : (body.items || []);
      const total = body.total || items.length;

      if(cs.offset === 0) resultsDiv.innerHTML = "";

      let appended = 0;
      for(const item of items){
        if(!item || !item._id || cs.loadedIds.has(item._id)) continue;
        cs.loadedIds.add(item._id);
        const $pedalDiv = renderPedal(item, userRole);
        $pedalDiv.attr("data-author", item.author || "");
        $pedalDiv.attr("data-published", (item.published || "draft").toLowerCase());
        $(resultsDiv).append($pedalDiv);
        appended++;
      }

      cs.offset += items.length;
      if (cs.loadedIds.size >= total || items.length < cs.limit) cs.allLoaded = true;

      updatePedalCountsFromServer(body.counts || null, total);
    }catch(err){
      console.error("Error loading catalog:", err);
      if(window.catalogState.offset === 0)
        resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err.message}</p>`;
    }finally{
      cs.loading = false;
    }
  }

  // osservatore per lazy load
  const observer = new IntersectionObserver(entries => {
    if(entries[0].isIntersecting && !window.catalogState.loading && !window.catalogState.allLoaded){
      loadPage();
    }
  }, { rootMargin: "250px" });

  // reset e reload
  window.resetAndLoad = function({search = "", status = "all"} = {}){
    resultsDiv.innerHTML = "";
    window.catalogState.offset = 0;
    window.catalogState.allLoaded = false;
    window.catalogState.loading = false;
    window.catalogState.search = search;
    window.catalogState.status = status;
    window.catalogState.loadedIds = new Set();

    ensureSentinel();
    observer.disconnect();
    observer.observe(document.getElementById("lazySentinel"));

    loadPage();
  };

  // ricerca lato server (debounced)
  function debounce(fn, delay){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn(...a), delay); }; }
  $("#pedalFilterInput").off("input").on("input", debounce(function(){
    const val = $(this).val().trim();
    resetAndLoad({ search: val, status: window.catalogState.status });
  }, 350));

  // click sui filtri numerici -> chiama resetAndLoad lato server
  $(document).off("click", ".status-filter").on("click", ".status-filter", function(){
    const filter = $(this).data("filter") || "all";
    $(".status-filter").removeClass("active-filter");
    $(this).addClass("active-filter");
    resetAndLoad({ search: window.catalogState.search, status: filter });
  });

  // inizializza sentinel e carica la prima pagina
  ensureSentinel();
  observer.observe(document.getElementById("lazySentinel"));
  loadPage();
}
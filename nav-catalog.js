// nav-catalog.js (versione completa, paginata, search server-side, filters)

///////////////////////
// NAV (unchanged)
///////////////////////
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

  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm">Login</button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click", "#loginBtn", () => window.location.href = "login");
  } else {
    $(document).on('click','#createPedalBtn', () => createNewPedal());
  }

  $("body").append(window.fullscreenMenuHtml);
  $("#menuToggle").on("click", () => $("#fullscreenMenu").addClass("active"));
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function(){
    const input = $("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.css("display","flex").focus();
  });

  const style = document.createElement("style");
  style.textContent = `
    .status-filter{cursor:pointer;text-decoration:underline;color:#ddd;}
    .status-filter.active-filter{font-weight:bold;color:#fff;text-decoration:none;border-bottom:2px solid #fff;}
    @media(max-width:768px){#pedalCount span.status-filter:not([data-filter="all"]){display:none!important;}}
  `;
  document.head.appendChild(style);
}


///////////////////////
// CATALOG (paginated + lazy)
///////////////////////
function initCatalog(userRole) {
  const resultsDiv = document.getElementById("catalog");
  resultsDiv.innerHTML = `<div class="bx--loading-overlay"><div class="bx--loading" role="status"><svg class="bx--loading__svg" viewBox="-75 -75 150 150"><circle class="bx--loading__background" cx="0" cy="0" r="37.5"/><circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/></svg></div></div>`;

  // Config
  const token = localStorage.getItem("authToken");
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const limit = 20;

  // Stato
  window.catalogState = {
    offset: 0,
    limit,
    loading: false,
    allLoaded: false,
    statusFilter: "all",   // "all", "draft", "private", "reviewing", "publicByMe", "user"
    search: "",            // search term (server-side)
    loadedIds: new Set(),  // evita duplicati
    counts: null,          // counts server-side (aggiornati ad ogni risposta)
  };

  // create sentinel container if not exist
  function ensureSentinel() {
    let s = document.getElementById("lazySentinel");
    if (!s) {
      s = document.createElement("div");
      s.id = "lazySentinel";
      s.style.height = "1px";
      resultsDiv.appendChild(s);
    }
    return s;
  }

  // helper per build URL
  function buildUrl() {
    const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
    url.searchParams.set("role", roleParam);
    url.searchParams.set("username", usernameParam);
    url.searchParams.set("limit", catalogState.limit);
    url.searchParams.set("offset", catalogState.offset);
    if (catalogState.search) url.searchParams.set("search", catalogState.search);
    if (catalogState.statusFilter && catalogState.statusFilter !== "all") url.searchParams.set("status", catalogState.statusFilter);
    return url.toString();
  }

  // Normalizza risposta (tolleranza: array oppure {items,total,counts})
  function normalizeResponse(body) {
    if (Array.isArray(body)) {
      return { items: body, total: body.length, counts: null };
    }
    if (body && body.items) {
      return { items: body.items, total: body.total || body.items.length, counts: body.counts || null };
    }
    return { items: [], total: 0, counts: null };
  }

  // Load page (offset/limit) dal server
  async function loadPage() {
    const cs = window.catalogState;
    if (cs.loading || cs.allLoaded) return;
    cs.loading = true;

    // show small loading marker
    showBatchLoader(true);

    const url = buildUrl();
    try {
      const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const { items, total, counts } = normalizeResponse(body);

      // update counts / total
      cs.counts = counts || cs.counts || null;

      // append only new items (evita duplicati se server torna sovrapposti)
      let appended = 0;
      for (const item of items) {
        if (!item || !item._id) continue;
        if (cs.loadedIds.has(item._id)) continue;
        cs.loadedIds.add(item._id);
        appendPedalToDOM(item, userRole);
        appended++;
      }

      // advance offset by number of items returned by server (not by appended to handle server paging)
      cs.offset += items.length;

      // determine if finished (server says total or returned less than limit)
      if (typeof total === "number") {
        if (cs.loadedIds.size >= total) cs.allLoaded = true;
      } else {
        if (items.length < cs.limit) cs.allLoaded = true;
      }

      // update counters UI from server counts if present, else fallback
      updatePedalCountsFromServer(cs.counts, (typeof total === "number" ? total : null));

    } catch (err) {
      console.error("Error loading catalog page:", err);
      // mostra messaggio d'errore ma non bloccare forever
      if (window.catalogState.offset === 0) resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err.message || err}</p>`;
    } finally {
      cs.loading = false;
      showBatchLoader(false);
    }
  }

  // Appendi un singolo pedal al DOM
  function appendPedalToDOM(pedal, role) {
    const $pedalDiv = renderPedal(pedal, role);
    $pedalDiv.attr("data-author", pedal.author || "");
    $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
    $(resultsDiv).append($pedalDiv);
  }

  // Small batch loader spinner text (in fondo)
  function showBatchLoader(show) {
    let el = document.getElementById("batchLoader");
    if (show) {
      if (!el) {
        el = document.createElement("div");
        el.id = "batchLoader";
        el.style.padding = "12px";
        el.style.textAlign = "center";
        el.innerText = "Loading more…";
        resultsDiv.appendChild(el);
      }
    } else {
      if (el) el.remove();
    }
    // ensure sentinel always after loader
    const s = ensureSentinel();
    resultsDiv.appendChild(s);
  }

  // IntersectionObserver: osserva sentinel e chiama loadPage quando serve
  const observer = new IntersectionObserver(entries => {
    const ent = entries[0];
    if (!ent.isIntersecting) return;
    // only load if not already loading and not allLoaded
    if (!window.catalogState.loading && !window.catalogState.allLoaded) {
      loadPage();
    }
  }, { rootMargin: "250px" });

  // reset & (ri)start loading (usato per search e per status filter)
  function resetAndLoad({search = "", status = "all"} = {}) {
    // clear DOM and state
    resultsDiv.innerHTML = "";
    window.catalogState.offset = 0;
    window.catalogState.allLoaded = false;
    window.catalogState.loading = false;
    window.catalogState.search = search;
    window.catalogState.statusFilter = status;
    window.catalogState.loadedIds = new Set();
    window.catalogState.counts = null;

    // attach sentinel and observer
    ensureSentinel();
    observer.disconnect(); // remove any previous observations
    observer.observe(document.getElementById("lazySentinel"));

    // first page
    loadPage();
  }

  // Server-side search debounce
  function debounce(fn, delay){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn(...a), delay); }; }
  $("#pedalFilterInput").off("input").on("input", debounce(function(){
    const val = $(this).val().trim();
    // server-side search: reset state and request from server with search param
    resetAndLoad({ search: val, status: window.catalogState.statusFilter });
  }, 350));

  // Click handlers for status filters (numbers). They call server with &status=...
  $(document).off("click", ".status-filter").on("click", ".status-filter", function(){
    const filter = $(this).data("filter") || "all";
    window.catalogState.statusFilter = filter;
    // mark active visual
    $(".status-filter").removeClass("active-filter");
    $(this).addClass("active-filter");
    // reset & load for new status
    resetAndLoad({ search: window.catalogState.search, status: filter });
  });

  // inizializza sentinel + osservatore e carica primo batch
  ensureSentinel();
  observer.observe(document.getElementById("lazySentinel"));
  loadPage();
} // end initCatalog


///////////////////////
// Update counters using server counts if available
///////////////////////
function updatePedalCountsFromServer(counts, totalFromServer = null) {
  // counts: { draft, private, reviewing, publicByMe, userCreated } or null
  // totalFromServer: integer or null

  const cs = window.catalogState || {};
  const totalVisible = (document.querySelectorAll(".pedal-catalog") || []).length;
  const totalAbsolute = (typeof totalFromServer === "number") ? totalFromServer : (cs.counts ? (cs.counts.draft + cs.counts.private + cs.counts.reviewing + (cs.counts.publicByMe || 0) + (cs.counts.userCreated || 0)) : totalVisible);

  // If we have server counts use them, otherwise show counts computed from DOM (fallback)
  const sc = counts || cs.counts || null;
  let draftCount = sc ? (sc.draft || 0) : $(".pedal-catalog[data-published='draft']").length;
  let privateCount = sc ? (sc.private || 0) : $(".pedal-catalog[data-published='private']").length;
  let reviewingCount = sc ? (sc.reviewing || 0) : $(".pedal-catalog[data-published='reviewing']").length;
  let publicByMe = sc ? (sc.publicByMe || 0) : 0;
  let userCreated = sc ? (sc.userCreated || 0) : $(".pedal-catalog").filter(function(){ return ($(this).data("author") || "").toLowerCase() !== "admin"; }).length;

  const currentFilter = window.catalogState?.statusFilter || "all";

  const reviewingBadge = reviewingCount > 0
    ? `<span class="status-filter ${currentFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="background:#ff0000;color:white;border-radius:50%;padding:1px 5px;font-size:0.75rem;font-weight:bold;min-width:18px;text-align:center;">${reviewingCount}</span>`
    : `<span class="status-filter ${currentFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  let countsHtml = `${totalVisible} gear shown (All: <span class="status-filter ${currentFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>`;

  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${currentFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${draftCount}</span>, Private: <span class="status-filter ${currentFilter === "private" ? "active-filter" : ""}" data-filter="private">${privateCount}</span>, Reviewing: ${reviewingBadge}, Published by me: <span class="status-filter ${currentFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${publicByMe}</span>`;
    if (window.currentUser?.role === "admin") {
      countsHtml += `, Published by Users: <span class="status-filter ${currentFilter === "user" ? "active-filter" : ""}" data-filter="user">${userCreated}</span>`;
    }
  }

  countsHtml += `)`;
  $("#pedalCount").html(countsHtml);

  // riaggancia handler (assicurati che click chiami la funzione sopra)
  $(".status-filter").off("click").on("click", function(){
    const filter = $(this).data("filter") || "all";
    $(".status-filter").removeClass("active-filter");
    $(this).addClass("active-filter");
    window.catalogState.statusFilter = filter;
    // reset & load server-side with status
    const currentSearch = window.catalogState.search || "";
    // perform reset/load
    // ps: chiamare la funzione che abbiamo definito in initCatalog: resetAndLoad
    if (typeof resetAndLoad === "function") {
      resetAndLoad({ search: currentSearch, status: filter });
    } else {
      // fallback: trigger a click event handled earlier
      $(this).trigger("click");
    }
  });
}


// =========================
// nav-catalog.js (final stable version)
// =========================

function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");

  const navHtml = `
    <header style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <button id="menuToggle" aria-label="Open menu" style="background:none;border:none;">
          <div class="pedalplex-logo"></div>
        </button>
        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size:1.25rem;color:#aaa;font-weight:600;">Gears</span>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;">
        <span id="pedalCount" style="font-size:0.75rem;color:#aaa"></span>

        <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none;border:none;cursor:pointer;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            viewBox="0 0 24 24" width="22" height="22"><circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>

        <input id="pedalFilterInput" type="text" placeholder="Filter gears..."
          style="font-size:0.875rem;padding:6px 12px;border:1px solid #8c8c8c;border-radius:4px;outline-offset:2px;width:140px;display:none;" />

        <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" style="display:flex;align-items:center;gap:0.5rem;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32">
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
    const loginBtn = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm">Login</button>`;
    $("#toggleFilterBtn").after(loginBtn);
    $(document).on("click", "#loginBtn", () => (window.location.href = "login"));
  } else {
    $(document).on("click", "#createPedalBtn", () => createNewPedal());
  }

  // menu fullscreen
  $("body").append(window.fullscreenMenuHtml);
  $("#menuToggle").on("click", () => $("#fullscreenMenu").addClass("active"));
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.show().focus();
  });

  const style = document.createElement("style");
  style.textContent = `
    .status-filter{cursor:pointer;text-decoration:underline;color:#ddd;}
    .status-filter.active-filter{font-weight:bold;color:#fff;text-decoration:none;border-bottom:2px solid #fff;}
    @media(max-width:768px){#pedalCount span.status-filter:not([data-filter="all"]){display:none!important;}}
  `;
  document.head.appendChild(style);
}

// ==========================
// CATALOG with Lazy Load + Server Filter + Server Search
// ==========================
function initCatalog(userRole) {
  const resultsDiv = document.getElementById("catalog");
  resultsDiv.innerHTML = `<div id="catalogLoader" style="text-align:center;padding:2rem;"><div class="bx--loading" role="status"><svg class="bx--loading__svg" viewBox="-75 -75 150 150"><circle class="bx--loading__background" cx="0" cy="0" r="37.5"/><circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/></svg></div></div>`;

  const token = localStorage.getItem("authToken");
  const role = userRole;
  const username = window.currentUser?.username || "";

  // Stato catalogo
  window.catalogState = {
    offset: 0,
    limit: 20,
    loading: false,
    allLoaded: false,
    statusFilter: "all",
    search: "",
    loadedIds: new Set(),
    counts: null,
  };

  function buildUrl() {
    const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
    url.searchParams.set("limit", window.catalogState.limit);
    url.searchParams.set("offset", window.catalogState.offset);
    url.searchParams.set("role", role);
    url.searchParams.set("username", username);
    if (window.catalogState.search) url.searchParams.set("search", window.catalogState.search);
    if (window.catalogState.statusFilter && window.catalogState.statusFilter !== "all")
      url.searchParams.set("status", window.catalogState.statusFilter);
    return url.toString();
  }

  async function loadPage() {
    const cs = window.catalogState;
    if (cs.loading || cs.allLoaded) return;
    cs.loading = true;

    showBatchLoader(true);
    try {
      const res = await fetch(buildUrl(), { headers: { Authorization: "Bearer " + token } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();

      let items = Array.isArray(data) ? data : data.items || [];
      let total = data.total || items.length;
      let counts = data.counts || null;

      if (counts) cs.counts = counts;

      let appended = 0;
      for (const item of items) {
        if (!item || !item._id || cs.loadedIds.has(item._id)) continue;
        cs.loadedIds.add(item._id);
        appendPedalToDOM(item, role);
        appended++;
      }

      cs.offset += items.length;
      if (items.length < cs.limit) cs.allLoaded = true;

      updatePedalCountsFromServer(cs.counts, total);
    } catch (e) {
      console.error("Catalog load error:", e);
      if (window.catalogState.offset === 0)
        resultsDiv.innerHTML = `<p style="color:red;">Error loading catalog: ${e.message}</p>`;
    } finally {
      cs.loading = false;
      showBatchLoader(false);
    }
  }

  function appendPedalToDOM(pedal, role) {
    const $p = renderPedal(pedal, role);
    $p.attr("data-published", (pedal.published || "draft").toLowerCase());
    $p.attr("data-author", pedal.author || "");
    $(resultsDiv).append($p);
  }

  // Spinner bottom
  function showBatchLoader(show) {
    let el = document.getElementById("batchLoader");
    if (show) {
      if (!el) {
        el = document.createElement("div");
        el.id = "batchLoader";
        el.style.textAlign = "center";
        el.style.padding = "12px";
        el.innerText = "Loading more…";
        resultsDiv.appendChild(el);
      }
    } else if (el) el.remove();
  }

  // Sentinel for infinite scroll
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

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadPage();
    },
    { rootMargin: "300px" }
  );

  window.resetAndLoad = function ({ search = "", status = "all" } = {}) {
    const cs = window.catalogState;
    cs.offset = 0;
    cs.loading = false;
    cs.allLoaded = false;
    cs.loadedIds = new Set();
    cs.search = search;
    cs.statusFilter = status;
    resultsDiv.innerHTML = "";
    ensureSentinel();
    observer.disconnect();
    observer.observe(document.getElementById("lazySentinel"));
    loadPage();
  };

  // ricerca debounce lato server
  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }
  $("#pedalFilterInput")
    .off("input")
    .on(
      "input",
      debounce(function () {
        const val = $(this).val().trim();
        resetAndLoad({ search: val, status: window.catalogState.statusFilter });
      }, 350)
    );

  // Filtri cliccando sui numeri
  $(document)
    .off("click", ".status-filter")
    .on("click", ".status-filter", function () {
      const filter = $(this).data("filter") || "all";
      $(".status-filter").removeClass("active-filter");
      $(this).addClass("active-filter");
      resetAndLoad({ search: window.catalogState.search, status: filter });
    });

  ensureSentinel();
  observer.observe(document.getElementById("lazySentinel"));
  loadPage();
}

// ===========================
// Contatori
// ===========================
function updatePedalCountsFromServer(counts, totalFromServer = null) {
  const cs = window.catalogState || {};
  const totalVisible = $(".pedal-catalog").length;
  const totalAbsolute = totalFromServer || totalVisible;
  const c = counts || {};

  const currentFilter = cs.statusFilter || "all";
  let countsHtml = `${totalVisible} shown (All: <span class="status-filter ${
    currentFilter === "all" ? "active-filter" : ""
  }" data-filter="all">${totalAbsolute}</span>`;

  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${
      currentFilter === "draft" ? "active-filter" : ""
    }" data-filter="draft">${c.draft || 0}</span>, Private: <span class="status-filter ${
      currentFilter === "private" ? "active-filter" : ""
    }" data-filter="private">${c.private || 0}</span>, Reviewing: <span class="status-filter ${
      currentFilter === "reviewing" ? "active-filter" : ""
    }" data-filter="reviewing">${c.reviewing || 0}</span>, Published by me: <span class="status-filter ${
      currentFilter === "publicByMe" ? "active-filter" : ""
    }" data-filter="publicByMe">${c.publicByMe || 0}</span>`;
    if (window.currentUser?.role === "admin") {
      countsHtml += `, Published by Users: <span class="status-filter ${
        currentFilter === "user" ? "active-filter" : ""
      }" data-filter="user">${c.user || 0}</span>`;
    }
  }

  countsHtml += ")";
  $("#pedalCount").html(countsHtml);
}

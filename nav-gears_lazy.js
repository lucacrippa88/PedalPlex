// nav-gears_lazy.js

window.catalogInitialized = false;

// ========================== UTILITY ==========================
function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // null se non presente
}

// ========================== NAVBAR ==========================
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
    const loginBtnHtml = `
      <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login" style="display: flex; align-items: center; gap: 0.5rem;">
        Login
      </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);

    $(document).on("click", "#loginBtn", function() {
      window.location.href = "login";
    });
  } else {
    function isTokenValid() {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp > now;
      } catch (err) {
        console.error("Invalid JWT:", err);
        return false;
      }
    }

    function handleCreatePedalClick() {
      if (!isTokenValid()) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'Please log in to create a pedal.',
          confirmButtonText: 'Login',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        }).then(() => { window.location.href = "login"; });
        return;
      }
      createNewPedal();
    }

    $(document).on('click', '#createPedalBtn', handleCreatePedalClick);
    $(document).on('click', '#createOwnPedalBtn', handleCreatePedalClick);
  }

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) input.hide().val("");
    else input.css("display", "flex").focus();
  });

  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    $(".pedal-catalog").each(function () {
      const name = $(this).data("pedal-id")?.toLowerCase() || "";
      $(this).toggle(name.includes(filterValue));
    });
    updatePedalCountsFromServer();
  });

  if (userRole === "guest") $(".status-filter").not('[data-filter="all"]').hide();
}

// ========================== SINGLE PEDAL VIEW ==========================
function initSinglePedalView(pedalId, userRole) {
  window.singlePedalMode = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.empty();

  const globalSpinner = $(`
    <div id="catalog-global-loader" class="bx--loading-overlay"
         style="position: fixed; top:80%; left:50%; transform: translate(-50%, -50%); z-index:9999; width:120px; height:120px; display:flex; justify-content:center; align-items:center;">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"></circle>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"></circle>
        </svg>
      </div>
    </div>
  `);
  resultsDiv.append(globalSpinner);

  const cleanId = decodeURIComponent(pedalId.trim());

  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? "Bearer " + token : ""
    },
    body: JSON.stringify({ ids: [cleanId] })
  })
    .then(res => res.json())
    .then(data => {
      $("#catalog-global-loader").remove();
      const pedals = data.docs || [];
      if (pedals.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'Pedal not found',
          text: 'This gear does not exist.',
          confirmButtonText: 'Back to Catalog',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        }).then(() => window.location.href = 'gears');
        return;
      }
      renderCatalogIncremental(pedals, 'catalog', userRole, 50);
      if (userRole !== "guest") setupEditPedalHandler(pedals);
    })
    .catch(err => {
      console.error("Error loading pedal by ID:", err);
      $("#catalog-global-loader").remove();
      resultsDiv.html(`<p style="color:red;">Error loading pedal: ${err.message}</p>`);
    });
}

// ========================== NAV INIT ==========================
function initNavCatalog(userRole) {
  renderNavBar(userRole);
  const pedalIdFromURL = getPedalIdFromURL();
  if (pedalIdFromURL) {
    initSinglePedalView(pedalIdFromURL, userRole);
    return;
  }
  initCatalog(userRole);
}

// ========================== CATALOG (Lazy Load) ==========================
function initCatalog(userRole) {
  if (window.singlePedalMode || window.catalogInitialized) return;
  window.catalogInitialized = true;

  $("#catalog").empty();
  setupCatalogObserver();
  loadNextCatalogPage();
}

// ========================== FILTER FUNCTION ==========================
function filterPedalsByStatus(filter) {
  const currentUsername = (window.currentUser?.username || "").toLowerCase();
  $(".pedal-catalog").each(function () {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    const isMine = (status === "public" && author === currentUsername);
    const isUserCreated = author && author !== "admin";

    if (filter === "all") $(this).toggle(status !== "template");
    else if (filter === "template") $(this).toggle(status === "template");
    else if (filter === "publicByMe") $(this).toggle(isMine);
    else if (filter === "user") $(this).toggle(isUserCreated);
    else $(this).toggle(status === filter);
  });
  updatePedalCounts(filter);
}

// ========================== PEDAL COUNTS ==========================
function updatePedalCountsFromServer(activeFilter = null) {
  const token = localStorage.getItem("authToken");
  fetch("https://api.pedalplex.com/GET_CATALOG_COUNTS.php", {
    headers: token ? { Authorization: "Bearer " + token } : {}
  })
    .then(r => r.json())
    .then(counts => {
      let countsHtml = `${counts.total} gear${counts.total === 1 ? "" : "s"} (All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${counts.total}</span>`;
      if (window.currentUser?.role !== "guest") {
        countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${counts.draft}</span>, 
          Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${counts.private}</span>, 
          Review: <span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">${counts.reviewing}</span>, 
          By me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${counts.publicByMe}</span>;
          Template: <span class="status-filter ${activeFilter === "template" ? "active-filter" : ""}" data-filter="template">${counts.template}</span>`;
        if (window.currentUser?.role === "admin") {
          countsHtml += `, By Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${counts.byUsers}</span>`;
        }
      }
      countsHtml += `)`;
      $("#pedalCount").html(countsHtml);

      $(".status-filter").off("click").on("click", function() {
        const filter = $(this).data("filter");
        filterPedalsByStatus(filter);
      });
    })
    .catch(err => console.error("Counts fetch error:", err));
}

// ========================== CSS ==========================
const style = document.createElement("style");
style.textContent = `
  .status-filter { cursor: pointer; text-decoration: underline; color: #ddd; }
  .status-filter.active-filter { font-weight: bold; color: #fff; text-decoration: none; border-bottom: 2px solid #fff; }
  @media (max-width: 768px) { #pedalCount span.status-filter:not([data-filter="all"]) { display: none !important; } }
`;
document.head.appendChild(style);

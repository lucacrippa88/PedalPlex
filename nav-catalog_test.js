// nav-catalog-lazy.js

// --- GLOBAL VARIABLES ---
let lazyOffset = 0;
let lazyLimit = 50;
let lazyLoading = false;
let lazyAllLoaded = false;

let catalogMeta = null;
let activeServerFilter = null;
let activeSearch = "";

// --- INIT NAV CATALOG ---
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
    const loginBtnHtml = `
      <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login" style="display: flex; align-items: center; gap: 0.5rem;">
        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
          <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
          <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
        </svg>
        Login
      </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click", "#loginBtn", function() {
      window.location.href = "login";
    });
  }

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) input.hide().val("");
    else input.css("display", "flex").focus();
  });

  $("#pedalFilterInput").on("input", function () {
    activeSearch = $(this).val().trim();
    lazyOffset = 0;
    lazyAllLoaded = false;
    $("#catalog").empty();
    loadMorePedals(userRole);
  });

  // optional fullscreen menu logic here...
}

// --- UPDATE META COUNTERS ---
function updateMetaCounters() {
  if (!catalogMeta) return;

  const total = catalogMeta.total || 0;
  const drafts = catalogMeta.draft || 0;
  const privates = catalogMeta.private || 0;
  const reviewing = catalogMeta.reviewing || 0;
  const publicByMe = catalogMeta.publicByMe || 0;
  const userPedals = catalogMeta.userPedals || 0;

  let html = `${total} gears (All: <span class="status-filter" data-filter="all">${total}</span>`;

  if (window.currentUser?.role !== "guest") {
    html += `, Draft: <span class="status-filter" data-filter="draft">${drafts}</span>,
             Private: <span class="status-filter" data-filter="private">${privates}</span>,
             Reviewing: <span class="status-filter" data-filter="reviewing">${reviewing}</span>,
             Published by me: <span class="status-filter" data-filter="publicByMe">${publicByMe}</span>`;
    if (window.currentUser?.role === "admin") {
      html += `, Users: <span class="status-filter" data-filter="user">${userPedals}</span>`;
    }
  }
  html += `)`;

  $("#pedalCount").html(html);

  $(".status-filter").off("click").on("click", function() {
    activeServerFilter = $(this).data("filter");
    lazyOffset = 0;
    lazyAllLoaded = false;
    $("#catalog").empty();
    loadMorePedals(window.currentUser?.role);
  });
}

// --- INIT CATALOG LAZY LOADING ---
function initCatalog(userRole) {
  $("#catalog").html(`
    <div class="bx--loading-overlay">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
        </svg>
      </div>
    </div>`);

  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem('authToken');

  fetch(`GET_CATALOG_META.php?role=${roleParam}&username=${usernameParam}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(meta => {
    catalogMeta = meta;
    updateMetaCounters();
    lazyOffset = 0;
    lazyAllLoaded = false;
    $("#catalog").empty();
    loadMorePedals(userRole);
    setupLazyScroll(userRole);
  })
  .catch(err => {
    console.error("Error fetching catalog meta:", err);
    $("#catalog").html(`<p style="color:red;">Error loading metadata: ${err.message}</p>`);
  });
}

// --- LOAD CHUNK OF PEDALS ---
function loadMorePedals(userRole) {
  if (lazyLoading || lazyAllLoaded) return;

  lazyLoading = true;
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem('authToken');

  const url = `GET_CATALOG_LAZY.php?role=${roleParam}&username=${usernameParam}&offset=${lazyOffset}&limit=${lazyLimit}&filter=${encodeURIComponent(activeServerFilter || "")}&search=${encodeURIComponent(activeSearch || "")}`;

  fetch(url, { headers: { 'Authorization': 'Bearer ' + token }})
    .then(res => res.json())
    .then(list => {
      if (!Array.isArray(list) || list.length === 0) {
        lazyAllLoaded = true;
        return;
      }

      list.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
        $("#catalog").append($pedalDiv);
      });

      lazyOffset += list.length;
    })
    .catch(err => console.error("Lazy load error:", err))
    .finally(() => { lazyLoading = false; });
}

// --- SETUP SCROLL LISTENER ---
function setupLazyScroll(userRole) {
  $(window).off("scroll.lazy").on("scroll.lazy", function () {
    if (lazyAllLoaded || lazyLoading) return;
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 300) {
      loadMorePedals(userRole);
    }
  });
}

// --- RENDER PEDAL ITEM (usa la tua funzione originale) ---
function renderPedal(pedal, userRole) {
  const html = `
    <div class="pedal-catalog" data-pedal-id="${pedal._id}">
      <h3>${pedal._id}</h3>
      <p>Author: ${pedal.author || '-'}</p>
      <p>Published: ${pedal.published}</p>
    </div>`;
  return $(html);
}

// --- OPTIONAL: add your style overrides ---
const style = document.createElement("style");
style.textContent = `
  .status-filter { cursor: pointer; text-decoration: underline; color: #ddd; }
  .status-filter.active-filter { font-weight: bold; color: #fff; text-decoration: none; border-bottom: 2px solid #fff; }
  @media (max-width: 768px) { #pedalCount span.status-filter:not([data-filter="all"]) { display: none !important; } }
`;
document.head.appendChild(style);

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
          placeholder="Search gears..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
          aria-label="Search pedals"/>

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
    const loginBtnHtml = `
      <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" style="display: flex; align-items: center; gap: 0.5rem;">
        Login
      </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);

    $(document).on("click", "#loginBtn", function() {
      window.location.href = "login";
    });
  } else {
    // Logged-in users: handle Create Pedal
    function isTokenValid() {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp > now;
      } catch { return false; }
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

  // Fullscreen menu
  $("body").append(window.fullscreenMenuHtml);
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  // Toggle search input
  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) input.hide().val("");
    else input.css("display", "flex").focus();
  });

  // 🔹 Search LATO SERVER
  $("#pedalFilterInput").on("input", function () {
    const searchValue = $(this).val().trim();
    performServerSearch(searchValue);
  });

  // Apply guest mode filter visibility
  if (userRole === "guest") $(".status-filter").not('[data-filter="all"]').hide();
}

// ========================
// SEARCH LATO SERVER
// ========================
function performServerSearch(searchText) {
  const userRole = window.currentUser?.role || "guest";
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem('authToken') || "";

  const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
  url.searchParams.set("role", roleParam);
  url.searchParams.set("username", usernameParam);

  // 🔹 Solo se c’è testo, aggiungo il parametro search
  if (searchText && searchText.trim() !== "") {
    url.searchParams.set("search", searchText.trim());
  }

  fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.ok ? res.json() : Promise.reject("Network error"))
  .then(pedals => {
    const resultsDiv = document.getElementById("catalog");
    resultsDiv.innerHTML = "";

    pedals.sort((a, b) => a._id.localeCompare(b._id)); // ordinamento alfabetico
    pedals.forEach(pedal => {
      const $pedalDiv = renderPedal(pedal, userRole);
      $pedalDiv.attr("data-author", pedal.author || "");
      $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
      $(resultsDiv).append($pedalDiv);
    });

    updatePedalCounts();   // aggiorna contatori
    if (userRole !== "guest") setupEditPedalHandler(pedals);
  })
  .catch(err => {
    console.error("Error fetching pedals:", err);
    document.getElementById("catalog").innerHTML = `<p style="color:red;">Error loading pedals: ${err}</p>`;
  });
}


// ========================
// UPDATE PEDAL COUNTS
// ========================
function updatePedalCounts(activeFilter = null) {
  const visiblePedals = $(".pedal-catalog:visible");
  const allPedals = $(".pedal-catalog");
  const totalVisible = visiblePedals.length;
  const totalAbsolute = allPedals.length;

  const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0 };
  let userPedalsCount = 0;
  const currentUsername = (window.currentUser?.username || "").toLowerCase();

  allPedals.each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    if (status in statusCounts) statusCounts[status]++;
    if (status === "public" && author === currentUsername) statusCounts.publicByMe++;
    if (author && author !== "admin") userPedalsCount++;
  });

  const reviewingBadge = statusCounts.reviewing > 0
    ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="
        background:#ff0000;
        color:white;
        border-radius:50%;
        padding:1px 5px;
        font-size:0.75rem;
        font-weight:bold;
        min-width:18px;
        text-align:center;
      ">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  let countsHtml =
    `${totalVisible} gear${totalVisible === 1 ? "" : "s"} available ` +
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>`;

  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Reviewing: ${reviewingBadge}, 
     Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;
    
    if (window.currentUser?.role === "admin") {
      countsHtml += `, Published by Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
    }
  }

  countsHtml += `)`;
  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click", function() {
    const filter = $(this).data("filter");
    filterPedalsByStatus(filter);
  });
}

// ========================
// FILTER PEDALS
// ========================
function filterPedalsByStatus(filter) {
  const userRole = window.currentUser?.role || "guest";

  // Filtraggio lato server come la ricerca
  initCatalog(userRole, filter);
}

// ========================
// INIT CATALOG
// ========================
function initCatalog(userRole, filter = 'all') {
  const resultsDiv = document.getElementById("catalog");
  resultsDiv.innerHTML = `
      <div class="bx--loading-overlay">
        <div class="bx--loading" role="status">
          <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
            <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
            <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
          </svg>
        </div>     
      </div>`;

  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";
  const token = localStorage.getItem('authToken') || "";

  const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php");
  url.searchParams.set("role", roleParam);
  url.searchParams.set("username", usernameParam);
  if (filter && filter !== 'all') url.searchParams.set("filter", filter);

  fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
    .then(res => res.ok ? res.json() : Promise.reject("Network error"))
    .then(pedals => {
      resultsDiv.innerHTML = "";
      $("#pedalCount").text(`${pedals.length} gears`);

      pedals.sort((a,b) => a._id - b._id);
      pedals.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
        $(resultsDiv).append($pedalDiv);
      });

      updatePedalCounts(filter);
      if (userRole !== "guest") setupEditPedalHandler(pedals);
    })
    .catch(err => {
      console.error("Error fetching pedals:", err);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err}</p>`;
    });
}

// ========================
// CSS STYLING STATUS FILTERS
// ========================
// const style = document.createElement("style");
// style.textContent = `
//   .status-filter {
//     cursor: pointer;
//     text-decoration: underline;
//     color: #ddd;
//   }
//   .status-filter.active-filter {
//     font-weight: bold;
//     color: #fff;
//     text-decoration: none;
//     border-bottom: 2px solid #fff;
//   }
//   @media (max-width: 768px) {
//     #pedalCount span.status-filter:not([data-filter="all"]) {
//       display: none !important;
//     }
//   }
// `;
// document.head.appendChild(style);

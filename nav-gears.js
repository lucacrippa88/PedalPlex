// nav-catalog.js

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
    updatePedalCounts();
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

  // Pulizia ID dall'URL
  const cleanId = decodeURIComponent(pedalId.trim());

  // Fetch pedal singolo
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
        $("#catalog-global-loader").remove(); // assicuriamoci di rimuovere lo spinner
        Swal.fire({
          icon: 'error',
          title: 'Pedal not found',
          text: 'This gear does not exist.',
          confirmButtonText: 'Back to Catalog',
          customClass: {
            confirmButton: 'bx--btn bx--btn--primary' // Carbon Design
          }
        }).then(() => {
          window.location.href = 'gears'; // redirect alla lista pedali
        });
        return;
      }


      // pedals.forEach(pedal => {
      //   const $div = renderPedal(pedal, userRole);
      //   $div.attr("data-author", pedal.author || "");
      //   $div.attr("data-published", (pedal.published || "draft").toLowerCase());
      //   resultsDiv.append($div);
      // });
      // updatePedalCounts();

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
// function initNavCatalog(userRole) {
//   renderNavBar(userRole);
//   const pedalIdFromURL = getPedalIdFromURL();
//   if (pedalIdFromURL) {
//     initSinglePedalView(pedalIdFromURL, userRole);
//     return;
//   }
//   initCatalog(userRole);
// }

function initNavCatalog(userRole) {
  renderNavBar(userRole);

  const pedalIdFromURL = getPedalIdFromURL();
  const searchQuery = new URLSearchParams(window.location.search).get("search");

  if (pedalIdFromURL) {
    initSinglePedalView(pedalIdFromURL, userRole);
    return;
  }

  initCatalog(userRole);

  if (searchQuery) {
    const normalizedQuery = normalizeString(searchQuery);

    const applySearchFilter = () => {
      $(".pedal-catalog").each(function () {
        const pedalId = $(this).data("pedal-id") || "";
        const normalizedPedalId = normalizeString(pedalId);
        $(this).toggle(normalizedPedalId.includes(normalizedQuery));
      });
      updatePedalCounts();

      const visible = $(".pedal-catalog:visible");
      if (visible.length === 1) {
        const pedalId = visible.data("pedal-id");
        window.location.href = `/gears?id=${encodeURIComponent(pedalId)}`;
      }
    };

    const waitForCatalog = () => {
      if ($(".pedal-catalog").length === 0) {
        requestAnimationFrame(waitForCatalog);
      } else {
        applySearchFilter();
      }
    };
    waitForCatalog();
  }
}

/**
 * Normalizza stringhe per ricerca fuzzy leggera
 * - minuscolo
 * - rimuove spazi iniziali/finali
 * - rimuove simboli comuni (- _ . ,)
 * - riduce spazi multipli a singolo
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\-\_.,]/g, "")
    .replace(/\s+/g, " ");
}


// ========================== CATALOG ==========================
function initCatalog(userRole) {
  if (window.singlePedalMode || window.catalogInitialized) return;
  window.catalogInitialized = true;

  const resultsDiv = $("#catalog");
  resultsDiv.empty();

  const token = localStorage.getItem("authToken");
  const roleParam = userRole === "guest" ? "guest" : userRole;
  const usernameParam = window.currentUser?.username || "";

  // Spinner globale iniziale
  const globalSpinner = $(`
    <div id="catalog-global-loader" class="bx--loading-overlay"
         style="position: fixed; top:50%; left:50%; transform: translate(-50%, -50%);
                z-index:9999; width:120px; height:120px; display:flex; justify-content:center; align-items:center;">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"></circle>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"></circle>
        </svg>
      </div>
    </div>
  `);
  resultsDiv.append(globalSpinner);

  // --- FETCH METADATA ---
  fetch(`https://api.pedalplex.com/GET_CATALOG_METADATA.php?role=${roleParam}&username=${usernameParam}`, {
    headers: { Authorization: token ? "Bearer " + token : "" }
  })
    .then(r => r.json())
    .then(pedals => {
      if (window.singlePedalMode) return;

      // Rimuove lo spinner globale subito dopo metadata
      $("#catalog-global-loader").remove();

      pedals.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        $pedalDiv.attr("data-author", pedal.author || "");
        $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());

        // Loader inline per ogni pedal
        const $loaderInline = $(`
          <div class="loader-inline-container">
            <div class="loader-bar"></div>
          </div>
        `);
        $pedalDiv.append($loaderInline);
        resultsDiv.append($pedalDiv);
      });

      updatePedalCounts();

      if (userRole !== "guest") setupEditPedalHandler(pedals);
    })
    .catch(err => {
      console.error("Error metadata:", err);
      $("#catalog-global-loader").remove();
      resultsDiv.html(`<p style="color:red;">Error loading metadata: ${err.message}</p>`);
    });

  // --- FETCH CATALOGO COMPLETO (in parallelo) ---
  fetch(`https://api.pedalplex.com/GET_CATALOG.php?role=${roleParam}&username=${usernameParam}`, {
    headers: { Authorization: token ? "Bearer " + token : "" }
  })
    .then(r => r.json())
    .then(fullPedals => {
      if (window.singlePedalMode) return;

      // Sovrascrive loader inline con i dati completi
      $(".pedal-catalog").each(function () {
        const pedalId = $(this).data("pedal-id");
        const fullPedal = fullPedals.find(p => p._id === pedalId);
        if (fullPedal) {
          $(this).replaceWith(renderPedal(fullPedal, userRole)
            .attr("data-author", fullPedal.author || "")
            .attr("data-published", (fullPedal.published || "draft").toLowerCase())
          );
        }
      });

      updatePedalCounts();

      if (userRole !== "guest") setupEditPedalHandler(fullPedals);
    })
    .catch(err => console.error("Error full fetch:", err));
}



// ========================== UPDATE COUNTS ==========================
function updatePedalCounts(activeFilter = null) {
  const visiblePedals = $(".pedal-catalog:visible");
  const allPedals = $(".pedal-catalog");
  const totalVisible = visiblePedals.length;
  const totalAbsolute = allPedals.length;

  const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0, template: 0 };
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
    ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="background:#ff0000; color:white; border-radius:50%; padding:1px 5px; font-size:0.75rem; font-weight:bold; min-width:18px; text-align:center;">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  let countsHtml =
    `${totalVisible} gear${totalVisible === 1 ? "" : "s"} ` +
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>`;

  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Review: ${reviewingBadge}, 
     By me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>;
     Template: <span class="status-filter ${activeFilter === "template" ? "active-filter" : ""}" data-filter="template">${statusCounts.template}</span>`;

    if (window.currentUser?.role === "admin") {
      countsHtml += `, By Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
    }
  }

  countsHtml += `)`;
  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click", function() {
    const filter = $(this).data("filter");
    filterPedalsByStatus(filter);
  });
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

// ========================== CSS ==========================
const style = document.createElement("style");
style.textContent = `
  .status-filter {
    cursor: pointer;
    text-decoration: underline;
    color: #ddd;
  }
  .status-filter.active-filter {
    font-weight: bold;
    color: #fff;
    text-decoration: none;
    border-bottom: 2px solid #fff;
  }

  @media (max-width: 768px) {
    #pedalCount span.status-filter:not([data-filter="all"]) {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

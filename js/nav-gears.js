window.catalogInitialized = false;


function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const SVG_X_GEARS = `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16z"/></svg>`;

function renderNavBar(userRole) {
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Mobile search overlay -->
      <div id="gears-search-overlay" class="pp-search-overlay">
        <input type="text" id="pedalFilterInputMobile" placeholder="Filter gears..." aria-label="Filter gears"/>
        <button id="gearsSearchClose"
                class="bx--btn bx--btn--secondary bx--btn--icon-only"
                type="button" aria-label="Close search">
          ${SVG_X_GEARS}
        </button>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <span class="menu-morph" aria-hidden="true"><i class="menu-morph__ham"></i><i class="menu-morph__logo"></i></span>
        </button>
        <button id="toggleFilterBtnTablet" class="showTablet bx--btn bx--btn--secondary bx--btn--icon-only"
                type="button" aria-label="Toggle search">
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M29 27.586l-7.552-7.552a11.018 11.018 0 1 0-1.414 1.414L27.586 29zM4 13a9 9 0 1 1 9 9 9.01 9.01 0 0 1-9-9z"/>
          </svg>
        </button>
        <div class="title">PedalPlex</div>
        <a href="/gears" class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600; text-decoration:none">Gears</a>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>

        <input
          type="text"
          id="pedalFilterInput"
          placeholder="Filter gears..."
          style="font-size: 1rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;"
          aria-label="Filter pedals"/>

        <button id="toggleFilterBtn" class="showMobile bx--btn bx--btn--secondary bx--btn--icon-only"
                type="button" aria-label="Toggle search">
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M29 27.586l-7.552-7.552a11.018 11.018 0 1 0-1.414 1.414L27.586 29zM4 13a9 9 0 1 1 9 9 9.01 9.01 0 0 1-9-9z"/>
          </svg>
        </button>
        <button id="toggleFilterBtnDesktop" class="showDesktop bx--btn bx--btn--secondary bx--btn--sm"
                type="button" style="display:flex;align-items:center;gap:0.4rem;">
          <svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M29 27.586l-7.552-7.552a11.018 11.018 0 1 0-1.414 1.414L27.586 29zM4 13a9 9 0 1 1 9 9 9.01 9.01 0 0 1-9-9z"/>
          </svg>
          Search
        </button>

        <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <polygon points="31,24 27,24 27,20 25,20 25,24 21,24 21,26 25,26 25,30 27,30 27,26 31,26 31,24"/>
            <path d="M25.336 2.268H22.051L10.051 2.268H7.051A2.006 2.006 0 0 0 5.051 4.268L5 28a2.006 2.006 0 0 0 2 2H17V28H7L7.051 4.268h3l12 0h3l-.051 11.732h2L27.051 4.268A2.006 2.006 0 0 0 25.051 2.268z"/>
            <circle cx="11.843" cy="10.561" r="1.81" transform="translate(0.295 -2.599)"/>
            <circle cx="11.843" cy="10.561" r="1.81" transform="translate(8.469 -2.599)"/>
          </svg>
          Create New Gear
        </button>
      </div>
    </header>
  `;
  $("body").prepend(navHtml);

  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    const loginSvg = `<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/><path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/></svg>`;
    const loginBtnHtml = `
      <button id="loginBtn" class="showDesktop bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login" style="display: flex; align-items: center; gap: 0.5rem;">
        ${loginSvg}Login
      </button>
      <button id="loginBtnMobile" class="showMobile bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only" type="button" aria-label="Login" title="Login">
        ${loginSvg}
      </button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $(document).on("click", "#loginBtn, #loginBtnMobile", () => window.location.href = "login");
  } else {
    $(document).on('click', '#createPedalBtn', createNewPedal);
    $(document).on('click', '#createOwnPedalBtn', createNewPedal);
  }

  const isMobileGears = () => window.innerWidth <= 768;

  function closeGearsSearch() {
    const overlay  = document.getElementById('gears-search-overlay');
    const $inputM  = $('#pedalFilterInputMobile');
    const $inputD  = $('#pedalFilterInput');
    if (overlay) overlay.classList.remove('active');
    $inputM.val('');
    $inputD.hide().val('').css({ width: '120px' });
    if (typeof updateGearsCatalogHeader === 'function') updateGearsCatalogHeader();
  }

  $("#toggleFilterBtn").on("click", function () {
    // Mobile only — apre l'overlay
    const overlay = document.getElementById('gears-search-overlay');
    if (overlay) overlay.classList.add('active');
    const inputEl = document.getElementById('pedalFilterInputMobile');
    if (inputEl) {
      requestAnimationFrame(() => { setTimeout(() => { inputEl.focus(); }, 50); });
    }
  });

  // Tablet search button (left side) — same behaviour as desktop
  $("#toggleFilterBtnTablet, #toggleFilterBtnDesktop").on("click", function () {
    const $input = $("#pedalFilterInput");
    if ($input.is(":visible")) {
      closeGearsSearch();
    } else {
      $input.css("display", "flex").focus();
    }
  });

  $('#gearsSearchClose').on('click', function (e) {
    e.stopPropagation();
    closeGearsSearch();
  });

  // Search gear with server calls
  let searchTimeout = null;

  function triggerSearch(query) {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      resetCatalogState();
      currentSearchQuery = query === "" ? null : query;
      loadNextCatalogPage();
      if (typeof updateGearsCatalogHeader === 'function') updateGearsCatalogHeader();
    }, 500);
  }

  $("#pedalFilterInputMobile").on("input", function () {
    triggerSearch($(this).val().trim());
  });

  $("#pedalFilterInput").on("input", function () {
    triggerSearch($(this).val().trim());
  });

}

// Single gear view
function initSinglePedalView(pedalId, userRole) {
  window.singlePedalMode = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.empty();

  const globalSpinner = $('<div id="catalog-global-loader"></div>');
  resultsDiv.append(globalSpinner);

  const cleanId = decodeURIComponent(pedalId.trim());

  fetch("https://api.pedalplex.com/GET_GEARS_BY_IDS.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
      },
      body: JSON.stringify({
        ids: [cleanId]
      })
    })
    .then(r => r.json())
    .then(data => {
      $("#catalog-global-loader").remove();
      const pedals = data.docs || [];
      if (pedals.length === 0) {
        Swal.fire({
            icon: "error",
            title: "Pedal not found",
            confirmButtonText: "Back to Catalog"
          })
          .then(() => window.location.href = "gears");
        return;
      }
      renderCatalogIncremental(pedals, 'catalog', userRole, 50);
      if (userRole !== "guest") setupEditPedalHandler(pedals);
    });
}

// Init nav + catalog
function initNavCatalog(userRole) {
  renderNavBar(userRole);
  updatePedalCountsFromServer();
  const pedalIdFromURL = getPedalIdFromURL();
  if (pedalIdFromURL) initSinglePedalView(pedalIdFromURL, userRole);
  else {
    setupCatalogObserver();
    loadNextCatalogPage();
  }
}
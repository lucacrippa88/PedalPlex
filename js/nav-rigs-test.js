/**
 * nav-rigs-test.js — NAVBAR SEMPLIFICATA (prototipo)
 *
 * Navbar:  [☰] PedalPlex  Rigs  |  [+ Add Gear]  [Save Rig]  [Login?]
 * Barra:   [Rig ▾] [Edit ✏]  [Save Plexes →]  [⋯ Actions ▾]
 *
 * Il dropdown "Actions" raggruppa:
 *   • Build Rig (nuovo)
 *   • ── separator ──
 *   • Guided Tour
 */
function initNavPedalboard(userRole) {
  const isGuest = (userRole === "guest");

  // ── SVG helpers ───────────────────────────────────────────────────────────
  const SVG = {
    addGear:  `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M17 15V8h-2v7H8v2h7v7h2v-7h7v-2z"/></svg>`,
    save:     `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M27 4H8L4 8v20a2 2 0 002 2h22a2 2 0 002-2V6a2 2 0 00-2-2zm0 24H6V8.8L8.8 6H10v8h14V6h2zm-6-18h2v6h-2z"/></svg>`,
    check:    `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/></svg>`,
    dots:     `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/><circle cx="24" cy="16" r="2"/></svg>`,
    buildRig: `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><g transform="rotate(90 16 16)"><path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"/><path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"/></g></svg>`,
    explore:  `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28ZM22.31,10.35,13.72,14.09l-4.07,8.57,8.6-3.74ZM16,17a1,1,0,1,1,1-1A1,1,0,0,1,16,17Z"/></svg>`,
    plexes:   `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M18 6L16.57 7.393 24.15 15 4 15 4 17 24.15 17 16.57 24.573 18 26 28 16 18 6z"/></svg>`,
    tour:     `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"/><path d="M16 11a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11zM15 17h2v8h-2z"/></svg>`,
    login:    `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/><path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/></svg>`,
  };

  const saveLabelDesktop = isGuest ? `${SVG.check} Save Rig Offline` : `${SVG.save} Save Rig`;
  const loginBtnDesktop  = isGuest ? `
    <button id="loginBtn" class="showDesktop bx--btn bx--btn--primary bx--btn--sm"
        type="button" aria-label="Login" style="display:flex;align-items:center;gap:0.5rem;">
      ${SVG.login} Login
    </button>` : '';
  const loginBtnMobile = isGuest ? `
    <button id="loginBtnMobile" class="showMobile bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only"
        type="button" aria-label="Login">${SVG.login}
    </button>` : '';

  // ── Navbar HTML ───────────────────────────────────────────────────────────
  const navHtml = `
    <header style="display:flex;align-items:center;justify-content:space-between;">

      <!-- Left -->
      <div style="display:flex;align-items:center;gap:1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <span class="menu-morph" aria-hidden="true"><i class="menu-morph__ham"></i><i class="menu-morph__logo"></i></span>
        </button>
        <a href="" style="text-decoration:none;" class="title">PedalPlex</a>
        <a href="rigs" class="subtitle" style="font-size:1.25rem;color:#aaa;font-weight:600;text-decoration:none">Rigs</a>
      </div>

      <!-- Right desktop -->
      <div class="rightButtons showDesktop" style="display:flex;align-items:center;gap:0.75rem;">
        <input type="text" id="pedalFilterInput" placeholder="Search pedals…"
               style="font-size:0.875rem;padding:6px 12px;border:1px solid #8c8c8c;border-radius:4px;outline-offset:2px;width:280px;display:none;"
               aria-label="Filter pedals"/>
        ${loginBtnDesktop}
        <button id="addGearsTrigger" class="bx--btn bx--btn--primary bx--btn--sm"
                type="button" style="display:flex;align-items:center;gap:0.4rem;">
          ${SVG.addGear} Add Gear
        </button>
        <button id="saveBtn" class="bx--btn bx--btn--primary bx--btn--sm"
                type="button" style="display:flex;align-items:center;gap:0.5rem;">
          ${saveLabelDesktop}
        </button>
      </div>

      <!-- Right mobile -->
      <div class="rightButtons showMobile" style="display:flex;align-items:center;gap:0.5rem;">
        ${loginBtnMobile}
        <button id="addGearsTriggerMobile" class="bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only"
                type="button" aria-label="Add Gear">
          ${SVG.addGear}
        </button>
        <button id="saveBtnMobile" class="bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only"
                type="button" aria-label="${isGuest ? 'Save Rig Offline' : 'Save Rig'}">
          ${isGuest ? SVG.check : SVG.save}
        </button>
      </div>

    </header>`;

  $("body").prepend(navHtml);

  // ── Actions dropdown (injected into #pedalboard-controls) ─────────────────
  function injectActionsDropdown() {
    if (document.getElementById('pp-actions-btn')) return;

    const buildRigItem = !isGuest
      ? `<button class="pp-action-item" data-action="buildRig">${SVG.buildRig} <span>Build Rig</span></button>`
      : '';

    const actionsHtml = `
      <div id="pp-actions-wrapper" style="position:relative;margin-left:auto;">

        <button id="pp-actions-btn"
            class="bx--btn bx--btn--tertiary bx--btn--sm showDesktop"
            type="button"
            style="display:flex;align-items:center;gap:0.5rem;max-width:none!important;">
          ${SVG.dots} Actions
        </button>

        <button id="pp-actions-btn-mobile"
            class="bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only showMobile"
            type="button" aria-label="Actions">
          ${SVG.dots}
        </button>

        <div id="pp-actions-menu" style="
            display:none;
            position:absolute;
            top:calc(100% + 6px);
            right:0;
            min-width:200px;
            width:200px;
            overflow:hidden;
            background:rgb(30,30,30);
            border:1px solid #9C54D5;
            border-radius:8px;
            box-shadow:0 8px 24px rgba(0,0,0,0.5);
            z-index:4000;
            padding:4px 0;
            ">
          ${buildRigItem}
          <a class="pp-action-item" href="plexes">${SVG.plexes} <span>Save your Plexes</span></a>
          <div class="pp-action-separator"></div>
          <button class="pp-action-item" data-action="tour">${SVG.tour} <span>Guided Tour</span></button>
        </div>

      </div>`;

    const controls = document.getElementById('pedalboard-controls');
    if (controls) controls.insertAdjacentHTML('beforeend', actionsHtml);
  }

  // Inject actions dropdown styles once
  if (!document.getElementById('pp-actions-style')) {
    const style = document.createElement('style');
    style.id = 'pp-actions-style';
    style.textContent = `
      .pp-action-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 9px 16px;
        background: none;
        border: none;
        color: #fff;
        font-size: 0.875rem;
        cursor: pointer;
        text-decoration: none;
        box-sizing: border-box;
        margin-left: 0 !important;
        border-radius: 0;
        box-shadow: none;
        max-width: none !important;
        min-height: 0;
      }
      .pp-action-item:hover {
        background: rgba(156, 84, 213, 0.18);
        color: #9C54D5;
      }
      .pp-action-item svg { flex-shrink: 0; }
      .pp-action-separator {
        height: 1px;
        background: rgba(255,255,255,0.1);
        margin: 4px 0;
      }
      #pp-actions-menu { animation: ppFadeIn 0.1s ease; }
      @keyframes ppFadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
    `;
    document.head.appendChild(style);
  }

  $(document).ready(() => {
    const controls = document.getElementById('pedalboard-controls');
    if (!controls) return;
    const observer = new MutationObserver(() => {
      if (controls.style.display !== 'none') {
        injectActionsDropdown();
        observer.disconnect();
      }
    });
    observer.observe(controls, { attributes: true, attributeFilter: ['style'] });
    if (controls.style.display !== 'none') injectActionsDropdown();
  });

  // ── Toggle dropdown ────────────────────────────────────────────────────────
  $(document).on('click', '#pp-actions-btn, #pp-actions-btn-mobile', function (e) {
    e.stopPropagation();
    const menu = document.getElementById('pp-actions-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#pp-actions-wrapper').length) {
      const menu = document.getElementById('pp-actions-menu');
      if (menu) menu.style.display = 'none';
    }
  });

  // ── Actions dispatch ───────────────────────────────────────────────────────
  $(document).on('click', '.pp-action-item[data-action]', function () {
    const action = $(this).data('action');
    const menu = document.getElementById('pp-actions-menu');
    if (menu) menu.style.display = 'none';
    switch (action) {
      case 'buildRig':
        if (typeof createNewPedalboard === 'function') createNewPedalboard();
        break;
      case 'tour':
        if (typeof window.startTour === 'function') window.startTour(0);
        break;
    }
  });

  // ── Menu + filter wiring (unchanged) ──────────────────────────────────────
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", function () { $("#fullscreenMenu").removeClass("active"); });

  $("#addGearsTrigger, #addGearsTriggerMobile").on("click", function (e) {
    e.stopPropagation();
    window.openPedalSearch();
  });

  $("#tourTriggerBtn").on("click", function () {
    if (typeof window.startTour === 'function') window.startTour(0);
  });

  $("#pedalFilterInput").on("click", function (e) { e.stopPropagation(); });

  window.catalog = window.catalog || [];

  // ── updateRigsCTAState (unchanged logic) ─────────────────────────────────
  window.updateRigsCTAState = function (pedalCount) {
    const isRigEmpty = (!pedalCount || pedalCount === 0);
    const $addGears = $("#addGearsTrigger, #addGearsTriggerMobile");
    const $saveBtn  = $("#saveBtn, #saveBtnMobile");
    const $viewPreset = $("#viewPreset");

    if (isRigEmpty) {
      $addGears.removeClass('bx--btn--tertiary').addClass('bx--btn--primary');
      $saveBtn.addClass('rig-cta-subtle');
      $viewPreset.addClass('rig-cta-subtle');
    } else {
      $addGears.removeClass('bx--btn--primary').addClass('bx--btn--tertiary');
      $saveBtn.removeClass('rig-cta-subtle');
      $viewPreset.removeClass('rig-cta-subtle');
    }
  };

  // ── Filter visibility (preservato da nav-rigs.js originale) ───────────────
  function updateFilterVisibility() {
    const hasPedalboards = window.allPedalboards && window.allPedalboards.length > 0;
    $("#pedalFilterInput").toggle(hasPedalboards);
  }
  updateFilterVisibility();
  window.updateNavFilterVisibility = updateFilterVisibility;

  // ── Guest / logged-in wiring ───────────────────────────────────────────────
  if (isGuest) {
    $("#saveBtn, #saveBtnMobile").on("click", function () {
      if (typeof saveGuestPedalboard === "function") saveGuestPedalboard();
      if (window.allPedalboards.length === 1) setupPedalboardDropdownAndRender();
      updateFilterVisibility();
    });
    $("#loginBtn, #loginBtnMobile").on("click", () => { window.location.href = "login"; });
  } else {
    $("#saveBtn").on("click", function () {
      if (typeof savePedalboard === "function") savePedalboard();
    });
    $("#saveBtnMobile").on("click", function () {
      if (typeof savePedalboard === "function") savePedalboard();
    });
  }
}

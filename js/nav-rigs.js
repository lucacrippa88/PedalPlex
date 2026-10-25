/**
 * nav-rigs.js — NAVBAR SEMPLIFICATA
 *
 * Navbar:  [☰] PedalPlex  Rigs  |  [+ Add Gear]  [Save Rig]  [Login?]
 * Barra:   [Rig ▾] [Edit]  [⋯ Actions ▾]
 *
 * Actions dropdown:
 *   • Build Rig (solo logged-in)
 *   • Save your Presets
 *   • ── separator ──
 *   • Guided Tour
 *
 * Tutta la logica openPedalSearch / lazy-load è copiata da nav-rigs.js
 * per evitare il doppio caricamento del file originale.
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
    plexes:   `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M18 6L16.57 7.393 24.15 15 4 15 4 17 24.15 17 16.57 24.573 18 26 28 16 18 6z"/></svg>`,
    tour:     `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"/><path d="M16 11a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11zM15 17h2v8h-2z"/></svg>`,
    login:    `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/><path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/></svg>`,
  };

  const saveLabelDesktop = isGuest ? `${SVG.check} Save Rig Offline` : `${SVG.save} Save Rig`;

  // ── Navbar HTML (Actions sempre nell'header) ──────────────────────────────
  const buildRigItem = !isGuest
    ? `<button class="pp-action-item" data-action="buildRig">${SVG.buildRig} <span>Build new Rig</span></button>`
    : '';
  const editRigItem = `<button class="pp-action-item" data-action="editRig">${SVG.buildRig} <span>Edit Rig</span></button>`;

  const navHtml = `
    <header style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <span class="menu-morph" aria-hidden="true"><i class="menu-morph__ham"></i><i class="menu-morph__logo"></i></span>
        </button>
        <a href="" style="text-decoration:none;" class="title">PedalPlex</a>
        <a href="rigs" class="subtitle" style="font-size:1.25rem;color:#aaa;font-weight:600;text-decoration:none">Rigs</a>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <input type="text" id="pedalFilterInput" placeholder="Search pedals…"
               style="font-size:0.875rem;padding:6px 12px;border:1px solid #8c8c8c;border-radius:4px;outline-offset:2px;width:280px;display:none;"
               aria-label="Filter pedals"/>
        <button id="addGearsTrigger" class="showDesktop bx--btn bx--btn--secondary bx--btn--sm"
                type="button" style="display:flex;align-items:center;gap:0.4rem;">
          ${SVG.addGear} Add Gear
        </button>
        <button id="saveBtn" class="showDesktop bx--btn bx--btn--primary bx--btn--sm"
                type="button" style="display:flex;align-items:center;gap:0.5rem;white-space:nowrap;max-width:none!important;">
          ${saveLabelDesktop}
        </button>
        <button id="addGearsTriggerMobile" class="showMobile bx--btn bx--btn--secondary bx--btn--sm bx--btn--icon-only"
                type="button" aria-label="Add Gear">
          ${SVG.addGear}
        </button>
        <button id="saveBtnMobile" class="showMobile bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only"
                type="button" aria-label="${isGuest ? 'Save Rig Offline' : 'Save Rig'}">
          ${isGuest ? SVG.check : SVG.save}
        </button>
        <div id="pp-actions-wrapper" style="position:relative;">
          <button id="pp-actions-btn"
              class="showDesktop bx--btn bx--btn--tertiary bx--btn--sm"
              type="button"
              style="display:flex;align-items:center;gap:0.5rem;max-width:none!important;">
            ${SVG.dots} Actions
          </button>
          <button id="pp-actions-btn-mobile"
              class="showMobile bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only"
              type="button" aria-label="Actions">
            ${SVG.dots}
          </button>
          <div id="pp-actions-menu" style="
              display:none;
              position:absolute;
              top:calc(100% + 6px);
              right:0;
              width:200px;
              overflow:hidden;
              background:rgb(30,30,30);
              border:1px solid #9C54D5;
              border-radius:8px;
              box-shadow:0 8px 24px rgba(0,0,0,0.5);
              z-index:4000;
              padding:4px 0;">
            ${isGuest ? `<a class="pp-action-item pp-action-login" href="login">${SVG.login} <span>Login to sync your Rigs</span></a><div class="pp-action-separator"></div>` : ''}
            ${buildRigItem}
            ${editRigItem}
            <div class="pp-action-separator"></div>
            <button class="pp-action-item" data-action="tour">${SVG.tour} <span>Guided Tour</span></button>
          </div>
        </div>
      </div>
    </header>`;

  $("body").prepend(navHtml);

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
      .pp-action-login {
        color: #a78bfa !important;
        font-weight: 600;
      }
      .pp-action-login:hover {
        background: rgba(139, 92, 246, 0.22) !important;
        color: #c4b5fd !important;
      }
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
  $(document).on('click', '.pp-action-item[data-action]', function () {
    const action = $(this).data('action');
    document.getElementById('pp-actions-menu').style.display = 'none';
    switch (action) {
      case 'buildRig':
        if (typeof createNewPedalboard === 'function') createNewPedalboard();
        break;
      case 'editRig':
        document.getElementById('renameBoardBtn')?.click();
        break;
      case 'tour':
        if (typeof window.startTour === 'function') window.startTour(0);
        break;
    }
  });

  // ── Menu toggle ────────────────────────────────────────────────────────────
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", function () { $("#fullscreenMenu").removeClass("active"); });

  // ── Add Gear wiring ────────────────────────────────────────────────────────
  $("#addGearsTrigger, #addGearsTriggerMobile").on("click", function (e) {
    e.stopPropagation();
    window.openPedalSearch();
  });

  $("#pedalFilterInput").on("click", function (e) { e.stopPropagation(); });

  window.catalog = window.catalog || [];

  // ── openPedalSearch + lazy-load (da nav-rigs.js) ──────────────────────────
  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function positionDropdown() {
    const input = document.getElementById('pedalFilterInput');
    const dropdown = document.getElementById('pedalAddDropdownContainer');
    if (!dropdown || !input) return;
    const rect = input.getBoundingClientRect();
    dropdown.style.top  = (window.scrollY + rect.bottom + 4) + 'px';
    dropdown.style.left = (window.scrollX + rect.left) + 'px';
    dropdown.style.width = Math.max(rect.width, 320) + 'px';
  }

  function getOrCreateDropdown() {
    let dropdown = document.getElementById('pedalAddDropdownContainer');
    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'pedalAddDropdownContainer';
      document.body.appendChild(dropdown);
    }
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex   = '3000';
    return dropdown;
  }

  let lazyPage = 1, lazyQuery = '', lazyLoading = false, lazyHasMore = true, lazySentinelObserver = null;
  const LAZY_LIMIT = 30, LAZY_SPINNER_ID = 'pedalDropdownLazySpinner';

  function appendPedalItems(pedalsList, dropdown) {
    const authToken = localStorage.getItem('authToken');
    pedalsList.forEach(pedal => {
      const item = document.createElement('div');
      item.classList.add('pedal-dropdown-item');
      const label = document.createElement('span');
      label.className = 'pedal-dropdown-label';
      label.textContent = pedal._id;
      item.appendChild(label);
      const btn = document.createElement('button');
      btn.classList.add('bx--btn', 'bx--btn--primary', 'bx--btn--sm', 'pedal-dropdown-btn');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-label', `Add ${pedal._id}`);
      btn.innerHTML = `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M17 15V8h-2v7H8v2h7v7h2v-7h7v-2z"/></svg>`;

      const handleAddPedal = async (e) => {
        e.stopPropagation();
        if (!window.pedalboard) return;
        if (!Array.isArray(window.pedalboard.pedals)) window.pedalboard.pedals = [];

        let pedalData = window.catalog.find(p => p._id === pedal._id);
        if (!pedalData) {
          try {
            const res = await fetch("https://api.pedalplex.com/GET_GEARS_BY_IDS.php", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(authToken ? { "Authorization": "Bearer " + authToken } : {}) },
              body: JSON.stringify({ ids: [pedal._id] })
            });
            const result = await res.json();
            if (result?.docs?.length > 0) { pedalData = result.docs[0]; window.catalog.push(pedalData); }
            else return;
          } catch (err) { console.error("Fetch error:", err); return; }
        }

        const targetRow = window._emptySlotRow || 1;
        const insertAt  = window._emptySlotInsertAt;
        const row1Count = window.pedalboard.pedals.filter(p => (p.row||1) === 1).length;
        const rowStart  = (targetRow === 2) ? row1Count : 0;
        const slotPos   = (insertAt !== null && insertAt !== undefined) ? (insertAt - rowStart) : null;
        window.pedalboard.pedals.push({ pedal_id: pedal._id, rotation: 0, row: targetRow, slot_pos: slotPos });
        window._emptySlotRow = null;
        window._emptySlotInsertAt = null;
        if (typeof window.deactivateSlot === 'function') window.deactivateSlot();
        if (typeof renderPedalboard === 'function') renderPedalboard();
      };

      item.addEventListener('click', handleAddPedal);
      btn.addEventListener('click', handleAddPedal);
      item.appendChild(btn);
      dropdown.appendChild(item);
    });
  }

  function getOrCreateLazySentinel(dropdown) {
    let s = dropdown.querySelector('#pedalDropdownSentinel');
    if (!s) { s = document.createElement('div'); s.id = 'pedalDropdownSentinel'; s.style.height = '1px'; dropdown.appendChild(s); }
    return s;
  }

  function attachLazyObserver(dropdown) {
    if (lazySentinelObserver) { lazySentinelObserver.disconnect(); lazySentinelObserver = null; }
    const sentinel = getOrCreateLazySentinel(dropdown);
    lazySentinelObserver = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !lazyLoading && lazyHasMore) await loadNextPage(dropdown);
    }, { root: dropdown, threshold: 0 });
    lazySentinelObserver.observe(sentinel);
  }

  async function loadNextPage(dropdown) {
    if (lazyLoading || !lazyHasMore || lazyQuery) return;
    lazyLoading = true;
    const authToken = localStorage.getItem('authToken');
    let spinner = document.getElementById(LAZY_SPINNER_ID);
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = LAZY_SPINNER_ID;
      spinner.style.cssText = 'padding:10px;display:flex;justify-content:center;';
      spinner.innerHTML = `<div class="bx--loading bx--loading--small bx--loading--active" role="alert"><svg class="bx--loading__svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke-width="8"/></svg></div>`;
    }
    const sentinel = getOrCreateLazySentinel(dropdown);
    dropdown.insertBefore(spinner, sentinel);
    try {
      lazyPage++;
      const res = await fetch(`https://api.pedalplex.com/GET_CATALOG_LAZY.PHP?page=${lazyPage}&limit=${LAZY_LIMIT}`, {
        headers: { ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {}) }
      });
      const data = await res.json();
      spinner.remove();
      if (!Array.isArray(data) || data.length === 0) {
        lazyHasMore = false;
        if (lazySentinelObserver) { lazySentinelObserver.disconnect(); lazySentinelObserver = null; }
        sentinel.remove();
      } else {
        data.forEach(item => { if (item?._id && !window.catalog.some(p => p._id === item._id)) window.catalog.push(item); });
        if (data.length < LAZY_LIMIT) { lazyHasMore = false; if (lazySentinelObserver) { lazySentinelObserver.disconnect(); lazySentinelObserver = null; } sentinel.remove(); }
        appendPedalItems(data.map(i => ({ _id: i._id })), dropdown);
        if (lazyHasMore) getOrCreateLazySentinel(dropdown);
      }
    } catch (err) { console.error("Lazy load error:", err); spinner.remove(); }
    lazyLoading = false;
  }

  async function fetchAndRenderPedals(rawQuery = '') {
    const query = (rawQuery || '').trim().toLowerCase();
    const dropdown = getOrCreateDropdown();
    const categoryFilter = window._emptySlotCategory || null;
    window._emptySlotCategory = null;
    lazyPage = 1; lazyQuery = query; lazyHasMore = !query && !categoryFilter; lazyLoading = false;
    if (lazySentinelObserver) { lazySentinelObserver.disconnect(); lazySentinelObserver = null; }

    dropdown.innerHTML = `<div style="padding:10px;display:flex;justify-content:center;"><div class="bx--loading bx--loading--small bx--loading--active" role="alert"><svg class="bx--loading__svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke-width="8"/></svg></div></div>`;
    dropdown.style.display = 'block';
    positionDropdown();

    try {
      const authToken = localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json', ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {}) };
      let pedalsList = [];

      if (categoryFilter) {
        const results = await Promise.all(categoryFilter.map(cat => {
          const url = query
            ? `https://api.pedalplex.com/GET_CATALOG_IDS.php?search=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`
            : `https://api.pedalplex.com/GET_CATALOG_LAZY.php?page=1&limit=${LAZY_LIMIT}&category=${encodeURIComponent(cat)}`;
          return fetch(url, { headers }).then(r => r.json()).catch(() => []);
        }));
        const seen = new Set();
        results.forEach(data => {
          if (!Array.isArray(data)) return;
          data.forEach(item => { if (item?._id && !seen.has(item._id)) { seen.add(item._id); pedalsList.push(item); if (!window.catalog.some(p => p._id === item._id)) window.catalog.push(item); } });
        });
        pedalsList.sort((a, b) => a._id.localeCompare(b._id));
      } else if (query) {
        const res = await fetch(`https://api.pedalplex.com/GET_CATALOG_IDS.php?search=${encodeURIComponent(query)}`, { headers });
        const data = await res.json();
        if (Array.isArray(data)) pedalsList = data;
      } else {
        const res = await fetch(`https://api.pedalplex.com/GET_CATALOG_LAZY.php?page=1&limit=${LAZY_LIMIT}`, { headers: { ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {}) } });
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach(item => { if (item?._id && !window.catalog.some(p => p._id === item._id)) window.catalog.push(item); });
          if (data.length < LAZY_LIMIT) lazyHasMore = false;
          pedalsList = data.map(item => ({ _id: item._id }));
        }
      }

      dropdown.innerHTML = '';
      if (!pedalsList?.length) {
        const noResult = document.createElement('div');
        noResult.textContent = 'No pedals found';
        noResult.style.cssText = 'padding:12px;color:#525252;font-size:0.875rem;';
        dropdown.appendChild(noResult);
        positionDropdown();
        return;
      }
      appendPedalItems(pedalsList, dropdown);
      if (lazyHasMore) attachLazyObserver(dropdown);
      dropdown.style.display = 'block';
      positionDropdown();
    } catch (err) { console.error("Search error:", err); dropdown.style.display = 'none'; }
  }

  window.openPedalSearch = function () {
    const $input = $('#pedalFilterInput');
    $input.show().focus();
    const dropdown = getOrCreateDropdown();
    if (dropdown.children.length > 0) { dropdown.style.display = 'block'; positionDropdown(); }
    else { fetchAndRenderPedals($input.val().trim()); }
  };

  $("#pedalFilterInput").on("input", debounce(function () { fetchAndRenderPedals($(this).val()); }, 300));

  document.addEventListener("click", function (event) {
    const input    = document.getElementById("pedalFilterInput");
    const dropdown = document.getElementById("pedalAddDropdownContainer");
    const trigger  = document.getElementById("addGearsTrigger");
    if ((input && input.contains(event.target)) || (dropdown && dropdown.contains(event.target)) || (trigger && trigger.contains(event.target))) return;
    if (input && $(input).is(":visible")) $(input).hide();
    if (dropdown) dropdown.style.display = "none";
  });

  window.addEventListener('scroll', positionDropdown);
  window.addEventListener('resize', positionDropdown);

  // ── updateRigsCTAState ────────────────────────────────────────────────────
  window.updateRigsCTAState = function (pedalCount) {
    const isEmpty = (!pedalCount || pedalCount === 0);
    const $add  = $("#addGearsTrigger, #addGearsTriggerMobile");
    const $save = $("#saveBtn, #saveBtnMobile");
    const $view = $("#viewPreset");
    if (isEmpty) { $add.removeClass('bx--btn--tertiary').addClass('bx--btn--primary'); $save.addClass('rig-cta-subtle'); $view.addClass('rig-cta-subtle'); }
    else         { $add.removeClass('bx--btn--primary').addClass('bx--btn--tertiary'); $save.removeClass('rig-cta-subtle'); $view.removeClass('rig-cta-subtle'); }
  };

  window.updateNavFilterVisibility = function () {};

  // ── Guest / logged-in wiring ───────────────────────────────────────────────
  if (isGuest) {
    $("#saveBtn, #saveBtnMobile").on("click", function () {
      if (typeof saveGuestPedalboard === "function") saveGuestPedalboard();
      if (window.allPedalboards?.length === 1) setupPedalboardDropdownAndRender();
    });
  } else {
    $("#saveBtn").on("click",       function () { if (typeof savePedalboard === "function") savePedalboard(); });
    $("#saveBtnMobile").on("click", function () { if (typeof savePedalboard === "function") savePedalboard(); });
  }
}

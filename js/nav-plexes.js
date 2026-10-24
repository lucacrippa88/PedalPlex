/**
 * nav-plexes.js — NAVBAR SEMPLIFICATA
 *
 * Navbar:  [☰] PedalPlex  Plexes  |  [Explore]  [Lock Tone]  [Login?]
 * Barra:   [Rig ▾] [Folder ▾] [Plex ▾]  [⋯ Actions ▾]
 *
 * Il dropdown "Actions" raggruppa:
 *   • Edit Folder
 *   • Edit Plex / New Tone
 *   • Add Folder
 *   • Share
 *   • Lock 🔒
 *   • Download
 *   • Manage Rigs
 *   • ── separator ──
 *   • Guided Tour
 */
function initNavPreset() {

  const isGuest = !window.currentUser;

  // ── Save original controls for SubPlex preservation ──────────────────────
  window.originalPedalControls = {};
  const currentPreset = window.presetMap?.[currentPresetId];
  if (currentPreset?.pedals) {
    for (const pedalId of Object.keys(currentPreset.pedals)) {
      window.originalPedalControls[pedalId] = JSON.parse(JSON.stringify(currentPreset.pedals[pedalId].controls));
    }
  }

  // ── SVG helpers ───────────────────────────────────────────────────────────
  const SVG = {
    explore:    `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28ZM22.31,10.35,13.72,14.09l-4.07,8.57,8.6-3.74ZM16,17a1,1,0,1,1,1-1A1,1,0,0,1,16,17Z"/></svg>`,
    check:      `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/></svg>`,
    dots:       `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/><circle cx="24" cy="16" r="2"/></svg>`,
    editFolder: `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="m31.707,19.2929l-3-3c-.3906-.3906-1.0234-.3906-1.4141,0l-9.293,9.293v4.4141h4.4141l9.293-9.293c.3906-.3906.3906-1.0234,0-1.4141Zm-10.1211,8.707h-1.5859v-1.5859l5-5,1.5859,1.5859-5,5Zm6.4141-6.4141l-1.5859-1.5859,1.5859-1.5859,1.5859,1.5859-1.5859,1.5859Z" stroke="currentColor"></path><path d="M28,8H16l-3.4-3.4C12.2,4.2,11.7,4,11.2,4H4C2.9,4,2,4.9,2,6v20c0,1.1,0.9,2,2,2h14v-2H4V6h7.2l3.4,3.4l0.6,0.6H28v8h2v-8 C30,8.9,29.1,8,28,8z" stroke="currentColor"></path></svg>`,
    editPreset: `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M29.707,7.293l-3-3a.9994.9994,0,0,0-1.414,0L16,13.5859V18h4.4141L29.707,8.707A.9994.9994,0,0,0,29.707,7.293ZM19.5859,16H18V14.4141l5-5L24.5859,11ZM26,9.5859,24.4141,8,26,6.4141,27.5859,8Z"></path><path d="M24,15v7.5562A3.9552,3.9552,0,0,0,22,22a4,4,0,1,0,4,4V15ZM22,28a2,2,0,1,1,2-2A2.0027,2.0027,0,0,1,22,28Z"></path><path d="M17,6H10A2.002,2.002,0,0,0,8,8V22.5562A3.9557,3.9557,0,0,0,6,22a4,4,0,1,0,4,4V8h7ZM6,28a2,2,0,1,1,2-2A2.0023,2.0023,0,0,1,6,28Z"></path></svg>`,
    addFolder:  `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M26 20L24 20 24 24 20 24 20 26 24 26 24 30 26 30 26 26 30 26 30 24 26 24z" stroke="currentColor"/><path d="M28,8H16l-3.4-3.4C12.2,4.2,11.7,4,11.2,4H4C2.9,4,2,4.9,2,6v20c0,1.1,0.9,2,2,2h14v-2H4V6h7.2l3.4,3.4l0.6,0.6H28v8h2v-8 C30,8.9,29.1,8,28,8z" stroke="currentColor"/></svg>`,
    newTone:    `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M30 6L26 6 26 2 24 2 24 6 20 6 20 8 24 8 24 12 26 12 26 8 30 8 30 6zM24 15v7.5562A3.9552 3.9552 0 0022 22a4 4 0 104 4V15zM22 28a2 2 0 112-2A2.0027 2.0027 0 0122 28zM17 6H10A2.002 2.002 0 008 8V22.5562A3.9557 3.9557 0 006 22a4 4 0 104 4V8h7zM6 28a2 2 0 112-2A2.0023 2.0023 0 016 28z" stroke="currentColor"/></svg>`,
    share:      `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M23,20a5,5,0,0,0-3.89,1.89L11.8,17.32a4.46,4.46,0,0,0,0-2.64l7.31-4.57A5,5,0,1,0,18,7a4.79,4.79,0,0,0,.2,1.32l-7.31,4.57a5,5,0,1,0,0,6.22l7.31,4.57A4.79,4.79,0,0,0,18,25a5,5,0,1,0,5-5Z"/></svg>`,
    lock:       `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M24,14H22V10a6,6,0,0,0-12,0v4H8a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V16A2,2,0,0,0,24,14ZM12,10a4,4,0,0,1,8,0v4H12ZM24,28H8V16H24Z"></path><circle cx="16" cy="22" r="2"></circle></svg>`,
    download:   `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M26,24v4H6V24H4v4H4a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2h0V24Z"/><polygon points="26 14 24.59 12.59 17 20.17 17 2 15 2 15 20.17 7.41 12.59 6 14 16 24 26 14"/></svg>`,
    manageRigs: `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M14 26L15.41 24.59 7.83 17 28 17 28 15 7.83 15 15.41 7.41 14 6 4 16 14 26z"/></svg>`,
    tour:       `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"/><path d="M16 11a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11zM15 17h2v8h-2z"/></svg>`,
    login:      `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/><path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/></svg>`,
  };

  // ── Build navbar HTML ─────────────────────────────────────────────────────
  const lockLabel      = isGuest ? 'Save Preset Offline' : 'Save Preset';
  const loginBtnDesktop = isGuest ? `
    <button id="loginBtn" class="showDesktop bx--btn bx--btn--primary bx--btn--sm" type="button"
        style="display:flex;align-items:center;gap:0.5rem;">
      ${SVG.login} Login
    </button>` : '';
  const loginBtnMobile = isGuest ? `
    <button id="loginBtnMobile" class="showMobile bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only" type="button" aria-label="Login">
      ${SVG.login}
    </button>` : '';

  const navHtml = `
    <header style="display:flex;align-items:center;justify-content:space-between;">

      <!-- Left -->
      <div style="display:flex;align-items:center;gap:1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <span class="menu-morph" aria-hidden="true"><i class="menu-morph__ham"></i><i class="menu-morph__logo"></i></span>
        </button>
        <a href="" style="text-decoration:none;" class="title">PedalPlex</a>
        <a href="plexes" class="subtitle" style="font-size:1.25rem;color:#aaa;font-weight:600;text-decoration:none">${L.Plexes}</a>
      </div>

      <!-- Right desktop -->
      <div class="rightButtons showDesktop" style="display:flex;align-items:center;gap:1rem;">
        ${loginBtnDesktop}
        <button id="exploreBtn" class="bx--btn bx--btn--danger bx--btn--sm" type="button"
            style="display:flex;align-items:center;gap:0.5rem;">
          ${SVG.explore} Explore
        </button>
        <button id="savePstBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" disabled
            style="display:flex;align-items:center;gap:0.5rem;white-space:nowrap;max-width:none!important;">
          ${SVG.check} ${lockLabel}
        </button>
      </div>

      <!-- Right mobile -->
      <div class="rightButtons showMobile" style="display:flex;align-items:center;gap:0.5rem;">
        ${loginBtnMobile}
        <button id="exploreBtnMobile" class="bx--btn bx--btn--danger bx--btn--sm bx--btn--icon-only" type="button" aria-label="Explore">
          ${SVG.explore}
        </button>
        <button id="savePstBtnMobile" class="bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only" type="button" disabled aria-label="${lockLabel}">
          ${SVG.check}
        </button>
      </div>

    </header>`;

  $("body").prepend(navHtml);

  // ── Actions dropdown (injected into #preset-controls) ────────────────────
  // We wait for the controls bar to be visible before injecting
  function injectActionsDropdown() {
    if (document.getElementById('pp-actions-btn')) return; // already done

    const actionsHtml = `
      <div id="pp-actions-wrapper" style="position:relative;margin-left:auto;">

        <!-- Desktop: "Actions" label -->
        <button id="pp-actions-btn"
            class="bx--btn bx--btn--tertiary bx--btn--sm showDesktop"
            type="button"
            style="display:flex;align-items:center;gap:0.5rem;max-width:none!important;">
          ${SVG.dots} Actions
        </button>

        <!-- Mobile: dots only -->
        <button id="pp-actions-btn-mobile"
            class="bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only showMobile"
            type="button" aria-label="Actions">
          ${SVG.dots}
        </button>

        <!-- Dropdown panel -->
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
          <button class="pp-action-item" data-action="newTone">${SVG.newTone} <span>New Preset</span></button>
          <button class="pp-action-item" data-action="renamePreset">${SVG.editPreset} <span>Edit Preset</span></button>
          <button class="pp-action-item" data-action="addFolder">${SVG.addFolder} <span>Add Folder</span></button>
          <button class="pp-action-item" data-action="renameFolder">${SVG.editFolder} <span>Edit Folder</span></button>
          <div class="pp-action-separator"></div>
          <button class="pp-action-item" id="pp-action-share" data-action="share">${SVG.share} <span>Share Preset</span></button>
          <button class="pp-action-item" id="pp-action-lock"  data-action="lock">${SVG.lock}  <span>Lock Preset</span></button>
          <button class="pp-action-item" data-action="download">${SVG.download} <span>Download Preset</span></button>
          <div class="pp-action-separator"></div>
          <a class="pp-action-item" href="rigs">${SVG.manageRigs} <span>Manage Rigs</span></a>
          <button class="pp-action-item" data-action="tour">${SVG.tour} <span>Guided Tour</span></button>
        </div>

      </div>`;

    // Inject into the controls bar (if present) or after header
    const controls = document.getElementById('preset-controls');
    if (controls) {
      controls.insertAdjacentHTML('beforeend', actionsHtml);
    }
  }

  // Inject styles for the dropdown items
  const style = document.createElement('style');
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

  // Inject after controls bar is visible
  $(document).ready(() => {
    const controls = document.getElementById('preset-controls');
    if (controls) {
      // observe visibility
      const observer = new MutationObserver(() => {
        if (controls.style.display !== 'none') {
          injectActionsDropdown();
          observer.disconnect();
        }
      });
      observer.observe(controls, { attributes: true, attributeFilter: ['style'] });
      // Also try immediately in case it's already visible
      if (controls.style.display !== 'none') injectActionsDropdown();
    }
  });

  // ── Aggiorna icone Share / Lock nel dropdown ───────────────────────────────
  function updateActionsState() {
    const presetId = document.getElementById('presetSelect')?.value;
    if (!presetId) return;

    // ── Lock state ─────────────────────────────────────────────────────────
    const isLocked = typeof getPlexLockStatus === 'function' && getPlexLockStatus(presetId);
    const lockBtn  = document.getElementById('pp-action-lock');
    if (lockBtn) {
      const lockSvgLocked = `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M24,14H22V10a6,6,0,0,0-12,0v4H8a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V16A2,2,0,0,0,24,14ZM12,10a4,4,0,0,1,8,0v4H12ZM24,28H8V16H24Z"></path><circle cx="16" cy="22" r="2"></circle></svg>`;
      const lockSvgOpen   = `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M24,14H10V10a6,6,0,0,1,12,0v1h2V10A8,8,0,0,0,8,10v4H8a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V16A2,2,0,0,0,24,14ZM8,28V16H24V28Z"></path><circle cx="16" cy="22" r="2"></circle></svg>`;
      lockBtn.innerHTML   = `${isLocked ? lockSvgLocked : lockSvgOpen} <span>${isLocked ? 'Locked - Manage' : 'Lock Preset'}</span>`;
      lockBtn.style.color = isLocked ? '#9C54D5' : '';
    }

    // ── Share state ────────────────────────────────────────────────────────
    const preset   = window.presetMap?.[presetId];
    const isShared = Boolean(preset?.shared);
    const shareBtn = document.getElementById('pp-action-share');
    if (shareBtn) {
      const shareSvgActive = `<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32"><path d="M23,20a5,5,0,0,0-3.89,1.89L11.8,17.32a4.46,4.46,0,0,0,0-2.64l7.31-4.57A5,5,0,1,0,18,7a4.79,4.79,0,0,0,.2,1.32l-7.31,4.57a5,5,0,1,0,0,6.22l7.31,4.57A4.79,4.79,0,0,0,18,25a5,5,0,1,0,5-5Z"/></svg>`;
      shareBtn.innerHTML   = `${shareSvgActive} <span>${isShared ? 'Shared - Manage' : 'Share Preset'}</span>`;
      shareBtn.style.color = isShared ? '#5EE2F0' : '';
    }
  }

  // ── Toggle dropdown ────────────────────────────────────────────────────────
  $(document).on('click', '#pp-actions-btn, #pp-actions-btn-mobile', function (e) {
    e.stopPropagation();
    const menu = document.getElementById('pp-actions-menu');
    if (!menu) return;
    const opening = menu.style.display === 'none';
    menu.style.display = opening ? 'block' : 'none';
    if (opening) updateActionsState();
  });

  // Close on outside click
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#pp-actions-wrapper').length) {
      const menu = document.getElementById('pp-actions-menu');
      if (menu) menu.style.display = 'none';
    }
  });

  // Esposta globalmente così plexes-share.js o altri moduli possono aggiornarla
  window.updateActionsMenuState = updateActionsState;

  // Aggiorna quando cambia il preset selezionato
  $(document).on('change', '#presetSelect', function () {
    // piccolo delay per lasciare che presetMap venga aggiornato dalla logica di plexes.js
    setTimeout(updateActionsState, 100);
  });

  // Osserva sparizione del container Swal e aggiorna lo stato del dropdown
  function _refreshOnSwalClose() {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.swal2-container')) {
        observer.disconnect();
        updateActionsState();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Actions dispatch ───────────────────────────────────────────────────────
  $(document).on('click', '.pp-action-item[data-action]', function () {
    const action = $(this).data('action');
    const menu = document.getElementById('pp-actions-menu');
    if (menu) menu.style.display = 'none';

    switch (action) {
      case 'renameFolder':  document.getElementById('renameFolderBtn')?.click(); break;
      case 'newTone':       document.getElementById('createPstBtn')?.click();    break;
      case 'renamePreset':  document.getElementById('renamePresetBtn')?.click(); break;
      case 'addFolder':     document.getElementById('addFolderBtn')?.click();    break;
      case 'share':
        document.getElementById('sharePresetBtn')?.click();
        _refreshOnSwalClose();
        break;
      case 'lock':
        document.getElementById('lockPresetBtn')?.click();
        _refreshOnSwalClose();
        break;
      case 'download':      document.getElementById('downloadPlexBtn')?.click(); break;
      case 'tour':
        if (typeof window.startTour === 'function') window.startTour(0);
        else { localStorage.setItem('pp_tour_active','true'); localStorage.setItem('pp_tour_step','0'); window.location.href='/rigs'; }
        break;
    }
  });

  // ── Existing button wiring (unchanged logic) ───────────────────────────────

  if (window.isPreviewMode) {
    ["exploreBtn","exploreBtnMobile","savePstBtn","savePstBtnMobile"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  if (isGuest) {
    $("#loginBtn, #loginBtnMobile").on("click", () => { window.location.href = "login"; });
    // disable addFolder inside actions
    $(document).on('click', '.pp-action-item[data-action="addFolder"]', () => {
      Swal?.fire({ icon:'info', title:'Login required', text:'Login to use folders.', timer:2000, showConfirmButton:false });
    });
  }

  $("#exploreBtn, #exploreBtnMobile").on("click", () => {
    if (typeof openExploreModal === "function") openExploreModal();
  });

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => { $("#fullscreenMenu").removeClass("active"); });

  function updateSavePresetButtonState() {
    const selected = $('#presetSelect').val();
    const disabled = !selected || selected.trim() === '';
    $('#savePstBtn').prop('disabled', disabled);
    $('#savePstBtnMobile').prop('disabled', disabled);
  }

  $(document).ready(() => {
    updateSavePresetButtonState();
    $('#presetSelect').on('change input', updateSavePresetButtonState);
  });

  $('#savePstBtn, #savePstBtnMobile').on('click', async () => {
    if (typeof recordGuestEvent === 'function') recordGuestEvent('save_preset_click');
    const presetName = $('#presetSelect option:selected').text().trim() || `Untitled ${L.Plex}`;
    const result = collectPedalControlValues(presetName);
    const pedalArray = result[presetName];
    if (!pedalArray || pedalArray.length === 0) return;

    const pedalsObject = {};
    for (const pedal of pedalArray) {
      if (!pedal.id) continue;
      const flatControls = {};
      for (const ctrl of pedal.controls) {
        const key = Object.keys(ctrl)[0];
        flatControls[key] = ctrl[key];
      }
      pedalsObject[pedal.id] = { controls: flatControls };
      const originalControls = window.originalPedalControls?.[pedal.id];
      if (originalControls) {
        const controlsChanged = Object.keys(flatControls).some(key => flatControls[key] !== originalControls[key]);
        if (!controlsChanged) {
          const existingSubplex = window.presetMap?.[currentPresetId]?.pedals?.[pedal.id]?.subplex;
          if (existingSubplex) pedalsObject[pedal.id].subplex = existingSubplex;
        }
      }
    }

    Swal.fire({ title:`Locking Tone as ${L.Plex}...`, didOpen:() => Swal.showLoading(), allowOutsideClick:false });
    const success = await savePreset(currentPresetId, { preset_name: presetName, pedals: pedalsObject });
    if (success) {
      window.PPUnsaved?.markPresetClean();
      Swal.close();
      Swal.fire({ icon:"success", title:`${L.Plex} Saved`, text:`Your Tone "${presetName}" has been saved successfully.`, timer:1000, showConfirmButton:false })
        .then(() => location.reload());
    } else {
      Swal.fire("Error", `Failed to save ${L.plex}. Please retry.`, "error");
    }
  });

  if (window.attachAddFolderListener) window.attachAddFolderListener();
  if (window.attachRenameFolderListener) window.attachRenameFolderListener();

  $('#pedalboardSelect').on('change', (e) => {
    const selectedId = e.target.value;
    const board = window.allPedalboards?.find(pb => pb._id === selectedId);
    if (!board) return;
    window.pedalboard = board;
    if (window.loadFoldersForCurrentPedalboard) window.loadFoldersForCurrentPedalboard();
    if (typeof fetchPresetsByBoardId === 'function') fetchPresetsByBoardId(window.currentUser.userid, window.pedalboard._id);
  });

  const waitForReady = setInterval(() => {
    if (window.currentUser && window.allPedalboards && window.allPedalboards.length > 0) {
      clearInterval(waitForReady);
      window.pedalboard = window.allPedalboards[0];
      if (window.loadFoldersForCurrentPedalboard) window.loadFoldersForCurrentPedalboard();
    }
  }, 50);
}

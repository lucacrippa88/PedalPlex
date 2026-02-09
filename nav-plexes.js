function initNavPreset() {

  const isGuest = !window.currentUser;

  // Save original gear control values to detect changes later (for SubPlex preservation)
  window.originalPedalControls = {};
  const currentPreset = window.presetMap?.[currentPresetId];
  if (currentPreset?.pedals) {
    for (const pedalId of Object.keys(currentPreset.pedals)) {
      window.originalPedalControls[pedalId] = JSON.parse(JSON.stringify(currentPreset.pedals[pedalId].controls));
    }
  }


  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <!-- Left: menu toggle + title -->
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <a href="" style="text-decoration:none;" class="title">PedalPlex</a>
        <a href="plexes" class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600; text-decoration:none">Plexes</a>
      </div>

      <!-- Right: buttons -->
      <div class="rightButtons showDesktop" style="display: flex; align-items: center; gap: 1rem;">

        <button id="savePstBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Save Plex" disabled
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>
        <button id="createPstBtn" class="bx--btn bx--btn--secondary bx--btn--sm" type="button" aria-label="Create New Plex"
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M30 6L26 6 26 2 24 2 24 6 20 6 20 8 24 8 24 12 26 12 26 8 30 8 30 6zM24 15v7.5562A3.9552 3.9552 0 0022 22a4 4 0 104 4V15zM22 28a2 2 0 112-2A2.0027 2.0027 0 0122 28zM17 6H10A2.002 2.002 0 008 8V22.5562A3.9557 3.9557 0 006 22a4 4 0 104 4V8h7zM6 28a2 2 0 112-2A2.0023 2.0023 0 016 28z" stroke="currentColor"/>
          </svg>
          Add Plex
        </button>
            <button id="addFolderBtn" class="bx--btn bx--btn--secondary bx--btn--sm" type="button" aria-label="Create New Folder"
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26 20L24 20 24 24 20 24 20 26 24 26 24 30 26 30 26 26 30 26 30 24 26 24z" stroke="currentColor"/>
            <path d="M28,8H16l-3.4-3.4C12.2,4.2,11.7,4,11.2,4H4C2.9,4,2,4.9,2,6v20c0,1.1,0.9,2,2,2h14v-2H4V6h7.2l3.4,3.4l0.6,0.6H28v8h2v-8 C30,8.9,29.1,8,28,8z" stroke="currentColor"/>
          </svg>
          Add folder
        </button>

      </div>

      <div class="rightButtons showMobile" style="display: flex; align-items: center; gap: 1rem;">

        <button id="savePstBtnMobile" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Save Plex" disabled
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>
        <button id="createPstBtnMobile" class="bx--btn bx--btn--secondary bx--btn--sm" type="button" aria-label="Create New Plex"
          style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M30 6L26 6 26 2 24 2 24 6 20 6 20 8 24 8 24 12 26 12 26 8 30 8 30 6zM24 15v7.5562A3.9552 3.9552 0 0022 22a4 4 0 104 4V15zM22 28a2 2 0 112-2A2.0027 2.0027 0 0122 28zM17 6H10A2.002 2.002 0 008 8V22.5562A3.9557 3.9557 0 006 22a4 4 0 104 4V8h7zM6 28a2 2 0 112-2A2.0023 2.0023 0 016 28z" stroke="currentColor"/>
          </svg>
          Add
        </button>

      </div>

    </header>
    `;

  $("body").prepend(navHtml);

  // Disable Save/Create/Folder buttons and add Login for guests
  if (isGuest) {
    // Remove save buttons
    ['savePstBtn', 'savePstBtnMobile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Add login button
    const loginBtnHtml = `
    <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Login" 
        style="display: flex; align-items: center; gap: 0.5rem;">
        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
        </svg>
        Login
    </button>`;
    const loginBtnHtmlMobile = `
    <button id="loginBtnMobile" class="bx--btn bx--btn--primary bx--btn--sm bx--btn--icon-only" type="button" aria-label="Login" 
        style="display: flex; align-items: center; gap: 0.5rem;">
        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
        </svg>
    </button>`;


    $(".rightButtons.showDesktop").prepend(loginBtnHtml);
    $(".rightButtons.showMobile").prepend(loginBtnHtmlMobile);

    $("#loginBtn, #loginBtnMobile").on("click", () => {
      window.location.href = "login";
    });

    // Disable create/add preset and add folder buttons
    ['createPstBtn', 'createPstBtnMobile', 'addFolderBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = true;
        el.classList.add('btn-disabled');
        el.addEventListener('click', () => {
          Swal.fire("Guest Mode", "Plex editing is disabled in guest mode.", "info");
        });
      }
    });
  }


  // Fullscreen menu toggle
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", () => {
    $("#fullscreenMenu").removeClass("active");
  });

  // Preset filter toggle
  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.show().focus();
  });

  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
  });

  function updateSavePresetButtonState() {
    const selected = $('#presetSelect').val();
    $('#savePstBtn').prop('disabled', !selected || selected.trim() === '');
    $('#savePstBtnMobile').prop('disabled', !selected || selected.trim() === '');
  }

  $(document).ready(() => {
    updateSavePresetButtonState();
    $('#presetSelect').on('change input', updateSavePresetButtonState);
  });

  // Save preset
  $('#savePstBtn, #savePstBtnMobile').on('click', async () => {
    const presetName = $('#presetSelect option:selected').text().trim() || "Untitled Plex";
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
      pedalsObject[pedal.id] = {
        controls: flatControls
      };

      // SubPlex preservation
      const originalControls = window.originalPedalControls?.[pedal.id];
      if (originalControls) {
        // Compare flatControls con originalControls
        const controlsChanged = Object.keys(flatControls).some(key => flatControls[key] !== originalControls[key]);
        if (!controlsChanged) { // SubPlex preservation only if controls didn't change
          const existingSubplex = window.presetMap?.[currentPresetId]?.pedals?.[pedal.id]?.subplex;
          if (existingSubplex) pedalsObject[pedal.id].subplex = existingSubplex;
        }
      }

    }

    Swal.fire({
      title: "Saving Plex...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    const success = await savePreset(currentPresetId, {
      preset_name: presetName,
      pedals: pedalsObject
    });

    if (success) {
      Swal.close()
      Swal.fire({
          icon: "success",
          title: "Plex Saved",
          text: `Plex "${presetName}" was successfully updated.`,
          timer: 1000,
          showConfirmButton: false
        })
        .then(() => location.reload());
    } else {
      Swal.fire("Error", "Failed to save Plex", "error");
    }
  });


  // Create preset
  $('#createPstBtn, #createPstBtnMobile').on('click', async () => {
    await createPreset();
  });


  // Attach folder add/rename listeners
  if (window.attachAddFolderListener) window.attachAddFolderListener();
  if (window.attachRenameFolderListener) window.attachRenameFolderListener();

  // Pedalboard change event
  $('#pedalboardSelect').on('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    window.pedalboard = window.allPedalboards[idx];

    // Fetch folders for this pedalboard
    if (window.loadFoldersForCurrentPedalboard) {
      window.loadFoldersForCurrentPedalboard();
    }

    // Fetch presets for this board
    if (typeof fetchPresetsByBoardId === 'function') {
      fetchPresetsByBoardId(window.currentUser.userid, window.pedalboard._id);
    }
  });

  // Page load: wait for currentUser and pedalboard ---
  const waitForReady = setInterval(() => {
    if (window.currentUser && window.allPedalboards && window.allPedalboards.length > 0) {
      clearInterval(waitForReady);
      window.pedalboard = window.allPedalboards[0]; // pick first pedalboard initially
      if (window.loadFoldersForCurrentPedalboard) {
        window.loadFoldersForCurrentPedalboard();
      }
    }
  }, 50);

}
function initNavPreset() {
  const navHtml = `
<header style="display: flex; align-items: center; justify-content: space-between;">
  <!-- Left: menu toggle + title -->
  <div style="display: flex; align-items: center; gap: 1rem;">
    <button class="menu-toggle" id="menuToggle" aria-label="Open menu" style="background:none; border:none; cursor:pointer;">
      <svg class="menu-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
        <path d="M4 6h24v2H4zm0 9h24v2H4zm0 9h24v2H4"/>
      </svg>
    </button>

    <div class="title">PedalPlex</div><span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Presets</span>
  </div>

  <!-- Right: search toggle, input, create button -->
  <div style="display: flex; align-items: center; gap: 1rem;">

    <button
      id="savePstBtn"
      class="bx--btn bx--btn--primary bx--btn--sm"
      type="button"
      aria-label="Save preset"
      disabled
      style="display: flex; align-items: center; gap: 0.5rem;">
      <svg
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        width="16"
        height="16"
        viewBox="0 0 32 32"
        aria-hidden="true"
        class="bx--btn__icon">
        <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
      </svg>
      Save
    </button>

    <button
      id="createPstBtn"
      class="bx--btn bx--btn--secondary bx--btn--sm"
      type="button"
      aria-label="Create New Preset"
      style="display: flex; align-items: center; gap: 0.5rem;">
      <svg
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        width="16"
        height="16"
        viewBox="0 0 32 32"
        aria-hidden="true"
        class="bx--btn__icon">
        <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Add preset
    </button>

    <button
      id="createFldBtn"
      class="bx--btn bx--btn--secondary bx--btn--sm"
      type="button"
      aria-label="Create New Folder"
      style="display: flex; align-items: center; gap: 0.5rem;">
      <svg
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        width="16"
        height="16"
        viewBox="0 0 32 32"
        aria-hidden="true"
        class="bx--btn__icon">
        <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Add folder
    </button>

  </div>

</header>
`;

  $("body").prepend(navHtml);
  $("body").append(window.fullscreenMenuHtml);

  // Fullscreen menu toggle with quote
  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });

  $("#closeMenu").on("click", () => {
    $("#fullscreenMenu").removeClass("active");
  });

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    input.is(":visible") ? input.hide().val("") : input.show().focus();
  });

  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    console.log("Filtering pedals by:", filterValue);
  });

  function updateSavePresetButtonState() {
    const selected = $('#presetSelect').val();
    $('#savePstBtn').prop('disabled', !selected || selected.trim() === '');
  }

  // Listen for changes to the preset dropdown and update Save button state
  $(document).ready(() => {
    updateSavePresetButtonState();
    $('#presetSelect').on('change input', updateSavePresetButtonState);
  });

  $('#savePstBtn').on('click', async () => {
    const presetName = $('#presetSelect').val() || "Untitled Preset";
    const result = collectPedalControlValues(presetName);
    const pedalArray = result[presetName];

    if (!pedalArray || pedalArray.length === 0) {
      console.warn("Pedals data missing in result:", result);
      return;
    }

    const pedalsObject = {};
    for (const pedal of pedalArray) {
      if (!pedal.id) continue;

      const flatControls = {};
      for (const ctrl of pedal.controls) {
        const key = Object.keys(ctrl)[0];
        flatControls[key] = ctrl[key];
      }

      pedalsObject[pedal.id] = { controls: flatControls };
    }

    const success = await savePreset(currentPresetId, {
      preset_name: presetName,
      pedals: pedalsObject
    });

    if (success) {
      Swal.fire({
        icon: "success",
        title: "Preset Saved",
        text: `Preset "${presetName}" was successfully updated.`,
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire("Error", "Failed to save preset", "error");
    }
  });

  $('#createPstBtn').on('click', async () => {
    await createPreset();
  });
}

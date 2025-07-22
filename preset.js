let resultsDiv;
let selectedBoardIndex = null;

let currentPresetId = null;
let currentPresetRev = null;
let currentPresetName = null;

window.allPedalboards = [];

function initPreset() {

  console.log("Start")


  const userId = window.currentUser?.userid;
  resultsDiv = document.getElementById("preset");

  window.catalog = [];
  window.pedalboard = {
    pedals: []
  };

  window.presetMap = {};

  // Show loading spinner
  resultsDiv.innerHTML = `
    <div class="bx--loading-overlay">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
        </svg>
      </div>
    </div>`;

  // Load catalog
  fetch('https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php')
    .then(response => {
      if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
      return response.json();
    })
    .then(catalog => {
      resultsDiv.innerHTML = ""; // Clear loader
      window.catalog = catalog;

      window.catalogMap = {};
      catalog.forEach(pedal => {
        window.catalogMap[pedal._id] = pedal;
      });

      // Fetch pedalboard data
      return fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId
        })
      });
    })
    .then(response => {
      if (!response.ok) throw new Error(`Pedalboard fetch failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
        renderFullPedalboard(); // Render empty if no boards
        return;
      }

      // Sort pedalboards alphabetically by board_name, case-insensitive
      data.docs.sort((a, b) => {
        const nameA = (a.board_name || '').toLowerCase();
        const nameB = (b.board_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      window.allPedalboards = data.docs; // Store all pedalboards here

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.innerHTML = '';

      // Add placeholder
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = 'Select a pedalboard...';
      placeholderOption.disabled = true;
      dropdown.appendChild(placeholderOption);

      data.docs.forEach((board, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = board.board_name || `Pedalboard ${index + 1}`;
        dropdown.appendChild(option);
      });

      if (data.docs.length > 0) {
        selectedBoardIndex = 0;
        dropdown.value = '0';

        window.pedalboard = window.allPedalboards[0];
        renderFullPedalboard();

        const userId = currentUser.userid;
        fetchPresetsByBoardId(userId, window.pedalboard._id);
      } else {
        selectedBoardIndex = null;
        window.pedalboard = {
          pedals: []
        };
        renderFullPedalboard();
      }

      dropdown.addEventListener('change', (e) => {
        selectedBoardIndex = parseInt(e.target.value, 10);
        window.pedalboard = window.allPedalboards[selectedBoardIndex];
        renderFullPedalboard();

        const userId = currentUser.userid;
        fetchPresetsByBoardId(userId, window.pedalboard._id);
      });
    })
    .catch(error => {
      console.error('Error:', error.message || error);
    });
}








async function renderFullPedalboard() {
  if (!resultsDiv) {
    console.error("resultsDiv not initialized yet");
    return;
  }
  const container = document.getElementById('preset');
  if (!container) {
    console.warn('No #pedalboard container found');
    return;
  }
  container.innerHTML = '';

  if (!window.pedalboard.pedals || window.pedalboard.pedals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 20px;">
          Pedalboard is empty.
        </p>
        <button
          id="createBtn"
          class="bx--btn bx--btn--secondary"
          type="button"
          aria-label="Go to Pedalboard"
          style="
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 auto;
          ">
          <svg xmlns="http://www.w3.org/2000/svg" class="bx--btn__icon" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
            <path d="M18 6L16.59 7.41 23.17 14H4v2H23.17l-6.58 6.59L18 26l10-10z"/>
          </svg>
          Go to pedalboard
        </button>
      </div>
    `;

    document.getElementById('createBtn').addEventListener('click', function () {
      window.location.href = 'pedalboard';
    });

    return;
  }

  $("#preset-controls").css("display", "inline-flex");

  const rowsMap = {};
  window.pedalboard.pedals.forEach(pbPedal => {
    const rowNum = pbPedal.row || 1;
    if (!rowsMap[rowNum]) rowsMap[rowNum] = [];
    rowsMap[rowNum].push(pbPedal);
  });

  const sortedRows = Object.keys(rowsMap).map(r => parseInt(r, 10)).sort((a, b) => a - b);

  for (const rowNum of sortedRows) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.flexWrap = 'wrap';
    rowDiv.style.alignItems = 'flex-start';
    rowDiv.style.gap = '10px';
    // rowDiv.style.marginTop = '30px';


    for (const pbPedal of rowsMap[rowNum]) {
      try {
        const pedalData = window.catalogMap[pbPedal.pedal_id];
        if (!pedalData) {
          console.warn(`Pedal not found in catalog: ${pbPedal.pedal_id}`);
          continue;
        }

        console.log(pedalData)

        const pedal = pedalData;
        const angle = pbPedal.rotation || 0;

        const insideColorRaw = pedal["inside-color"] || "";
        let inside = "";
        let colorOnly = insideColorRaw;

        const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
        if (match) {
          colorOnly = match[1];
          inside = match[2] || "";
        }

        const widthValue = parseFloat(getPedalWidth(pedal.width));

        // Base CSS
        const baseCss = {
          background: colorOnly,
          border: `5px solid ${pedal["color"]}`, // Outer border
          borderRadius: '10px',
          color: pedal["font-color"],
          width: getPedalWidth(pedal.width),
          height: getPedalHeight(pedal.height),
          transform: `rotate(${angle}deg)`,
          display: 'inline-block',
          transformOrigin: 'center center',
          ...(pedal["inside-border"] && {
            boxShadow: `inset 0 0 0 3px ${pedal["inside-border"]}` // Only if inside-border exists
          })
        };

        let $pedalDiv;

        if (pedal.type === "pedal") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -36px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "expression") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -36px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              borderRadius: '25px',
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "combo") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -80px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "head" || pedal.type === "pedal-inverted") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 80px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "round") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 0 0 3px ${pedal["inside-border"] || pedal["color"]}`);

          $pedalDiv = $("<div>").addClass("pedal-catalog").css({
            ...baseCss,
            borderRadius: "50%",  // make it circular
            width: getPedalWidth(pedal.width),  // make sure width = height
            height: getPedalHeight(pedal.height),
            boxShadow
          }).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);
        }

        // Head or inverted logo
        if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
          const $nameDiv = $("<div>").addClass("head-name").html(pedal.name).attr("style", pedal.logo || "");
          $pedalDiv.append($nameDiv);
        }

        // Render controls
        renderPedalControls(pedal, $pedalDiv);

        // Pedal logo
        if ((pedal.type === "pedal") || (pedal.type === "combo") || (pedal.type === "round") || (pedal.type === "expression")) {
          const $nameDiv = $("<div>").addClass("pedal-name").html(pedal.name).attr("style", pedal.logo || "");
          $pedalDiv.append($nameDiv);
        }

        const widthPx = parseFloat(getPedalWidth(pedal.width));
        const heightPx = parseFloat(getPedalHeight(pedal.height));
        const hasRotation = angle !== 0;

        let wrapperStyles = {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
          boxSizing: 'content-box',
          marginBottom: '20px',
        };

        if (hasRotation) {
          const radians = angle * Math.PI / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));

          const rotatedWidth = widthPx * cos + heightPx * sin;
          const rotatedHeight = widthPx * sin + heightPx * cos;

          Object.assign(wrapperStyles, {
            width: `${rotatedWidth}px`,
            height: `${rotatedHeight}px`,
            marginLeft: `${rotatedWidth * 0.2}px`,
            marginRight: `${rotatedWidth * 0.2}px`,
            ...(widthPx > heightPx ? { marginTop: '30px' } : {})
          });
        }

        const $wrapper = $("<div>")
          .css(wrapperStyles)
          .append($pedalDiv);

        rowDiv.appendChild($wrapper[0]);

      } catch (err) {
        console.error('Error fetching pedal info:', err);
      }
    }

    container.appendChild(rowDiv);
  }

  const pedalsOnBoard = [];
  $(".pedal").each(function () {
    pedalsOnBoard.push($(this).data("pedal-name"));
  });
  window.currentPedalsOnBoard = pedalsOnBoard;
}






function getBoxShadow(pedal, inside, insetIfNotFull) {
  const outerShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";

  // Handle full inside
  if (inside === "full") {
    return pedal["inside-border"]
      ? `${outerShadow}, inset 0 0 0 3px ${pedal["inside-border"]}`
      : outerShadow;
  }

  // Handle partial inside
  return `${outerShadow}, ${insetIfNotFull}`;
}







function fetchPresetsByBoardId(user_id, board_id) {
  const presetSelect = document.getElementById('presetSelect');
  if (!presetSelect) return;

  // Remove previous listener if exists (optional)
  presetSelect.onchange = null;

  presetSelect.addEventListener('change', (e) => {
    const selectedPresetName = e.target.value;
    const preset = window.presetMap[selectedPresetName];
    if (preset) {
      currentPresetId = preset._id;
      currentPresetName = preset.preset_name;
      currentPresetRev = preset._rev;
      // Wait a tick to ensure pedalboard DOM is updated/rendered
      setTimeout(() => applyPresetToPedalboard(preset), 0);
    } else {
      currentPresetId = null;
      currentPresetName = null;
      currentPresetRev = null;
    }
  });

  fetch('https://www.cineteatrosanluigi.it/plex/GET_PRESET.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: user_id,
        board_id: board_id
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch presets');
      return response.json();
    })
    .then(data => {
      if (data.error) {
        console.error('Error fetching presets:', data.error);
        return;
      }

      // Use data.presets to populate your dropdown
      presetSelect.innerHTML = ''; // clear

      if (!data.presets || data.presets.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No presets available';
        presetSelect.appendChild(option);
        return;
      }

      window.presetMap = {}; // reset for this board

      // Add placeholder option to presets dropdown
      const placeholderPresetOption = document.createElement('option');
      placeholderPresetOption.value = '';
      placeholderPresetOption.textContent = 'Select a preset...';
      placeholderPresetOption.selected = true;
      placeholderPresetOption.disabled = true;
      presetSelect.appendChild(placeholderPresetOption);

      data.presets.forEach((preset, index) => {
        const presetName = preset.preset_name || `Preset ${index + 1}`;
        window.presetMap[presetName] = preset;

        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        presetSelect.appendChild(option);
      });

    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}





// Edit preset logic
document.getElementById("renamePresetBtn").addEventListener("click", async () => {
  if (!currentPresetId) {
    Swal.fire({
      icon: "warning",
      title: "No Preset Selected",
      text: "Please select a preset to rename or delete.",
      confirmButtonText: "Ok",
      customClass: {
        confirmButton: "bx--btn bx--btn--primary"
      }
    });
    return;
  }

  const preset = Object.values(window.presetMap).find(p => p._id === currentPresetId);

  if (!preset || !currentPresetRev) {
    Swal.fire("Error", "Missing revision (_rev) info for the preset.", "error");
    return;
  }

  // Edit
  const result = await Swal.fire({
    title: "Edit Preset",
    input: "text",
    inputLabel: "Preset Name",
    inputValue: currentPresetName,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    denyButtonText: "Delete Preset",
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary",
      denyButton: "bx--btn bx--btn--danger"
    },
    inputValidator: (value) => {
      if (!value.trim()) {
        return "Name cannot be empty";
      }
    }
  });

  // Delete
  if (result.isDenied) {
    const confirmDelete = await Swal.fire({
      title: `Delete "${currentPresetName}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "bx--btn bx--btn--danger",
        cancelButton: "bx--btn bx--btn--secondary"
      }
    });

    if (confirmDelete.isConfirmed) {
      Swal.fire({
        title: "Deleting...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
      });

      const response = await fetch("https://www.cineteatrosanluigi.it/plex/DELETE_PRESET.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          preset_id: currentPresetId,
          preset_rev: currentPresetRev
        })
      });

      const data = await response.json();
      Swal.close();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Preset Deleted",
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          location.reload();
        });
      } else {
        Swal.fire("Error", data.error || "Failed to delete preset", "error");
      }
    }

    return;
  }

  // Rename
  const newName = result.value?.trim();
  if (newName && newName !== currentPresetName) {
    Swal.fire({
      title: "Saving...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    const success = await savePreset(currentPresetId, {
      preset_name: newName
    });

    Swal.close();

    if (success) {
      Swal.fire({
        icon: "success",
        title: "Preset Renamed",
        text: `Preset has been renamed to "${newName}"`,
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        currentPresetName = newName;
        updatePresetDropdownName(currentPresetId, newName);
        location.reload();
      });
    } else {
      Swal.fire("Error", "Failed to rename preset", "error");
    }
  }
});






// Update/save preset
async function savePreset(presetId, updateData) {
  try {
    const res = await fetch("https://www.cineteatrosanluigi.it/plex/UPDATE_PRESET.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        preset_id: presetId,
        ...updateData
      })
    });

    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error(err);
    return false;
  }
}



// Update the dropdown option text for the renamed preset
function updatePresetDropdownName(id, newName) {
  const dropdown = document.getElementById("presetDropdown");
  if (!dropdown) return;

  const option = [...dropdown.options].find(opt => opt.value === id);
  if (option) option.textContent = newName;
}




// Apply preset to linked pedalboard
function applyPresetToPedalboard(presetDoc) {
  const pedalsFromPreset = presetDoc.pedals;
  const pedalsOnBoard = getPedalList();

  const pedalsOnBoardIds = Array.from(document.querySelectorAll('.pedal-catalog')).map(el => el.dataset.pedalId);
  console.log(pedalsOnBoardIds)

  Object.keys(pedalsFromPreset).forEach(presetPedalId => {
    if (!pedalsOnBoardIds.includes(presetPedalId)) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `Missing pedal on pedalboard: ${presetPedalId}`,
        confirmButtonText: 'Ok',
        customClass: {
          confirmButton: 'bx--btn bx--btn--danger'
        }
      });
    }
  });

  $(".pedal-catalog").each(function () {
    const $pedalDiv = $(this);
    const pedalId = $pedalDiv.data("pedal-id");

    const defaultPedalFromCatalog = window.catalog.find(p => p._id === pedalId || p.name === pedalId);
    if (!defaultPedalFromCatalog) return;

    // Step 1: Deep clone the default controls from catalog
    const resetPedal = JSON.parse(JSON.stringify(defaultPedalFromCatalog));

    // Step 2: Apply preset values on top (if present)
    const presetPedal = pedalsFromPreset[pedalId];
    if (presetPedal && presetPedal.controls) {
      resetPedal.controls.forEach(row => {
        row.row.forEach(ctrl => {
          const controlLabel = ctrl.label;
          if (presetPedal.controls.hasOwnProperty(controlLabel)) {
            ctrl.value = presetPedal.controls[controlLabel];
          }
        });
      });
    }

    // Step 3: Re-render controls
    $pedalDiv.find('.row').remove();
    renderPedalControls(resetPedal, $pedalDiv);

    // Find existing name element (.pedal-name or .head-name)
    const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();

    let nameClass = 'pedal-name'; // default
    let $referenceNode = null;

    if ($existingName.length) {
      nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
      $referenceNode = $existingName.next(); // Save position relative to next sibling
      $existingName.remove(); // Remove it before re-adding
    }

    // Create new name element
    const $nameDiv = $("<div>")
      .addClass(nameClass)
      .html(resetPedal.name)
      .attr("style", resetPedal.logo || "");

    // Insert it back in the correct place
    if ($referenceNode && $referenceNode.length) {
      $nameDiv.insertBefore($referenceNode);
    } else {
      $pedalDiv.prepend($nameDiv); // fallback if no reference point
    }

  });
}





// Get all active gears controls to save the preset
function collectPedalControlValues(presetName = "Untitled Preset") {
  const pedals = [];

  $('[data-pedal-name]').each(function () {
    const pedalName = $(this).data('pedal-name');
    const pedalId = $(this).data('pedal-id');

    const $pedal = $(this);
    const controlsArray = [];
    let hasColoredLed = false;

    // Process knobs
    $pedal.find('.knob').each(function () {
      const label = $(this).data('control-label');
      const $valueLabel = $(this).next('.knob-value-label');
      let value;

      if ($valueLabel.length && $valueLabel.text().trim() !== '') {
        value = $valueLabel.text().trim();
      } else {
        const transform = $(this).css('transform');
        let angle = 0;

        if (transform && transform !== 'none') {
          const values = transform.match(/matrix\((.+)\)/)[1].split(', ');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        } else {
          const style = $(this).attr('style');
          const match = style && style.match(/rotate\((-?\d+)deg\)/);
          angle = match ? parseInt(match[1], 10) : 0;
        }

        value = getValueFromRotation(angle);
      }

      controlsArray.push({
        [label]: isNaN(value) ? value : parseFloat(value)
      });
    });

    // Process dropdowns
    $pedal.find('select[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({
        [label]: value
      });
    });

    // Process sliders
    $pedal.find('input[type="range"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({
        [label]: parseFloat(value)
      });
    });

    // Process LCDs
    $pedal.find('input[type="text"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val().trim();
      controlsArray.push({
        [label]: value
      });
    });

    // Process LEDs
    $pedal.find('.led[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const bgColor = $(this).css('background-color');
      const hexColor = rgbToHex(bgColor).toLowerCase();

      let matchedIndex = null;

      if (Array.isArray(window.catalog)) {
        const pedal = window.catalog.find(p => p.name === pedalName || p.id === pedalName);
        if (pedal && Array.isArray(pedal.controls)) {
          let control = null;

          for (const rowWrapper of pedal.controls) {
            if (Array.isArray(rowWrapper.row)) {
              control = rowWrapper.row.find(c => c.label === label && Array.isArray(c.colors));
              if (control) break;
            }
          }

          if (control && Array.isArray(control.colors)) {
            const catalogColors = control.colors.map(c => c.toLowerCase());
            matchedIndex = catalogColors.indexOf(hexColor);

            // LED is on if it's not black and it matched a defined color
            if (matchedIndex !== -1 && hexColor !== '#000000') {
              hasColoredLed = true;
            }
          }
        }
      }

      controlsArray.push({
        [label]: matchedIndex
      });
    });

    // Only save pedal if at least one LED is ON
    if (hasColoredLed) {
      pedals.push({
        id: pedalId,
        name: pedalName,
        controls: controlsArray
      });
    }
  });

  return {
    [presetName]: pedals
  };
}





// Function to filter pedals with colored LEDs
function filterPedalsWithColoredLeds(pedalsObj) {
  const filteredPedals = {};

  if (!pedalsObj || typeof pedalsObj !== 'object') {
    console.warn('filterPedalsWithColoredLeds: invalid pedalsObj:', pedalsObj);
    return filteredPedals;
  }

  for (const [pedalName, pedalData] of Object.entries(pedalsObj)) {
    if (!pedalData || typeof pedalData !== 'object') {
      console.warn(`Skipping pedal ${pedalName} because pedalData is invalid`, pedalData);
      continue;
    }

    const controls = pedalData.controls;

    if (!controls || (typeof controls !== 'object' && !Array.isArray(controls))) {
      console.warn(`Skipping pedal ${pedalName} because controls is invalid`, controls);
      continue;
    }

    let controlsArray;
    if (Array.isArray(controls)) {
      controlsArray = controls;
    } else {
      controlsArray = Object.entries(controls).map(([key, value]) => ({
        [key]: value
      }));
    }

    const hasColoredLed = controlsArray.some(ctrlObj => {
      const ledValue = Object.values(ctrlObj)[0];
      return typeof ledValue === 'number' && ledValue > 0;
    });

    if (hasColoredLed) {
      filteredPedals[pedalName] = pedalData;
    }
  }

  return filteredPedals;
}





// Create preset logic
async function createPreset() {
  const {
    value: presetName
  } = await Swal.fire({
    title: 'Enter new preset name',
    input: 'text',
    inputLabel: 'Preset Name',
    inputPlaceholder: 'Type your new preset name here',
    showCancelButton: true,
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    inputValidator: value => {
      if (!value) {
        return 'You need to enter a preset name!';
      }
    }
  });

  if (!presetName) return; // Cancelled or empty

  const userId = currentUser.userid;

  const selectedIndex = parseInt($('#pedalboardSelect').val(), 10);
  const selectedBoard = window.allPedalboards[selectedIndex];

  if (isNaN(selectedIndex) || !selectedBoard) {
    Swal.fire('Error', 'Selected pedalboard is invalid.', 'error');
    return;
  }

  const selectedBoardName = selectedBoard.board_name;
  const boardId = selectedBoard._id;

  const bodyData = {
    user_id: userId,
    board_name: selectedBoardName,
    board_id: boardId,
    preset_name: presetName,
    pedals: {} // Start with empty pedals
  };

  try {
    const response = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_PRESET.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const message = data.message || 'Failed to create preset.';
      const cloudantDetails = data.cloudant_response ?
        JSON.stringify(data.cloudant_response, null, 2) :
        'No Cloudant response.';

      Swal.fire('Error', `${message}\n\nCloudant says:\n${cloudantDetails}`, 'error');
      return;
    }

    Swal.fire({
      title: 'Success',
      text: `Preset "${presetName}" created.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      window.location.reload();
    });

  } catch (error) {
    console.error("Caught exception:", error);
    Swal.fire('Error', error.message || 'Network or server error.', 'error');
  }
}

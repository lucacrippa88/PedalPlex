let resultsDiv;
let selectedBoardIndex = null;

let currentPresetId = null;
let currentPresetRev = null;
let currentPresetName = null;

window.allPedalboards = [];

function initPreset() {
  const userId = window.currentUser?.userid;
  resultsDiv = document.getElementById("page-content");

  window.catalog = [];
  window.pedalboard = { pedals: [] };
  window.presetMap = {};

  // Show loader overlay
  document.getElementById("pageLoader").style.display = "flex";

  // Load catalog
  fetch('https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php')
    .then(response => {
      if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
      return response.json();
    })
    .then(catalog => {
      window.catalog = catalog;
      window.catalogMap = {};
      catalog.forEach(pedal => {
        window.catalogMap[pedal._id] = pedal;
      });

      // Hide loader
      document.getElementById("pageLoader").style.display = "none";

      // Fetch pedalboards
      return fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
    })
    .then(response => {
      if (!response.ok) throw new Error(`Pedalboard fetch failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
        renderFullPedalboard();
        return;
      }

      // Sort alphabetically
      data.docs.sort((a, b) =>
        (a.board_name || '').toLowerCase().localeCompare((b.board_name || '').toLowerCase())
      );

      window.allPedalboards = data.docs;

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.innerHTML = '';

      // Placeholder
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

      // Restore pedalboard selection
      const savedBoardName = localStorage.getItem('lastPedalboardName');
      let selectedBoard = null;

      if (savedBoardName) {
        selectedBoard = data.docs.find(b => b.board_name === savedBoardName);
      }

      if (selectedBoard) {
        selectedBoardIndex = data.docs.indexOf(selectedBoard);
        dropdown.value = selectedBoardIndex;
        window.pedalboard = selectedBoard;
      } else {
        selectedBoardIndex = 0;
        dropdown.value = '0';
        window.pedalboard = data.docs[0];
        localStorage.setItem('lastPedalboardName', window.pedalboard.board_name);
      }

      renderFullPedalboard();

      // Load presets for selected pedalboard
      fetchPresetsByBoardId(userId, window.pedalboard._id, restorePresetSelection);

      // On change
      dropdown.addEventListener('change', (e) => {
        const index = parseInt(e.target.value, 10);
        window.pedalboard = window.allPedalboards[index];
        localStorage.setItem('lastPedalboardName', window.pedalboard.board_name);

        renderFullPedalboard();
        fetchPresetsByBoardId(userId, window.pedalboard._id, restorePresetSelection);
      });
    })
    .catch(error => {
      console.error('Error:', error.message || error);
    });
}


function fetchPresetsByBoardId(user_id, board_id, callback) {
  const presetSelect = document.getElementById('presetSelect');
  if (!presetSelect) return;

  presetSelect.onchange = null;

  presetSelect.addEventListener('change', (e) => {
    const selectedPresetName = e.target.value;
    localStorage.setItem('lastPresetName', selectedPresetName);

    const preset = window.presetMap[selectedPresetName];
    if (preset) {
      currentPresetId = preset._id;
      currentPresetName = preset.preset_name;
      currentPresetRev = preset._rev;
      setTimeout(() => applyPresetToPedalboard(preset), 0);
    }
  });

  showPresetLoader();

  fetch('https://www.cineteatrosanluigi.it/plex/GET_PRESET.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, board_id })
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch presets');
      return response.json();
    })
    .then(data => {
      hidePresetLoader();

      if (data.error) {
        console.error('Error fetching presets:', data.error);
        return;
      }

      presetSelect.innerHTML = '';

      if (!data.presets || data.presets.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No presets available';
        presetSelect.appendChild(option);
        if (callback) callback();
        return;
      }

      window.presetMap = {};

      // Placeholder
      const placeholderPresetOption = document.createElement('option');
      placeholderPresetOption.value = '';
      placeholderPresetOption.textContent = 'Select a preset...';
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

      if (callback) callback();
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}


function restorePresetSelection() {
  const savedPresetName = localStorage.getItem('lastPresetName');
  if (!savedPresetName) return;

  const presetSelect = document.getElementById('presetSelect');
  const optionExists = Array.from(presetSelect.options).some(opt => opt.value === savedPresetName);

  if (optionExists) {
    presetSelect.value = savedPresetName;
    const preset = window.presetMap[savedPresetName];
    if (preset) {
      currentPresetId = preset._id;
      currentPresetName = preset.preset_name;
      currentPresetRev = preset._rev;
      applyPresetToPedalboard(preset);
    }
  }
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
      }
      else {
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
    } 
    else {
      Swal.fire("Error", "Failed to rename preset", "error");
    }
  }

  // Once server confirms edit is done:
  saveCurrentSelectionToStorage();
  location.reload();

});



// Update the dropdown option text for the renamed preset
function updatePresetDropdownName(presetId, newName) {
  const option = document.querySelector(
    `#presetSelect option[value="${presetId}"]`
  );
  if (option) {
    option.textContent = newName;
  }
}



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

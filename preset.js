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
        .then(res => {
            if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
            return res.json();
        })
        .then(catalog => {
            window.catalog = catalog;
            window.catalogMap = {};
            catalog.forEach(p => window.catalogMap[p._id] = p);
            document.getElementById("pageLoader").style.display = "none";

            // Fetch pedalboards
            return fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
        })
        .then(res => {
            if (!res.ok) throw new Error(`Pedalboard fetch failed: ${res.status}`);
            return res.json();
        })
        .then(async data => {
            window.allPedalboards = data.docs && Array.isArray(data.docs) ? data.docs : [];

            // Sort alphabetically
            window.allPedalboards.sort((a, b) => (a.board_name || '').toLowerCase().localeCompare((b.board_name || '').toLowerCase()));

            const dropdown = document.getElementById('pedalboardSelect');
            dropdown.innerHTML = '';

            // Placeholder
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Select a pedalboard...';
            placeholderOption.disabled = true;
            dropdown.appendChild(placeholderOption);

            // Add boards
            window.allPedalboards.forEach(pb => {
                const option = document.createElement('option');
                option.value = pb._id;
                option.textContent = pb.board_name || 'Untitled Pedalboard';
                dropdown.appendChild(option);
            });

            // -------------------------
            // Step 1: Restore pedalboard from localStorage
            // -------------------------
            let restored = false;
            const savedBoardId = localStorage.getItem('lastPedalboardId');
            if (savedBoardId) {
                const opt = Array.from(dropdown.options).find(o => o.value === savedBoardId);
                if (opt) {
                    dropdown.value = savedBoardId;
                    window.pedalboard = window.allPedalboards.find(pb => pb._id === savedBoardId);
                    restored = true;
                }
            }

            // Default selection if none restored
            if (!restored && window.allPedalboards.length > 0) {
                dropdown.selectedIndex = 1; // skip placeholder
                window.pedalboard = window.allPedalboards[0];
                localStorage.setItem('lastPedalboardId', window.pedalboard._id);
                localStorage.setItem('lastPedalboardText', window.pedalboard.board_name);
            }

            renderFullPedalboard();

            // Fetch presets for selected pedalboard
            await fetchPresetsByBoardId(userId, window.pedalboard._id, () => {
                const presetSelect = document.getElementById('presetSelect');
                const folderSelect = document.getElementById('folderSelect');

                // 1️⃣ Restore folder first
                const savedFolderId = localStorage.getItem('lastPresetFolderId') || 'default';
                if (folderSelect) {
                    const folderOptionExists = Array.from(folderSelect.options).some(o => o.value === savedFolderId);
                    folderSelect.value = folderOptionExists ? savedFolderId : 'default';
                }

                // 2️⃣ Restore preset selection via populatePresetDropdownByFolder
                const savedPresetId = localStorage.getItem('lastPresetId');
                populatePresetDropdownByFolder(folderSelect?.value || savedFolderId, savedPresetId);

                // 3️⃣ Restore zoom for current pedalboard
                if (typeof restoreZoomForCurrentBoard === "function") {
                    restoreZoomForCurrentBoard();
                }

                // 4️⃣ Trigger change event for Save button state
                presetSelect.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Pedalboard change listener
            dropdown.addEventListener('change', async (e) => {
                const selectedBoardId = e.target.value;
                window.pedalboard = window.allPedalboards.find(pb => pb._id === selectedBoardId);
                renderFullPedalboard();
                localStorage.setItem('lastPedalboardId', selectedBoardId);
                localStorage.setItem('lastPedalboardText', window.pedalboard.board_name);
                await fetchPresetsByBoardId(userId, selectedBoardId);
            });

            // Folder dropdown listener
            document.getElementById('folderSelect')?.addEventListener('change', (e) => {
                populatePresetDropdownByFolder(e.target.value);
            });

        })
        .catch(err => console.error('initPreset error:', err));
}




// Replace your fetchPresetsByBoardId function with this async version
async function fetchPresetsByBoardId(user_id, board_id, callback) {
  const presetSelect = document.getElementById('presetSelect');
  if (!presetSelect) return;

  // Use onchange assignment (replaces any previous handler)
  presetSelect.onchange = (e) => {
    const selectedPresetId = e.target.value;
    // presetMap keyed by _id
    const preset = window.presetMap && window.presetMap[selectedPresetId] ? window.presetMap[selectedPresetId] : (window.presets || []).find(p => p._id === selectedPresetId);
    if (preset) {
      // Guard: don’t re-apply the same preset
      if (window.currentPresetId === preset._id) return;
      currentPresetId = preset._id;
      currentPresetName = preset.preset_name;
      currentPresetRev = preset._rev;
      applyPresetToPedalboard(preset);
      // Save selection to storage
      saveCurrentSelectionToStorage();
    } else {
      currentPresetId = null;
      currentPresetName = null;
      currentPresetRev = null;
    }
  };

  showPresetLoader();

  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_PRESET.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user_id, board_id: board_id })
    });

    if (!res.ok) throw new Error('Failed to fetch presets');

    const data = await res.json();
    hidePresetLoader();

    if (data.error) {
      console.error('Error fetching presets:', data.error);
      if (callback) callback();
      return;
    }

    // Store all presets globally
    window.presets = data.presets || [];
    // Build presetMap keyed by _id for easy lookup
    window.presetMap = {};
    window.presets.forEach(p => {
      if (p && p._id) window.presetMap[p._id] = p;
    });

    // Ensure folders are loaded before we populate folder/preset selects
    if (!window.folders || window.folders.length === 0) {
      if (typeof window.loadFoldersForCurrentPedalboard === 'function') {
        await window.loadFoldersForCurrentPedalboard();
      }
    }

    // Make sure the folder dropdown is populated (folder.js exposes populateFolderDropdown)
    if (typeof window.populateFolderDropdown === 'function') {
      window.populateFolderDropdown();
    }

    // Decide which folder is currently selected (default -> 'default' means unassigned)
    const folderSelect = document.getElementById('folderSelect');
    const selectedFolderId = folderSelect?.value || 'default';

    // Populate presetSelect based on the currently selected folder
    populatePresetDropdownByFolder(selectedFolderId);

    if (callback) callback();
  } catch (err) {
    hidePresetLoader();
    console.error('Fetch error:', err);
    if (callback) callback();
  }
}


document.getElementById("renamePresetBtn").addEventListener("click", async () => {
  if (!currentPresetId) {
    Swal.fire({
      icon: "warning",
      title: "No Preset Selected",
      text: "Please select a preset to rename or assign to a folder.",
      confirmButtonText: "Ok",
      customClass: { confirmButton: "bx--btn bx--btn--primary" }
    });
    return;
  }

  const preset = Object.values(window.presetMap).find(p => p._id === currentPresetId);
  if (!preset || !currentPresetRev) {
    Swal.fire("Error", "Missing revision (_rev) info for the preset.", "error");
    return;
  }

  // Ensure we use the actual preset name for the Swal input
  currentPresetName = preset.preset_name || '';

  // Load folders only if not already loaded
  if (!window.folders || window.folders.length === 0) {
      await window.loadFoldersForCurrentPedalboard(true);
  }

  // Use the actual preset_name for the Swal input
  const presetNameForInput = preset.preset_name || '';

  const folderOptions = window.folders.map(f => {
    const selected = preset.folder_id === (f.id || f._id) ? "selected" : "";
    return `<option value="${f.id || f._id}" ${selected}>${f.name}</option>`;
  }).join("");

  const htmlContent = `
    <input id="presetNameInput" style="width:90%; margin:auto;" class="swal2-input" placeholder="Preset Name" value="${presetNameForInput}">
    <select id="folderSelectInput" class="swal2-select" style="margin-top:10px">
      <option value="">Default (unassigned)</option>
      ${folderOptions}
    </select>
  `;

  const result = await Swal.fire({
    title: "Edit Preset",
    html: htmlContent,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    denyButtonText: "Delete Preset",
    focusConfirm: false,
    preConfirm: () => {
      const newName = document.getElementById("presetNameInput").value.trim();
      const folderId = document.getElementById("folderSelectInput").value;
      if (!newName) {
        Swal.showValidationMessage("Preset name cannot be empty");
        return false;
      }
      return { newName, folderId };
    },
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary",
      denyButton: "bx--btn bx--btn--danger"
    }
  });

  // Handle delete
  if (result.isDenied) {
    const confirmDelete = await Swal.fire({
      title: `Delete "${currentPresetName}"?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      customClass: { confirmButton: "bx--btn bx--btn--danger", cancelButton: "bx--btn bx--btn--secondary" }
    });
    if (!confirmDelete.isConfirmed) return;

    Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    const response = await fetch("https://www.cineteatrosanluigi.it/plex/DELETE_PRESET.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset_id: currentPresetId, preset_rev: currentPresetRev })
    });
    const data = await response.json();
    Swal.close();

    if (data.success) {
      Swal.fire({ icon: "success", title: "Preset Deleted", timer: 2000, showConfirmButton: false })
        .then(() => location.reload());
    } else {
      Swal.fire("Error", data.error || "Failed to delete preset", "error");
    }
    return;
  }

  // Handle save
  if (result.value) {
    const { newName, folderId } = result.value;

    Swal.fire({ title: "Saving...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    // 1. Rename preset
    const success = await savePreset(currentPresetId, { preset_name: newName });
    if (!success) {
      Swal.close();
      Swal.fire("Error", "Failed to rename preset", "error");
      return;
    }

    // 2. Update folder assignment (atomic move)
    {
      const moveResult = await movePresetToFolder(currentPresetId, folderId || null);
      if (!moveResult || moveResult.ok !== true) {
        Swal.close();
        Swal.fire("Error", "Failed to update folder assignment for preset.", "error");
        console.error('movePresetToFolder result:', moveResult);
        return;
      }
    }

    // Update dropdown option text
    updatePresetDropdownName(currentPresetId, newName);

    // Update in-memory preset object
    if (window.presetMap[currentPresetId]) {
        window.presetMap[currentPresetId].preset_name = newName;
    }

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Preset Updated",
      text: `Preset "${newName}" saved and assigned to folder.`,
      timer: 2000,
      showConfirmButton: false
    }).then(() => location.reload());

    // Save current selection locally
    saveCurrentSelectionToStorage();
  }
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
  //const pedalsOnBoard = getPedalList();

  const pedalsOnBoardIds = Array.from(document.querySelectorAll('.pedal-catalog')).map(el => el.dataset.pedalId);

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

  savePedalboard(); // Save full pedalboard state after applying preset

  // Enable save button after applying preset
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }


}



async function createPreset() {
  // 1️⃣ Prompt for preset name
  const { value: presetName } = await Swal.fire({
    title: 'Enter new preset name',
    input: 'text',
    inputLabel: 'Preset Name',
    inputPlaceholder: 'Type your new preset name here',
    showCancelButton: true,
    inputValidator: value => !value && 'You must enter a preset name!'
  });

  if (!presetName) return; // Cancelled

  // 2️⃣ Prompt for folder selection
  const folderOptions = [{ id: '', name: 'No Folder' }, ...window.folders.map(f => ({ id: f.id || f._id, name: f.name }))];
  const folderHtml = `<select id="selectFolder" class="swal2-select" style="width:100%;padding:0.5em;">
    ${folderOptions.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
  </select>`;

  const { value: selectedFolderId } = await Swal.fire({
    title: 'Select folder for this preset',
    html: folderHtml,
    showCancelButton: true,
    preConfirm: () => document.getElementById('selectFolder').value
  });

  // 3️⃣ Create preset in Cloudant
  const userId = currentUser.userid;
  const boardId = window.pedalboard?._id;
  if (!boardId) {
    Swal.fire('Error', 'No pedalboard selected', 'error');
    return;
  }

  const bodyData = {
    user_id: userId,
    board_name: window.pedalboard.board_name,
    board_id: boardId,
    preset_name: presetName,
    pedals: {}
  };

  let newPresetId;
  let data;
  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_PRESET.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      Swal.fire('Error', 'Failed to create preset: ' + (data.message || 'Unknown error'), 'error');
      return;
    }
    newPresetId = data.id;
  } catch (err) {
    Swal.fire('Error', 'Network or server error: ' + err.message, 'error');
    return;
  }

  // Assign newly created preset to selected folder (atomic move)
  if (selectedFolderId) {
    const moveResult = await movePresetToFolder(newPresetId, selectedFolderId || null);
    if (!moveResult || moveResult.ok !== true) {
      console.error('Failed to assign newly created preset to folder', moveResult);
      // optional: Swal.fire to inform the user, but don't block creation success
    }
  }


  Swal.fire('Success', `Preset "${presetName}" created${selectedFolderId ? ` and added to folder.` : '.'}`, 'success')
    .then(() => window.location.reload());

  savePedalboard();

}




// Move preset to single target folder (removes from all others first).
// targetFolderId: string|null  — if null or empty, removes from all folders (unassigned)
async function movePresetToFolder(presetId, targetFolderId) {
  if (!presetId) return { ok: false, error: 'Missing presetId' };

  // ensure folders loaded
  window.folders = window.folders || [];

  // track folders we changed (objects)
  const changedFolders = new Map();

  // 1) Remove from any folder that has the preset (if it's not the target)
  window.folders.forEach(f => {
    f.preset_ids = f.preset_ids || [];
    const fid = f.id || f._id;
    if (f.preset_ids.includes(presetId) && fid !== targetFolderId) {
      f.preset_ids = f.preset_ids.filter(id => id !== presetId);
      changedFolders.set(fid, f);
    }
  });

  // 2) If target specified, ensure it now contains the preset
  if (targetFolderId) {
    const target = window.folders.find(f => (f.id || f._id) === targetFolderId);
    if (target) {
      target.preset_ids = target.preset_ids || [];
      if (!target.preset_ids.includes(presetId)) {
        target.preset_ids.push(presetId);
        changedFolders.set(targetFolderId, target);
      }
    } else {
      console.warn('movePresetToFolder: target folder not found locally:', targetFolderId);
    }
  }

  // 3) Push changes to server for each changed folder (use window.updateFolderOnServer exposed by folder.js)
  const updatePromises = [];
  for (const [fid, folderObj] of changedFolders.entries()) {
    if (typeof window.updateFolderOnServer === 'function') {
      updatePromises.push(window.updateFolderOnServer(folderObj));
    } else {
      // Fallback: make same request directly
      const formData = new URLSearchParams();
      formData.append('folder_id', folderObj.id || folderObj._id);
      formData.append('preset_ids', JSON.stringify(folderObj.preset_ids || []));
      updatePromises.push(
        fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        }).then(r => r.json()).catch(err => ({ ok: false, error: String(err) }))
      );
    }
  }

  let results = [];
  try {
    results = await Promise.all(updatePromises);
  } catch (err) {
    console.error('movePresetToFolder: error updating folders:', err);
    return { ok: false, error: String(err), details: err };
  }

  // check results for success
  const failed = results.filter(r => !(r && (r.ok === true || r.id)));
  if (failed.length > 0) {
    console.error('movePresetToFolder: some updates failed', failed, results);
    return { ok: false, error: 'Some folder updates failed', details: failed };
  }

  // Update in-memory preset.folder_id if possible
  if (window.presetMap && window.presetMap[presetId]) {
    const presetObj = window.presetMap[presetId];
    presetObj.folder_id = targetFolderId || null;
  }
  // Also update window.presets entry
  if (Array.isArray(window.presets)) {
    const p = window.presets.find(x => x._id === presetId);
    if (p) p.folder_id = targetFolderId || null;
  }

  // 4) Refresh UI: folder dropdown and preset dropdown for selected folder
  if (typeof window.populateFolderDropdown === 'function') window.populateFolderDropdown();
  const folderSelect = document.getElementById('folderSelect');
  const effectiveFolder = folderSelect?.value || (targetFolderId || 'default');
  populatePresetDropdownByFolder(effectiveFolder);

  return { ok: true };
}





// Save the full pedalboard state to localStorage
function savePedalboard() {
  if (!window.pedalboard) return;
    try {
      const boardId = window.pedalboard._id || 'unsaved_board';
      // Save pedalboard state keyed by board ID
      localStorage.setItem(`pedalboard_state_${boardId}`, JSON.stringify(window.pedalboard));
    } catch (err) {
      console.error("Failed to save pedalboard:", err);
  }
}





async function assignPresetToFolder(presetId, folderId) {
  if (!folderId) return; // nothing to do
  const folder = window.folders.find(f => f.id === folderId || f._id === folderId);
  if (!folder) return;

  folder.preset_ids = folder.preset_ids || [];
  if (!folder.preset_ids.includes(presetId)) {
    folder.preset_ids.push(presetId);
  }

  const formData = new URLSearchParams();
  formData.append('folder_id', folder.id || folder._id);
  formData.append('preset_ids', JSON.stringify(folder.preset_ids));

  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    const result = await res.json();
    if (!result.ok) console.error('Failed to update folder:', result.error);
  } catch (err) {
    console.error('Error updating folder:', err);
  }
}


// ---------------------------
// Filter and populate presets based on selected folder
// ---------------------------
function populatePresetDropdownByFolder(folderId, preferredPresetId = null) {
    const presetSelect = document.getElementById('presetSelect');
    if (!presetSelect || !window.presets) return;

    presetSelect.innerHTML = '';

    let filteredPresets = [];

    if (folderId === 'default') {
        // Show only presets not assigned to any folder
        const folderPresetIds = new Set();
        (window.folders || []).forEach(f => {
            if (Array.isArray(f.preset_ids)) f.preset_ids.forEach(id => folderPresetIds.add(id));
        });
        filteredPresets = window.presets.filter(p => !folderPresetIds.has(p._id));
    } else {
        // Show only presets assigned to the selected folder
        const folder = (window.folders || []).find(f => (f.id || f._id) === folderId);
        if (folder && Array.isArray(folder.preset_ids)) {
            filteredPresets = window.presets.filter(p => folder.preset_ids.includes(p._id));
        }
    }

    // Populate the dropdown
    filteredPresets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p._id;
        opt.textContent = p.preset_name || 'Untitled Preset';
        presetSelect.appendChild(opt);
    });

    // Determine which preset to select
    let selectedPreset = null;
    if (preferredPresetId) {
        selectedPreset = filteredPresets.find(p => p._id === preferredPresetId) || filteredPresets[0];
    } else {
        selectedPreset = filteredPresets[0] || null;
    }

    if (selectedPreset) {
        currentPresetId = selectedPreset._id;
        currentPresetName = selectedPreset.preset_name;
        currentPresetRev = selectedPreset._rev;
        presetSelect.value = selectedPreset._id;

        // Apply preset
        applyPresetToPedalboard(selectedPreset);

        // Save selection
        saveCurrentSelectionToStorage();
    }

    // Enable/disable Save button
    const saveBtn = document.getElementById('savePstBtn');
    if (saveBtn) saveBtn.disabled = filteredPresets.length === 0;
}



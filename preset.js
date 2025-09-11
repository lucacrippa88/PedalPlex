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
  window.pedalboard = {
    pedals: []
  };

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

      // Hide loader overlay once data is ready
      document.getElementById("pageLoader").style.display = "none";

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

      data.docs.forEach((board) => {
        const option = document.createElement('option');
        option.value = board._id; // <-- store DB id
        option.textContent = board.board_name || 'Untitled Pedalboard';
        dropdown.appendChild(option);
      });

      if (data.docs.length > 0) {

        // Restore pedalboard selection by saved text
        const savedBoardId = localStorage.getItem('lastPedalboardId');
        let restored = false;

        if (savedBoardId) {
          for (let i = 0; i < dropdown.options.length; i++) {
            if (dropdown.options[i].value === savedBoardId) {
              dropdown.selectedIndex = i;
              window.pedalboard = window.allPedalboards.find(pb => pb._id === savedBoardId);
              restored = true;
              break;
            }
          }
        }

        if (!restored) {
          // fallback: select first real pedalboard
          dropdown.selectedIndex = 1; // skip placeholder
          window.pedalboard = window.allPedalboards[0];

          // Save fallback choice
          localStorage.setItem('lastPedalboardId', window.pedalboard._id);
        }

        renderFullPedalboard();

        const userId = currentUser.userid;
        // fetchPresetsByBoardId(userId, window.pedalboard._id);
        fetchPresetsByBoardId(userId, window.pedalboard._id, () => {
          // Restore preset selection by visible text
          // Restore preset selection by visible text
          const savedPresetText = localStorage.getItem('lastPresetText');
          if (savedPresetText) {
            const presetSelect = document.getElementById('presetSelect');
            let restoredPreset = false;

            for (let i = 0; i < presetSelect.options.length; i++) {
              if (presetSelect.options[i].text.trim() === savedPresetText) {
                presetSelect.selectedIndex = i;
                const preset = window.presetMap[presetSelect.options[i].value];
                if (preset) {
                  currentPresetId = preset._id;
                  currentPresetName = preset.preset_name;
                  currentPresetRev = preset._rev;
                  applyPresetToPedalboard(preset);

                  // Restore zoom now that preset is applied
                  if (typeof restoreZoomForCurrentBoard === "function") {
                    restoreZoomForCurrentBoard();
                  }
                  restoredPreset = true;

                  // Trigger change event so Save button is enabled
                  const event = new Event('change', {
                    bubbles: true
                  });
                  presetSelect.dispatchEvent(event);
                }
                break;
              }
            }

            // fallback: select first real preset (skip placeholder)
            if (!restoredPreset && presetSelect.options.length > 1) {
              presetSelect.selectedIndex = 1;
              const preset = window.presetMap[presetSelect.options[1].value];
              if (preset) {
                applyPresetToPedalboard(preset);

                // Restore zoom now that preset is applied
                if (typeof restoreZoomForCurrentBoard === "function") {
                  restoreZoomForCurrentBoard();
                }

                // Trigger change event
                const event = new Event('change', {
                  bubbles: true
                });
                presetSelect.dispatchEvent(event);
              }
            }
          }


        });
      } else {
        selectedBoardIndex = null;
        window.pedalboard = {
          pedals: []
        };
        renderFullPedalboard();
      }

      dropdown.addEventListener('change', (e) => {
        const selectedBoardId = e.target.value;
        window.pedalboard = window.allPedalboards.find(pb => pb._id === selectedBoardId);

        renderFullPedalboard();

        const userId = currentUser.userid;
        fetchPresetsByBoardId(userId, selectedBoardId);

        // Save selection
        localStorage.setItem('lastPedalboardId', selectedBoardId);
      });

    })
    .catch(error => {
      console.error('Error:', error.message || error);
    });
}





function fetchPresetsByBoardId(user_id, board_id, callback) {
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
      // Save selection to storage
      saveCurrentSelectionToStorage();
    } else {
      currentPresetId = null;
      currentPresetName = null;
      currentPresetRev = null;
    }
  });

  showPresetLoader();

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

      hidePresetLoader();

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
        if (callback) callback();
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

      // Call callback after presets are populated
      if (callback) callback();

    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}





// Edit preset logic
// document.getElementById("renamePresetBtn").addEventListener("click", async () => {
//   if (!currentPresetId) {
//     Swal.fire({
//       icon: "warning",
//       title: "No Preset Selected",
//       text: "Please select a preset to rename or delete.",
//       confirmButtonText: "Ok",
//       customClass: {
//         confirmButton: "bx--btn bx--btn--primary"
//       }
//     });
//     return;
//   }

//   const preset = Object.values(window.presetMap).find(p => p._id === currentPresetId);

//   if (!preset || !currentPresetRev) {
//     Swal.fire("Error", "Missing revision (_rev) info for the preset.", "error");
//     return;
//   }

//   // Edit
//   const result = await Swal.fire({
//     title: "Edit Preset",
//     input: "text",
//     inputLabel: "Preset Name",
//     inputValue: currentPresetName,
//     showCancelButton: true,
//     showDenyButton: true,
//     confirmButtonText: "Save",
//     cancelButtonText: "Cancel",
//     denyButtonText: "Delete Preset",
//     customClass: {
//       confirmButton: "bx--btn bx--btn--primary",
//       cancelButton: "bx--btn bx--btn--secondary",
//       denyButton: "bx--btn bx--btn--danger"
//     },
//     inputValidator: (value) => {
//       if (!value.trim()) {
//         return "Name cannot be empty";
//       }
//     }
//   });

//   // Delete
//   if (result.isDenied) {
//     const confirmDelete = await Swal.fire({
//       title: `Delete "${currentPresetName}"?`,
//       text: "This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete it",
//       cancelButtonText: "Cancel",
//       customClass: {
//         confirmButton: "bx--btn bx--btn--danger",
//         cancelButton: "bx--btn bx--btn--secondary"
//       }
//     });

//     // if user clicked Cancel, just stop here
//     if (result.isDismissed) {
//       return;
//     }

//     if (confirmDelete.isConfirmed) {
//       Swal.fire({
//         title: "Deleting...",
//         didOpen: () => Swal.showLoading(),
//         allowOutsideClick: false
//       });

//       const response = await fetch("https://www.cineteatrosanluigi.it/plex/DELETE_PRESET.php", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           preset_id: currentPresetId,
//           preset_rev: currentPresetRev
//         })
//       });

//       const data = await response.json();
//       Swal.close();

//       if (data.success) {
//         Swal.fire({
//           icon: "success",
//           title: "Preset Deleted",
//           timer: 2000,
//           showConfirmButton: false
//         }).then(() => {
//           location.reload();
//         });
//       } else {
//         Swal.fire("Error", data.error || "Failed to delete preset", "error");
//       }
//     }

//     return;
//   }

//   // Rename
//   const newName = result.value?.trim();
//   if (newName && newName !== currentPresetName) {
//     Swal.fire({
//       title: "Saving...",
//       didOpen: () => Swal.showLoading(),
//       allowOutsideClick: false
//     });

//     const success = await savePreset(currentPresetId, {
//       preset_name: newName
//     });

//     Swal.close();

//     if (success) {
//       Swal.fire({
//         icon: "success",
//         title: "Preset Renamed",
//         text: `Preset has been renamed to "${newName}"`,
//         timer: 2000,
//         showConfirmButton: false
//       }).then(() => {
//         currentPresetName = newName;
//         updatePresetDropdownName(currentPresetId, newName);
//         location.reload();
//       });
//     } else {
//       Swal.fire("Error", "Failed to rename preset", "error");
//     }
//   }

//   // Once server confirms edit is done:
//   saveCurrentSelectionToStorage();

// });
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

  // 1️⃣ Ensure folders are loaded
  try {
    if (!window.folders || window.folders.length === 0) {
      await window.loadFoldersForCurrentPedalboard();
    }
  } catch (err) {
    console.error("Failed to load folders:", err);
    window.folders = []; // fallback to empty array
  }

  // 2️⃣ Build folder dropdown HTML safely
  const folderOptions = (window.folders || []).map(f => {
    const selected = preset.folder_id && preset.folder_id === (f._id || f.id) ? "selected" : "";
    return `<option value="${f._id || f.id}" ${selected}>${f.name}</option>`;
  }).join("");

  const htmlContent = `
    <input id="presetNameInput" class="swal2-input" placeholder="Preset Name" value="${currentPresetName}">
    <select id="folderSelectInput" class="swal2-select" style="margin-top:10px">
      <option value="">-- No folder --</option>
      ${folderOptions}
    </select>
  `;

  // 3️⃣ Show Swal modal
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

  // 4️⃣ Handle Delete
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
    if (!confirmDelete.isConfirmed) return;

    Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    const response = await fetch("https://www.cineteatrosanluigi.it/plex/DELETE_PRESET.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset_id: currentPresetId, preset_rev: currentPresetRev })
    });
    const data = await response.json();
    Swal.close();

    if (data.success) Swal.fire({ icon: "success", title: "Preset Deleted", timer: 2000, showConfirmButton: false }).then(() => location.reload());
    else Swal.fire("Error", data.error || "Failed to delete preset", "error");

    return;
  }

  // 5️⃣ Handle Save (rename + folder assignment)
  if (result.value) {
    const { newName, folderId } = result.value;

    Swal.fire({ title: "Saving...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    // Rename preset
    const renameSuccess = await savePreset(currentPresetId, { preset_name: newName });
    if (!renameSuccess) {
      Swal.close();
      Swal.fire("Error", "Failed to rename preset", "error");
      return;
    }

    // Assign to folder
    if (folderId) {
      const folder = (window.folders || []).find(f => (f._id || f.id) === folderId);
      if (folder) {
        folder.preset_ids = folder.preset_ids || [];
        if (!folder.preset_ids.includes(currentPresetId)) folder.preset_ids.push(currentPresetId);

        try {
          await fetch("https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `folder_id=${encodeURIComponent(folder._id || folder.id)}&preset_ids=${encodeURIComponent(JSON.stringify(folder.preset_ids))}`
          });
        } catch (err) {
          console.error("Failed to assign preset to folder:", err);
          Swal.close();
          Swal.fire("Warning", "Preset renamed but folder assignment failed.", "warning");
        }
      }
    }

    Swal.close();

    // Update UI and storage
    currentPresetName = newName;
    updatePresetDropdownName(currentPresetId, newName);

    if (typeof saveCurrentSelectionToStorage === "function") {
      saveCurrentSelectionToStorage();
    }

    Swal.fire({
      icon: "success",
      title: "Preset Updated",
      text: `Preset "${newName}" saved and assigned to folder.`,
      timer: 2000,
      showConfirmButton: false
    }).then(() => location.reload());
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

  savePedalboard(); // Save full pedalboard state after applying preset

  // Enable save button after applying preset
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }


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
  const selectedBoardId = $('#pedalboardSelect').val();
  const selectedBoard = window.allPedalboards.find(pb => pb._id === selectedBoardId);

  if (!selectedBoard) {
    Swal.fire('Error', 'Selected pedalboard is invalid.', 'error');
    return;
  }

  const bodyData = {
    user_id: userId,
    board_name: selectedBoard.board_name,
    board_id: selectedBoard._id, // <-- safe direct ID
    preset_name: presetName,
    pedals: {}
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

  savePedalboard();

}



// Save the full pedalboard state to localStorage
function savePedalboard() {
  if (!window.pedalboard) return;
    try {
      const boardId = window.pedalboard._id || 'unsaved_board';
      // Save pedalboard state keyed by board ID
      localStorage.setItem(`pedalboard_state_${boardId}`, JSON.stringify(window.pedalboard));

      console.log(`Pedalboard saved: ${boardId}`);
    } catch (err) {
      console.error("Failed to save pedalboard:", err);
  }
}

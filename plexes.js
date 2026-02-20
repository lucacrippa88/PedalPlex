let resultsDiv;
let selectedBoardIndex = null;
let currentPresetId = null;
let currentPresetRev = null;
let currentPresetName = null;
let isRestoringPreset = false;



window.allPedalboards = [];

$(document).ready(function () {
  if (!localStorage.getItem('authToken')) {
    console.warn("No auth token found — initializing guest mode.");
    initGuestMode();
  }

  renderFullPedalboard();
});



async function initPreset() {
  const isGuest = !window.currentUser;
  const userId = window.currentUser?.userid;
  resultsDiv = document.getElementById("page-content");

  window.catalog = [];
  window.pedalboard = {
    pedals: []
  };
  window.presetMap = {};

  if (isGuest) {
  console.warn("Initializing Guest Mode");

  // 1️⃣ Leggi il guest board dal localStorage
  const raw = localStorage.getItem("guestPedalboard");
  let guestBoards = [];

  try {
    guestBoards = JSON.parse(raw) || [];
  } catch (e) {
    console.error("Invalid guestPedalboard JSON", e);
  }

  const guestBoard = (guestBoards[0] || {
    board_name: "Guest Board",
    pedals: []
  });

  window.pedalboard = {
    _id: "guest_board",
    board_name: guestBoard.board_name,
    pedals: guestBoard.pedals || []
  };

  // disabilita UI non disponibile per ospiti
  [
    "pedalboardSelect",
    "presetSelect",
    "folderSelect",
    "renamePresetBtn",
    "savePstBtn",
    "savePstBtnMobile",
    "createPstBtn",
    "createPstBtnMobile",
    "addFolderBtn"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = true;
      el.classList.add("btn-disabled");
    }
  });

  // 2️⃣ Estrai gli ID pedali dal guest board
  const ids = [...new Set((guestBoard.pedals || []).map(p => p.pedal_id))];

  console.log("Fetching pedals via GET_PEDALS_BY_IDS (guest):", ids);

  window.catalog = [];
  window.catalogMap = {};

  // 3️⃣ Scarica SOLO i pedali necessari
  if (ids.length > 0) {
    try {
      const res = await fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });

      const json = await res.json();
      const docs = Array.isArray(json.docs) ? json.docs : json;

      window.catalog = docs;
      window.catalogMap = {};
      docs.forEach(p => window.catalogMap[p._id] = p);
    } catch (err) {
      console.error("Error fetching guest pedals:", err);
    }
  }

  // 4️⃣ RENDER DELLA PEDALBOARD (esattamente come i loggati)
  renderFullPedalboard(window.pedalboard.pedals);

  // 5️⃣ Nessun preset per ospiti
  window.presets = [];
  window.presetMap = {};
  populatePresetDropdownByFolder("default");

  return; // IMPORTANTISSIMO → evita i fetch logged-in
}


  // Show loader overlay
  document.getElementById("pageLoader").style.display = "flex";

  // 1️⃣ Scarica tutte le pedaliere per utente
  fetch('https://api.pedalplex.com/GET_PEDALBOARD.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId
    })
  })
  .then(res => {
    if (!res.ok) throw new Error(`Rig fetch failed: ${res.status}`);
    return res.json();
  })
  .then(async data => {
    window.allPedalboards = data.docs && Array.isArray(data.docs) ? data.docs : [];

    // 2️⃣ Estrai gli ID pedali unici da tutte le pedaliere
    const pedalIds = new Set();
    window.allPedalboards.forEach(pb => {
      if (pb.pedals && Array.isArray(pb.pedals)) {
        pb.pedals.forEach(p => pedalIds.add(p.pedal_id || p._id));
      }
    });
    const idsArray = Array.from(pedalIds);

    // 3️⃣ Scarica solo i pedali necessari
    let catalog = [];
    if (idsArray.length > 0) {
      const pedalRes = await fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsArray })
      });
      if (!pedalRes.ok) throw new Error(`Pedal fetch failed: ${pedalRes.status}`);

      const pedalJson = await pedalRes.json();
      catalog = Array.isArray(pedalJson.docs) ? pedalJson.docs : pedalJson;

    }

    window.catalog = catalog;
    window.catalogMap = {};
    catalog.forEach(p => window.catalogMap[p._id] = p);

    document.getElementById("pageLoader").style.display = "none";

      // Sort alphabetically
      window.allPedalboards.sort((a, b) => (a.board_name || '').toLowerCase().localeCompare((b.board_name || '').toLowerCase()));

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.innerHTML = '';

      // Placeholder
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = '-- Select a Rig --';
      placeholderOption.disabled = true;
      dropdown.appendChild(placeholderOption);

      // Add boards
      window.allPedalboards.forEach(pb => {
        const option = document.createElement('option');
        option.value = pb._id;
        option.textContent = pb.board_name || 'Untitled Rig';
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

      await fetchPresetsByBoardId(userId, window.pedalboard._id, () => {
        const presetSelect = document.getElementById('presetSelect');
        const folderSelect = document.getElementById('folderSelect');

        // 1️⃣ Restore folder first
        const savedFolderId = localStorage.getItem('lastPresetFolderId') || 'default';
        if (folderSelect) {
          const folderOptionExists = Array.from(folderSelect.options)
            .some(o => o.value === savedFolderId);
          folderSelect.value = folderOptionExists ? savedFolderId : 'default';
        }

        // 2️⃣ Restore preset selection (NO side effects)
        const savedPresetId = localStorage.getItem('lastPresetId');
        populatePresetDropdownByFolder(folderSelect?.value || savedFolderId, savedPresetId);

        // 3️⃣ Apply restored preset manually (NO onchange)
        if (savedPresetId && window.presetMap?.[savedPresetId]) {
          const preset = window.presetMap[savedPresetId];

          currentPresetId   = preset._id;
          currentPresetName = preset.preset_name;
          currentPresetRev  = preset._rev;

          applyPresetToPedalboard(preset);
        }

        // 4️⃣ Restore zoom
        if (typeof restoreZoomForCurrentBoard === "function") {
          restoreZoomForCurrentBoard();
        }

        // ❌ NON dispatchare change
      });


      // Pedalboard change listener
      dropdown.addEventListener('change', async (e) => {
        const selectedBoardId = e.target.value;
        window.pedalboard = window.allPedalboards.find(pb => pb._id === selectedBoardId);
        await renderFullPedalboard();
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




// Fetch presets for given board ID
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

  const token = localStorage.getItem('authToken');
  
  try {
    const res = await fetch('https://api.pedalplex.com/GET_PRESET.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        user_id: user_id,
        board_id: board_id
      })
    });

    if (!res.ok) throw new Error('Failed to fetch Plexes');

    const data = await res.json();
    hidePresetLoader();

    if (data.error) {
      console.error('Error fetching Plexes:', data.error);
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
      title: "No Plex Selected",
      text: "Please select a Plex to rename or assign to a folder.",
      confirmButtonText: "Ok",
      customClass: {
        confirmButton: "bx--btn bx--btn--primary"
      }
    });
    return;
  }

  const preset = Object.values(window.presetMap).find(p => p._id === currentPresetId);
  if (!preset || !currentPresetRev) {
    Swal.fire("Error", "Missing revision (_rev) info for the Plex.", "error");
    return;
  }

  // Ensure we use the actual preset name for the Swal input
  currentPresetName = preset.preset_name || '';

  // Ensure folders are loaded first
  if (!window.folders || window.folders.length === 0) {
    await window.loadFoldersForCurrentPedalboard(true);
  }

  // Helper to get folder ID containing the preset
  function getPresetFolderId(presetId) {
    const folder = (window.folders || []).find(f => f.preset_ids?.includes(presetId));
    return folder ? (folder.id || folder._id) : "";
  }

  const presetFolderId = getPresetFolderId(currentPresetId);

  const folderOptions = (window.folders || []).map(f => {
    const folderId = String(f.id || f._id);
    const selected = folderId === presetFolderId ? "selected" : "";
    return `<option value="${folderId}" ${selected}>${f.name}</option>`;
  }).join("");

  const folderSelectHtml = `
  <select id="folderSelectInput" class="swal2-select" style="margin-top:10px">
    <option value="" ${presetFolderId === "" ? "selected" : ""}>Default (unassigned)</option>
    ${folderOptions}
  </select>
  `;


  const htmlContent = `
    <input id="presetNameInput" style="width:90%; margin:auto;" class="swal2-input" placeholder="Plex Name" value="${currentPresetName}">
    ${folderSelectHtml}
  `;

  const result = await Swal.fire({
    title: "Edit Plex name and folder",
    html: htmlContent,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel",
    denyButtonText: "Delete",
    focusConfirm: false,
    preConfirm: () => {
      const newName = document.getElementById("presetNameInput").value.trim();
      const folderId = document.getElementById("folderSelectInput").value;
      if (!newName) {
        Swal.showValidationMessage("Plex name cannot be empty!");
        return false;
      }
      return {
        newName,
        folderId
      };
    },
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary",
      denyButton: "bx--btn bx--btn--danger"
    },
    footer: `
      <button id="duplicatePresetBtn" type="button" class="bx--btn bx--btn--tertiary">
        Duplicate
      </button>
    `,
    didOpen: () => {
      const duplicateBtn = document.getElementById("duplicatePresetBtn");
      if (duplicateBtn) {
        duplicateBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          e.preventDefault();

          const newName = document.getElementById("presetNameInput").value.trim();
          const folderId = document.getElementById("folderSelectInput").value;

          if (!newName) {
            Swal.showValidationMessage("Plex name cannot be empty!");
            return;
          }

          // Get the preset object at modal open time
          const presetObj = window.presetMap[currentPresetId]; // use the modal's current preset
          if (!presetObj) {
            Swal.fire("Error", "Plex not found", "error");
            return;
          }

          await duplicatePreset(presetObj._id, newName, folderId);
          Swal.close();
        });
      }
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
      customClass: {
        confirmButton: "bx--btn bx--btn--danger",
        cancelButton: "bx--btn bx--btn--secondary"
      }
    });
    if (!confirmDelete.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    const token = localStorage.getItem('authToken');

    const response = await fetch("https://api.pedalplex.com/DELETE_PRESET.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
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
          title: "Plex Deleted",
          timer: 1000,
          showConfirmButton: false
        })
        .then(() => location.reload());
    } else {
      Swal.fire("Error", data.error || "Failed to delete Plex", "error");
    }
    return;
  }


// Handle save
if (result.value) {
  const { newName, folderId } = result.value;

  // Step 0: Validate locally before spinner
  const sanitizedName = removeForbiddenChars(newName);
  if (!newName || sanitizedName !== newName) {
    await Swal.fire({
      icon: 'error',
      title: 'Invalid Plex name',
      text: 'Plex name cannot be empty and cannot contain forbidden characters. Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
    return;
  }


  // Step 1: Show spinner
  Swal.fire({
    title: "Saving...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    // Step 2: Save preset name
    const success = await savePreset(currentPresetId, { preset_name: sanitizedName });
    if (!success) {
      Swal.close();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Plex name rejected by server. Please use only allowed characters.',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
      return;
    }

    // Step 3: Move preset to folder
    const moveResult = await movePresetToFolder(currentPresetId, folderId || null);
    if (!moveResult || moveResult.ok !== true) {
      Swal.close();
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update folder assignment for Plex.',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
      console.error('movePresetToFolder result:', moveResult);
      return;
    }

    // Step 4: Update local state & UI
    updatePresetDropdownName(currentPresetId, sanitizedName);
    if (window.presetMap[currentPresetId]) {
      window.presetMap[currentPresetId].preset_name = sanitizedName;
    }
    saveCurrentSelectionToStorage();

    // Step 5: Close spinner before showing success
    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "Plex Updated",
      text: `Plex "${sanitizedName}" saved and assigned to folder.`,
      timer: 1000,
      showConfirmButton: false
    });

    // Step 6: Reload UI after short delay so user sees success
    setTimeout(() => location.reload(), 200);

  } catch (err) {
    Swal.close();
    console.error("Plex save error:", err);

    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Unexpected error occurred while saving Plex.',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }
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


// Update / save preset 
async function savePreset(presetId, updateData) {

  const token = localStorage.getItem('authToken');

  // ===== ARRICCHISCI PEDALS CON SUBPLEX =====
  if (updateData.pedals) {
    for (const pedalName in updateData.pedals) {
      const $pedalDiv = $(`.pedal-catalog[data-pedal-id="${pedalName}"]`);

      const appliedSubplex = $pedalDiv.data('applied-subplex');
      // ✅ salva SOLO subplex validi
      if (appliedSubplex && appliedSubplex.id) {
        updateData.pedals[pedalName].subplex = appliedSubplex;
      } else {
        // ❌ rimuovi qualunque residuo
        delete updateData.pedals[pedalName].subplex;
      }
    }
  }

  const payload = {
    preset_id: presetId,
    _rev: currentPresetRev, // <-- send current revision!
    ...updateData
  };
  try {
    const res = await fetch("https://api.pedalplex.com/UPDATE_PRESET.php", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error(err);
    return false;
  }
}



// Duplicate preset with proper confirmation
async function duplicatePreset(presetId, newName, folderId) {
  try {
    const original = window.presetMap && window.presetMap[presetId];
    if (!original) {
      Swal.fire({
        title: 'Error',
        text: 'Plex not found',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary'
        },
        buttonsStyling: false
      });
      return;
    }

    // Show loading UI
    Swal.fire({
      title: 'Duplicating Plex...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // --- Determine selected pedalboard from dropdown (do NOT rely on window.pedalboard) ---
    const pedalboardSelect = document.getElementById('pedalboardSelect');
    const selectedBoardId = pedalboardSelect?.value || (window.pedalboard && window.pedalboard._id) || null;
    const selectedBoardName = pedalboardSelect?.selectedOptions?.[0]?.text || (window.pedalboard && window.pedalboard.board_name) || '';

    if (!selectedBoardId) {
      Swal.close();
      Swal.fire({
        title: 'Error',
        text: 'No Rig selected',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary'
        },
        buttonsStyling: false
      });
      return;
    }

    // Build duplicated preset payload using selectedBoardId
    const duplicated = {
      user_id: window.currentUser?.userid,
      board_id: selectedBoardId,
      board_name: selectedBoardName,
      preset_name: `${newName} - Copy`,
      pedals: JSON.parse(JSON.stringify(original.pedals || {})),
    };

    // Create on server
    const newId = await createPresetOnServer(duplicated);

    if (!newId) {
      Swal.close();
      Swal.fire({
        title: 'Error',
        text: 'Could not duplicate Plex',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary'
        },
        buttonsStyling: false
      });
      return;
    }

    // If a folderId was provided, move the new preset into it
    if (folderId) {
      try {
        await movePresetToFolder(newId, folderId);
      } catch (err) {
        console.error('duplicatePreset: movePresetToFolder error', err);
        // continue anyway
      }
    }

    // Refresh folders/presets for the currently selected pedalboard
    if (typeof window.loadFoldersForCurrentPedalboard === 'function') {
      await window.loadFoldersForCurrentPedalboard();
    }
    const folderSelect = document.getElementById('folderSelect');
    if (folderSelect) populatePresetDropdownByFolder(folderSelect.value);

    // Close any loading modal (important)
    Swal.close();

    // Show success briefly (auto-closes), await it, then reload
    await Swal.fire({
      icon: 'success',
      title: 'Plex Duplicated',
      text: `Plex duplicated as "${duplicated.preset_name}"`,
      timer: 1000,
      showConfirmButton: false,
      allowOutsideClick: false
    });

    // Now safely reload after the user saw the confirmation
    location.reload();

  } catch (err) {
    console.error('duplicatePreset error:', err);
    Swal.close();
    Swal.fire({
      title: 'Error',
      text: 'Unexpected error duplicating Plex.',
      icon: 'error',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary'
      },
      buttonsStyling: false
    });
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
        text: `Missing gear on Rig: ${presetPedalId}`,
        confirmButtonText: 'Ok',
        customClass: {
          confirmButton: 'bx--btn bx--btn--danger'
        }
      });
    }
  });

  // $(".pedal-catalog").each(function () {
  //   const $pedalDiv = $(this);
  //   const pedalId = $pedalDiv.data("pedal-id");

  //   const defaultPedalFromCatalog = window.catalog.find(p => p._id === pedalId || p.name === pedalId);
  //   if (!defaultPedalFromCatalog) return;

  //   // Step 1: Deep clone the default controls from catalog
  //   const resetPedal = JSON.parse(JSON.stringify(defaultPedalFromCatalog));

  //   // Step 2: Apply preset values on top (if present)
  //   const presetPedal = pedalsFromPreset[pedalId];
  //   if (presetPedal) {
  //     // apply controls
  //     if (presetPedal.controls) {
  //       resetPedal.controls.forEach(row => {
  //         row.row.forEach(ctrl => {
  //           const controlLabel = ctrl.label;
  //           if (presetPedal.controls.hasOwnProperty(controlLabel)) {
  //             ctrl.value = presetPedal.controls[controlLabel];
  //           }
  //         });
  //       });
  //     }
  //     // add row info
  //     resetPedal.row = presetPedal.row || resetPedal.row || 1;
  //   }


  //   // Step 3: Re-render controls
  //   $pedalDiv.find('.row').remove();
  //   renderPedalControls(resetPedal, $pedalDiv);

  //   if (presetPedal) {
  //     const appliedSubplex = presetPedal.subplex || presetPedal;

  //     $pedalDiv.data('applied-subplex', appliedSubplex);
  //     renderAppliedPresetInfo($pedalDiv, appliedSubplex);

  //     // setupSubplexInvalidationOnDBLoad($pedalDiv);
  //     invalidateSubplex($pedalDiv);
  //   }


  //   // Find existing name element (.pedal-name or .head-name)
  //   const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();

  //   let nameClass = 'pedal-name'; // default
  //   let $referenceNode = null;

  //   if ($existingName.length) {
  //     nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
  //     $referenceNode = $existingName.next(); // Save position relative to next sibling
  //     $existingName.remove(); // Remove it before re-adding
  //   }

  //   // Create new name element
  //   const $nameDiv = $("<div>")
  //     .addClass(nameClass)
  //     .html(resetPedal.name)
  //     .attr("style", resetPedal.logo || "");

  //   // Insert it back in the correct place
  //   if ($referenceNode && $referenceNode.length) {
  //     $nameDiv.insertBefore($referenceNode);
  //   } else {
  //     $pedalDiv.prepend($nameDiv); // fallback if no reference point
  //   }

  // });


// Dentro applyPresetToPedalboard, per ogni pedal-catalog
$(".pedal-catalog").each(function () {
  const $pedalDiv = $(this);
  const pedalId = $pedalDiv.data("pedal-id");

  const defaultPedalFromCatalog = window.catalog.find(p => p._id === pedalId || p.name === pedalId);
  if (!defaultPedalFromCatalog) return;

  // Step 1: Deep clone del pedale
  const resetPedal = JSON.parse(JSON.stringify(defaultPedalFromCatalog));

  // Step 2: Applica valori preset
  const presetPedal = pedalsFromPreset[pedalId];
  if (presetPedal) {
    if (presetPedal.controls) {
      resetPedal.controls.forEach(row => {
        row.row.forEach(ctrl => {
          const controlLabel = ctrl.label;
          if (presetPedal.controls.hasOwnProperty(controlLabel)) {
            ctrl.value = presetPedal.controls[controlLabel];
          }
        });
      });
    }
    resetPedal.row = presetPedal.row || resetPedal.row || 1;
  }

  // Step 3: Render dei controlli
  $pedalDiv.find('.row').remove();
  renderPedalControls(resetPedal, $pedalDiv);

  // Step 4: Applica SubPlex e setup invalidazione
  if (presetPedal) {
    const appliedSubplex = presetPedal.subplex || presetPedal;

    // Imposta dati sul div
    $pedalDiv.data('applied-subplex', appliedSubplex);
    $pedalDiv.data('applied-subplex-state', 'original'); // STATO ORIGINALE
    $pedalDiv.data('subplex-hydrating', false);

    // Render info SubPlex (nome, icona ecc.)
    renderAppliedPresetInfo($pedalDiv, appliedSubplex);

    // ✅ Registrazione listener per dirty state
    setupSubplexInvalidationOnDBLoad($pedalDiv); 
  }

  // Step 5: Aggiorna nome pedale
  const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();
  let nameClass = 'pedal-name';
  let $referenceNode = null;
  if ($existingName.length) {
    nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
    $referenceNode = $existingName.next();
    $existingName.remove();
  }
  const $nameDiv = $("<div>").addClass(nameClass).html(resetPedal.name).attr("style", resetPedal.logo || "");
  if ($referenceNode && $referenceNode.length) {
    $nameDiv.insertBefore($referenceNode);
  } else {
    $pedalDiv.prepend($nameDiv);
  }
});



  savePedalboard(); // Save full pedalboard state after applying preset

  // Enable save button after applying preset
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }


}


// Create preset function
async function createPreset() {

  const { value: presetName, isConfirmed, isDenied } = await Swal.fire({
    title: 'Enter new Plex name',
    input: 'text',
    inputLabel: 'Plex Name',
    inputPlaceholder: 'Type your new Plex name here',
    showCancelButton: true,
    confirmButtonText: 'Save',
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary",
    },
    inputValidator: value => !value && 'You must enter a Plex name!'
  });

  if (isDenied) {
    // Redirect alla nuova pagina
    //window.location.href = 'plexes-catalog'; // not existing yet
  }

  if (!presetName) return; // Cancelled

  // -------------------------------
  // 2. Prompt for folder selection
  // -------------------------------
  const folderOptions = [{
      id: '',
      name: 'No Folder'
    },
    ...window.folders.map(f => ({
      id: f.id || f._id,
      name: f.name
    }))
  ];

  const folderHtml = `<select id="selectFolder" class="swal2-select">
    ${folderOptions.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
  </select>`;

  const {
    value: selectedFolderId
  } = await Swal.fire({
    title: 'Select folder for this Plex',
    html: folderHtml,
    showCancelButton: true,
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary"
    },
    preConfirm: () => document.getElementById('selectFolder').value
  });

  if (selectedFolderId === undefined) return; // Cancelled

  // -------------------------------
  // 3. Get currently selected pedalboard
  // -------------------------------
  const pedalboardSelect = document.getElementById('pedalboardSelect');
  const selectedBoardId = pedalboardSelect?.value;
  const selectedBoardName = pedalboardSelect?.selectedOptions[0]?.text;

  if (!selectedBoardId) {
    Swal.fire({
      title: 'Error',
      text: 'No Rig selected',
      icon: 'error',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary'
      },
      buttonsStyling: false
    });
    return;
  }

  // -------------------------------
  // 4. Create preset in Cloudant
  // -------------------------------

  // Validate selectedBoardName
  const sanitizedBoardName = removeForbiddenChars(selectedBoardName);
  if (sanitizedBoardName !== selectedBoardName) {
    Swal.fire({
      title: 'Invalid Rig name',
      text: 'Rig name contained forbidden characters. Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
    return; // Stop execution
  }

  // Validate presetName
  const sanitizedPresetName = removeForbiddenChars(presetName);
  if (sanitizedPresetName !== presetName) {
    Swal.fire({
      title: 'Invalid Plex name',
      text: 'Plex name contained forbidden characters. Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
    return; // Stop execution
  }


  // Prepare body data (user_id is ignored on server, derived from JWT)
  const bodyData = {
    board_name: selectedBoardName,
    board_id: selectedBoardId,
    preset_name: presetName,
    pedals: {}
  };

  let newPresetId;

  try {
    const token = localStorage.getItem('authToken'); // JWT token

    const res = await fetch('https://api.pedalplex.com/CREATE_PRESET.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to create Plex: ' + (data.error || 'Unknown error'),
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary'
        },
        buttonsStyling: false
      });
      return;
    }

    newPresetId = data.id;

  } catch (err) {
    Swal.fire({
      title: 'Error',
      text: 'Network or server error: ' + err.message,
      icon: 'error',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary'
      },
      buttonsStyling: false
    });
    return;
  }


  // -------------------------------
  // 5. Assign newly created preset to selected folder
  // -------------------------------
  if (selectedFolderId) {
    const moveResult = await movePresetToFolder(newPresetId, selectedFolderId || null);
    if (!moveResult || moveResult.ok !== true) {
      console.error('Failed to assign newly created Plex to folder', moveResult);
    }
  }

  // -------------------------------
  // 6. Refresh folder & preset dropdowns
  // -------------------------------
  if (typeof window.populateFolderDropdown === 'function') {
    window.populateFolderDropdown();
  }

  const folderSelect = document.getElementById('folderSelect');
  if (folderSelect) {
    populatePresetDropdownByFolder(folderSelect.value);
  }

  // -------------------------------
  // 7. Success Swal
  // -------------------------------
  Swal.fire({
    title: 'Success',
    text: `Plex "${presetName}" created${selectedFolderId ? ' and added to folder.' : '.'}`,
    icon: 'success',
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    buttonsStyling: false
  }).then(() => {
    window.location.reload();
  });

  // -------------------------------
  // 8. Save pedalboard state
  // -------------------------------
  savePedalboard();
}



// Move preset to single target folder (removes from all others first).
// targetFolderId: string|null  — if null or empty, removes from all folders (unassigned)
async function movePresetToFolder(presetId, targetFolderId) {
  if (!presetId) return {
    ok: false,
    error: 'Missing presetId'
  };

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

      const token = localStorage.getItem('authToken');
      updatePromises.push(
        fetch('https://api.pedalplex.com/UPDATE_FOLDER.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + token
          },
          body: formData.toString()
        }).then(r => r.json()).catch(err => ({
          ok: false,
          error: String(err)
        }))
      );
    }
  }

  let results = [];
  try {
    results = await Promise.all(updatePromises);
  } catch (err) {
    console.error('movePresetToFolder: error updating folders:', err);
    return {
      ok: false,
      error: String(err),
      details: err
    };
  }

  // check results for success
  const failed = results.filter(r => !(r && (r.ok === true || r.id)));
  if (failed.length > 0) {
    console.error('movePresetToFolder: some updates failed', failed, results);
    return {
      ok: false,
      error: 'Some folder updates failed',
      details: failed
    };
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

  return {
    ok: true
  };
}





// Save the full pedalboard state to localStorage
function savePedalboard() {
  if (!window.pedalboard) return;
  try {
    const boardId = window.pedalboard._id || 'unsaved_board';
    // Save pedalboard state keyed by board ID
    localStorage.setItem(`pedalboard_state_${boardId}`, JSON.stringify(window.pedalboard));
  } catch (err) {
    console.error("Failed to save Rig:", err);
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
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://api.pedalplex.com/UPDATE_FOLDER.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + token
      },
      body: formData.toString()
    });
    const result = await res.json();
    if (!result.ok) console.error('Failed to update folder:', result.error);
  } catch (err) {
    console.error('Error updating folder:', err);
  }
}



/**
 * Popola il dropdown dei preset filtrando per cartella
 * e garantendo che siano solo preset della pedaliera corrente.
 * @param {string} folderId - ID della cartella selezionata ('default' per non assegnati)
 * @param {string|null} preferredPresetId - preset da selezionare se valido
 * @param {boolean} isNewFolder - true se la cartella è appena creata
 */
function populatePresetDropdownByFolder(folderId, preferredPresetId = null, isNewFolder = false) {
  const presetSelect = document.getElementById('presetSelect');
  const editBtn = document.getElementById('renamePresetBtn');
  if (!presetSelect || !window.presets || !window.pedalboard) return;

  presetSelect.innerHTML = '';

  // 1️⃣ Filtra solo preset della pedaliera corrente
  const presetsForBoard = window.presets.filter(p => p.board_id === window.pedalboard._id);

  let filteredPresets = [];

  if (folderId === 'default') {
    // Mostra preset non assegnati a nessuna cartella
    const assignedIds = new Set();
    (window.folders || []).forEach(f => {
      if (Array.isArray(f.preset_ids)) f.preset_ids.forEach(id => assignedIds.add(id));
    });
    filteredPresets = presetsForBoard.filter(p => !assignedIds.has(p._id));
  } else {
    // Mostra preset assegnati alla cartella selezionata
    const folder = (window.folders || []).find(f => (f.id || f._id) === folderId);
    if (folder && Array.isArray(folder.preset_ids)) {
      filteredPresets = presetsForBoard.filter(p => folder.preset_ids.includes(p._id));
    }
  }

  // Ordina alfabeticamente
  filteredPresets.sort((a, b) => (a.preset_name || '').toLowerCase().localeCompare((b.preset_name || '').toLowerCase()));

  // Popola dropdown
  filteredPresets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p._id;
    opt.textContent = p.preset_name || 'Untitled Plex';
    presetSelect.appendChild(opt);
  });

  // Gestione pulsante e stato preset corrente
  if (filteredPresets.length === 0 || isNewFolder) {
    // Nessun preset disponibile
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- No Plexes --';
    placeholder.disabled = true;
    placeholder.selected = true;
    presetSelect.innerHTML = '';
    presetSelect.appendChild(placeholder);

    presetSelect.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'none';

    currentPresetId = null;
    currentPresetName = null;
    currentPresetRev = null;
  } else {
    presetSelect.style.display = 'inline-block';
    if (editBtn) editBtn.style.display = 'inline-block';

    // Seleziona preset preferito se valido, altrimenti primo preset della lista
    // let selectedPreset = preferredPresetId
    //   ? filteredPresets.find(p => p._id === preferredPresetId) || filteredPresets[0]
    //   : filteredPresets[0];
    let selectedPreset = null;
    if (preferredPresetId) {
      selectedPreset = filteredPresets.find(p => p._id === preferredPresetId);
      // ⛔ NON fare fallback automatico
      if (!selectedPreset) {
        console.warn('Preferred preset not found in folder:', preferredPresetId);
        return; // esci senza toccare stato o localStorage
      }
    } else {
      selectedPreset = filteredPresets[0];
    }


    currentPresetId = selectedPreset._id;
    currentPresetName = selectedPreset.preset_name;
    currentPresetRev = selectedPreset._rev;
    presetSelect.value = selectedPreset._id;

    // Update save button state based on new selection
    updateSavePresetButtonState();

    // Applica preset SOLO se appartiene alla pedaliera corrente
    if (selectedPreset.board_id === window.pedalboard._id) {
      applyPresetToPedalboard(selectedPreset);
    } else {
      console.warn('Selected Plex does not belong to current Rig:', selectedPreset);
      renderFullPedalboard(window.pedalboard.pedals);
      currentPresetId = null;
      currentPresetName = null;
      currentPresetRev = null;
    }

    // saveCurrentSelectionToStorage(); // test 1
    // if (!preferredPresetId || selectedPreset._id === preferredPresetId) { // test 2
    //   saveCurrentSelectionToStorage();
    // }
    presetSelect.addEventListener('change', saveCurrentSelectionToStorage); // test 3
    folderSelect.addEventListener('change', saveCurrentSelectionToStorage);


  }

  // Abilita/disabilita pulsante Save
  const saveBtn = document.getElementById('savePstBtn');
  if (saveBtn) saveBtn.disabled = filteredPresets.length === 0 || isNewFolder;
}








async function createPresetOnServer(presetData) {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('https://api.pedalplex.com/CREATE_PRESET.php', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(presetData),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) { // check 'ok' from PHP
      console.error("Failed to create Plex:", data);
      return null;
    }

    return data.id; // correct key returned by PHP
  } catch (err) {
    console.error("createPresetOnServer error:", err);
    return null;
  }
}







async function initGuestMode() {
  console.log("Initializing Guest Mode");

  resultsDiv = document.getElementById("page-content");

  // --- Reset global state like initPreset() ---
  window.currentUser = null; 
  window.catalog = [];
  window.catalogMap = {};
  window.presets = [];
  window.presetMap = {};
  window.folders = [];

  // --- Load guest pedalboards from localStorage ---
  const stored = localStorage.getItem("guestPedalboard");
  let boards = [];

  if (stored) {
    try { boards = JSON.parse(stored); }
    catch { boards = []; }
  }

  if (!Array.isArray(boards)) boards = [];

  // If no guest boards → create a default one
  if (boards.length === 0) {
    boards = [
      {
        _id: "guest_board_1",
        board_name: "Guest Rig",
        pedals: []
      }
    ];
    localStorage.setItem("guestPedalboard", JSON.stringify(boards));
  } 

  window.allPedalboards = boards;

  // -----------------------------
  // POPULATE PEDALBOARD SELECT UI
  // -----------------------------
  const dropdown = document.getElementById("pedalboardSelect");
  if (dropdown) {
    dropdown.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Guest Pedalboard --";
    placeholder.disabled = true;
    dropdown.appendChild(placeholder);

    boards.forEach(pb => {
      const opt = document.createElement("option");
      opt.value = pb._id;
      opt.textContent = pb.board_name;
      dropdown.appendChild(opt);
    });
  }

  // -----------------------------
  // RESTORE LAST USED BOARD
  // -----------------------------
  let restored = false;
  const savedId = localStorage.getItem("lastPedalboardId");

  if (savedId) {
    const match = boards.find(b => b._id === savedId);
    if (match) {
      window.pedalboard = match;
      if (dropdown) dropdown.value = savedId;
      restored = true;
    }
  }

  if (!restored) {
    window.pedalboard = boards[0];
    if (dropdown) dropdown.value = boards[0]._id;
    localStorage.setItem("lastPedalboardId", boards[0]._id);
    localStorage.setItem("lastPedalboardText", boards[0].board_name);
  }

  // -----------------------------
  // DISABLE ALL DB-SPECIFIC UI
  // -----------------------------
  [
    "presetSelect", "folderSelect",
    "renamePresetBtn", "savePstBtn", "savePstBtnMobile",
    "createPstBtn", "createPstBtnMobile", "addFolderBtn"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = true;
      el.classList.add("btn-disabled");
    }
  });

  // -----------------------------
  // RENDER BOARD IMMEDIATELY
  // -----------------------------
  renderFullPedalboard(window.pedalboard.pedals);

  // -----------------------------
  // INIT EMPTY PRESETS/FOLDERS
  // -----------------------------
  window.presets = [];
  window.presetMap = {};
  window.folders = [];
  populatePresetDropdownByFolder("default");

  // -----------------------------
  // GET PEDAL IDS & FETCH FROM SERVER
  // -----------------------------
  const pedalIds = window.pedalboard.pedals.map(p => p.pedal_id);

  if (pedalIds.length > 0) {
    console.log("Fetching gears via GET_PEDALS_BY_IDS (guest):", pedalIds);

    const response = await fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: pedalIds })
    });

    const data = await response.json();

    window.allPedals = data;

  }

  // -----------------------------
  // CHANGE BOARD LISTENER
  // -----------------------------
  if (dropdown) {
    dropdown.addEventListener("change", e => {
      const id = e.target.value;
      const board = boards.find(b => b._id === id);
      if (!board) return;

      window.pedalboard = board;

      localStorage.setItem("lastPedalboardId", id);
      localStorage.setItem("lastPedalboardText", board.board_name);

      renderFullPedalboard(board.pedals);
    });
  }

}






// --- Global function accessible everywhere ---
  function removeForbiddenChars(str) {
    const forbiddenRegex = /[$%*\\|()\[\]{}^£;<>]/g;
    str = str.replace(/[\p{So}\p{Cn}]/gu, ''); // remove emojis
    str = str.replace(forbiddenRegex, '');      // remove explicit forbidden chars
    str = str.replace(/\s+/g, ' ').trim();     // collapse spaces & trim
    return str;
  }







// Assicurati che il DOM sia pronto
document.addEventListener("DOMContentLoaded", () => {
  const leds = document.querySelectorAll(".pedal-catalog .led");

  leds.forEach(led => {
    const pedal = led.closest(".pedal-catalog");
    const pedalName = pedal.dataset.pedalName || "Pedale sconosciuto";
    const controlLabel = led.dataset.controlLabel || "LED";

    // Funzione per loggare il colore
    const logColor = () => {
      const style = getComputedStyle(led);
      const bgColor = style.backgroundColor;
      const boxShadow = style.boxShadow;
      console.log(`🎛️ ${pedalName} → ${controlLabel}: bg=${bgColor}, shadow=${boxShadow}`);
    };

    // Log immediato per debug
    logColor();

    // Log quando clicchi il LED
    led.addEventListener("click", logColor);

    // Observer per catturare cambiamenti di style
    const observer = new MutationObserver(logColor);
    observer.observe(led, { attributes: true, attributeFilter: ["style"] });
  });
});
// folder.js (replace your existing file with this)

// ---------------------------
// folder.js (robust)
// ---------------------------

// Store folders locally (synchronised with window.folders)
let folders = []; // kept for backwards compatibility but use window.folders as source-of-truth
window.folders = window.folders || [];

// ---------------------------
// Update folder on server helper
// ---------------------------
async function updateFolderOnServer(folder) {
  try {
    const folderId = folder.id || folder._id;
    if (!folderId) throw new Error('Missing folder id for updateFolderOnServer');

    const formData = new URLSearchParams();
    formData.append('folder_id', folderId);
    // ensure it's a JSON string
    formData.append('preset_ids', JSON.stringify(folder.preset_ids || []));

    const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('[folders] updateFolderOnServer error:', err);
    return { ok: false, error: err.message || String(err) };
  }
}

// Expose to global so preset.js can call it
window.updateFolderOnServer = updateFolderOnServer;

// ---------------------------
// Populate main page #folderSelect dropdown
// ---------------------------
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  if (!folderSelect) return;

  folderSelect.innerHTML = '';

  // Always add a synthetic "Default" entry at the top
  const defaultOption = document.createElement("option");
  defaultOption.value = "default";
  defaultOption.textContent = "Default (unassigned)";
  folderSelect.appendChild(defaultOption);

  // Add folders from server
  (window.folders || []).forEach(f => {
    if (!f) return;
    const opt = document.createElement('option');
    opt.value = f.id || f._id;
    opt.textContent = f.name || '(Untitled folder)';
    folderSelect.appendChild(opt);
  });

  // Placeholder option at the end (optional, you can remove if confusing)
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select Folder --';
  placeholder.disabled = true;
  folderSelect.appendChild(placeholder);

  // ✅ Auto-apply first preset when folder changes
  folderSelect.onchange = (e) => {
    const folderId = e.target.value;
    populatePresetDropdownByFolder(folderId);

    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect && presetSelect.options.length > 0) {
      // take first preset
      const firstPresetId = presetSelect.options[0].value;
      const firstPreset = window.presetMap[firstPresetId];
      if (firstPreset && window.currentPresetId !== firstPreset._id) {
        applyPresetToPedalboard(firstPreset);
        saveCurrentSelectionToStorage();
      }
    }
  };
}


// ---------------------------
// Save folder to DB
// ---------------------------
async function saveFolderToDB(folder, explicitBoardId) {
  try {
    const boardId = explicitBoardId || (window.pedalboard && window.pedalboard._id);
    if (!boardId) {
      Swal.fire('Error', 'No pedalboard selected. Please select one before creating a folder.', 'error');
      return null;
    }

    const res = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `user_id=${encodeURIComponent(window.currentUser.userid)}&board_id=${encodeURIComponent(boardId)}&name=${encodeURIComponent(folder.name)}`
    });

    const result = await res.json();
    if (result.ok) return result;

    Swal.fire('Error', 'Could not save folder: ' + (result.error || 'Unknown error'), 'error');
    return null;
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Network or server error', 'error');
    return null;
  }
}

// ---------------------------
// Add Folder
// ---------------------------
function attachAddFolderListener() {
  const addFolderBtn = document.getElementById('addFolderBtn');
  if (!addFolderBtn) return;

  addFolderBtn.addEventListener('click', async () => {
    const board = window.pedalboard;
    if (!board || !board._id) {
      Swal.fire('Select Board', 'Please select a pedalboard before creating a folder.', 'info');
      return;
    }

    const boardName = board.board_name || 'Unnamed Pedalboard';
    const { value: folderName, isConfirmed } = await Swal.fire({
      title: `New Folder for "${boardName}"`,
      input: 'text',
      inputLabel: 'Folder Name',
      confirmButtonText: "Create",
      inputPlaceholder: 'Enter folder name',
      showCancelButton: true,
      buttonsStyling: false,
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
        cancelButton: "bx--btn bx--btn--secondary"
      },
      inputValidator: (v) => !v.trim() && 'Folder name cannot be empty'
    });

    if (isConfirmed && folderName && folderName.trim()) {
      const newFolder = {
        name: folderName.trim(),
        preset_ids: []
      };

      const saved = await saveFolderToDB(newFolder, board._id);
      if (saved) {
        // cloudant response may contain id/_id — normalize
        const normalized = {
          id: saved.id || saved._id || saved.id,
          _id: saved.id || saved._id,
          name: newFolder.name,
          preset_ids: []
        };
        window.folders = window.folders || [];
        window.folders.push(normalized);
        populateFolderDropdown();
        const folderSelect = document.getElementById('folderSelect');
        if (folderSelect) folderSelect.value = normalized.id || normalized._id;

        Swal.fire({
          title: 'Success',
          text: `Folder "${newFolder.name}" created for "${boardName}"`,
          icon: 'success',
          customClass: {
            confirmButton: 'bx--btn bx--btn--primary', // Carbon primary button
          },
          buttonsStyling: false,
        });
      }
    }
  });
}

// ---------------------------
// Rename Folder
// ---------------------------
function attachRenameFolderListener() {
  const renameFolderBtn = document.getElementById('renameFolderBtn');
  if (!renameFolderBtn) return;

  renameFolderBtn.addEventListener('click', async () => {
    const folderSelect = document.getElementById('folderSelect');
    if (!folderSelect || !folderSelect.value) {
      Swal.fire('Select Folder', 'Please select a folder to rename.', 'info');
      return;
    }

    const folderId = folderSelect.value;
    const folder = (window.folders || []).find(f => (f._id || f.id) === folderId);
    if (!folder) {
      Swal.fire({
        title: 'Error',
        text: 'Selected folder not found.',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary', // Carbon primary button
        },
        buttonsStyling: false,
      });
      return;
    }

    const boardName = window.pedalboard?.board_name || 'Unnamed Pedalboard';
    const { value: newName, isConfirmed, isDenied } = await Swal.fire({
      title: `Edit folder for "${boardName}"`,
      input: 'text',
      inputLabel: 'New folder name',
      confirmButtonText: "Rename",
      denyButtonText: "Delete",
      inputValue: folder.name,
      showCancelButton: true,
      showDenyButton: true,
      inputValidator: v => !v.trim() && 'Folder name cannot be empty',
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary',
        denyButton: 'bx--btn bx--btn--danger',
      },
      buttonsStyling: false,
    });


    if (!isConfirmed) return;

    try {
      const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `folder_id=${encodeURIComponent(folderId)}&name=${encodeURIComponent(newName.trim())}`
      });
      const result = await res.json();

      if (result.ok) {
        folder.name = newName.trim();
        populateFolderDropdown();
        folderSelect.value = folderId;
        Swal.fire('Success', `Folder renamed to "${newName}"`, 'success');
      } else {
        Swal.fire('Error', 'Could not rename folder: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Network or server error', 'error');
    }
  });
}

// ---------------------------
// Fetch folders for the current pedalboard
// Returns window.folders (promise resolves when done)
// ---------------------------
async function loadFoldersForCurrentPedalboard(forSwal = false) {

  if (!window.currentUser || !window.pedalboard || !window.pedalboard._id) {
    console.warn('[folders] Missing currentUser or pedalboard/_id — aborting loadFoldersForCurrentPedalboard');
    window.folders = [];
    if (!forSwal) populateFolderDropdown();
    return window.folders;
  }

  let loader, folderSelect;
  if (!forSwal) {
    loader = document.getElementById('folderSelectLoader');
    folderSelect = document.getElementById('folderSelect');
    if (loader) loader.style.display = 'flex';
    if (folderSelect) folderSelect.style.display = 'none';
  }

  try {
    const payload = {
      user_id: window.currentUser.userid,
      board_id: window.pedalboard._id
    };

    const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_FOLDERS.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.error('[folders] Failed to parse JSON from GET_FOLDERS:', parseErr);
      data = null;
    }

    // Normalize into window.folders array
    if (!data) { window.folders = [];
    } else if (Array.isArray(data.folders)) { window.folders = data.folders;
    } else if (Array.isArray(data.docs)) { window.folders = data.docs;
    } else if (Array.isArray(data)) { window.folders = data;
    } else if (data.error) {
      console.error('[folders] Server returned error:', data.error);
      window.folders = [];
    } else {
      const possible = data.folders || data.docs || Object.values(data).find(v => Array.isArray(v));
      window.folders = Array.isArray(possible) ? possible : [];
    }

    // Ensure each folder has proper id, name, and preset_ids
    window.folders = window.folders.map((f, idx) => {
      if (typeof f === 'string') return { id: `folder_${idx}`, name: f, preset_ids: [] };
      return {
        id: f._id || f.id || f['_id'] || `folder_${idx}`,  // fallback ID
        _id: f._id || f.id || f['_id'] || `folder_${idx}`,
        name: f.name || f.folder_name || f.title || `(Folder ${idx + 1})`,
        preset_ids: Array.isArray(f.preset_ids) ? f.preset_ids : (Array.isArray(f.presets) ? f.presets : [])
      };
    });

    // Update main page dropdown only if not for Swal
    if (!forSwal) populateFolderDropdown();

    return window.folders;
  } catch (err) {
    console.error('[folders] Error fetching folders:', err);
    window.folders = [];
    if (!forSwal) populateFolderDropdown();
    return window.folders;
  } finally {
    if (!forSwal) {
      if (loader) loader.style.display = 'none';
      if (folderSelect) folderSelect.style.display = 'inline-block';
    }
  }
}

// Expose globally (keep your existing API)
window.attachAddFolderListener = attachAddFolderListener;
window.attachRenameFolderListener = attachRenameFolderListener;
window.loadFoldersForCurrentPedalboard = loadFoldersForCurrentPedalboard;
window.populateFolderDropdown = populateFolderDropdown;

// ---------------------------
// folder.js (robust, unified sanitization)
// ---------------------------

// Store folders locally (synchronized with window.folders)
let folders = [];
window.folders = window.folders || [];

// ---------------------------
// Global sanitization function
// ---------------------------
function sanitizeFolderName(str) {
  if (!str) return '';

  // Permessi: A-Z, a-z, 0-9, -, _
  // Rimuove tutto ciò che NON è permesso
  str = str.replace(/[^A-Za-z0-9\-_]/g, '');

  return str.trim();
}


// ---------------------------
// Update folder on server helper
// ---------------------------
async function updateFolderOnServer(folder) {
  try {
    const folderId = folder.id || folder._id;
    if (!folderId) throw new Error('Missing folder id for updateFolderOnServer');

    const sanitizedName = folder.name ? sanitizeFolderName(folder.name) : '';

    if (folder.name && sanitizedName !== folder.name) {
      Swal.fire({
        title: 'Invalid characters',
        text: 'Folder name contained forbidden special characters. Allowed: letters, numbers, spaces, and safe punctuation (-, _).',
        icon: 'error',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false,
      });
      return { ok: false, error: 'Folder name contains forbidden characters' };
    }

    const formData = new URLSearchParams();
    formData.append('folder_id', folderId);
    if (sanitizedName) formData.append('name', sanitizedName);
    formData.append('preset_ids', JSON.stringify(folder.preset_ids || []));

    const token = localStorage.getItem('authToken');
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + token
      },
      body: formData.toString()
    });

    return await res.json();
  } catch (err) {
    console.error('[folders] updateFolderOnServer error:', err);
    return { ok: false, error: err.message || String(err) };
  }
}
window.updateFolderOnServer = updateFolderOnServer;

// ---------------------------
// Populate main page #folderSelect dropdown
// ---------------------------
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  if (!folderSelect) return;
  folderSelect.innerHTML = '';

  // Default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "default";
  defaultOption.textContent = "Default (unassigned)";
  folderSelect.appendChild(defaultOption);

  const sortedFolders = (window.folders || []).slice().sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  if (sortedFolders.length === 0) {
    const noFoldersOption = document.createElement("option");
    noFoldersOption.value = "";
    noFoldersOption.textContent = "-- No folders --";
    noFoldersOption.disabled = true;
    folderSelect.appendChild(noFoldersOption);
    folderSelect.value = "default";
  } else {
    sortedFolders.forEach(f => {
      if (!f) return;
      const opt = document.createElement('option');
      opt.value = f.id || f._id;
      opt.textContent = decodeHTMLEntities(f.name || '(Untitled folder)');
      folderSelect.appendChild(opt);
    });
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select Folder --';
    placeholder.disabled = true;
    folderSelect.appendChild(placeholder);
  }

  folderSelect.onchange = (e) => {
    const folderId = e.target.value;
    populatePresetDropdownByFolder(folderId);

    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect && presetSelect.options.length > 0) {
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
  const folderInput = document.querySelector('#folderNameInput');
  const sanitizedName = sanitizeFolderName(folder.name);

  if (sanitizedName !== folder.name) {
    if (folderInput) folderInput.style.border = '2px solid red';
    Swal.fire({
      title: 'Invalid characters',
      text: 'Folder name contained forbidden special characters. Allowed: letters, numbers, spaces, and safe punctuation (-, _).',
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false,
    });
    return null;
  } else {
    if (folderInput) folderInput.style.border = '';
  }

  try {
    const boardId = explicitBoardId || (window.pedalboard && window.pedalboard._id);
    if (!boardId) {
      Swal.fire({ title: 'Error', text: 'No pedalboard selected.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      return null;
    }

    const token = localStorage.getItem('authToken');
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        user_id: window.currentUser.userid,
        board_id: boardId,
        name: folder.name
      })
    });

    const result = await res.json();
    if (result.ok) return result;

    Swal.fire({
      title: 'Error',
      text: 'Could not save folder: ' + (result.error || 'Unknown error'),
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false,
    });
    return null;
  } catch (err) {
    console.error(err);
    Swal.fire({ title: 'Error', text: 'Network or server error', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
    return null;
  }
}

// ---------------------------
// Add Folder Listener
// ---------------------------
function attachAddFolderListener() {
  const addFolderBtn = document.getElementById('addFolderBtn');
  if (!addFolderBtn) return;

  addFolderBtn.addEventListener('click', async () => {
    const pedalboardSelect = document.getElementById('pedalboardSelect');
    if (!pedalboardSelect?.value) {
      Swal.fire({ title: 'Select Board', text: 'Please select a pedalboard.', icon: 'info', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      return;
    }

    const selectedBoardId = pedalboardSelect.value;
    const board = window.allPedalboards.find(b => b._id === selectedBoardId || b.id === selectedBoardId);
    if (!board) return Swal.fire({ title: 'Error', text: 'Board not found', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });

    const boardName = board.board_name || 'Unnamed Pedalboard';
    const { value: folderName, isConfirmed } = await Swal.fire({
      title: `New Folder for "${boardName}"`,
      input: 'text',
      inputLabel: 'Folder Name',
      confirmButtonText: "Create",
      inputPlaceholder: 'Enter folder name',
      showCancelButton: true,
      buttonsStyling: false,
      customClass: { confirmButton: "bx--btn bx--btn--primary", cancelButton: "bx--btn bx--btn--secondary" },
      inputValidator: v => !v.trim() && 'Folder name cannot be empty'
    });

    if (isConfirmed && folderName?.trim()) {
      const newFolder = { name: folderName.trim(), preset_ids: [] };
      const saved = await saveFolderToDB(newFolder, board._id);
      if (saved) {
        await loadFoldersForCurrentPedalboard();
        const folderSelect = document.getElementById('folderSelect');
        if (folderSelect) {
          folderSelect.value = saved.id || saved._id;
          populatePresetDropdownByFolder(folderSelect.value, null, true);
        }
        Swal.fire({ title: 'Success', text: `Folder "${newFolder.name}" created.`, icon: 'success', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      }
    }
  });
}

// ---------------------------
// Rename/Delete Folder Listener
// ---------------------------
function attachRenameFolderListener() {
  const renameFolderBtn = document.getElementById('renameFolderBtn');
  if (!renameFolderBtn) return;

  renameFolderBtn.addEventListener('click', async () => {
    const folderSelect = document.getElementById('folderSelect');
    if (!folderSelect?.value) return Swal.fire({ title: 'Select Folder', text: 'Select a folder.', icon: 'info', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });

    const folderId = folderSelect.value;
    const folder = (window.folders || []).find(f => (f._id || f.id) === folderId);
    if (!folder) return Swal.fire({ title: 'Error', text: 'Folder not found.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });

    const boardName = decodeHTMLEntities(window.pedalboard?.board_name || 'Unnamed Folder');
    const { value: newName, isConfirmed, isDenied } = await Swal.fire({
      title: `Edit folder for "${boardName}"`,
      input: 'text',
      inputLabel: 'New folder name',
      confirmButtonText: "Rename",
      denyButtonText: "Delete",
      inputValue: decodeHTMLEntities(folder.name),
      showCancelButton: true,
      showDenyButton: true,
      inputValidator: v => !v.trim() && 'Folder name cannot be empty',
      customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary', denyButton: 'bx--btn bx--btn--danger' },
      buttonsStyling: false,
    });

    // ---- DELETE ----
    if (isDenied) {
      const confirmDelete = await Swal.fire({
        title: 'Are you sure?',
        text: `Permanently delete "${folder.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        customClass: { confirmButton: 'bx--btn bx--btn--danger', cancelButton: 'bx--btn bx--btn--secondary' },
        buttonsStyling: false,
      });
      if (!confirmDelete.isConfirmed) return;

      Swal.fire({ title: 'Deleting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const formData = new URLSearchParams();
        formData.append('folder_id', folderId);
        formData.append('folder_rev', folder._rev || '');
        const token = localStorage.getItem("authToken");
        if (!token) return Swal.fire({ icon: "error", title: "Authentication error", text: "You must be logged in." });

        const res = await fetch('https://www.cineteatrosanluigi.it/plex/DELETE_FOLDER.php', {
          method: 'POST',
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer " + token },
          body: formData.toString()
        });
        const result = await res.json();
        if (result.success) {
          window.folders = (window.folders || []).filter(f => (f._id || f.id) !== folderId);
          populateFolderDropdown();
          Swal.fire({ title: 'Deleted!', text: `"${folder.name}" removed.`, icon: 'success', timer: 1000, showConfirmButton: false });
        } else Swal.fire({ title: 'Error', text: result.error || 'Could not delete folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      } catch (err) {
        console.error('[folders] delete error:', err);
        Swal.fire({ title: 'Error', text: 'Network/server error deleting folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      }
      return;
    }

    // ---- RENAME ----
    if (isConfirmed) {
      const sanitizedName = sanitizeFolderName(newName.trim());
      if (sanitizedName !== newName.trim()) return Swal.fire({
        title: 'Invalid characters',
        html: 'Folder name contains forbidden special characters.',
        icon: 'error',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });

      Swal.fire({ title: 'Renaming...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + token },
          body: `folder_id=${encodeURIComponent(folderId)}&name=${encodeURIComponent(sanitizedName)}`
        });
        const result = await res.json();
        if (result.ok) {
          await loadFoldersForCurrentPedalboard();
          const folderSelect = document.getElementById('folderSelect');
          if (folderSelect) folderSelect.value = folderId;
          Swal.fire({ title: 'Success', text: `Folder renamed to "${decodeHTMLEntities(sanitizedName)}"`, icon: 'success', timer: 1000, showConfirmButton: false });
        } else Swal.fire({ title: 'Error', text: result.error || 'Could not rename folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      } catch (err) {
        console.error('[folders] rename error:', err);
        Swal.fire({ title: 'Error', text: 'Network/server error while renaming.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      }
    }
  });
}

// ---------------------------
// Load folders for current pedalboard
// ---------------------------
async function loadFoldersForCurrentPedalboard(forSwal = false) {
  const boardId = document.getElementById('pedalboardSelect')?.value;
  if (!window.currentUser || !boardId) {
    console.warn('[folders] Missing currentUser or selected pedalboard — aborting loadFoldersForCurrentPedalboard');
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
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_FOLDERS.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: window.currentUser.userid, board_id: boardId })
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!data) window.folders = [];
    else if (Array.isArray(data.folders)) window.folders = data.folders;
    else if (Array.isArray(data.docs)) window.folders = data.docs;
    else if (Array.isArray(data)) window.folders = data;
    else {
      const possible = data.folders || data.docs || Object.values(data).find(v => Array.isArray(v));
      window.folders = Array.isArray(possible) ? possible : [];
    }

    window.folders = window.folders.map((f, idx) => ({
      id: f._id || f.id || f['_id'] || `folder_${idx}`,
      _id: f._id || f.id || f['_id'] || `folder_${idx}`,
      _rev: f._rev || f.rev || null,
      name: f.name || f.folder_name || f.title || `(Folder ${idx + 1})`,
      preset_ids: Array.isArray(f.preset_ids) ? f.preset_ids : (Array.isArray(f.presets) ? f.presets : [])
    }));

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

// ---------------------------
// Expose globally
// ---------------------------
window.attachAddFolderListener = attachAddFolderListener;
window.attachRenameFolderListener = attachRenameFolderListener;
window.loadFoldersForCurrentPedalboard = loadFoldersForCurrentPedalboard;
window.populateFolderDropdown = populateFolderDropdown;
window.sanitizeFolderName = sanitizeFolderName;

// ----------------------------
// folder.js (robust, unified sanitization & Carbon styling)
// ----------------------------

// Store folders locally (synchronized with window.folders)
let folders = [];
window.folders = window.folders || [];

// ---------------------------
// Global sanitization function
// ---------------------------
function sanitizeFolderName(str) {
  if (!str) return '';

  // Permessi: A-Z, a-z, 0-9, -, _, spazio
  // Rimuove tutto ciò che NON è permesso
  str = str.replace(/[^A-Za-z0-9\-_ ]/g, '');

  // Rimuove eventuali spazi multipli consecutivi e trim
  str = str.replace(/\s+/g, ' ').trim();

  return str; 
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
    const res = await fetch('https://api.pedalplex.com/UPDATE_FOLDER.php', {
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
      opt.textContent = typeof decodeHTMLEntities === 'function' ? decodeHTMLEntities(f.name || '(Untitled folder)') : (f.name || '(Untitled folder)');
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
    if (typeof populatePresetDropdownByFolder === 'function') {
      populatePresetDropdownByFolder(folderId);
    }

    const presetSelect = document.getElementById('presetSelect');
    if (presetSelect && presetSelect.options.length > 0) {
      const firstPresetId = presetSelect.options[0].value;
      const firstPreset = window.presetMap?.[firstPresetId];
      if (firstPreset && window.currentPresetId !== firstPreset._id) {
        if (typeof applyPresetToPedalboard === 'function') applyPresetToPedalboard(firstPreset);
        if (typeof saveCurrentSelectionToStorage === 'function') saveCurrentSelectionToStorage();
      }
    }
  };
}

// ---------------------------
// Save folder to DB
// ---------------------------
async function saveFolderToDB(folder, explicitBoardId) {
  const sanitizedName = sanitizeFolderName(folder.name);

  if (sanitizedName !== folder.name) {
    Swal.fire({
      title: 'Invalid characters',
      text: 'Folder name contained forbidden special characters. Allowed: letters, numbers, spaces, and safe punctuation (-, _).',
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false,
    });
    return null;
  }

  try {
    const boardId = explicitBoardId || (window.pedalboard && (window.pedalboard._id || window.pedalboard.id)) || document.getElementById('pedalboardSelect')?.value;
    if (!boardId) {
      Swal.fire({
        title: 'Error',
        text: 'No Rig selected.',
        icon: 'error',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
      return null;
    }

    const token = localStorage.getItem('authToken');
    if (!token || !window.currentUser) {
      Swal.fire({
        title: 'Login required',
        text: 'You must be logged in to create folders.',
        icon: 'info',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
      return null;
    }

    const res = await fetch('https://api.pedalplex.com/CREATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        user_id: window.currentUser.userid,
        board_id: boardId,
        name: sanitizedName
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
    Swal.fire({
      title: 'Error',
      text: 'Network or server error',
      icon: 'error',
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
    return null;
  }
}

// ---------------------------
// Open Add Folder Modal
// ---------------------------
async function openAddFolderModal() {
  if (!window.currentUser || window.currentUser.role === 'guest') {
    return Swal.fire({
      title: 'Login required',
      text: 'Please log in to create and manage folders.',
      icon: 'info',
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }

  const pedalboardSelect = document.getElementById('pedalboardSelect');
  const selectedBoardId = pedalboardSelect?.value || window.pedalboard?._id || window.pedalboard?.id;
  if (!selectedBoardId) {
    return Swal.fire({
      title: 'Select Rig',
      text: 'Please select a Rig first.',
      icon: 'info',
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }

  const board = (window.allPedalboards || []).find(b => b._id === selectedBoardId || b.id === selectedBoardId) || window.pedalboard;
  const boardName = (typeof decodeHTMLEntities === 'function' ? decodeHTMLEntities(board?.board_name || '') : board?.board_name) || 'Current Rig';

  const { value: folderName, isConfirmed } = await Swal.fire({
    title: `New Folder for Rig "${boardName}"`,
    input: 'text',
    inputLabel: 'Folder Name',
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Create Folder",
    cancelButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M20,10H7.8149l3.5874-3.5859L10,5,4,11,10,17l1.4023-1.4146L7.8179,12H20a6,6,0,0,1,0,12H12v2h8a8,8,0,0,0,0-16Z'></path></svg>Cancel",
    inputPlaceholder: 'Enter folder name',
    showCancelButton: true,
    showCloseButton: true,
    buttonsStyling: false,
    customClass: { confirmButton: "bx--btn bx--btn--primary", cancelButton: "bx--btn bx--btn--secondary" },
    inputValidator: v => !v.trim() && 'Folder name cannot be empty'
  });

  if (isConfirmed && folderName?.trim()) {
    const newFolder = { name: folderName.trim(), preset_ids: [] };
    const saved = await saveFolderToDB(newFolder, selectedBoardId);
    if (saved) {
      await loadFoldersForCurrentPedalboard();
      const folderSelect = document.getElementById('folderSelect');
      if (folderSelect) {
        folderSelect.value = saved.id || saved._id;
        if (typeof populatePresetDropdownByFolder === 'function') {
          populatePresetDropdownByFolder(folderSelect.value, null, true);
        }
      }
      Swal.fire({
        title: 'Success',
        text: `Folder "${newFolder.name}" created.`,
        icon: 'success',
        confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
    }
  }
}

// ---------------------------
// Open Edit/Delete Folder Modal
// ---------------------------
async function openRenameFolderModal() {
  if (!window.currentUser || window.currentUser.role === 'guest') {
    return Swal.fire({
      title: 'Login required',
      text: 'Please log in to edit folders.',
      icon: 'info',
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }

  const folderSelect = document.getElementById('folderSelect');
  const folderId = folderSelect?.value;

  if (!folderId || folderId === 'default') {
    return Swal.fire({
      title: 'Select Folder',
      text: 'Please select a custom folder to edit or delete (the default unassigned view cannot be edited).',
      icon: 'info',
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }

  const folder = (window.folders || []).find(f => (f._id || f.id) === folderId);
  if (!folder) {
    return Swal.fire({
      title: 'Error',
      text: 'Folder not found.',
      icon: 'error',
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Ok",
      customClass: { confirmButton: 'bx--btn bx--btn--primary' },
      buttonsStyling: false
    });
  }

  const currentFolderName = typeof decodeHTMLEntities === 'function' ? decodeHTMLEntities(folder.name || '') : (folder.name || '');

  const { value: newName, isConfirmed, isDenied } = await Swal.fire({
    title: `Edit Folder "${currentFolderName}"`,
    input: 'text',
    inputLabel: 'New folder name',
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M2 26H30V28H2z'></path><path d='M25.4,9c0.8-0.8,0.8-2,0-2.8c0,0,0,0,0,0l-3.6-3.6c-0.8-0.8-2-0.8-2.8,0c0,0,0,0,0,0l-15,15V24h6.4L25.4,9z M20.4,4L24,7.6 l-3,3L17.4,7L20.4,4z M6,22v-3.6l10-10l3.6,3.6l-10,10H6z'></path></svg>Rename Folder",
    denyButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M12 12H14V24H12z'></path><path d='M18 12H20V24H18z'></path><path d='M4,6V8H6V28a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V8h2V6ZM8,28V8H24V28Z'></path><path d='M12 2H20V4H12z'></path></svg>Delete Folder",
    inputValue: currentFolderName,
    showCancelButton: false,
    showCloseButton: true,
    showDenyButton: true,
    inputValidator: v => !v.trim() && 'Folder name cannot be empty',
    customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary', denyButton: 'bx--btn bx--btn--danger' },
    buttonsStyling: false,
  });

  // ---- DELETE ----
  if (isDenied) {
    const confirmDelete = await Swal.fire({
      title: 'Are you sure?',
      text: `Permanently delete folder "${currentFolderName}"? Presets inside will not be deleted and will return to unassigned.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M12 12H14V24H12z'></path><path d='M18 12H20V24H18z'></path><path d='M4,6V8H6V28a2,2,0,0,0,2,2H24a2,2,0,0,0,2-2V8h2V6ZM8,28V8H24V28Z'></path><path d='M12 2H20V4H12z'></path></svg>Yes, Delete Folder",
      cancelButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M20,10H7.8149l3.5874-3.5859L10,5,4,11,10,17l1.4023-1.4146L7.8179,12H20a6,6,0,0,1,0,12H12v2h8a8,8,0,0,0,0-16Z'></path></svg>No, Cancel",
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
      if (!token) return Swal.fire({ icon: "error", title: "Authentication error", text: "You must be logged in.", customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });

      const res = await fetch('https://api.pedalplex.com/DELETE_FOLDER.php', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Bearer " + token },
        body: formData.toString()
      });
      const result = await res.json();
      if (result.success) {
        window.folders = (window.folders || []).filter(f => (f._id || f.id) !== folderId);
        populateFolderDropdown();
        if (folderSelect) folderSelect.value = 'default';
        if (typeof populatePresetDropdownByFolder === 'function') {
          populatePresetDropdownByFolder('default');
        }
        Swal.fire({ title: 'Deleted!', text: `"${currentFolderName}" removed.`, icon: 'success', timer: 1000, showConfirmButton: false });
      } else {
        Swal.fire({ title: 'Error', text: result.error || 'Could not delete folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      }
    } catch (err) {
      console.error('[folders] delete error:', err);
      Swal.fire({ title: 'Error', text: 'Network/server error deleting folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
    }
    return;
  }

  // ---- RENAME ----
  if (isConfirmed) {
    const sanitizedName = sanitizeFolderName(newName.trim());
    if (sanitizedName !== newName.trim()) {
      return Swal.fire({
        title: 'Invalid characters',
        text: 'Folder name contains forbidden special characters.',
        icon: 'error',
        customClass: { confirmButton: 'bx--btn bx--btn--primary' },
        buttonsStyling: false
      });
    }

    Swal.fire({ title: 'Renaming...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('https://api.pedalplex.com/UPDATE_FOLDER.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + token },
        body: `folder_id=${encodeURIComponent(folderId)}&name=${encodeURIComponent(sanitizedName)}`
      });
      const result = await res.json();
      if (result.ok) {
        await loadFoldersForCurrentPedalboard();
        if (folderSelect) folderSelect.value = folderId;
        if (typeof populatePresetDropdownByFolder === 'function') {
          populatePresetDropdownByFolder(folderId);
        }
        Swal.fire({
          title: 'Success',
          text: `Folder renamed to "${typeof decodeHTMLEntities === 'function' ? decodeHTMLEntities(sanitizedName) : sanitizedName}"`,
          icon: 'success',
          timer: 1000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({ title: 'Error', text: result.error || 'Could not rename folder.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
      }
    } catch (err) {
      console.error('[folders] rename error:', err);
      Swal.fire({ title: 'Error', text: 'Network/server error while renaming.', icon: 'error', customClass: { confirmButton: 'bx--btn bx--btn--primary' }, buttonsStyling: false });
    }
  }
}

// ---------------------------
// Add Folder Listener
// ---------------------------
function attachAddFolderListener() {
  const addFolderBtn = document.getElementById('addFolderBtn');
  if (!addFolderBtn) return;
  // Remove previous listener to avoid stacking
  addFolderBtn.onclick = openAddFolderModal;
}

// ---------------------------
// Rename/Delete Folder Listener
// ---------------------------
function attachRenameFolderListener() {
  const renameFolderBtn = document.getElementById('renameFolderBtn');
  if (!renameFolderBtn) return;
  // Remove previous listener to avoid stacking
  renameFolderBtn.onclick = openRenameFolderModal;
}

// ---------------------------
// Load folders for current pedalboard
// ---------------------------
async function loadFoldersForCurrentPedalboard(forSwal = false) {
  const boardId = document.getElementById('pedalboardSelect')?.value || window.pedalboard?._id || window.pedalboard?.id;
  if (!window.currentUser || !boardId || window.currentUser.role === 'guest') {
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
    const res = await fetch('https://api.pedalplex.com/GET_FOLDERS.php', {
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
window.openAddFolderModal = openAddFolderModal;
window.openRenameFolderModal = openRenameFolderModal;
window.attachAddFolderListener = attachAddFolderListener;
window.attachRenameFolderListener = attachRenameFolderListener;
window.loadFoldersForCurrentPedalboard = loadFoldersForCurrentPedalboard;
window.populateFolderDropdown = populateFolderDropdown;
window.sanitizeFolderName = sanitizeFolderName;

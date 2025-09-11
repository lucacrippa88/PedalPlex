// ---------------------------
// folder.js
// ---------------------------

// Store folders locally
window.folders = []; // objects with {id, name, preset_ids}

// ---------------------------
// Populate main page #folderSelect dropdown (with "Default" option for unassigned presets)
// ---------------------------
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  if (!folderSelect || !window.folders || !window.presets) return;

  folderSelect.innerHTML = '';

  // Placeholder
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '-- Select Folder --';
  placeholder.disabled = true;
  placeholder.selected = true;
  folderSelect.appendChild(placeholder);

  // Add real folders
  window.folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id || f._id;
    opt.textContent = f.name;
    folderSelect.appendChild(opt);
  });

  // Check for presets not in any folder
  const folderPresetIds = new Set();
  window.folders.forEach(f => {
    if (Array.isArray(f.preset_ids)) f.preset_ids.forEach(id => folderPresetIds.add(id));
  });

  const unassignedPresets = window.presets.filter(p => !folderPresetIds.has(p._id));
  if (unassignedPresets.length > 0) {
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'default';
    defaultOpt.textContent = 'Default';
    folderSelect.appendChild(defaultOpt);
  }

  // Populate presets for initially selected folder (if any)
  if (folderSelect.value) populatePresetDropdownByFolder(folderSelect.value);

  // Trigger population of presets when folder changes
  folderSelect.addEventListener('change', (e) => {
    populatePresetDropdownByFolder(e.target.value);
  });
}

// ---------------------------
// Populate #presetSelect based on folder
// ---------------------------
function populatePresetDropdownByFolder(folderId) {
  const presetSelect = document.getElementById('presetSelect');
  if (!presetSelect || !window.presets) return;

  presetSelect.innerHTML = '';

  let filteredPresets = [];

  if (folderId === 'default') {
    // Show presets not in any folder
    const folderPresetIds = new Set();
    window.folders.forEach(f => {
      if (Array.isArray(f.preset_ids)) f.preset_ids.forEach(id => folderPresetIds.add(id));
    });
    filteredPresets = window.presets.filter(p => !folderPresetIds.has(p._id));
  } else {
    const folder = window.folders.find(f => (f.id || f._id) === folderId);
    if (folder && Array.isArray(folder.preset_ids)) {
      filteredPresets = window.presets.filter(p => folder.preset_ids.includes(p._id));
    }
  }

  filteredPresets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p._id;
    opt.textContent = p.preset_name || 'Untitled Preset';
    presetSelect.appendChild(opt);
  });
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
      inputPlaceholder: 'Enter folder name',
      showCancelButton: true,
      inputValidator: (v) => !v.trim() && 'Folder name cannot be empty'
    });

    if (isConfirmed && folderName.trim()) {
      const newFolder = {
        name: folderName.trim(),
        preset_ids: []
      };

      const saved = await saveFolderToDB(newFolder, board._id);
      if (saved) {
        window.folders.push(saved); // use server response
        populateFolderDropdown();
        const folderSelect = document.getElementById('folderSelect');
        if (folderSelect) folderSelect.value = saved.id || saved._id;

        Swal.fire('Success', `Folder "${newFolder.name}" created for "${boardName}"`, 'success');
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
    const folder = window.folders.find(f => (f._id || f.id) === folderId);
    if (!folder) {
      Swal.fire('Error', 'Selected folder not found.', 'error');
      return;
    }

    const boardName = window.pedalboard?.board_name || 'Unnamed Pedalboard';
    const { value: newName, isConfirmed } = await Swal.fire({
      title: `Rename folder for "${boardName}"`,
      input: 'text',
      inputLabel: 'New folder name',
      inputValue: folder.name,
      showCancelButton: true,
      inputValidator: v => !v.trim() && 'Folder name cannot be empty'
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
// Fetch folders for current pedalboard
// ---------------------------
async function loadFoldersForCurrentPedalboard(forSwal = false) {
  if (!window.currentUser || !window.pedalboard || !window.pedalboard._id) {
    window.folders = [];
    if (!forSwal) populateFolderDropdown();
    return;
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
      body: JSON.stringify({
        user_id: window.currentUser.userid,
        board_id: window.pedalboard._id
      })
    });

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }

    if (!data) window.folders = [];
    else if (Array.isArray(data.folders)) window.folders = data.folders;
    else if (Array.isArray(data.docs)) window.folders = data.docs;
    else if (Array.isArray(data)) window.folders = data;
    else window.folders = [];

    // Normalize folders
    window.folders = window.folders.map((f, idx) => ({
      id: f._id || f.id || `folder_${idx}`,
      name: f.name || f.folder_name || f.title || `(Folder ${idx + 1})`,
      preset_ids: f.preset_ids || f.presets || []
    }));

    if (!forSwal) populateFolderDropdown();

  } catch (err) {
    console.error(err);
    window.folders = [];
    if (!forSwal) populateFolderDropdown();
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
window.populatePresetDropdownByFolder = populatePresetDropdownByFolder;
window.populateFolderDropdown = populateFolderDropdown;

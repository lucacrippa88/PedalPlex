// ---------------------------
// folder.js
// ---------------------------

// Store folders locally
let folders = []; // objects with {id, name, preset_ids}

// Populate folder dropdown (robust + auto-select option)
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  if (!folderSelect) return;

  folderSelect.innerHTML = '<option value="">-- Select Folder --</option>';

  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id || '';
    opt.textContent = f.name || (f.id || 'Unnamed Folder');
    folderSelect.appendChild(opt);
  });

  // OPTIONAL: if you want auto-select the first folder and fire change handlers,
  // uncomment the block below. Useful if you want presets to load immediately.
  if (folders.length > 0) {
    folderSelect.value = folders[0].id;
    folderSelect.dispatchEvent(new Event('change'));
  }
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
        folders.push(saved); // use Cloudant response
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
    const folder = folders.find(f => (f._id || f.id) === folderId);
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
// Fetch folders for the current pedalboard (robust with logging)
// ---------------------------
async function loadFoldersForCurrentPedalboard() {
  console.log('[folders] loadFoldersForCurrentPedalboard called', {
    currentUser: window.currentUser,
    pedalboard: window.pedalboard
  });

  if (!window.currentUser || !window.pedalboard || !window.pedalboard._id) {
    console.warn('[folders] Missing currentUser or pedalboard/_id — aborting loadFoldersForCurrentPedalboard');
    folders = [];
    populateFolderDropdown();
    return;
  }

  const loader = document.getElementById('folderSelectLoader');
  const folderSelect = document.getElementById('folderSelect');
  if (loader) loader.style.display = 'flex';
  if (folderSelect) folderSelect.style.display = 'none';

  try {
    const payload = {
      user_id: window.currentUser.userid,
      board_id: window.pedalboard._id
    };
    console.log('[folders] POST -> GET_FOLDERS.php payload:', payload);

    const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_FOLDERS.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('[folders] GET_FOLDERS response status:', res.status);
    console.log('[folders] GET_FOLDERS raw response text:', text);

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.error('[folders] Failed to parse JSON from GET_FOLDERS:', parseErr);
      data = null;
    }

    // Normalize response into `folders` array, handling multiple possible server shapes
    if (!data) {
      folders = [];
    } else if (Array.isArray(data.folders)) {
      folders = data.folders;
    } else if (Array.isArray(data.docs)) {
      // older code returned docs => adapt
      folders = data.docs;
    } else if (Array.isArray(data)) {
      // server might return plain array
      folders = data;
    } else if (data.error) {
      console.error('[folders] Server returned error:', data.error);
      folders = [];
    } else {
      // unknown shape — make best attempt to extract any array-valued fields
      const possible = data.folders || data.docs || Object.values(data).find(v => Array.isArray(v));
      if (Array.isArray(possible)) folders = possible;
      else folders = [];
    }

    // Ensure each folder has { id, name, preset_ids }
    folders = folders.map(f => {
      // if the item is a string, treat it as name
      if (typeof f === 'string') return { id: '', name: f, preset_ids: [] };

      return {
        id: (f.id || f._id || f['_id'] || ''),
        name: (f.name || f.folder_name || f.title || ''),
        preset_ids: (f.preset_ids || f.presets || [])
      };
    });

    console.log('[folders] normalized folders:', folders);

    populateFolderDropdown();
  } catch (err) {
    console.error('[folders] Error fetching folders:', err);
    folders = [];
    populateFolderDropdown();
  } finally {
    if (loader) loader.style.display = 'none';
    if (folderSelect) folderSelect.style.display = 'inline-block';
  }
}

// Expose globally (keep your existing API)
window.attachAddFolderListener = attachAddFolderListener;
window.attachRenameFolderListener = attachRenameFolderListener;
window.loadFoldersForCurrentPedalboard = loadFoldersForCurrentPedalboard;
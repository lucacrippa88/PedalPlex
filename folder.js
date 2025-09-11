// ---------------------------
// folder.js
// ---------------------------

// Store folders locally
let folders = []; // {id, name, preset_ids}

// Populate folder dropdown
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  if (!folderSelect) return;

  folderSelect.innerHTML = '<option value="">-- Select Folder --</option>';
  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    folderSelect.appendChild(opt);
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
// Fetch folders for the current pedalboard
// ---------------------------
async function loadFoldersForCurrentPedalboard() {
  if (!window.currentUser || !window.pedalboard || !window.pedalboard._id) return;

  const loader = document.getElementById('folderSelectLoader');
  const folderSelect = document.getElementById('folderSelect');
  if (loader) loader.style.display = 'flex';
  if (folderSelect) folderSelect.style.display = 'none';

  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/GET_FOLDERS.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: window.currentUser.userid,
        board_id: window.pedalboard._id
      })
    });

    const data = await res.json();

    if (data.error) {
      console.error('Failed to load folders:', data.error);
      folders = [];
    } else {
      folders = data.folders || [];
    }

    populateFolderDropdown();
  } catch (err) {
    console.error('Error fetching folders:', err);
    folders = [];
    populateFolderDropdown();
  } finally {
    if (loader) loader.style.display = 'none';
    if (folderSelect) folderSelect.style.display = 'inline-block';
  }
}


// ---------------------------
// Expose globally
// ---------------------------
window.attachAddFolderListener = attachAddFolderListener;
window.attachRenameFolderListener = attachRenameFolderListener;
window.loadFoldersForCurrentPedalboard = loadFoldersForCurrentPedalboard;
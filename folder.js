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

// Save folder to DB
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

// Attach event listener to Add Folder button
function attachAddFolderListener() {
  const addFolderBtn = document.getElementById('addFolderBtn');
  if (!addFolderBtn) {
    console.warn('attachAddFolderListener: addFolderBtn not found yet');
    return;
  }

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
        id: 'folder_' + Date.now(),
        name: folderName.trim(),
        preset_ids: []
      };

      const saved = await saveFolderToDB(newFolder, board._id);
      if (saved) {
        folders.push(newFolder);
        populateFolderDropdown();
        const folderSelect = document.getElementById('folderSelect');
        if (folderSelect) folderSelect.value = newFolder.id;

        Swal.fire('Success', `Folder "${newFolder.name}" created for "${boardName}"`, 'success');
      }
    }
  });
}

// Expose to global so nav-preset.js can call it
window.attachAddFolderListener = attachAddFolderListener;

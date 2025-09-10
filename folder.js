// folders array
let folders = []; // {id, name, preset_ids}

// Populate folder dropdown
function populateFolderDropdown() {
  const folderSelect = document.getElementById('folderSelect');
  folderSelect.innerHTML = '<option value="">-- Select Folder --</option>';
  folders.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    folderSelect.appendChild(opt);
  });
}

// Save folder to DB
async function saveFolderToDB(folder) {
  const pedalboardSelect = document.getElementById('pedalboardSelect');
  const selectedIndex = parseInt(pedalboardSelect.value);
  if (isNaN(selectedIndex) || !pedalboards[selectedIndex]) {
    Swal.fire('Error', 'Please select a valid pedalboard', 'error');
    return null;
  }
  const board_id = pedalboards[selectedIndex]._id;

  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `user_id=${encodeURIComponent(window.currentUser.user_id)}&board_id=${encodeURIComponent(board_id)}&name=${encodeURIComponent(folder.name)}`
    });
    const result = await res.json();
    if (result.ok) return result;
    Swal.fire('Error', 'Could not save folder: ' + result.error, 'error');
    return null;
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Network or server error', 'error');
    return null;
  }
}

// Handle adding a new folder
document.addEventListener('DOMContentLoaded', () => {
  const addFolderBtn = document.getElementById('addFolderBtn');
  console.log('addFolderBtn:', addFolderBtn);
  if (!addFolderBtn) return;

  addFolderBtn.addEventListener('click', async () => {
    const { value: folderName, isConfirmed } = await Swal.fire({
      title: 'New Folder',
      input: 'text',
      inputLabel: 'Folder Name',
      inputPlaceholder: 'Enter folder name',
      showCancelButton: true,
    });

    if (isConfirmed && folderName.trim()) {
      const newFolder = {
        id: 'folder_' + Date.now(),
        name: folderName.trim(),
        preset_ids: []
      };

      const saved = await saveFolderToDB(newFolder);
      if (saved) {
        folders.push(newFolder);
        populateFolderDropdown();
        document.getElementById('folderSelect').value = newFolder.id;
      }
    }
  });

  // Handle renaming a folder
  const renameFolderBtn = document.getElementById('renameFolderBtn');
  if (!renameFolderBtn) return;

  renameFolderBtn.addEventListener('click', async () => {
    const folderSelect = document.getElementById('folderSelect');
    const folderId = folderSelect.value;

    if (!folderId) {
      Swal.fire('Select Folder', 'Please select a folder to rename', 'info');
      return;
    }

    const currentFolder = folders.find(f => f.id === folderId);
    if (!currentFolder) return;

    const { value: newName, isConfirmed } = await Swal.fire({
      title: 'Rename Folder',
      input: 'text',
      inputLabel: 'New folder name',
      inputValue: currentFolder.name,
      showCancelButton: true
    });

    if (isConfirmed && newName.trim()) {
      const res = await fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `folder_id=${encodeURIComponent(folderId)}&name=${encodeURIComponent(newName.trim())}`
      });
      const result = await res.json();
      if (result.ok) {
        currentFolder.name = newName.trim();
        populateFolderDropdown();
        folderSelect.value = folderId;
        Swal.fire('Success', 'Folder renamed successfully', 'success');
      } else {
        Swal.fire('Error', 'Could not rename folder: ' + result.error, 'error');
      }
    }
  });
});

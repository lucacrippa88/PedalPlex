// Example: folders for current pedalboard
let folders = []; // will store objects {id, name, preset_ids}

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

// Handle adding a new folder
document.getElementById('addFolderBtn').addEventListener('click', async () => {
  const folderName = await Swal.fire({
    title: 'New Folder',
    input: 'text',
    inputLabel: 'Folder Name',
    inputPlaceholder: 'Enter folder name',
    showCancelButton: true,
  });

  if (folderName.isConfirmed && folderName.value.trim()) {
    const newFolder = {
      id: 'folder_' + Date.now(), // simple unique ID
      name: folderName.value.trim(),
      preset_ids: [],
    };



    

  $('#createFldBtn').on('click', async () => {
    const saved = await saveFolderToDB(newFolder);
    if (saved) {
      folders.push(newFolder);
      populateFolderDropdown();
      document.getElementById('folderSelect').value = newFolder.id;
    }
  });






    // Save folder to DB here (pseudo-code)
    async function saveFolderToDB(folder) {
  try {
    const res = await fetch('https://www.cineteatrosanluigi.it/plex/CREATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _id: folder.id,
        user_id: window.currentUser.user_id, // from your auth check
        board_id: document.getElementById('pedalboardSelect').value,
        name: folder.name
      })
    });

    if (!res.ok) throw new Error('Failed to save folder');
    return await res.json();
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Could not save folder', 'error');
    return null;
  }
}


    folders.push(newFolder);
    populateFolderDropdown();

    // Auto-select the newly created folder
    document.getElementById('folderSelect').value = newFolder.id;
  }
});




// Handle renaming a folder
document.getElementById('renameFolderBtn').addEventListener('click', async () => {
  const folderSelect = document.getElementById('folderSelect');
  const folderId = folderSelect.value;

  if (!folderId) {
    Swal.fire('Select Folder', 'Please select a folder to rename', 'info');
    return;
  }

  const currentFolder = folders.find(f => f.id === folderId);
  if (!currentFolder) return;

  // SweetAlert prompt
  const { value: newName, isConfirmed } = await Swal.fire({
    title: 'Rename Folder',
    input: 'text',
    inputLabel: 'New folder name',
    inputValue: currentFolder.name,
    showCancelButton: true
  });

  if (isConfirmed && newName.trim()) {
    // Call API to rename folder
    fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_FOLDER.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `folder_id=${encodeURIComponent(folderId)}&name=${encodeURIComponent(newName.trim())}`
    })
    .then(res => res.json())
    .then(result => {
      if (result.ok) {
        // Update local folder array and dropdown
        currentFolder.name = newName.trim();
        populateFolderDropdown();
        folderSelect.value = folderId;

        Swal.fire('Success', 'Folder renamed successfully', 'success');
      } else {
        Swal.fire('Error', 'Could not rename folder: ' + result.error, 'error');
      }
    })
    .catch(err => {
      console.error(err);
      Swal.fire('Error', 'Network or server error', 'error');
    });
  }
});


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



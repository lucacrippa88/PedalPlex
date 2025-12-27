// Variable definition
let selectedBoardIndex = 0;
window.allPedalboards = []; // store all pedalboards here

// ------------------------------------------------------------------------------
// Main
function initPedalboard(userRole) {
  const userId = window.currentUser?.userid;
  const resultsDiv = document.getElementById("pedalboard");

  window.catalog = [];
  window.pedalboard = { pedals: [] };

  // Loader
  resultsDiv.innerHTML = `<div class="bx--loading-overlay"><div class="bx--loading" role="status"><svg class="bx--loading__svg" viewBox="-75 -75 150 150"><circle class="bx--loading__background" cx="0" cy="0" r="37.5"/><circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/></svg></div></div>`;

  // --- GUEST USER ---
  if (userRole === "guest") {
  const savedBoard = localStorage.getItem("guestPedalboard");   // Recupera eventuale pedalboard guest dal localStorage
  const boards = savedBoard ? JSON.parse(savedBoard) : [];

  if (boards.length === 0) {
    $("#pedalboard-controls").hide();
    $("#pedalboardSelect").hide();
    $("#renameBoardBtn").hide();
    $("#viewPreset").hide();

    resultsDiv.innerHTML = `
      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 20px;">
          No Rigs found. Create a new one!
        </p>
        <button id="createBtn" class="bx--btn bx--btn--secondary">Create a Rig</button>
      </div>`;
    window.allPedalboards = [];
    return;
  }

  // --- Fetch pedal data dal server ---
  const pedalIds = boards[0].pedals.map(p => p.pedal_id); // ora boards[0] è oggetto corretto
  fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: pedalIds })
  })
    .then(res => res.json())
    .then(result => {
      window.catalog = result.docs || [];

      window.allPedalboards = boards;
      window.pedalboard = structuredClone(boards[0]);

      $("#pedalboard-controls").css("display", "inline-flex");
      $("#pedalboardSelect").css("display", "none");
      $("#renameBoardBtn").css("display", "none");
      $("#viewPreset").css("display", "inline-flex");

      const dropdown = document.getElementById("pedalboardSelect");
      dropdown.innerHTML = '';
      const option = document.createElement("option");
      option.value = 0;
      option.textContent = window.pedalboard.board_name || "Guest Rig";
      dropdown.appendChild(option);

      renderPedalboard();
      if (typeof onPedalboardLoaded === "function") setTimeout(onPedalboardLoaded, 100);

      dropdown.addEventListener("change", (e) => {
        const idx = parseInt(e.target.value, 10);
        window.pedalboard = window.allPedalboards[idx];
        renderPedalboard();
      });
    })
    .catch(err => {
      console.error("Guest gears fetch failed:", err);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading guest pedals: ${err}</p>`;
    });

  return; // stop qui per i guest
}


  // --- LOGGED-IN USERS ---
  // Check if guest pedalboard exists
  const savedGuestBoards = JSON.parse(localStorage.getItem("guestPedalboard") || "[]");
  if (savedGuestBoards.length > 0) {
    Swal.fire({
      title: "Import local Rig?",
      text: "You have a Rig saved locally. Do you want to import it into your account?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, import",
      cancelButtonText: "No, skip",
      customClass: {
        confirmButton: 'bx--btn bx--btn--primary',
        cancelButton: 'bx--btn bx--btn--secondary'
      }
    }).then(result => {
      if (result.isConfirmed) {
        importGuestPedalboard(savedGuestBoards[0])
          .then(() => {
            localStorage.removeItem("guestPedalboard");
            initPedalboard(userRole); // reload after import
          })
          .catch(err => console.error("Import failed:", err));
        return;
      } else {
        localStorage.removeItem("guestPedalboard");
        initLoggedInPedalboards(userRole); // continue normally
      }
    });
    return;
  } else {
  // Fetch pedalboard first
  fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  })
    .then(res => {
      if (!res.ok) throw new Error(`Rig fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
        $("#pedalboard-controls").css("display", "none");
        resultsDiv.innerHTML = `You don't have any Rig yet.<br><br>
          <button id="createBtn" class="showDesktop bx--btn bx--btn--secondary" type="button" aria-label="Create New Pedalboard">
            Create Rig
          </button>`;
        return;
      }

      // Sort pedalboards alphabetically
      data.docs.sort((a, b) => ((a.board_name || '').toLowerCase()).localeCompare((b.board_name || '').toLowerCase()));

      window.allPedalboards = data.docs;

      const dropdown = document.getElementById("pedalboardSelect");
      dropdown.innerHTML = '';
      data.docs.forEach((board, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.setAttribute('value-id', board._id);
        option.textContent = board.board_name || `Pedalboard ${index + 1}`;
        dropdown.appendChild(option);
      });

      // Select first board by default or last used
      let lastId = localStorage.getItem('lastPedalboardId');
      let defaultIndex = 0;
      if (lastId) {
        const idx = window.allPedalboards.findIndex(b => b._id === lastId);
        if (idx !== -1) defaultIndex = idx;
      }

      selectedBoardIndex = defaultIndex;
      const selectedBoard = structuredClone(window.allPedalboards[selectedBoardIndex]);

      // Fetch pedals from server
      const pedalIds = selectedBoard.pedals.map(p => p.pedal_id);
      return fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pedalIds })
      })
        .then(res => res.json())
        .then(result => {
          window.catalog = result.docs || [];
          window.pedalboard = selectedBoard;

          $("#pedalboard-controls").css("display", "inline-flex");
          $("#pedalboardSelect").css("display", "inline-flex");
          $("#renameBoardBtn").css("display", "inline-flex");
          $("#viewPreset").css("display", "inline-flex");

          renderPedalboard();
          if (typeof onPedalboardLoaded === "function") setTimeout(onPedalboardLoaded, 100);

          dropdown.value = selectedBoardIndex.toString();
          dropdown.addEventListener("change", (e) => {
            selectedBoardIndex = parseInt(e.target.value, 10);
            window.pedalboard = window.allPedalboards[selectedBoardIndex];

            const pedalIds = window.pedalboard.pedals.map(p => p.pedal_id);
            fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: pedalIds })
            })
              .then(res => res.json())
              .then(result => {
                window.catalog = result.docs || [];
                renderPedalboard();
                saveSelectedBoardToLocalStorage();
              })
              .catch(err => console.error("Error fetching pedals on change:", err));
          });
        });
    })
    .catch(error => {
      console.error('Error:', error.message || error);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedalboard: ${error}</p>`;
    });
  }
}


// ------------------------------------------------------------------------------
// Capire se serve ancora
function setupFilterUI(pedals) {
  const input = document.getElementById('pedalFilterInput');
  const dropdownContainer = document.getElementById('pedalAddDropdownContainer');

  dropdownContainer.style.position = 'absolute'; // For absolute positioning
  dropdownContainer.style.background = 'white';
  dropdownContainer.style.maxHeight = '200px';
  dropdownContainer.style.overflowY = 'auto';
  dropdownContainer.style.width = input.offsetWidth + 'px';
  dropdownContainer.style.display = 'none';
  dropdownContainer.style.zIndex = 1000;
  dropdownContainer.style.borderRadius = '4px'; // or any radius you prefer


  function positionDropdown() {
    const rect = input.getBoundingClientRect();
    dropdownContainer.style.top = (20 + window.scrollY + rect.bottom) + 'px';
    dropdownContainer.style.left = (window.scrollX + rect.left) + 'px';
    dropdownContainer.style.width = rect.width + 'px';
  }


  function clearDropdown() {
    dropdownContainer.innerHTML = '';
    dropdownContainer.style.display = 'none';
  }

  function createAddButton(pedal) {
    const btn = document.createElement('button');

    btn.style.marginLeft = '5px';
    btn.classList.add('bx--btn', 'bx--btn--primary', 'bx--btn--sm');

    // Reduce padding to make button smaller
    btn.style.padding = '2px 6px';

    btn.innerHTML = `<svg focusable="false" preserveAspectRatio="xMidYMid meet"  xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="8" height="8" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

    btn.addEventListener('click', async () => {
      // Rotation Swal
      const {
        value: rotationStr
      } = await Swal.fire({
        title: 'Enter rotation',
        input: 'select',
        inputOptions: {
          0: '0°',
          90: '90°',
          180: '180°',
          270: '270°'
        },
        inputValue: '0',
        showCancelButton: true,
        inputValidator: value => {
          return (value === '') ? 'You need to select a rotation!' : null;
        },
        didOpen: () => {
          // Get Confirm and Cancel buttons and add Carbon classes
          const confirmBtn = Swal.getConfirmButton();
          const cancelBtn = Swal.getCancelButton();

          if (confirmBtn) {
            confirmBtn.className = 'bx--btn bx--btn--primary'; 
          }
          if (cancelBtn) {
            cancelBtn.className = 'bx--btn bx--btn--secondary'; 
          }
        }
      });
      if (rotationStr === undefined) return; // Cancel pressed

      const rotation = parseInt(rotationStr, 10);

      // Row Swal
      const {
        value: rowStr
      } = await Swal.fire({
        title: 'Enter row number',
        input: 'number',
        inputAttributes: {
          min: 1,
          step: 1
        },
        inputValue: '1',
        showCancelButton: true,
        inputValidator: value => {
          if (!value || isNaN(value) || value < 1) {
            return 'Row must be a number 1 or higher!';
          }
          return null;
        },
        didOpen: () => {
          const confirmBtn = Swal.getConfirmButton();
          const cancelBtn = Swal.getCancelButton();

          if (confirmBtn) {
            confirmBtn.className = 'bx--btn bx--btn--primary'; 
          }
          if (cancelBtn) {
            cancelBtn.className = 'bx--btn bx--btn--secondary'; 
          }
        }
      });
      if (rowStr === undefined) return; // Cancel pressed

      const row = parseInt(rowStr, 10);

      window.pedalboard.pedals.push({
        pedal_id: pedal._id,
        rotation,
        row
      });

      renderPedalboard();

      input.value = '';
      clearDropdown();
    });
    return btn;
  }

  function updateDropdown(filterText) {
    dropdownContainer.innerHTML = '';
    if (!filterText) {
      clearDropdown();
      return;
    }

    const filtered = pedals.filter(p => p._id.toLowerCase().includes(filterText.toLowerCase()));

    if (filtered.length === 0) {
      const noResult = document.createElement('div');
      noResult.textContent = 'No gears found. Add them from the search bar above!';
      noResult.style.padding = '6px';
      dropdownContainer.appendChild(noResult);
      dropdownContainer.style.display = 'block';
      positionDropdown();
      return;
    }

    filtered.forEach(pedal => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '6px';

      const label = document.createElement('span');
      label.textContent = pedal._id;
      label.style.color = 'black';
      item.appendChild(label);

      const addBtn = createAddButton(pedal);
      item.appendChild(addBtn);

      dropdownContainer.appendChild(item);
    });
    dropdownContainer.style.display = 'block';
    positionDropdown();
  }

  input.addEventListener('input', () => {
    updateDropdown(input.value);
  });

  window.addEventListener('scroll', () => {
    if (dropdownContainer.style.display === 'block') {
      positionDropdown();
    }
  });

  window.addEventListener('resize', () => {
    if (dropdownContainer.style.display === 'block') {
      positionDropdown();
      dropdownContainer.style.width = input.offsetWidth + 'px';
    }
  });

  document.addEventListener('click', (event) => {
    if (!dropdownContainer.contains(event.target) && event.target !== input) {
      clearDropdown();
    }
  });
}

// Capire se serve ancora
document.addEventListener('DOMContentLoaded', () => {
  setupFilterUI(window.catalog);
});

// Render pedalboard
function renderPedalboard() {
  const container = document.getElementById('pedalboard');
  if (!container) return;
  container.innerHTML = '';

  if (!window.pedalboard?.pedals || window.pedalboard.pedals.length === 0) {
    container.textContent = "No gears found. Add them from the search bar above!";
    return;
  }

  // Group pedals by row
  const rowsMap = {};
  window.pedalboard.pedals.forEach(pbPedal => {
    const rowNum = pbPedal.row || 1;
    if (!rowsMap[rowNum]) rowsMap[rowNum] = [];
    rowsMap[rowNum].push(pbPedal);
  });

  // Sort rows ascending
  const sortedRows = Object.keys(rowsMap).map(r => parseInt(r, 10)).sort((a, b) => a - b);

  sortedRows.forEach(rowNum => {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.flexWrap = 'wrap';
    rowDiv.style.marginBottom = '10px';
    rowDiv.style.gap = '10px';
    container.appendChild(rowDiv);

    rowsMap[rowNum].forEach(pbPedal => {
      const pedalData = window.catalog.find(p => p._id === pbPedal.pedal_id);
      if (!pedalData) {
        console.warn(`Pedal not found in catalog: ${pbPedal.pedal_id}`);
        return;
      }

      // Use existing renderPedal from utils.js
      const $pedalEl = renderPedal(pedalData, window.currentUser?.role || 'guest', pedalboardPage = true);

      // Add click listener to open edit modal
      $pedalEl.css('cursor', 'pointer');
      $pedalEl.on('click', () => openEditPedalModal(pbPedal));

      // Apply rotation to the pedal itself
      const angle = pbPedal.rotation || 0;
      $pedalEl.css('transform', `rotate(${angle}deg)`);

      // Calculate wrapper styles accounting for rotation (layout only)
      const widthPx = parseFloat(getPedalWidth(pedalData.width));
      const heightPx = parseFloat(getPedalHeight(pedalData.height));
      const hasRotation = angle !== 0;

      let wrapperStyles = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
        boxSizing: 'content-box',
        marginBottom: '20px',
      };

      if (hasRotation) {
        const radians = angle * Math.PI / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));

        const rotatedWidth = widthPx * cos + heightPx * sin;
        const rotatedHeight = widthPx * sin + heightPx * cos;

        Object.assign(wrapperStyles, {
          width: `${rotatedWidth}px`,
          height: `${rotatedHeight}px`,
          marginLeft: `${rotatedWidth * 0.2}px`,
          marginRight: `${rotatedWidth * 0.2}px`,
          ...(widthPx > heightPx ? { marginTop: '30px' } : {})
        });
      }

      const $wrapper = $("<div>").css(wrapperStyles).append($pedalEl);
      rowDiv.appendChild($wrapper[0]);
    });
  });
}

// Handle edit pedal modal
function openEditPedalModal(pbPedal) {
  Swal.fire({
    title: `Edit pedal: ${pbPedal.pedal_id}`,
    html: `
      <div style="display: flex; flex-direction: column; gap: 1em; max-width: 400px; margin: auto;">
        <div style="display: flex; gap: 1em; justify-content: space-between;">
          
          <!-- Rotation Dropdown (no Carbon classes) -->
          <div style="flex: 1;">
            <label for="rotationSelect" class="bx--label">Rotation</label>
            <select id="rotationSelect" style="width: 100%; padding: 0.5em; border: 1px solid #8d8d8d; border-radius: 0.25em; height: 40px; font-size: initial;">
              <option value="0" ${pbPedal.rotation === 0 ? 'selected' : ''}>0°</option>
              <option value="90" ${pbPedal.rotation === 90 ? 'selected' : ''}>90°</option>
              <option value="180" ${pbPedal.rotation === 180 ? 'selected' : ''}>180°</option>
              <option value="270" ${pbPedal.rotation === 270 ? 'selected' : ''}>270°</option>
            </select>
          </div>

          <!-- Row Input (no Carbon classes) -->
          <div style="flex: 1;">
            <label for="rowInput" class="bx--label">Row</label>
            <input id="rowInput" type="number" min="1" value="${pbPedal.row}" 
              style="width: 100%; padding: 0.5em; border: 1px solid #8d8d8d; border-radius: 0.25em; font-size: initial; height: 24px;">
          </div>

        </div>
      </div>
    `,
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    customClass: {
      actions: 'swal2-actions-with-remove'
    },
    didOpen: () => {
      Swal.getConfirmButton().className = 'bx--btn bx--btn--primary';
      Swal.getCancelButton().className = 'bx--btn bx--btn--secondary';

      // Add "Remove pedal" button inline with Save/Cancel
      const actions = Swal.getActions();
      const removeBtn = document.createElement('button');
      removeBtn.id = 'removePedalBtn';
      removeBtn.className = 'bx--btn bx--btn--danger';
      removeBtn.textContent = 'Remove';
      actions.insertBefore(removeBtn, actions.firstChild);

      removeBtn.addEventListener('click', () => {
        Swal.fire({
          title: 'Are you sure?',
          text: 'This will remove the selected gear from your pedalboard.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, remove it',
          cancelButtonText: 'Cancel',
          didOpen: () => {
            Swal.getConfirmButton().className = 'bx--btn bx--btn--danger';
            Swal.getCancelButton().className = 'bx--btn bx--btn--secondary';
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.pedalboard.pedals = window.pedalboard.pedals.filter(p => p !== pbPedal);
            Swal.close();
            renderPedalboard();
          }
        });
      });
    },
    preConfirm: () => {
      const rotation = parseInt(document.getElementById('rotationSelect').value, 10);
      const row = parseInt(document.getElementById('rowInput').value, 10);

      if (![0, 90, 180, 270].includes(rotation)) {
        Swal.showValidationMessage('Rotation must be 0, 90, 180, or 270 degrees.');
        return false;
      }
      if (isNaN(row) || row < 1) {
        Swal.showValidationMessage('Row must be a number 1 or higher.');
        return false;
      }

      return {
        rotation,
        row
      };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      pbPedal.rotation = result.value.rotation;
      pbPedal.row = result.value.row;
      renderPedalboard();
    }
  });
}

// Save pedalboard (both logged-in and guest users)
function savePedalboard() {
  const saveBtn = document.getElementById('saveBtn');
  const userId = currentUser?.userid;

  if (saveBtn) {
    saveBtn.classList.add('cds--btn', 'cds--btn--primary'); 
  }

  if (!window.allPedalboards || !Array.isArray(window.allPedalboards) || selectedBoardIndex === undefined || selectedBoardIndex < 0) {
    if (saveBtn) saveBtn.disabled = true;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No Rig selected!',
      confirmButtonText: 'Ok',
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
      }
    });
    return;
  }

  if (saveBtn) saveBtn.disabled = false;

  window.allPedalboards[selectedBoardIndex] = structuredClone(window.pedalboard);

  // --- GUEST USER SAVE ---
  if (window.currentUser?.role === 'guest') {
    saveGuestPedalboard();
    return;
  }

  // --- VALIDATION FOR SPECIAL CHARACTERS ---
  const pedalboardToSave = window.allPedalboards[selectedBoardIndex];

  function hasInvalidChars(obj) {
    const forbidden = /[$%*\\|()\[\]{}^£;<>]/;

    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const val = obj[key];

      if (typeof val === 'string') {
        if (forbidden.test(val)) return true;
      } else if (Array.isArray(val)) {
        for (let item of val) {
          if (typeof item === 'string') {
            if (forbidden.test(item)) return true;
          } else if (typeof item === 'object' && item !== null) {
            if (hasInvalidChars(item)) return true;
          }
        }
      } else if (typeof val === 'object' && val !== null) {
        if (hasInvalidChars(val)) return true;
      }
    }

    return false;
  }

  if (hasInvalidChars(pedalboardToSave)) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid board name',
      text: 'Board name contains forbidden characters.  Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
      confirmButtonText: 'Ok',
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
      }
    });
    return;
  }

  // --- LOGGED-IN USER SAVE ---
  const token = localStorage.getItem('authToken');

  fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_PEDALBOARD.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      user_id: userId,
      pedalboard: pedalboardToSave
    })
  })
  .then(async response => {
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON response from server: ${text}`);
    }

    if (!response.ok) {
      const errorMsg = data.error ? `${data.error}${data.message ? ': ' + data.message : ''}` : `Save failed: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  })
  .then(data => {
    Swal.fire({
      icon: 'success',
      title: 'Rig saved!',
      timer: 1500,
      showConfirmButton: false,
      willClose: () => {
        location.reload();
      }
    });
  })
  .catch(err => {
    Swal.fire({
      icon: 'error',
      title: 'Error saving Rig',
      text: err.message || err,
    });
  });
}

// Handle new pedalboard creation
$(document).ready(function () {
  $(document).on('click', '#createBtn', function () {
    Swal.fire({
      title: 'Enter new Rig name',
      input: 'text',
      inputPlaceholder: 'Rig name...',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
        cancelButton: "bx--btn bx--btn--secondary",
      },
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a Rig name!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
  const boardName = result.value;
  const userId = currentUser?.userid;

  // --- GUEST USER CREATE ---
  if (currentUser?.role === 'guest') {
    const forbiddenRegex = /[$%*\\|()\[\]{}^£;<>]/;

    function removeEmojis(str) {
      return str.replace(/[\p{So}\p{Cn}]/gu, '');
    }

    // Sanitize input
    let sanitizedBoardName = boardName.replace(forbiddenRegex, '');
    sanitizedBoardName = removeEmojis(sanitizedBoardName);
    sanitizedBoardName = sanitizedBoardName.replace(/\s+/g, ' ').trim();

    if (sanitizedBoardName !== boardName) {
      Swal.fire({
        title: 'Invalid Rig name',
        text: 'Rig name contains forbidden characters. Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary',
        },
        buttonsStyling: false,
      });
      return; // stop execution
    }

    const guestBoards = JSON.parse(localStorage.getItem('guestPedalboard') || '[]');
    const newBoard = { board_name: sanitizedBoardName, pedals: [] };
    guestBoards.push(newBoard);
    localStorage.setItem('guestPedalboard', JSON.stringify(guestBoards));
    window.allPedalboards = guestBoards;
    selectedBoardIndex = guestBoards.length - 1;
    window.pedalboard = structuredClone(newBoard);
    setupPedalboardDropdownAndRender();

    Swal.fire({
      icon: 'success',
      title: 'Rig created locally!',
      timer: 1200,
      showConfirmButton: false
    });

    $("#pedalboard-controls").css("display", "inline-flex");
    $("#viewPreset").css("display", "inline-flex");
    return;
  }


  // --- LOGGED-IN USER CREATE (existing fetch) ---

        const token = localStorage.getItem('authToken');

        // --- Validation for board name ---
        const forbiddenRegex = /[$%*\\|()\[\]{}^£;<>]/;

        // Remove emojis as well
        function removeEmojis(str) {
          return str.replace(/[\p{So}\p{Cn}]/gu, '');
        }
        // Sanitize board name
        let sanitizedBoardName = boardName;
        // Remove forbidden chars
        sanitizedBoardName = sanitizedBoardName.replace(forbiddenRegex, '');
        // Remove emojis
        sanitizedBoardName = removeEmojis(sanitizedBoardName);
        // Optionally collapse multiple spaces
        sanitizedBoardName = sanitizedBoardName.replace(/\s+/g, ' ').trim();
        if (sanitizedBoardName !== boardName) {
          // Update input field so user sees the cleaned value
          const boardNameInput = document.getElementById('boardNameInput'); // replace with your actual input ID
          if (boardNameInput) {
            boardNameInput.value = sanitizedBoardName;
          }
          Swal.fire({
            title: 'Invalid Rig name',
            text: 'Rig name contains forbidden characters.  Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
            icon: 'error',
            customClass: {
              confirmButton: 'bx--btn bx--btn--primary',
            },
            buttonsStyling: false,
          });
          return; // Stop further execution
        }



        fetch('https://www.cineteatrosanluigi.it/plex/CREATE_PEDALBOARD.php', {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Bearer " + token
          },
          body: new URLSearchParams({
            board_name: boardName,
            user_id: userId
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Rig Created',
                text: `Rig "${boardName}" has been created successfully.`,
                timer: 1000,
                showConfirmButton: false,
                willClose: () => {
                  location.reload();
                }
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: data.error || 'Unknown error'
              });
            }
          })
          .catch(err => {
            console.error("Fetch error:", err);
            Swal.fire({
              icon: 'error',
              title: 'Request Error',
              text: err.message || 'Network or server error'
            });
          });

      }
    });
  });
});

// Handle pedalboard rename
document.getElementById('renameBoardBtn').addEventListener('click', () => {
  if (window.allPedalboards.length === 0) {
    Swal.fire('No Rigs to rename');
    return;
  }

  const currentBoard = window.allPedalboards[selectedBoardIndex];
  const currentName = currentBoard.board_name || `Rig ${selectedBoardIndex + 1}`;

  Swal.fire({
    title: 'Rename Rig',
    input: 'text',
    inputValue: currentName,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Rename',
    cancelButtonText: 'Cancel',
    denyButtonText: 'Delete',
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton: "bx--btn bx--btn--secondary",
      denyButton: "bx--btn bx--btn--danger",
    },
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'Please enter a valid name';
      }
    }
  }).then(result => {
    if (result.isConfirmed) {
      const newName = result.value.trim();

      // --- Validation for new board name ---
      const forbiddenRegex = /[$%*\\|()\[\]{}^£;<>]/;

      // Remove emojis using Unicode property escapes
      function removeEmojis(str) {
        return str.replace(/[\p{So}\p{Cn}]/gu, '');
      }
      // Sanitize newName
      let sanitizedName = newName;
      sanitizedName = sanitizedName.replace(forbiddenRegex, '');
      sanitizedName = removeEmojis(sanitizedName);
      sanitizedName = sanitizedName.replace(/\s+/g, ' ').trim();
      if (sanitizedName !== newName) {
        Swal.fire({
          title: 'Invalid Rig name',
          text: 'Rig name contains forbidden characters.  Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
          icon: 'error',
          customClass: {
            confirmButton: 'bx--btn bx--btn--primary',
          },
          buttonsStyling: false,
        });

        // Do NOT update dropdown
        return;
      }

      // ✅ Name is valid, update dropdown and internal data
      window.allPedalboards[selectedBoardIndex].board_name = newName;
      window.pedalboard.board_name = newName;

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.options[selectedBoardIndex].textContent = newName;

      savePedalboard();

    }

    // DELETE LOGIC
    else if (result.isDenied) {

      const currentBoard = window.allPedalboards[selectedBoardIndex];

      if (currentUser?.role === 'guest') {
        // Confirm deletion for guest
        Swal.fire({
          title: `Delete "${currentBoard.board_name}"?`,
          text: 'This will remove the Rig locally and cannot be undone.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, delete it',
          cancelButtonText: 'Cancel',
          customClass: {
            confirmButton: "bx--btn bx--btn--danger",
            cancelButton: "bx--btn bx--btn--secondary",
          }
        }).then(confirm => {
          if (confirm.isConfirmed) {
            // Remove from localStorage
            let guestBoards = JSON.parse(localStorage.getItem('guestPedalboard') || '[]');
            guestBoards.splice(selectedBoardIndex, 1);
            localStorage.setItem('guestPedalboard', JSON.stringify(guestBoards));

            // Update in-memory
            window.allPedalboards = guestBoards;

            if (guestBoards.length > 0) {
              selectedBoardIndex = 0;
              window.pedalboard = structuredClone(guestBoards[0]);
              setupPedalboardDropdownAndRender();
            } else {
              selectedBoardIndex = -1;
              window.pedalboard = null;

              // Clear UI and show create button
              const container = document.getElementById('pedalboard');
              container.innerHTML = `You don't have any Rigs yet.<br><br><button id="createBtn" class="showDesktop bx--btn bx--btn--secondary" type="button" aria-label="Create New Pedalboard" style="display: flex; align-items: center; gap: 0.5rem;">
                <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
                  <g transform="rotate(90 16 16)">
                    <path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"></path>
                    <path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"></path>
                  </g>
                </svg>
                Create a Rig
              </button>`;

              $("#pedalboard-controls").hide();
            }

            Swal.fire({
              title: 'Deleted!',
              text: 'Your local Rig has been removed.',
              icon: 'success',
              timer: 1200,
              showConfirmButton: false
            });
          }
        });

        // Important: exit here, don't continue to logged-in user deletion
        return;
      }

        // --- LOGGED-IN USER deletion logic ---
      const userId = currentUser.userid;
      const boardId = currentBoard._id;

      // Check if there are related presets first
      fetch('https://www.cineteatrosanluigi.it/plex/CHECK_PRESETS_FOR_BOARD.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          board_id: boardId
        })
      })
      .then(res => res.json())
      .then(check => {
        if (check.has_presets) {
          Swal.fire({
            title: 'Cannot delete',
            text: 'This Rig has linked Plexes and cannot be deleted.',
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'bx--btn bx--btn--primary'
            }
          });
        } else {
          // If no presets, confirm deletion
          Swal.fire({
            title: `Delete "${currentName}"?`,
            text: 'This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            customClass: {
              confirmButton: "bx--btn bx--btn--danger",
              cancelButton: "bx--btn bx--btn--secondary",
            }
          }).then(confirm => {
            if (confirm.isConfirmed) {
              Swal.fire({
                title: "Deleting...",
                didOpen: () => Swal.showLoading(),
                allowOutsideClick: false
              });

              const token = localStorage.getItem('authToken');

              fetch('https://www.cineteatrosanluigi.it/plex/DELETE_PEDALBOARD.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                  user_id: userId,
                  board_id: boardId
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.ok) {
                  Swal.fire({
                    title: 'Deleted!',
                    text: 'Rig has been deleted.',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                  });
                  window.allPedalboards.splice(selectedBoardIndex, 1);
                  const dropdown = document.getElementById('pedalboardSelect');
                  dropdown.remove(selectedBoardIndex);

                  if (window.allPedalboards.length > 0) {
                    selectedBoardIndex = 0;
                    setupPedalboardDropdownAndRender(); // fetch dei pedali incluso, render corretto
                  } else {
                    selectedBoardIndex = -1;
                    window.pedalboard = null;
                    document.getElementById('pedalboard').innerHTML = '';
                    location.reload();                
                  }

                } else {
                  Swal.fire('Error', data.error || 'Failed to delete Rig.', 'error');
                }
              })
              .catch((err) => {
                console.error('Delete request failed:', err);
                Swal.fire('Error', 'Network error occurred.', 'error');
              });
            }
          });
        }
      })
      .catch(() => {
        Swal.fire('Error', 'Failed to check for related Plexes.', 'error');
      });
    }
  });
});

// Returns the currently selected pedalboard object (with pedals)
function getCurrentPedalboard() {
  // For logged-in users
  if (window.currentUser?.role !== "guest") {
    return window.pedalboard;
  }

  // For guests: ensure we have something to return
  if (!window.pedalboard) {
    return { board_name: "Guest Rig", pedals: [] };
  }

  return window.pedalboard;
}

// Save guest pedalbpard to local storage
function saveGuestPedalboard() {
  const board = getCurrentPedalboard();
  const guestBoards = [board]; // always save as array
  localStorage.setItem("guestPedalboard", JSON.stringify(guestBoards));
  window.allPedalboards = guestBoards;
  Swal.fire({
    icon: 'success',
    title: 'Saved!',
    text: 'Your pedalboard is temporarily saved locally.',
    timer: 1000,
    showConfirmButton: false
  });
}

// Import guest pedalboard from local storage
function importGuestPedalboard(board, userFromServer) {
  return new Promise((resolve, reject) => {
    const boardName = board.board_name || "Untitled Rig";
    const pedals = board.pedals || [];
    const userId = window.currentUser?.userid;

    if (!boardName || !userId) {
      console.error("Cannot import: missing board_name or user_id", { board, userFromServer });
      reject("Missing board_name or user_id");
      return;
    }

    // --- Validation for board name ---
    const forbiddenRegex = /[$%*\\|()\[\]{}^£;<>]/;
    // Remove emojis using Unicode property escapes
    function removeEmojis(str) {
      return str.replace(/[\p{So}\p{Cn}]/gu, '');
    }
    // Sanitize boardName
    let sanitizedBoardName = boardName;
    // Remove forbidden characters
    sanitizedBoardName = sanitizedBoardName.replace(forbiddenRegex, '');
    // Remove emojis
    sanitizedBoardName = removeEmojis(sanitizedBoardName);
    // Collapse multiple spaces and trim
    sanitizedBoardName = sanitizedBoardName.replace(/\s+/g, ' ').trim();
    // If sanitized name differs from original, show error and stop
    if (sanitizedBoardName !== boardName) {
      Swal.fire({
        title: 'Invalid board name',
        text: 'Rig name contains forbidden characters.  Allowed: letters, numbers, spaces, and safe punctuation (/ , . - _ & \' " ! ? :).',
        icon: 'error',
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary',
        },
        buttonsStyling: false,
      });

      reject("Invalid board_name");
      return; // Stop execution
    }


    const token = localStorage.getItem('authToken');

    $.ajax({
      url: 'https://www.cineteatrosanluigi.it/plex/CREATE_PEDALBOARD.php',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      data: {
        board_name: boardName,
        user_id: userId,
        pedals: JSON.stringify(pedals)   // pass pedals too
      },
      success: function(resp) {
        console.log("Imported guest Rig:", resp);
        resolve(resp);
      },
      error: function(err) {
        console.error("Failed to import guest Rig:", err);
        reject(err);
      }
    });
  });
}


// ------------------------------------------------------------------------------
// HELPER
function saveSelectedBoardToLocalStorage() {
  if (!window.pedalboard) return;
  localStorage.setItem('lastPedalboardId', window.pedalboard._id);
  localStorage.setItem('lastPedalboardText', window.pedalboard.board_name);
}

// HELPER
function setupPedalboardDropdownAndRender() {
  const dropdown = document.getElementById('pedalboardSelect');
  if (!dropdown || !window.allPedalboards || window.allPedalboards.length === 0) return;

  dropdown.innerHTML = '';

  // Populate dropdown
  window.allPedalboards.forEach((board, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.setAttribute('value-id', board._id);
    option.textContent = board.board_name || `Rig ${index + 1}`;
    dropdown.appendChild(option);
  });

  // Selezione di default
  let selectedIndex = 0;
  if (window.currentUser?.role !== 'guest') {
    const lastId = localStorage.getItem('lastPedalboardId');
    if (lastId) {
      const idx = window.allPedalboards.findIndex(b => b._id === lastId);
      if (idx !== -1) selectedIndex = idx;
    }
  }
  dropdown.selectedIndex = selectedIndex;
  const selectedBoard = structuredClone(window.allPedalboards[selectedIndex]);
  window.pedalboard = selectedBoard;

  // --- FETCH PEDALS ---
  const pedalIds = selectedBoard.pedals.map(p => p.pedal_id);
  fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: pedalIds })
  })
  .then(res => res.json())
  .then(result => {
    window.catalog = result.docs || [];
    renderPedalboard();
    if (typeof onPedalboardLoaded === "function") setTimeout(onPedalboardLoaded, 100);
  })
  .catch(err => console.error("Error fetching pedals:", err));

  // Cambiamento dropdown
  dropdown.addEventListener('change', (e) => {
    selectedIndex = parseInt(e.target.value, 10);
    const newBoard = structuredClone(window.allPedalboards[selectedIndex]);
    window.pedalboard = newBoard;

    const pedalIds = newBoard.pedals.map(p => p.pedal_id);
    fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: pedalIds })
    })
    .then(res => res.json())
    .then(result => {
      window.catalog = result.docs || [];
      renderPedalboard();
      saveSelectedBoardToLocalStorage();
    })
    .catch(err => console.error("Error fetching pedals on change:", err));
  });
}

// HELPER
function extractColorFromLogo(logoCss) {
  if (!logoCss) return null;
  const match = logoCss.match(/color\s*:\s*([^;]+);?/i);
  return match ? match[1].trim() : null;
}
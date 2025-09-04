let selectedBoardIndex = 0;
window.allPedalboards = []; // store all pedalboards here


function initPedalboard(userRole) {
  const userId = window.currentUser?.userid;
  const resultsDiv = document.getElementById("pedalboard");

  window.catalog = [];
  window.pedalboard = {
    pedals: []
  };

  // Show loading spinner
  resultsDiv.innerHTML = `
    <div class="bx--loading-overlay">
      <div class="bx--loading" role="status">
        <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
          <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
          <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
        </svg>
      </div>
    </div>`;


  // Load catalog
  fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${userRole}&username=${window.currentUser.username}`)
    .then(response => {
      if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
      return response.json();
    })
    .then(catalog => {
      resultsDiv.innerHTML = ""; // Clear loader
      window.catalog = catalog;
      setupFilterUI(window.catalog);

      // Fetch pedalboard data
      return fetch('https://www.cineteatrosanluigi.it/plex/GET_PEDALBOARD.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId
        })
      });
    })
    .then(response => {
      if (!response.ok) throw new Error(`Pedalboard fetch failed: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
        $("#pedalboard-controls").css("display", "none");
        resultsDiv.innerHTML = `
          <div style="text-align: center; margin-top: 40px;">
            <p style="font-size: 1.1em; margin-bottom: 20px;">
              No pedalboards found. Create a new one!
            </p>
            <button
              id="createBtn"
              class="bx--btn bx--btn--secondary"
              type="button"
              aria-label="Create New Pedalboard"
              style="
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin: 0 auto;
              ">
              <svg
                focusable="false"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                width="16"
                height="16"
                viewBox="0 0 32 32"
                aria-hidden="true"
                class="bx--btn__icon">
                <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Create pedalboard
            </button>
          </div>
        `;
        return;
      }
      $("#pedalboard-controls").css("display", "inline-flex");


      // Sort pedalboards alphabetically by board_name, case-insensitive
      data.docs.sort((a, b) => {
        const nameA = (a.board_name || '').toLowerCase();
        const nameB = (b.board_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      window.allPedalboards = data.docs; // STORE all pedalboards here

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.innerHTML = '';
      data.docs.forEach((board, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = board.board_name || `Pedalboard ${index + 1}`;
        dropdown.appendChild(option);
      });

      selectedBoardIndex = 0;
      window.pedalboard = window.allPedalboards[selectedBoardIndex];
      renderPedalboard();

      dropdown.addEventListener('change', (e) => {
        selectedBoardIndex = parseInt(e.target.value, 10);
        window.pedalboard = window.allPedalboards[selectedBoardIndex];
        renderPedalboard();
      });
    })


    .catch(error => {
      console.error('Error:', error.message || error);
    });

}







function setupFilterUI(pedals) {
  const input = document.getElementById('pedalFilterInput');
  const dropdownContainer = document.getElementById('pedalAddDropdownContainer');

  // if (!input || !dropdownContainer) {
  //   console.warn('Missing input or dropdown container');
  //   return;
  // }

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

    btn.innerHTML = `
      <svg focusable="false" preserveAspectRatio="xMidYMid meet" 
        xmlns="http://www.w3.org/2000/svg" fill="currentColor" 
        width="8" height="8" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

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
      noResult.textContent = 'No pedals found';
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


document.addEventListener('DOMContentLoaded', () => {
  setupFilterUI(window.catalog);
});







function renderPedalboard() {
  const container = document.getElementById('pedalboard');
  // if (!container) {
  //   console.warn('No #pedalboard container found');
  //   return;
  // }
  container.innerHTML = '';

  if (!window.pedalboard.pedals || window.pedalboard.pedals.length === 0) {
    container.textContent = "No pedals found.";
    return;
  }

  // Group pedals by row number
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

    rowsMap[rowNum].forEach(pbPedal => {
      const pedalData = window.catalog.find(p => p._id === pbPedal.pedal_id);
      if (!pedalData) {
        console.warn(`Pedal not found in catalog: ${pbPedal.pedal_id}`);
        return;
      }

      const pedalDiv = document.createElement('div');
      pedalDiv.className = 'pedalboard-pedal';
      pedalDiv.style.backgroundColor = pedalData.color || '#444';
      pedalDiv.style.color = pedalData['font-color'] || '#fff';
      pedalDiv.style.margin = '5px';
      pedalDiv.style.padding = '5px';
      pedalDiv.style.display = 'flex';
      pedalDiv.style.flexDirection = 'column';
      pedalDiv.style.justifyContent = 'center';
      pedalDiv.style.alignItems = 'center';
      pedalDiv.style.borderRadius = '8px';
      pedalDiv.style.width = '200px';
      pedalDiv.style.height = '120px';
      pedalDiv.style.boxSizing = 'border-box';
      pedalDiv.style.userSelect = 'none';
      pedalDiv.style.textAlign = 'center';
      pedalDiv.style.cursor = 'pointer';
      pedalDiv.style.transform = `rotate(${pbPedal.rotation}deg)`;

      const colorFromLogo = extractColorFromLogo(pedalData.logo);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = pbPedal.pedal_id;
      if (colorFromLogo) nameSpan.style.color = colorFromLogo;
      nameSpan.style.fontWeight = 'bold';
      pedalDiv.appendChild(nameSpan);

      const rowSpan = document.createElement('div');
      rowSpan.textContent = `Row: ${pbPedal.row}`;
      rowSpan.style.marginTop = '6px';
      rowSpan.style.fontSize = '0.9em';
      if (colorFromLogo) rowSpan.style.color = colorFromLogo;
      else rowSpan.style.color = pedalData['font-color'] || '#ddd';
      pedalDiv.appendChild(rowSpan);

      pedalDiv.addEventListener('click', () => {
        openEditPedalModal(pbPedal);
      });

      rowDiv.appendChild(pedalDiv);
    });

    container.appendChild(rowDiv);
  });
}





function openEditPedalModal(pbPedal) {
  Swal.fire({
    title: `Edit pedal: ${pbPedal.pedal_id}`,
    html: `
      <div style="display: flex; flex-direction: column; gap: 1em; max-width: 400px; margin: auto;">
        <div style="display: flex; gap: 1em; justify-content: space-between;">
          
          <!-- Rotation Dropdown (no Carbon classes) -->
          <div style="flex: 1;">
            <label for="rotationSelect" class="bx--label">Rotation</label>
            <select id="rotationSelect" style="width: 100%; padding: 0.5em; border: 1px solid #8d8d8d; border-radius: 0.25em;">
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
              style="width: 100%; padding: 0.5em; border: 1px solid #8d8d8d; border-radius: 0.25em;">
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




function extractColorFromLogo(logoCss) {
  if (!logoCss) return null;
  const match = logoCss.match(/color\s*:\s*([^;]+);?/i);
  return match ? match[1].trim() : null;
}









function savePedalboard() {
  const saveBtn = document.getElementById('saveBtn');
  const userId = currentUser.userid;

  if (saveBtn) {
    saveBtn.classList.add('cds--btn', 'cds--btn--primary'); 
  }

  if (
    !window.allPedalboards ||
    !Array.isArray(window.allPedalboards) ||
    selectedBoardIndex === undefined ||
    selectedBoardIndex < 0 ||
    selectedBoardIndex >= window.allPedalboards.length
  ) {
    if (saveBtn) saveBtn.disabled = true;

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No pedalboard selected!',
      confirmButtonText: 'Ok',
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
      }
    }).then(() => {
      location.reload();
    });

    return;
  }

  if (saveBtn) saveBtn.disabled = false;

  window.allPedalboards[selectedBoardIndex] = {
    ...window.pedalboard
  };

  const pedalboardToSave = window.allPedalboards[selectedBoardIndex];

  fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_PEDALBOARD.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
        title: 'Pedalboard saved!',
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
        title: 'Error saving pedalboard',
        text: err.message || err,
      });
    });
}





$(document).ready(function () {
  $(document).on('click', '#createBtn', function () {
    Swal.fire({
      title: 'Enter new pedalboard name',
      input: 'text',
      inputPlaceholder: 'Board name',
      showCancelButton: true,
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: "bx--btn bx--btn--primary",
        cancelButton: "bx--btn bx--btn--secondary",
      },
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a board name!';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const boardName = result.value;
        const userId = currentUser.userid;

        fetch('https://www.cineteatrosanluigi.it/plex/CREATE_PEDALBOARD.php', {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
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
                title: 'Pedalboard Created',
                text: `Pedalboard "${boardName}" has been created successfully.`,
                timer: 2000,
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



document.getElementById('renameBoardBtn').addEventListener('click', () => {
  if (window.allPedalboards.length === 0) {
    Swal.fire('No pedalboard to rename');
    return;
  }

  const currentBoard = window.allPedalboards[selectedBoardIndex];
  const currentName = currentBoard.board_name || `Pedalboard ${selectedBoardIndex + 1}`;

  Swal.fire({
    title: 'Edit pedalboard',
    input: 'text',
    inputValue: currentName,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Save',
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
      window.allPedalboards[selectedBoardIndex].board_name = newName;
      window.pedalboard.board_name = newName;

      const dropdown = document.getElementById('pedalboardSelect');
      dropdown.options[selectedBoardIndex].textContent = newName;

      savePedalboard();
    }

    // DELETE LOGIC
    else if (result.isDenied) {
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
            text: 'This pedalboard has linked presets and cannot be deleted.',
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
              fetch('https://www.cineteatrosanluigi.it/plex/DELETE_PEDALBOARD.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  user_id: userId,
                  board_id: boardId
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.ok) {
                  Swal.fire({
                    title: 'Deleted!',
                    text: 'The pedalboard has been deleted.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                  });

                  window.allPedalboards.splice(selectedBoardIndex, 1);
                  const dropdown = document.getElementById('pedalboardSelect');
                  dropdown.remove(selectedBoardIndex);

                  if (window.allPedalboards.length > 0) {
                    selectedBoardIndex = 0;
                    window.pedalboard = structuredClone(window.allPedalboards[0]);
                    renderPedalboard(window.pedalboard);
                    dropdown.selectedIndex = 0;
                  } else {
                    selectedBoardIndex = -1;
                    window.pedalboard = null;
                    const contentEl = document.getElementById('pedalboard');
                    if (contentEl) contentEl.innerHTML = '';
                    location.reload();                
                  }
                } else {
                  Swal.fire('Error', data.error || 'Failed to delete pedalboard.', 'error');
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
        Swal.fire('Error', 'Failed to check for related presets.', 'error');
      });
    }
  });
});




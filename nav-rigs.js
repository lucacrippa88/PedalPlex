function initNavPedalboard(userRole) {
  const isGuest = (userRole === "guest");

  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>
        <a href="/PedalPlex/" style="text-decoration:none;" class="title">PedalPlex</a>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Rigs</span>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="addGearsTrigger" class="showDesktop" style="cursor:pointer; font-size: 0.75rem; opacity: 0.7;">Add gears</span>

        <!-- Hide by default -->
        <button id="toggleFilterBtn" class="showDesktop" aria-label="Toggle search" 
                style="background:none; border:none; cursor:pointer; padding:4px; display:none;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input type="text"
               id="pedalFilterInput"
               placeholder="..."
               style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 200px; display:none;" 
               aria-label="Filter pedals"/>

        <button id="saveBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Save Rig"
                style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/>
          </svg>
          Save
        </button>

        <button id="createBtn" class="showDesktop bx--btn bx--btn--secondary bx--btn--sm" type="button" aria-label="Create New Rig"
                style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <g transform="rotate(90 16 16)">
              <path d="M28 24L24 24 24 20 22 20 22 24 18 24 18 26 22 26 22 30 24 30 24 26 28 26 28 24z"></path>
              <path d="M10,28V10H22v7h2V6a2.0023,2.0023,0,0,0-2-2H10A2.002,2.002,0,0,0,8,6V28a2.0023,2.0023,0,0,0,2,2h6l0-2ZM10,6H22l0,2H10Z"></path>
            </g>
          </svg>
          Create Rig
        </button>
      </div>
    </header>
  `;

  $("body").prepend(navHtml);
  // $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", function() { $("#fullscreenMenu").removeClass("active"); });


  
  $("#toggleFilterBtn").on("click", function (e) {
    e.stopPropagation();
    $("#pedalFilterInput").show().focus();
  });

  $("#addGearsTrigger").on("click", function (e) {
    e.stopPropagation();
    $("#toggleFilterBtn").trigger("click");
  });

  $("#pedalFilterInput").on("click", function (e) {
    e.stopPropagation();
  });






// Assicurati che catalog esista
window.catalog = window.catalog || [];

// --- Debounce helper ---
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

$("#pedalFilterInput").attr("placeholder", "Search pedals...");

// --- Funzione di posizionamento dropdown ---
function positionDropdown() {
    const input = document.getElementById('pedalFilterInput');
    const dropdown = document.getElementById('pedalAddDropdownContainer');
    if (!dropdown) return;
    const rect = input.getBoundingClientRect();
    dropdown.style.top = window.scrollY + rect.bottom + 'px';
    dropdown.style.left = window.scrollX + rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
}

// --- Funzione per creare dropdown se non esiste ---
function getOrCreateDropdown() {
    let dropdown = document.getElementById('pedalAddDropdownContainer');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'pedalAddDropdownContainer';
        dropdown.style.position = 'absolute';
        dropdown.style.background = 'white';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.borderRadius = '4px';
        dropdown.style.maxHeight = '200px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.display = 'none';
        dropdown.style.zIndex = 3000;
        document.body.appendChild(dropdown);
    }
    return dropdown;
}

// --- Event listener input con debounce ---
$("#pedalFilterInput").on("input", debounce(async function() {
    const query = $(this).val().trim().toLowerCase();
    const dropdown = getOrCreateDropdown();

    if (!query) {
        dropdown.style.display = 'none';
        return;
    }

    // Mostra spinner loader
    dropdown.innerHTML = `
        <div style="padding: 10px; display: flex; justify-content: center;">
            <div class="bx--loading bx--loading--small bx--loading--active" role="alert" aria-live="assertive">
                <svg class="bx--loading__svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" stroke-width="8" />
                </svg>
            </div>
        </div>
    `;
    dropdown.style.display = 'block';
    positionDropdown();

    try {
        // const res = await fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG_IDS.php?search=${encodeURIComponent(query)}`);
        // const data = await res.json();
        const authToken = localStorage.getItem('authToken');

        const res = await fetch(
            `https://www.cineteatrosanluigi.it/plex/GET_CATALOG_IDS.php?search=${encodeURIComponent(query)}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken // <--- Passiamo il JWT
                }
            }
        );
        const data = await res.json();

        dropdown.innerHTML = '';

        if (!data || !Array.isArray(data) || data.length === 0) {
            const noResult = document.createElement('div');
            noResult.textContent = 'No pedals found';
            noResult.style.padding = '6px';
            dropdown.appendChild(noResult);
            positionDropdown();
            return;
        }

        // --- Popola dropdown ---
        data.forEach(pedal => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '6px';

            const label = document.createElement('span');
            label.textContent = pedal._id;
            label.style.color = 'black';
            item.appendChild(label);

            const btn = document.createElement('button');
            btn.classList.add('bx--btn', 'bx--btn--primary', 'bx--btn--sm');
            btn.style.padding = '2px 6px';
            btn.innerHTML = `
                <svg focusable="false" preserveAspectRatio="xMidYMid meet" 
                     xmlns="http://www.w3.org/2000/svg" fill="currentColor" 
                     width="8" height="8" viewBox="0 0 16 16" aria-hidden="true">
                     <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>`;

            btn.addEventListener('click', async () => {
                const { value: rotationStr } = await Swal.fire({
                title: 'Enter rotation',
                input: 'select',
                inputOptions: {0:'0°', 90:'90°', 180:'180°', 270:'270°'},
                inputValue: '0',
                showCancelButton: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: 'bx--btn bx--btn--primary',
                    cancelButton: 'bx--btn bx--btn--secondary'
                },
                buttonsStyling: false // importante per non far sovrascrivere da Swal
            });

            if (rotationStr === undefined) return;
            const rotation = parseInt(rotationStr, 10);

            const { value: rowStr } = await Swal.fire({
                title: 'Enter row number',
                input: 'number',
                inputAttributes: { min: 1, step: 1 },
                inputValue: '1',
                showCancelButton: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: 'bx--btn bx--btn--primary',
                    cancelButton: 'bx--btn bx--btn--secondary'
                },
                buttonsStyling: false
            });

            if (rowStr === undefined) return;
            const row = parseInt(rowStr, 10);


                // --- POST per scaricare pedale dal server se non esiste nel catalogo ---
                let pedalData = window.catalog.find(p => p._id === pedal._id);
                if (!pedalData) {
                    try {
                        const postRes = await fetch("https://www.cineteatrosanluigi.it/plex/GET_PEDALS_BY_IDS.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ids: [pedal._id] })
                        });
                        const result = await postRes.json();
                        if (result?.docs?.length > 0) {
                            pedalData = result.docs[0];
                            window.catalog.push(pedalData);
                        } else {
                            console.error("Pedal not found on server:", pedal._id);
                            return;
                        }
                    } catch (err) {
                        console.error("Fetch error:", err);
                        return;
                    }
                }

                // Aggiungi il pedale alla pedalboard
                window.pedalboard.pedals.push({ pedal_id: pedal._id, rotation, row });
                renderPedalboard();

                $("#pedalFilterInput").val('');
                dropdown.style.display = 'none';
            });

            item.appendChild(btn);
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
        positionDropdown();
    } catch (err) {
        console.error("Search error:", err);
        dropdown.style.display = 'none';
    }
}, 300));

// --- Click fuori = chiudi search ---
document.addEventListener("click", function () {
  const input = $("#pedalFilterInput");
  if (!input.is(":visible")) return;

  input.hide().val("");

  const dropdown = document.getElementById("pedalAddDropdownContainer");
  if (dropdown) dropdown.style.display = "none";
});


// --- Aggiorna posizione al scroll/resize ---
window.addEventListener('scroll', positionDropdown);
window.addEventListener('resize', positionDropdown);







  // --- SHOW FILTER ONLY IF THERE'S AT LEAST ONE PEDALBOARD ---
  function updateFilterVisibility() {
    const hasBoards = Array.isArray(window.allPedalboards) && window.allPedalboards.length > 0;
    if (hasBoards) {
      $("#toggleFilterBtn").show();
    } else {
      $("#toggleFilterBtn").hide();
      $("#pedalFilterInput").hide();
    }
  }

  // Initial visibility check
  updateFilterVisibility();
  // Expose function so you can call it after creating/deleting boards
  window.updateNavFilterVisibility = updateFilterVisibility;

  if (isGuest) {
    $("#createBtn").hide();

    $("#saveBtn").html(`
      <svg focusable='false' preserveAspectRatio='xMidYMid meet'
           xmlns='http://www.w3.org/2000/svg' fill='currentColor'
           width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
        <path d='M24.8008 12.1362a8.8694 8.8694 0 00-.9795-2.5434L30 3.4142 28.5872 2 2 28.5872 3.4142 30l5-5H23.5a6.4974 6.4974 0 001.3008-12.8638zM23.5 23H10.4141L22.3418 11.0723a6.9049 6.9049 0 01.6006 2.0708l.0986.812.8154.0639A4.4975 4.4975 0 0123.5 23zM4.2964 23.4487l1.4313-1.4311A4.4774 4.4774 0 018.144 14.019l.8155-.0639.0991-.812a6.9867 6.9867 0 0110.63-5.0865l1.4431-1.4428A8.9859 8.9859 0 007.2 12.1362 6.4891 6.4891 0 004.2964 23.4487z'/>
      </svg> Offline Save
    `);

    $("#saveBtn").on("click", function() {
      if (typeof saveGuestPedalboard === "function") saveGuestPedalboard();
      if (window.allPedalboards.length === 1) setupPedalboardDropdownAndRender();
      updateFilterVisibility();
    });

    const loginBtnHtml = `<button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
          </svg>
          Login
        </button>`;
    $("#toggleFilterBtn").after(loginBtnHtml);
    $("#loginBtn").before($("#pedalFilterInput"));
    $("#loginBtn").on("click", () => window.location.href = "login");
  } else {
    $("#saveBtn").on("click", function() { if (typeof savePedalboard === "function") savePedalboard(); });
    $("#createBtn").on("click", function() { if (typeof createNewPedalboard === "function") createNewPedalboard(); });
  }
}

// ----------------------------
// plexes-share.js
// ----------------------------

// Funzione per generare UUIDv4 (standalone, senza CDN)
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Funzione per generare link condivisibile
function generateShareLink(preset) {
    // genera token solo se non esiste
    if (!preset.shared_token) {
        preset.shared_token = uuidv4();
    }
    const baseUrl = window.location.origin + '/shared/plex/';
    return baseUrl + preset.shared_token;
}

// ----------------------------
// Modal Share Plex
// ----------------------------
function openShareModal() {
    const currentPresetId = document.getElementById("presetSelect")?.value;
    const preset = window.presetMap?.[currentPresetId];

    if (!preset) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No Plex selected.',
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M20,10H7.8149l3.5874-3.5859L10,5,4,11,10,17l1.4023-1.4146L7.8179,12H20a6,6,0,0,1,0,12H12v2h8a8,8,0,0,0,0-16Z'></path></svg>Go back",
            customClass: {
                cancelButton: 'bx--btn bx--btn--secondary'
            }
        });
        return;
    }

    const isShared = preset.shared || false;

    Swal.fire({
        title: 'Share Plex',
        html: `
        Warning: this is a beta feature. Work in progress.
      <div style="text-align:left; margin-top:1rem;">
        <!-- Toggle -->
        <div class="pp-toggle">
          <input type="checkbox" id="shareToggle" ${isShared ? 'checked' : ''}>
          <label for="shareToggle">
            <span class="pp-toggle-switch"></span>
            <span id="shareToggleLabel" class="pp-toggle-text"></span>
          </label>
        </div>

        <!-- Link container -->
        <div id="shareLinkContainer" style="margin-top:1rem; display:none;">
          <div style="display:flex; gap:8px;">
            <input id="shareLinkInput" class="bx--text-input" readonly style="flex:1;">
            <button id="copyLinkBtn" class="bx--btn bx--btn--secondary bx--btn--icon-only">
              <svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
                <path d='M29.25,6.76a6,6,0,0,0-8.5,0l1.42,1.42a4,4,0,1,1,5.67,5.67l-8,8a4,4,0,1,1-5.67-5.66l1.41-1.42-1.41-1.42-1.42,1.42a6,6,0,0,0,0,8.5A6,6,0,0,0,17,25a6,6,0,0,0,4.27-1.76l8-8A6,6,0,0,0,29.25,6.76Z'></path>
                <path d='M4.19,24.82a4,4,0,0,1,0-5.67l8-8a4,4,0,0,1,5.67,0A3.94,3.94,0,0,1,19,14a4,4,0,0,1-1.17,2.85L15.71,19l1.42,1.42,2.12-2.12a6,6,0,0,0-8.51-8.51l-8,8a6,6,0,0,0,0,8.51A6,6,0,0,0,7,28a6.07,6.07,0,0,0,4.28-1.76L9.86,24.82A4,4,0,0,1,4.19,24.82Z'></path>
              </svg>
            </button>
          </div>
          <br>
        </div>
      </div>
    `,
        showCloseButton: true,
        confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Save",
        customClass: {
            confirmButton: 'bx--btn bx--btn--primary'
        },

        didOpen: () => {
            const toggle = document.getElementById("shareToggle");
            const label = document.getElementById("shareToggleLabel");
            const container = document.getElementById("shareLinkContainer");
            const input = document.getElementById("shareLinkInput");
            const copyBtn = document.getElementById("copyLinkBtn");

            // inizializza toggle basandosi sul valore salvato
            toggle.checked = !!preset.shared;

            // aggiorna UI toggle + link
            function updateUI() {
                if (toggle.checked) {
                    label.textContent = "Shared";
                    container.style.display = "block";

                    // ✅ genera SOLO se:
                    // - non esiste già
                    // - l'utente ha appena attivato lo share
                    if (!preset.shared_token) {
                        preset.shared_token = uuidv4();
                    }

                    input.value = window.location.origin + '/shared/plex/' + preset.shared_token;

                } else {
                    label.textContent = "Private";
                    container.style.display = "none";
                    input.value = "";
                }
            } 

            // chiamata iniziale per aggiornare l'UI
            updateUI();

            // cambia UI al toggle
            toggle.addEventListener("change", updateUI);

            // copy button
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(input.value);
                    copyBtn.textContent = "Copied!";
                    setTimeout(() => {
                        copyBtn.innerHTML = `<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
                            <path d='M29.25,6.76a6,6,0,0,0-8.5,0l1.42,1.42a4,4,0,1,1,5.67,5.67l-8,8a4,4,0,1,1-5.67-5.66l1.41-1.42-1.41-1.42-1.42,1.42a6,6,0,0,0,0,8.5A6,6,0,0,0,17,25a6,6,0,0,0,4.27-1.76l8-8A6,6,0,0,0,29.25,6.76Z'></path>
                            <path d='M4.19,24.82a4,4,0,0,1,0-5.67l8-8a4,4,0,0,1,5.67,0A3.94,3.94,0,0,1,19,14a4,4,0,0,1-1.17,2.85L15.71,19l1.42,1.42,2.12-2.12a6,6,0,0,0-8.51-8.51l-8,8a6,6,0,0,0,0,8.51A6,6,0,0,0,7,28a6.07,6.07,0,0,0,4.28-1.76L9.86,24.82A4,4,0,0,1,4.19,24.82Z'></path>
                        </svg>`;
                    }, 1500);
                } catch (e) {
                    console.error("Copy failed", e);
                }
            });
        },

        preConfirm: async () => {
            const enabled = document.getElementById("shareToggle").checked;
            preset.shared = enabled;

            const dbData = {
                preset_id: currentPresetId,
                shared: preset.shared,
                sharedAt: enabled ? new Date().toISOString() : null,
                shared_token: preset.shared_token,
                original_author: preset.user_id
            };

            // console.log("Dati da salvare nel DB:", dbData);

            try {
                const res = await fetch('https://api.pedalplex.com/UPDATE_PLEX.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dbData)
                });
                const json = await res.json();

                if (!json.success) {
                    Swal.showValidationMessage(json.error || 'Failed to save preset');
                    return false; // tiene aperto il modal
                }
            } catch (e) {
                Swal.showValidationMessage('Network error: ' + e);
                return false; // tiene aperto il modal
            }

            // Tutto ok: modal Share si chiude
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Your Plex sharing options have been updated.',
                    showConfirmButton: false,
                    timer: 1500
                });
            }, 100); // piccolo delay per evitare conflitti con la chiusura del modal originale

            return true; // chiude modal Share
        }
    });
}
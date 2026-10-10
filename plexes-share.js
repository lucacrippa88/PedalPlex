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
    return window.location.origin + '/shared/plex/?token=' + preset.shared_token;
}

// ---------------------------- 
// Generate Share Plex QR Code
// ----------------------------
function generateQR(link) {
    const container = document.getElementById("qrContainer");
    if (!container) return;

    container.innerHTML = "";
    container.style.position = "relative";
    container.style.display = "flex";
    container.style.justifyContent = "center";

    // wrapper per QR
    const qrWrapper = document.createElement("div");
    qrWrapper.style.position = "relative";
    container.appendChild(qrWrapper);

    // genera QR
    new QRCode(qrWrapper, {
        text: link,
        width: 180,
        height: 180,
        correctLevel: QRCode.CorrectLevel.H // to correct logo positioning
    });

    // logo centrale
    const logo = document.createElement("img");
    logo.src = "/logos/pedalplex_logo_black.png";
    logo.dataset.role = "pp-logo";

    logo.style.position = "absolute";
    logo.style.top = "50%";
    logo.style.left = "50%";
    logo.style.transform = "translate(-50%, -50%)";

    // Logo dimensions
    logo.style.width = "42px";
    logo.style.height = "42px";

    // migliora leggibilità QR
    logo.style.background = "white";
    logo.style.padding = "6px";
    logo.style.borderRadius = "8px";

    // opzionale: micro shadow per staccarlo
    logo.style.boxShadow = "0 0 4px rgba(0,0,0,0.2)";
    logo.style.objectFit = "contain";

    qrWrapper.appendChild(logo);
}

// ----------------------------
// Download QR Code as PNG
// ----------------------------
function downloadQR(presetName) {
    const qrWrapper = document.querySelector("#qrContainer > div");
    if (!qrWrapper) return;

    const qrCanvas = qrWrapper.querySelector("canvas");
    if (!qrCanvas) return;

    const size = qrCanvas.width;

    // canvas composito: QR + logo sopra
    const out = document.createElement("canvas");
    out.width = size;
    out.height = size;
    const ctx = out.getContext("2d");

    // 1. disegna il QR
    ctx.drawImage(qrCanvas, 0, 0);

    // 2. disegna il logo sopra (già caricato nel DOM, non l'img del QR)
    const logoImg = qrWrapper.querySelector("img[data-role='pp-logo']");
    if (logoImg && logoImg.complete) {
        const logoSize = 42;
        const padding = 6;
        const boxSize = logoSize + padding * 2;
        const x = (size - boxSize) / 2;
        const y = (size - boxSize) / 2;
        const radius = 8;

        // sfondo bianco arrotondato
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + boxSize - radius, y);
        ctx.quadraticCurveTo(x + boxSize, y, x + boxSize, y + radius);
        ctx.lineTo(x + boxSize, y + boxSize - radius);
        ctx.quadraticCurveTo(x + boxSize, y + boxSize, x + boxSize - radius, y + boxSize);
        ctx.lineTo(x + radius, y + boxSize);
        ctx.quadraticCurveTo(x, y + boxSize, x, y + boxSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.restore();

        ctx.drawImage(logoImg, x + padding, y + padding, logoSize, logoSize);
    }

    // 3. scarica
    const filename = (presetName || "plex").replace(/[^a-z0-9_\-]/gi, "_") + "_qr.png";
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = filename;
    a.click();
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

    const isShared = Boolean(preset.shared);

    Swal.fire({
        title: 'Share Plex',
        html: `
        Share your entire Rig configuration with a friend.
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
                <button id="copyLinkBtn" class="bx--btn bx--btn--secondary bx--btn--icon-only" title="Copy link">
                <svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
                    <path d='M29.25,6.76a6,6,0,0,0-8.5,0l1.42,1.42a4,4,0,1,1,5.67,5.67l-8,8a4,4,0,1,1-5.67-5.66l1.41-1.42-1.41-1.42-1.42,1.42a6,6,0,0,0,0,8.5A6,6,0,0,0,17,25a6,6,0,0,0,4.27-1.76l8-8A6,6,0,0,0,29.25,6.76Z'></path>
                    <path d='M4.19,24.82a4,4,0,0,1,0-5.67l8-8a4,4,0,0,1,5.67,0A3.94,3.94,0,0,1,19,14a4,4,0,0,1-1.17,2.85L15.71,19l1.42,1.42,2.12-2.12a6,6,0,0,0-8.51-8.51l-8,8a6,6,0,0,0,0,8.51A6,6,0,0,0,7,28a6.07,6.07,0,0,0,4.28-1.76L9.86,24.82A4,4,0,0,1,4.19,24.82Z'></path>
                </svg>
                </button>
                <button id="downloadQrBtn" class="bx--btn bx--btn--secondary bx--btn--icon-only" title="Download QR code" style="display:none;">
                <svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'>
                    <path d='M26 24v4H6v-4H4v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-4z'></path>
                    <path d='M26 14l-1.41-1.41L17 20.17V2h-2v18.17l-7.59-7.58L6 14l10 10 10-10z'></path>
                </svg>
                </button>
            </div>
            <br>
            
            <!-- QR container -->
            <div id="qrContainer" style="margin-top:10px; display:none; justify-content:center"></div>
            </div>

        </div>
        `,
        showCloseButton: true,
        confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Apply",
        customClass: {
            confirmButton: 'bx--btn bx--btn--primary'
        },

        didOpen: () => {
            const toggle = document.getElementById("shareToggle");
            const label = document.getElementById("shareToggleLabel");
            const container = document.getElementById("shareLinkContainer");
            const input = document.getElementById("shareLinkInput");
            const copyBtn = document.getElementById("copyLinkBtn");
            const downloadQrBtn = document.getElementById("downloadQrBtn");
            const qrContainer = document.getElementById("qrContainer");

            // inizializza toggle basandosi sul valore salvato
            toggle.checked = !!preset.shared;

            let userInteracted = false;

            // aggiorna UI toggle + link
            function updateUI() {
                if (toggle.checked) {
                    label.textContent = "Shared";
                    container.style.display = "block";
                    qrContainer.style.display = "flex";

                    // genera SOLO dopo interazione utente
                    if (userInteracted && !preset.shared_token) {
                        preset.shared_token = uuidv4();
                    }

                    if (preset.shared_token) {
                        const link = window.location.origin + '/shared/plex/?token=' + preset.shared_token;
                        input.value = link;

                        generateQR(link);
                        downloadQrBtn.style.display = "";
                    }

                } else {
                    label.textContent = "Private";
                    container.style.display = "none";
                    qrContainer.style.display = "none";
                    downloadQrBtn.style.display = "none";
                    input.value = "";
                }
            }

            // chiamata iniziale per aggiornare l'UI
            updateUI();

            // cambia UI al toggle
            toggle.addEventListener("change", () => {
                userInteracted = true;
                updateUI();
            });

            // download QR button
            downloadQrBtn.addEventListener("click", () => {
                downloadQR(preset.preset_name);
            });

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
            preset.sharedAt = enabled ? new Date().toISOString() : null;

            const dbData = {
                preset_id: currentPresetId,
                shared: preset.shared,
                sharedAt: preset.sharedAt,
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

                if (typeof window.updateSharePresetButtonState === 'function') {
                    window.updateSharePresetButtonState(preset);
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
















// =================== LOAD SHARED PLEX IN PREVIEW MODE =======================
function getSharedPlexAuthorId(plex) {
    return plex.original_author || plex.user_id || plex.owner_id || plex.author_id || null;
}

async function fetchBoardForSharedPlex(plex) {
    const embeddedBoard = plex.board || plex.pedalboard || plex.rig;
    if (embeddedBoard?.pedals && Array.isArray(embeddedBoard.pedals)) {
        return embeddedBoard;
    }

    const boardId = plex.board_id || plex.boardId;
    const authorId = getSharedPlexAuthorId(plex);

    if (!boardId || !authorId) {
        throw new Error("Shared Plex is missing board or author information.");
    }

    const rigRes = await fetch('https://api.pedalplex.com/GET_RIG.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: authorId,
            board_id: boardId
        })
    });

    if (!rigRes.ok) throw new Error(`Failed to fetch source rig: ${rigRes.statusText}`);

    const rigData = await rigRes.json();
    const boards = Array.isArray(rigData.docs) ? rigData.docs : [];
    const board = boards.find(b => b._id === boardId || b.id === boardId);

    if (!board) {
        throw new Error("Source rig for shared Plex was not found.");
    }

    return board;
}

async function loadSharedPlexPreview() {
    console.log("🔹 loadSharedPlexPreview started, window.location.href:", window.location.href);
    resultsDiv = document.getElementById("page-content");

    // Helper per leggere query string
    function getQueryParam(name) {
        name = name.replace(/[\[\]]/g, "\\$&");
        const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        const results = regex.exec(window.location.href);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    const token = getQueryParam('shared_token');
    console.log("🔹 shared_token:", token);
    if (!token) {
        console.warn('No shared_token in URL');
        return;
    }

    try {
        // 1️⃣ Fetch del plex condiviso
        const plexRes = await fetch(`https://api.pedalplex.com/GET_SHARED_PLEX.php?token=${encodeURIComponent(token)}`);
        if (!plexRes.ok) throw new Error(`Failed to fetch shared plex: ${plexRes.statusText}`);
        const plexData = await plexRes.json();
        if (!plexData.plex) throw new Error("Shared Plex not found.");

        const plex = plexData.plex;
        window.sharedPlexData = plex; // store for import
        console.log("🔹 Shared plex loaded:", plex);

        // 2️⃣ Recupera la pedaliera originale, così manteniamo ordine e posizionamento
        const sourceBoard = await fetchBoardForSharedPlex(plex);
        const boardPedals = Array.isArray(sourceBoard.pedals) ? sourceBoard.pedals : [];
        const pedalIds = [...new Set(boardPedals.map(p => p.pedal_id || p._id).filter(Boolean))];

        if (pedalIds.length === 0) {
            throw new Error("Source rig has no gears.");
        }

        const gearsRes = await fetch('https://api.pedalplex.com/GET_GEARS_BY_IDS.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: pedalIds })
        });
        if (!gearsRes.ok) throw new Error(`Failed to fetch gears: ${gearsRes.statusText}`);
        const gearsData = await gearsRes.json();
        if (!gearsData.docs) throw new Error("No gears returned.");

        const pedals = {};
        gearsData.docs.forEach(doc => {
            pedals[doc._id] = doc;
        });

        console.log("🔹 Gears loaded:", pedals);

        // 3️⃣ Costruisci catalog completo della pedaliera originale
        window.catalog = gearsData.docs;
        window.catalogMap = {};
        window.catalog.forEach(p => {
            window.catalogMap[p._id] = p;
        });

        // 4️⃣ Usa la pedaliera originale: ordine, righe, rotazione e offset restano corretti
        window.pedalboard = {
            ...sourceBoard,
            board_name: sourceBoard.board_name || plex.board_name || "Shared Rig",
            pedals: boardPedals
        };

        await renderFullPedalboard(window.pedalboard);

        setTimeout(() => {
            applyPresetToPedalboard(plex);
        }, 100); // 100ms per lasciare completare il DOM

        // 5️⃣ Mostra info plex
        const date = new Date(plex.sharedAt);
        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
                              ', ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const authorName = plex.original_author.replace(/^user_/, '');
        $("#previewPlexData").html(`Previewing <strong>${plex.preset_name}</strong>, by <strong>${authorName}</strong> - shared on ${formattedDate}`)
                               .css("display", "block");

    } catch (err) {
        console.error("Error loading shared plex:", err);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load shared plex. Check console for details.",
            confirmButtonText: "Ok"
        });
    }
}


// Chiamare solo in preview mode
window.addEventListener("load", function () {
    if (window.isPreviewMode) {
        loadSharedPlexPreview();
    }
});


// =================== IMPORT SHARED PLEX =======================

/**
 * Opens a two-step modal to import a shared plex into the current user's account.
 * Step 1 – choose import mode: create a new rig OR apply to an existing rig.
 * Step 2 – configure the details for the chosen mode, then save.
 */
async function openImportSharedPlexModal() {
    const plex = window.sharedPlexData;
    if (!plex) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Shared plex data not loaded yet. Please wait and try again.', showConfirmButton: false, timer: 2000 });
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        Swal.fire({
            icon: 'info',
            title: 'Login required',
            text: 'You need to be logged in to import a Plex into your account.',
            confirmButtonText: 'Log in',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        }).then(r => { if (r.isConfirmed) window.location.href = '/login'; });
        return;
    }

    // ── Step 1: choose import mode ────────────────────────────────────────────
    const { value: mode } = await Swal.fire({
        title: 'Import Plex',
        html: `
            <p style="margin-bottom:1.25rem;text-align:left;">How do you want to import <strong>${plex.preset_name || 'this Plex'}</strong>?</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--cds-ui-03,#e0e0e0);border-radius:4px;cursor:pointer;text-align:left;">
                    <input type="radio" name="importMode" value="new" style="margin-top:3px;flex-shrink:0;">
                    <span>
                        <strong>Create a new Rig</strong><br>
                        <span style="font-size:0.85em;color:#6f6f6f;">A new Rig with all the pedals from this Plex will be created in your account.</span>
                    </span>
                </label>
                <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--cds-ui-03,#e0e0e0);border-radius:4px;cursor:pointer;text-align:left;">
                    <input type="radio" name="importMode" value="existing" style="margin-top:3px;flex-shrink:0;">
                    <span>
                        <strong>Apply to an existing Rig</strong><br>
                        <span style="font-size:0.85em;color:#6f6f6f;">Settings will be applied only to pedals already present in the chosen Rig (matched by type).</span>
                    </span>
                </label>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Next →',
        cancelButtonText: 'Cancel',
        customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' },
        preConfirm: () => {
            const selected = document.querySelector('input[name="importMode"]:checked');
            if (!selected) { Swal.showValidationMessage('Please select an option.'); return false; }
            return selected.value;
        }
    });

    if (!mode) return; // cancelled

    if (mode === 'new') {
        await _importSharedPlexToNewRig(plex, token);
    } else {
        await _importSharedPlexToExistingRig(plex, token);
    }
}

// ── Import: create new rig then attach plex ───────────────────────────────────
async function _importSharedPlexToNewRig(plex, token) {
    // Ask for plex name (pre-filled)
    const { value: plexName } = await Swal.fire({
        title: 'Create a new Rig',
        html: `
            <p style="text-align:left;margin-bottom:1rem;">A new Rig with the same pedals will be created. You can customise it afterwards from the <a href="/rigs">Rigs page</a>.</p>
            <label class="bx--label" style="display:block;text-align:left;margin-bottom:4px;">Plex name</label>
            <input id="importPlexName" class="bx--text-input" value="${(plex.preset_name || 'Imported Plex').replace(/"/g, '&quot;')}" maxlength="100" style="width:100%;">`,
        showCancelButton: true,
        confirmButtonText: 'Import',
        cancelButtonText: '← Back',
        customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' },
        preConfirm: () => {
            const name = document.getElementById('importPlexName')?.value?.trim();
            if (!name) { Swal.showValidationMessage('Please enter a Plex name.'); return false; }
            return name;
        },
        didOpen: () => { document.getElementById('importPlexName')?.select(); }
    });

    if (plexName === undefined) {
        // "Back" — re-open step 1
        openImportSharedPlexModal();
        return;
    }

    // We can't create a Rig server-side without extra info; instead redirect to /rigs
    // with the shared plex data in sessionStorage so the Rigs page can pre-populate it.
    const importPayload = {
        source: 'shared_plex_import',
        plex_name: plexName,
        plex: plex,
        board: window.pedalboard   // the source board (pedals + gear layout)
    };
    sessionStorage.setItem('pp_import_shared_plex', JSON.stringify(importPayload));
    window.location.href = '/rigs?import_shared_plex=1';
}

// ── Import: apply plex settings to an existing rig ───────────────────────────
async function _importSharedPlexToExistingRig(plex, token) {
    // 1. Fetch user's rigs
    let userRigs = [];
    try {
        const authPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = 'user_' + (authPayload.username || authPayload.sub || '');
        const res = await fetch('https://api.pedalplex.com/GET_RIG.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        if (!res.ok) throw new Error('Failed to fetch rigs');
        const data = await res.json();
        userRigs = Array.isArray(data.docs) ? data.docs : [];
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load your Rigs. Please try again.', showConfirmButton: false, timer: 2000 });
        return;
    }

    if (userRigs.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Rigs found',
            text: "You don't have any Rigs yet. Create one first!",
            confirmButtonText: 'Go to Rigs',
            customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        }).then(r => { if (r.isConfirmed) window.location.href = '/rigs'; });
        return;
    }

    // 2. Build rig selector options
    const rigOptions = userRigs.map((b, i) => `<option value="${i}">${b.board_name || 'Rig ' + (i + 1)}</option>`).join('');

    // 3. Source pedals from the shared plex
    const sourcePedalSettings = plex.pedals || {};   // { pedal_id: { controls: {...} }, ... }
    const sourcePedalIds = Object.keys(sourcePedalSettings);

    // Helper: compute how many pedals match between source plex and a target board
    function countMatches(board) {
        const boardPedalIds = (board.pedals || []).map(p => String(p.pedal_id || p._id));
        return sourcePedalIds.filter(id => boardPedalIds.includes(String(id))).length;
    }

    // Sort rigs: most matches first
    userRigs.sort((a, b) => countMatches(b) - countMatches(a));
    const sortedOptions = userRigs.map((b, i) => {
        const m = countMatches(b);
        const label = b.board_name || 'Rig ' + (i + 1);
        const hint = m > 0 ? ` (${m} matching pedal${m > 1 ? 's' : ''})` : ' (no match)';
        return `<option value="${i}"${m === 0 ? ' style="color:#a8a8a8"' : ''}>${label}${hint}</option>`;
    }).join('');

    // 4. Show rig selector + preview of matched pedals
    function buildMatchPreview(rigIndex) {
        const board = userRigs[rigIndex];
        const boardPedalIds = (board.pedals || []).map(p => String(p.pedal_id || p._id));
        const matched = sourcePedalIds.filter(id => boardPedalIds.includes(String(id)));
        const unmatched = sourcePedalIds.filter(id => !boardPedalIds.includes(String(id)));

        let html = '';
        if (matched.length > 0) {
            const names = matched.map(id => {
                const gear = window.catalogMap?.[id];
                return gear ? `<strong>${gear.brand || ''} ${gear.model || id}</strong>` : `<em>${id}</em>`;
            }).join(', ');
            html += `<p style="margin-top:10px;font-size:0.875rem;">✅ Settings will be applied to: ${names}.</p>`;
        }
        if (unmatched.length > 0) {
            const names = unmatched.map(id => {
                const gear = window.catalogMap?.[id];
                return gear ? `${gear.brand || ''} ${gear.model || id}` : id;
            }).join(', ');
            html += `<p style="margin-top:6px;font-size:0.875rem;color:#6f6f6f;">⚠️ Not in this Rig (skipped): ${names}.</p>`;
        }
        if (matched.length === 0) {
            html += `<p style="margin-top:10px;font-size:0.875rem;color:#da1e28;">⚠️ No matching pedals found — nothing will be imported.</p>`;
        }
        return html;
    }

    const { value: formData } = await Swal.fire({
        title: 'Apply to existing Rig',
        html: `
            <p style="text-align:left;margin-bottom:1rem;">Choose the Rig and a name for the new Plex. Settings will be applied only to matching pedals.</p>
            <label class="bx--label" style="display:block;text-align:left;margin-bottom:4px;">Target Rig</label>
            <select id="importRigSelect" class="bx--select-input" style="width:100%;margin-bottom:8px;">${sortedOptions}</select>
            <div id="importMatchPreview" style="min-height:40px;"></div>
            <label class="bx--label" style="display:block;text-align:left;margin-top:12px;margin-bottom:4px;">Plex name</label>
            <input id="importPlexName2" class="bx--text-input" value="${(plex.preset_name || 'Imported Plex').replace(/"/g, '&quot;')}" maxlength="100" style="width:100%;">`,
        showCancelButton: true,
        confirmButtonText: 'Import',
        cancelButtonText: '← Back',
        customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' },
        didOpen: () => {
            const sel = document.getElementById('importRigSelect');
            const preview = document.getElementById('importMatchPreview');
            function refresh() { preview.innerHTML = buildMatchPreview(parseInt(sel.value, 10)); }
            refresh();
            sel.addEventListener('change', refresh);
        },
        preConfirm: () => {
            const rigIndex = parseInt(document.getElementById('importRigSelect')?.value, 10);
            const plexName = document.getElementById('importPlexName2')?.value?.trim();
            if (!plexName) { Swal.showValidationMessage('Please enter a Plex name.'); return false; }
            return { rigIndex, plexName };
        }
    });

    if (formData === undefined) {
        // "Back" — re-open step 1
        openImportSharedPlexModal();
        return;
    }

    const { rigIndex, plexName } = formData;
    const targetBoard = userRigs[rigIndex];

    // 5. Build filtered pedals object (only matched pedals)
    const boardPedalIds = new Set((targetBoard.pedals || []).map(p => String(p.pedal_id || p._id)));
    const filteredPedals = {};
    Object.entries(sourcePedalSettings).forEach(([id, settings]) => {
        if (boardPedalIds.has(String(id))) {
            filteredPedals[id] = settings;
        }
    });

    if (Object.keys(filteredPedals).length === 0) {
        const goAnyway = await Swal.fire({
            icon: 'warning',
            title: 'No matching pedals',
            text: 'None of the pedals in this Plex match the selected Rig. The imported Plex will have no settings. Do you want to continue anyway?',
            showCancelButton: true,
            confirmButtonText: 'Import anyway',
            cancelButtonText: 'Cancel',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        });
        if (!goAnyway.isConfirmed) return;
    }

    // 6. Save via CREATE_PLEX.php
    try {
        const res = await fetch('https://api.pedalplex.com/CREATE_PLEX.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                board_id:    targetBoard._id,
                board_name:  targetBoard.board_name || '',
                preset_name: plexName,
                pedals:      filteredPedals
            })
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Unknown error');

        Swal.fire({
            icon: 'success',
            title: 'Plex imported!',
            html: `<strong>${plexName}</strong> has been added to <strong>${targetBoard.board_name}</strong>.
                   <br><a href="/plexes" style="color:var(--cds-link-01,#0f62fe);">Go to Plexes →</a>`,
            confirmButtonText: 'Go to Plexes',
            showCancelButton: true,
            cancelButtonText: 'Stay here',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        }).then(r => { if (r.isConfirmed) window.location.href = '/plexes'; });
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Import failed', text: e.message || 'Could not save the Plex. Please try again.', showConfirmButton: false, timer: 2500 });
    }
}


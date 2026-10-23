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
            text: `No ${L.plex} selected.`,
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
        title: `Share ${L.Plex}`,
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
                    text: `Your ${L.plex} sharing options have been updated.`,
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
        throw new Error(`Shared ${L.Plex} is missing board or author information.`);
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
        throw new Error(`Source rig for shared ${L.Plex} was not found.`);
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
        if (!plexRes.ok) throw new Error(`Failed to fetch shared ${L.plex}: ${plexRes.statusText}`);
        const plexData = await plexRes.json();
        if (!plexData.plex) throw new Error(`Shared ${L.Plex} not found.`);

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
        console.error(`Error loading shared ${L.plex}:`, err);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: `Failed to load shared ${L.plex}. Check console for details.`,
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
        Swal.fire({ icon: 'error', title: 'Error', text: `Shared ${L.plex} data not loaded yet. Please wait and try again.`, showConfirmButton: false, timer: 2000 });
        return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
        Swal.fire({
            icon: 'info',
            title: 'Login required',
            text: `You need to be logged in to import a ${L.Plex} into your account.`,
            confirmButtonText: 'Log in',
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        }).then(r => { if (r.isConfirmed) window.location.href = '/login'; });
        return;
    }

    // ── Step 1: choose import mode ────────────────────────────────────────────
    const { value: mode } = await Swal.fire({
        title: `Import ${L.Plex}`,
        html: `
            <p style="margin-bottom:1.25rem;text-align:left;">How do you want to import <strong>${plex.preset_name || ('this ' + L.Plex)}</strong>?</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <label style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border:1px solid var(--cds-ui-03,#e0e0e0);border-radius:4px;cursor:pointer;text-align:left;">
                    <input type="radio" name="importMode" value="new" style="margin-top:3px;flex-shrink:0;">
                    <span>
                        <strong>Create a new Rig</strong><br>
                        <span style="font-size:0.85em;color:#6f6f6f;">A new Rig with all the pedals from this ${L.Plex} will be created in your account.</span>
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
            <label class="bx--label" style="display:block;text-align:left;margin-bottom:4px;">${L.Plex} name</label>
            <input id="importPlexName" class="bx--text-input" value="${(plex.preset_name || ('Imported ' + L.Plex)).replace(/"/g, '&quot;')}" maxlength="100" style="width:100%;">`,
        showCancelButton: true,
        confirmButtonText: 'Import',
        cancelButtonText: '← Back',
        customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' },
        preConfirm: () => {
            const name = document.getElementById('importPlexName')?.value?.trim();
            if (!name) { Swal.showValidationMessage(`Please enter a ${L.Plex} name.`); return false; }
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

    // 2. Source pedals from the shared plex
    const sourcePedalSettings = plex.pedals || {};   // { pedal_id: { controls: {label: value} } }
    const sourcePedalIds = Object.keys(sourcePedalSettings);

    // Source gear info from the already-loaded catalogMap (populated by loadSharedPlexPreview)
    const sourceGearMap = {};  // { id: gear doc }
    sourcePedalIds.forEach(id => {
        const g = window.catalogMap?.[id] || window.catalog?.find(c => c._id === id);
        if (g) sourceGearMap[id] = g;
    });

    // 3. Fetch catalog data for all target rig pedals (needed for fuzzy matching)
    const allTargetPedalIds = new Set();
    userRigs.forEach(b => (b.pedals || []).forEach(p => {
        const id = p.pedal_id || p._id;
        if (id) allTargetPedalIds.add(String(id));
    }));
    // Remove IDs already in catalogMap
    const missingIds = Array.from(allTargetPedalIds).filter(id => !window.catalogMap?.[id]);
    let targetCatalogMap = Object.assign({}, window.catalogMap || {});
    if (missingIds.length > 0) {
        try {
            const gRes = await fetch('https://api.pedalplex.com/GET_GEARS_BY_IDS.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: missingIds })
            });
            const gData = await gRes.json();
            (gData.docs || []).forEach(g => { targetCatalogMap[g._id] = g; });
        } catch (e) { /* continue without extra catalog data */ }
    }

    // ── Matching helpers ──────────────────────────────────────────────────────

    /**
     * Semantic synonym clusters for common pedal control labels.
     * Each cluster is a set of normalised strings that mean the same thing.
     * Order within a cluster doesn't matter; membership is checked both ways.
     */
    const LABEL_SYNONYMS = [
        // gain / drive
        ['gain', 'drive', 'distortion', 'dist', 'overdrive', 'fuzz', 'crunch', 'saturation', 'grit', 'grind', 'breakup', 'clip', 'clipping', 'amt'],
        // level / volume / output
        ['level', 'volume', 'output', 'vol', 'out', 'outputlevel', 'outputvol', 'outvolume', 'master', 'mastervol', 'masterlevel'],
        // tone / treble / brightness
        ['tone', 'treble', 'bright', 'brightness', 'highs', 'high', 'trebleboost', 'tonecontrol', 'topend'],
        // bass / low
        ['bass', 'low', 'lows', 'lowend', 'bottom', 'sub'],
        // mid / mids
        ['mid', 'mids', 'midrange', 'middle', 'midboost', 'freq', 'frequency'],
        // presence / contour
        ['presence', 'contour', 'scoop', 'edge', 'definition', 'clarity'],
        // mix / blend / wet
        ['mix', 'blend', 'drywet', 'wet', 'dry', 'effect', 'effectlevel', 'efxlevel', 'fxlevel'],
        // rate / speed / tempo
        ['rate', 'speed', 'tempo', 'lfo', 'lforate', 'lfospeed', 'oscillation'],
        // depth / intensity / width (modulation depth)
        ['depth', 'intensity', 'width', 'modulation', 'mod', 'modamt', 'modulation'],
        // feedback / repeats / regen
        ['feedback', 'repeats', 'regeneration', 'regen', 'recycle', 'tail'],
        // time / delay time
        ['time', 'delay', 'delaytime', 'echotime', 'repeat'],
        // reverb / decay / room size
        ['reverb', 'decay', 'size', 'reverbtime', 'room', 'hall', 'plate', 'spring', 'roomsize'],
        // filter / cutoff / wah / envelope
        ['filter', 'cutoff', 'wah', 'sweep', 'peak', 'resonance', 'q', 'envelope', 'sense', 'sensitivity'],
        // phase stages
        ['phase', 'phaseshift', 'stages'],
        // pitch / detune / octave
        ['pitch', 'interval', 'detune', 'pitchshift', 'harmony', 'harmonize', 'octave'],
        // chorus
        ['chorus', 'chorusdepth'],
        // attack (compressor / envelope)
        ['attack'],
        // release / sustain (compressor)
        ['release', 'sustain', 'sustainer', 'compression', 'compress', 'squeeze', 'ratio', 'threshold'],
        // boost / input trim
        ['boost', 'pregain', 'trim', 'input', 'inputlevel', 'inputgain'],
        // cut (hi/lo cut, tone cut)
        ['cut', 'hicut', 'locut', 'treblecut', 'basscut', 'rolloff'],
    ];

    // Build a reverse lookup: normalisedLabel → clusterIndex
    const _labelToCluster = {};
    LABEL_SYNONYMS.forEach((cluster, idx) => {
        cluster.forEach(word => { _labelToCluster[word] = idx; });
    });

    /**
     * Known single-letter/abbreviation prefixes used in pedal label shorthands.
     * e.g. "E.Level" → "effectlevel", "F.Back" → "feedback", "D.Time" → "delaytime"
     */
    const ABBREV_PREFIX = {
        'e': 'effect', 'f': 'feedback', 'd': 'delay', 'r': 'rate',
        'l': 'level',  'v': 'volume',  't': 'time',  'm': 'mix',
    };

    /** Normalise a control label: lowercase, strip non-alphanumeric */
    function _normLabel(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    /**
     * Map a label string to its cluster index (or -1 if not in any cluster).
     * Resolution order:
     *   1. Full normalised string exact match  ("feedback" → cluster)
     *   2. Abbreviated prefix expansion: "D.Time" → try "delaytime", then "delay", then "time"
     *   3. Word-by-word for compound labels:  "Output Level" → try "output", "level"
     */
    function _clusterOf(label) {
        const n = _normLabel(label);

        // 1. Exact full match
        if (_labelToCluster[n] !== undefined) return _labelToCluster[n];

        // 2. Abbreviated prefix: letter + separator + rest  (e.g. "D.Time", "E Level", "F-back")
        const abbrevMatch = String(label || '').trim().match(/^([a-zA-Z])[.\-_\s]+(.+)$/);
        if (abbrevMatch) {
            const prefix = ABBREV_PREFIX[abbrevMatch[1].toLowerCase()];
            const rest   = _normLabel(abbrevMatch[2]);
            if (prefix) {
                // Try combined ("delaytime"), then prefix alone ("delay"), then rest alone ("time")
                const candidates = [prefix + rest, prefix, rest];
                for (const c of candidates) {
                    if (_labelToCluster[c] !== undefined) return _labelToCluster[c];
                }
            }
        }

        // 3. Word-by-word for compound labels ("Output Level" → "output", "level")
        const words = n.match(/[a-z]+/g) || [];
        for (const w of words) {
            if (_labelToCluster[w] !== undefined) return _labelToCluster[w];
        }

        return -1; // unknown
    }

    /** Extract flat list of control labels from a gear's controls array */
    function _gearControlLabels(gear) {
        if (!gear || !Array.isArray(gear.controls)) return [];
        const labels = [];
        gear.controls.forEach(row => {
            (row.row || []).forEach(ctrl => { if (ctrl.label) labels.push(ctrl.label); });
        });
        return labels;
    }

    /**
     * Compute similarity score (0–1) between two label sets using cluster-aware Jaccard.
     * Labels in the same synonym cluster count as a match even if the strings differ.
     */
    function _controlSimilarity(labelsA, labelsB) {
        if (!labelsA.length || !labelsB.length) return 0;

        // Map each label to its cluster (or its own norm string if not in a cluster)
        function toKey(l) {
            const c = _clusterOf(l);
            return c >= 0 ? 'cluster:' + c : 'raw:' + _normLabel(l);
        }

        const setA = new Set(labelsA.map(toKey));
        const setB = new Set(labelsB.map(toKey));
        let intersection = 0;
        setA.forEach(k => { if (setB.has(k)) intersection++; });
        return intersection / (setA.size + setB.size - intersection);
    }

    const FUZZY_SIMILARITY_THRESHOLD = 0.3; // at least 30% cluster-based overlap

    /**
     * For a source pedal id, find the best match in the target board.
     * Returns { type: 'exact'|'fuzzy'|'none', targetId, score, matchedLabels, labelMap, tGear }
     * labelMap: { srcLabel → targetLabel } for fuzzy transfers
     */
    function _findBestMatch(srcId, boardPedals) {
        const srcGear = sourceGearMap[srcId];

        // Exact match: same pedal ID
        const exactTarget = boardPedals.find(p => String(p.pedal_id || p._id) === String(srcId));
        if (exactTarget) {
            return { type: 'exact', targetId: String(srcId), score: 1,
                     matchedLabels: Object.keys(sourcePedalSettings[srcId]?.controls || {}),
                     labelMap: null, tGear: null };
        }

        // Fuzzy: same category + cluster-aware label similarity
        if (!srcGear) return { type: 'none' };
        const srcCategory = (srcGear.category || '').toLowerCase().trim();
        const srcLabels = _gearControlLabels(srcGear);

        let best = null;
        boardPedals.forEach(p => {
            const tId = String(p.pedal_id || p._id);
            const tGear = targetCatalogMap[tId];
            if (!tGear) return;
            const tCategory = (tGear.category || '').toLowerCase().trim();
            if (!srcCategory || !tCategory || srcCategory !== tCategory) return;

            const tLabels = _gearControlLabels(tGear);
            const score = _controlSimilarity(srcLabels, tLabels);
            if (score >= FUZZY_SIMILARITY_THRESHOLD && (!best || score > best.score)) {
                // Build labelMap: srcLabel → best matching tLabel (same cluster or exact norm)
                const labelMap = {};
                const matchedLabels = [];
                srcLabels.forEach(sl => {
                    const sc = _clusterOf(sl);
                    const sn = _normLabel(sl);
                    // 1. Exact norm match
                    const exactTLabel = tLabels.find(tl => _normLabel(tl) === sn);
                    if (exactTLabel) { labelMap[sl] = exactTLabel; matchedLabels.push(sl); return; }
                    // 2. Same cluster match (pick first available in target)
                    if (sc >= 0) {
                        const clusterTLabel = tLabels.find(tl => _clusterOf(tl) === sc);
                        if (clusterTLabel) { labelMap[sl] = clusterTLabel; matchedLabels.push(sl); }
                    }
                });
                best = { type: 'fuzzy', targetId: tId, score, matchedLabels, labelMap, tGear };
            }
        });
        return best || { type: 'none' };
    }

    /**
     * Build a flat lookup { label → ctrl } for a gear's controls, for value validation.
     * Used to check whether a value is valid for a discrete/multi control.
     */
    function _buildCtrlMeta(gear) {
        const meta = {};
        if (!gear || !Array.isArray(gear.controls)) return meta;
        gear.controls.forEach(row => {
            (row.row || []).forEach(ctrl => {
                if (ctrl.label) meta[ctrl.label] = ctrl;
            });
        });
        return meta;
    }

    /**
     * Sanitise a value before storing it on a target control.
     * - Continuous (knob with min/max): clamp to [min, max].
     * - Discrete/multi (knob with values[] or multi): use value only if it
     *   exists in target's values array; otherwise use the target's default value.
     * Returns the sanitised value, or null to skip the control entirely.
     */
    function _sanitiseValue(value, targetCtrl) {
        if (!targetCtrl) return value; // no metadata — pass through

        const hasValues = Array.isArray(targetCtrl.values) && targetCtrl.values.length > 0;
        if (hasValues) {
            // Discrete / multi: value must be in the target's allowed set
            const strVal = String(value);
            if (targetCtrl.values.includes(strVal) || targetCtrl.values.includes(value)) {
                return value; // valid
            }
            // Not valid → use target's default (first value or stored default)
            return targetCtrl.value !== undefined ? targetCtrl.value : targetCtrl.values[0];
        }

        // Continuous: clamp
        if (targetCtrl.min !== undefined && targetCtrl.max !== undefined) {
            const num = parseFloat(value);
            if (!isNaN(num)) return Math.min(targetCtrl.max, Math.max(targetCtrl.min, num));
        }

        return value;
    }

    /**
     * Build the filtered pedals object for saving.
     * Exact match: copy settings as-is under the same pedal id.
     * Fuzzy match: remap each source label to its target label via labelMap,
     *              storing the value under the TARGET label so it lands on the right knob.
     *              Discrete controls whose source value is not in the target's value set
     *              are reset to the target's default instead of being transferred as-is.
     */
    function _buildFilteredPedals(rigIndex) {
        const board = userRigs[rigIndex];
        const boardPedals = board.pedals || [];
        const result = {};

        sourcePedalIds.forEach(srcId => {
            const match = _findBestMatch(srcId, boardPedals);
            if (match.type === 'none') return;

            const srcControls = sourcePedalSettings[srcId]?.controls || {};

            if (match.type === 'exact') {
                // For exact matches we still sanitise discrete values against the
                // target gear's metadata (same pedal type, but let's be safe).
                const tGearMeta = _buildCtrlMeta(targetCatalogMap[match.targetId]);
                const sanitised = {};
                Object.entries(srcControls).forEach(([label, value]) => {
                    sanitised[label] = _sanitiseValue(value, tGearMeta[label]);
                });
                result[match.targetId] = { ...sourcePedalSettings[srcId], controls: sanitised };
                return;
            }

            // Fuzzy: remap source labels to target labels + sanitise values
            const tGearMeta = _buildCtrlMeta(match.tGear);
            const filteredControls = {};
            Object.entries(srcControls).forEach(([srcLabel, value]) => {
                const targetLabel = match.labelMap?.[srcLabel];
                if (!targetLabel) return;
                const sanitised = _sanitiseValue(value, tGearMeta[targetLabel]);
                if (sanitised !== null) filteredControls[targetLabel] = sanitised;
            });
            if (Object.keys(filteredControls).length > 0) {
                result[match.targetId] = { controls: filteredControls };
            }
        });

        return result;
    }

    // 4. Helper to count exact + fuzzy matches for a board (used for sorting + dropdown hints)
    function _countMatchSummary(board) {
        const boardPedals = board.pedals || [];
        let exact = 0, fuzzy = 0;
        sourcePedalIds.forEach(id => {
            const m = _findBestMatch(id, boardPedals);
            if (m.type === 'exact') exact++;
            else if (m.type === 'fuzzy') fuzzy++;
        });
        return { exact, fuzzy, total: exact + fuzzy };
    }

    // Sort rigs: most matches first
    userRigs.sort((a, b) => {
        const sa = _countMatchSummary(a), sb = _countMatchSummary(b);
        if (sb.total !== sa.total) return sb.total - sa.total;
        return sb.exact - sa.exact;
    });

    const sortedOptions = userRigs.map((b, i) => {
        const { exact, fuzzy, total } = _countMatchSummary(b);
        const label = b.board_name || 'Rig ' + (i + 1);
        let hint = '';
        if (exact > 0 && fuzzy > 0) hint = ` (${exact} exact, ${fuzzy} similar)`;
        else if (exact > 0) hint = ` (${exact} exact match${exact > 1 ? 'es' : ''})`;
        else if (fuzzy > 0) hint = ` (${fuzzy} similar)`;
        else hint = ' (no match)';
        return `<option value="${i}"${total === 0 ? ' style="color:#a8a8a8"' : ''}>${label}${hint}</option>`;
    }).join('');

    // 5. Build match preview HTML for a selected rig
    function buildMatchPreview(rigIndex) {
        const board = userRigs[rigIndex];
        const boardPedals = board.pedals || [];
        const rows = [];

        sourcePedalIds.forEach(srcId => {
            const match = _findBestMatch(srcId, boardPedals);
            const srcGear = sourceGearMap[srcId];
            const srcName = srcGear ? `${srcGear.brand || ''} ${srcGear.model || srcId}`.trim() : srcId;

            if (match.type === 'exact') {
                rows.push(`<li style="margin-bottom:4px;">✅ <strong>${srcName}</strong> — exact match, all controls applied</li>`);
            } else if (match.type === 'fuzzy') {
                const tName = match.tGear ? `${match.tGear.brand || ''} ${match.tGear.model || match.targetId}`.trim() : match.targetId;
                const pct = Math.round(match.score * 100);
                const applied = match.matchedLabels.length;
                const total = Object.keys(sourcePedalSettings[srcId]?.controls || {}).length;
                rows.push(`<li style="margin-bottom:4px;">🔁 <strong>${srcName}</strong> → <em>${tName}</em> (same category, ${pct}% similarity — ${applied}/${total} controls mapped)</li>`);
            } else {
                rows.push(`<li style="margin-bottom:4px;color:#6f6f6f;">⛔ <strong>${srcName}</strong> — not in this Rig, skipped</li>`);
            }
        });

        if (rows.length === 0) return `<p style="margin-top:8px;font-size:0.875rem;color:#da1e28;">No pedals found in source ${L.plex}.</p>`;
        return `<ul style="margin:8px 0 0;padding-left:18px;font-size:0.8rem;text-align:left;">${rows.join('')}</ul>`;
    }

    const { value: formData } = await Swal.fire({
        title: 'Apply to existing Rig',
        width: '560px',
        html: `
            <p style="text-align:left;margin-bottom:0.75rem;font-size:0.9rem;">Choose the Rig and a name for the new ${L.Plex}.</p>
            <label class="bx--label" style="display:block;text-align:left;margin-bottom:4px;">Target Rig</label>
            <select id="importRigSelect" class="bx--select-input" style="width:100%;margin-bottom:6px;">${sortedOptions}</select>
            <div id="importMatchPreview" style="min-height:36px;max-height:180px;overflow-y:auto;overflow-x:hidden;"></div>
            <label class="bx--label" style="display:block;text-align:left;margin-top:10px;margin-bottom:4px;">${L.Plex} name</label>
            <input id="importPlexName2" class="bx--text-input" value="${(plex.preset_name || ('Imported ' + L.Plex)).replace(/"/g, '&quot;')}" maxlength="100" style="width:100%;">`,
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
            if (!plexName) { Swal.showValidationMessage(`Please enter a ${L.Plex} name.`); return false; }
            return { rigIndex, plexName };
        }
    });

    if (formData === undefined) {
        openImportSharedPlexModal();
        return;
    }

    const { rigIndex, plexName } = formData;
    const targetBoard = userRigs[rigIndex];

    // 6. Build filtered pedals using exact + fuzzy matching
    const filteredPedals = _buildFilteredPedals(rigIndex);

    if (Object.keys(filteredPedals).length === 0) {
        const goAnyway = await Swal.fire({
            icon: 'warning',
            title: 'No matching pedals',
            text: `None of the pedals in this ${L.Plex} match the selected Rig. The imported ${L.Plex} will have no settings. Continue anyway?`,
            showCancelButton: true,
            confirmButtonText: 'Import anyway',
            cancelButtonText: 'Cancel',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        });
        if (!goAnyway.isConfirmed) return;
    }

    // 7. Save via CREATE_PLEX.php
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
            title: `${L.Plex} imported!`,
            html: `<strong>${plexName}</strong> has been added to <strong>${targetBoard.board_name}</strong>.
                   <br><a href="/plexes" style="color:var(--cds-link-01,#0f62fe);">Go to ${L.Plexes} →</a>`,
            confirmButtonText: `Go to ${L.Plexes}`,
            showCancelButton: true,
            cancelButtonText: 'Stay here',
            customClass: { confirmButton: 'bx--btn bx--btn--primary', cancelButton: 'bx--btn bx--btn--secondary' }
        }).then(r => { if (r.isConfirmed) window.location.href = '/plexes'; });
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Import failed', text: e.message || `Could not save the ${L.Plex}. Please try again.`, showConfirmButton: false, timer: 2500 });
    }
}


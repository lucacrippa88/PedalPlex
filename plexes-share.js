function openShareModal() {
  const currentPresetId = document.getElementById("presetSelect")?.value;
  const preset = window.presetMap?.[currentPresetId];

  if (!preset) {
    Swal.fire('Error', 'No Plex selected', 'error');
    return;
  }

  const isShared = preset.shared || false;

  Swal.fire({
    title: 'Share Plex',
    html: `
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
            <button id="copyLinkBtn" class="bx--btn bx--btn--secondary">
                Copy
            </button>
            </div>
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

        function updateUI() {
        if (toggle.checked) {
            label.textContent = "Shared";
            container.style.display = "block";

            // genera link solo quando serve
            const link = generateShareLink(preset);
            input.value = link;

        } else {
            label.textContent = "Private";
            container.style.display = "none";
            input.value = "";
        }
        }

        // init
        updateUI();

        toggle.addEventListener("change", updateUI);

        copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(input.value);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy", 1500);
        } catch (e) {
            console.error("Copy failed", e);
        }
        });
    },

    preConfirm: () => {
        const enabled = document.getElementById("shareToggle").checked;
        preset.shared = enabled;

        return enabled;
    }
    });
}
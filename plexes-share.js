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
      <div class="bx--form-item" style="text-align:left; margin-top:1rem;">
        <div class="bx--toggle">
          <input 
            type="checkbox" 
            class="bx--toggle-input" 
            id="shareToggle" 
            ${isShared ? 'checked' : ''}
          >
          <label class="bx--toggle-input__label" for="shareToggle">
            <span class="bx--toggle__switch"></span>
            <span class="bx--toggle__text--off">Private</span>
            <span class="bx--toggle__text--on">Shared</span>
          </label>
        </div>
      </div>

      <div id="shareLinkContainer" style="margin-top:1rem; display:${isShared ? 'block' : 'none'};">
        <input id="shareLinkInput" class="bx--text-input" readonly style="width:100%;">
      </div>
    `,
        showCloseButton: true,
        confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M6 18H20V20H6z'></path><path d='M6 12H26V14H6z'></path></svg>Get Plex Link",
        customClass: {
            confirmButton: 'bx--btn bx--btn--primary'
        },
        didOpen: () => {
        const toggleEl = document.getElementById("shareToggle");

        // inizializza SOLO il toggle
        if (toggleEl) {
            CarbonComponents.Toggle.init(toggleEl);
        }

        const toggle = toggleEl;
        const linkContainer = document.getElementById("shareLinkContainer");
        const linkInput = document.getElementById("shareLinkInput");

        toggle.addEventListener("change", () => {
            if (toggle.checked) {
            linkContainer.style.display = "block";
            // linkInput.value = generateShareLink(preset); (quando lo aggiungi)
            } else {
            linkContainer.style.display = "none";
            linkInput.value = "";
            }
        });
        },
        preConfirm: () => {
            const enabled = document.getElementById("shareToggle").checked;

            // salva stato localmente (o poi lo mandi a backend se vuoi)
            preset.shared = enabled;

            return enabled;
        }
    });
}
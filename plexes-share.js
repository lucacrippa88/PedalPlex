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
        <input 
            type="checkbox" 
            id="shareToggle" 
            ${isShared ? 'checked' : ''}
        >
        <label for="shareToggle">
            <span class="pp-toggle-switch"></span>
            <span class="pp-toggle-text off">Private</span>
            <span class="pp-toggle-text on">Shared</span>
        </label>
        </div>

        <!-- Link -->
        <div id="shareLinkContainer" style="margin-top:1rem; display:${isShared ? 'block' : 'none'};">
          <input id="shareLinkInput" class="bx--text-input" readonly style="width:100%;">
        </div>

      </div>
    `,
    showCloseButton: true,
    confirmButtonText: "Get Plex Link",
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary'
    },

    didOpen: () => {
      // 🔴 IMPORTANTE: re-scan SOLO il contenuto Swal
      const swalContent = Swal.getHtmlContainer();
      CarbonComponents.watch(swalContent);

      const toggle = document.getElementById("shareToggle");
      const linkContainer = document.getElementById("shareLinkContainer");
      const linkInput = document.getElementById("shareLinkInput");

      // stato iniziale
      if (toggle.checked) {
        // linkInput.value = generateShareLink(preset);
      }

      toggle.addEventListener("change", () => {
        if (toggle.checked) {
          linkContainer.style.display = "block";
          // linkInput.value = generateShareLink(preset);
        } else {
          linkContainer.style.display = "none";
          linkInput.value = "";
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
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
    showCancelButton: true,
    confirmButtonText: 'Save',
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    didOpen: () => {
      const toggle = document.getElementById("shareToggle");
      const linkContainer = document.getElementById("shareLinkContainer");
      const linkInput = document.getElementById("shareLinkInput");

      // inizializza Carbon toggle
      CarbonComponents.watch();

      // genera link se già shared
      if (isShared) {
        linkInput.value = generateShareLink(preset);
      }

      toggle.addEventListener("change", () => {
        if (toggle.checked) {
          linkContainer.style.display = "block";
          linkInput.value = generateShareLink(preset);
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
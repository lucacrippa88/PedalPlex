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

      <div class="pp-toggle">
        <input 
          type="checkbox" 
          id="shareToggle" 
          ${isShared ? 'checked' : ''}
        >
        <label for="shareToggle">
          <span class="pp-toggle-switch"></span>
          <span id="shareToggleLabel" class="pp-toggle-text"></span>
        </label>
      </div>

      <button 
        id="generateLinkBtn" 
        class="bx--btn bx--btn--primary"
        style="margin-top:1rem; width:100%; display:none;"
      >
        <svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M6 18H20V20H6z'></path><path d='M6 12H26V14H6z'></path></svg>Get Plex Link
      </button>

      <input 
        id="shareLinkInput" 
        class="bx--text-input" 
        readonly 
        style="margin-top:1rem; width:100%; display:none;"
      >
    </div>
  `,
  showConfirmButton: false,
  showCloseButton: true,

  didOpen: () => {
    const toggle = document.getElementById("shareToggle");
    const label = document.getElementById("shareToggleLabel");
    const btn = document.getElementById("generateLinkBtn");
    const input = document.getElementById("shareLinkInput");

    function updateUI() {
      if (toggle.checked) {
        label.textContent = "Shared";
        btn.style.display = "block";
      } else {
        label.textContent = "Private";
        btn.style.display = "none";
        input.style.display = "none";
        input.value = "";
      }
    }

    // init stato iniziale
    updateUI();

    toggle.addEventListener("change", updateUI);

    btn.addEventListener("click", () => {
      const link = generateShareLink(preset); // quando lo aggiungi
      input.value = link;
      input.style.display = "block";
    });
  }
});
}
// zoom-preset.js

const minZoom = 0.7;
const maxZoom = 1.2;
const step = 0.05;
let zoomLevel = 1.0;

/**
 * Get the current board ID depending on the page
 * - In pedalboard.html: ID is stored in option[value-id]
 * - In preset.html: ID is directly option.value
 */
function getSelectedBoardId() {
  const select = document.getElementById("pedalboardSelect") 
               || document.getElementById("presetSelect");

  if (!select) return null;

  const opt = select.options[select.selectedIndex];
  if (!opt) return null;

  // Pedalboard.html → use value-id if it exists
  if (opt.hasAttribute("value-id")) {
    return opt.getAttribute("value-id");
  }

  // Preset.html → use normal value
  return opt.value;
}

/**
 * Save zoom level for the current board
 */
function saveZoom() {
  const id = getSelectedBoardId();
  if (!id) return;
  localStorage.setItem(`zoom_${id}`, zoomLevel);
}

/**
 * Load zoom level for the current board
 */
function getSelectedBoardId() {
  const select = document.getElementById("pedalboardSelect") 
               || document.getElementById("presetSelect");

  if (!select) return null;

  const opt = select.options[select.selectedIndex];
  if (!opt) return null;

  // Pedalboard.html → use value-id if it exists
  if (opt.hasAttribute("value-id")) {
    return opt.getAttribute("value-id");
  }

  // Preset.html → use normal value
  return opt.value;
}

/**
 * Apply zoom to #preset and/or #pedalboard if they exist
 */
function applyZoom() {
  const zoomTargets = [
    document.getElementById("preset"),
    document.getElementById("pedalboard")
  ].filter(Boolean);

  if (zoomTargets.length === 0) return;

  showZoomSpinner();

  // On mobile, limit zoom so pedals never overflow
  if (window.innerWidth <= 768) {
    zoomLevel = getMobileSafeZoom();
  }

  zoomTargets.forEach(zoomTarget => {
    zoomTarget.style.zoom = zoomLevel;
  });

  saveZoom();
  setTimeout(() => hideZoomSpinner(), 300);
}

/**
 * Zoom controls
 */
function zoomIn() {
  if (zoomLevel < maxZoom) {
    zoomLevel = Math.min(zoomLevel + step, maxZoom);
    applyZoom();
  }
}

function zoomOut() {
  if (zoomLevel > minZoom) {
    zoomLevel = Math.max(zoomLevel - step, minZoom);
    applyZoom();
  }
}

function resetZoom() {
  zoomLevel = 1.0;
  applyZoom();
}

/**
 * Called after a pedalboard finishes loading
 */
function onPedalboardLoaded() {
  loadZoom();
  applyZoom();
}

/**
 * Called after a preset has been applied
 */
function restoreZoomForCurrentBoard() {
  loadZoom();
  applyZoom();
}

/**
 * Hook up dropdown changes (for both pedalboard and preset selects)
 */
["pedalboardSelect", "presetSelect"].forEach(selectId => {
  const el = document.getElementById(selectId);
  if (el) {
    el.addEventListener("change", () => {
      setTimeout(onPedalboardLoaded, 50); // delay ensures DOM is ready
    });
  }
});

/**
 * Zoom spinner
 */
function showZoomSpinner() {
  const spinner = document.getElementById("zoomSpinner");
  if (spinner) spinner.style.display = "block";
}

function hideZoomSpinner() {
  const spinner = document.getElementById("zoomSpinner");
  if (spinner) spinner.style.display = "none";
}

/**
 * Compute a mobile-safe zoom that prevents overflow
 */
function getMobileSafeZoom() {
  const zoomTarget = document.getElementById("preset") 
                  || document.getElementById("pedalboard");

  if (!zoomTarget) return 1.0;

  const rect = zoomTarget.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const margin = 36; // safety margin in pixels

  const contentWidth = rect.width / zoomLevel;
  const contentHeight = rect.height / zoomLevel;

  const maxScaleWidth = (screenWidth - margin * 2) / contentWidth;
  const maxScaleHeight = (screenHeight - margin * 2) / contentHeight;

  return Math.min(zoomLevel, maxScaleWidth, maxScaleHeight, maxZoom);
}

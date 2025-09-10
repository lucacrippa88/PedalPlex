const minZoom = 0.7;
const maxZoom = 1.0;
const step = 0.05;
let zoomLevel = 1.0;

// Get currently selected pedalboard text
function getSelectedPedalboard() {
  const select = document.getElementById("pedalboardSelect");
  const idx = select.selectedIndex;
  if (idx < 0) return null;
  return select.options[idx].text.trim();
}
// Get currently selected preset text
function getSelectedPreset() {
  const select = document.getElementById("presetSelect");
  const idx = select.selectedIndex;
  if (idx < 0) return null;
  return select.options[idx].text.trim();
}


// Save zoom for the current pedalboard to localstorage
function saveZoom() {
  const id = getSelectedPedalboard();
  if (!id) return;
  localStorage.setItem(`zoom_${id}`, zoomLevel);
}

// Load zoom for the current pedalboard
function loadZoom() {
  const id = getSelectedPedalboard();
  if (!id) return;
  const saved = localStorage.getItem(`zoom_${id}`);
  zoomLevel = saved ? parseFloat(saved) : 1.0;
}

// Apply zoom to the current #preset element
function applyZoom() {
  const zoomTarget = document.getElementById("preset");
  if (!zoomTarget) return;

  showZoomSpinner();

  // Apply zoom immediately (transition handles smoothness)
  zoomTarget.style.transform = `scale(${zoomLevel})`;

  saveZoom();

  // Hide spinner after short delay
  setTimeout(() => {
    hideZoomSpinner();
  }, 300); // match transition duration
}


// Zoom buttons
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


// Call this function **after a pedalboard has finished loading**
function onPedalboardLoaded() {
  loadZoom();
  applyZoom();
}

// Call this after a preset has been applied
function restoreZoomForCurrentBoard() {
  loadZoom();      // load zoom level for selected pedalboard
  applyZoom();     // apply it
}

// Hook up dropdown changes
document.getElementById("pedalboardSelect").addEventListener("change", () => {
  // After loading new pedalboard, apply its zoom
  // If initPreset is async, call onPedalboardLoaded() in its callback
  setTimeout(onPedalboardLoaded, 50); // short delay to ensure content exists
});



// Spinners management
function showZoomSpinner() {
  document.getElementById("zoomSpinner").style.display = "block";
}
function hideZoomSpinner() {
  document.getElementById("zoomSpinner").style.display = "none";
}
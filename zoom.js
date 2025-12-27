// zoom.js

const minZoom = 0.7;
const maxZoom = 1.2;
const step = 0.05;
let zoomLevel = 1.0;

/**
 * Get the current board ID depending on the page
 * - In rigs.html: ID is stored in option[value-id]
 * - In plexes.html: ID is directly option.value
 */
function getSelectedBoardId() {
  const select =
    document.getElementById("pedalboardSelect") ||
    document.getElementById("presetSelect");

  if (!select) return null;

  const opt = select.options[select.selectedIndex];
  if (!opt) return null;

  return opt.hasAttribute("value-id")
    ? opt.getAttribute("value-id")
    : opt.value;
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
function loadZoom() {
  const id = getSelectedBoardId();
  if (!id) return;
  const saved = localStorage.getItem(`zoom_${id}`);
  zoomLevel = saved ? parseFloat(saved) : 1.0;
  // console.log("Loaded zoom for", id, "=", zoomLevel);
}

/**
 * Apply zoom to #preset and/or #pedalboard if they exist
 */
// function applyZoom() {
//   const zoomTargets = [
//     document.getElementById("preset"),
//     document.getElementById("pedalboard"),
//   ].filter(Boolean);

//   if (zoomTargets.length === 0) return;

//   showZoomSpinner();

//   // On mobile, limit zoom so pedals never overflow
//   if (window.innerWidth <= 768) {
//     zoomLevel = getMobileSafeZoom();
//   }

//   zoomTargets.forEach((zoomTarget) => {
//     zoomTarget.style.zoom = zoomLevel;
//   });

//   saveZoom();
//   setTimeout(hideZoomSpinner, 300);
// }
function applyZoom() {
  const zoomTargets = [
    document.getElementById("preset"),
    document.getElementById("pedalboard"),
  ].filter(Boolean);

  if (zoomTargets.length === 0) return;

  showZoomSpinner();

  // MOBILE: nessuno zoom, layout naturale
  if (window.innerWidth <= 768) {
    zoomTargets.forEach((zoomTarget) => {
      zoomTarget.style.zoom = "1";
      zoomTarget.style.transform = "none";
      zoomTarget.style.transformOrigin = "top left";
      zoomTarget.style.width = "100%";
      zoomTarget.style.overflow = "visible";
    });

    setTimeout(hideZoomSpinner, 200);
    return;
  }

  // DESKTOP / TABLET: uso normale dello zoom
  zoomTargets.forEach((zoomTarget) => {
    zoomTarget.style.zoom = zoomLevel;
    zoomTarget.style.transform = "";
    zoomTarget.style.width = "";
    zoomTarget.style.overflow = "";
  });

  saveZoom();
  setTimeout(hideZoomSpinner, 300);
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
["pedalboardSelect", "presetSelect"].forEach((selectId) => {
  const el = document.getElementById(selectId);
  if (el) {
    el.addEventListener("change", () => {
      // wait for content to load before applying zoom
      setTimeout(onPedalboardLoaded, 200);
    });
  }
});

/**
 * Ensure zoom is restored when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  // If pedalboard content is loaded asynchronously, call this from initPedalboard()
  setTimeout(onPedalboardLoaded, 500);
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

// /**
//  * Compute a mobile-safe zoom that prevents overflow
//  */
// function getMobileSafeZoom() {
//   const zoomTarget =
//     document.getElementById("preset") || document.getElementById("pedalboard");

//   if (!zoomTarget) return 1.0;

//   const rect = zoomTarget.getBoundingClientRect();
//   const screenWidth = window.innerWidth;
//   const screenHeight = window.innerHeight;

//   const margin = 36; // safety margin in pixels

//   const contentWidth = rect.width / zoomLevel;
//   const contentHeight = rect.height / zoomLevel;

//   const maxScaleWidth = (screenWidth - margin * 2) / contentWidth;
//   const maxScaleHeight = (screenHeight - margin * 2) / contentHeight;

//   return Math.min(zoomLevel, maxScaleWidth, maxScaleHeight, maxZoom);
// }


// /**

// * Calcola uno zoom sicuro per mobile che garantisce
// * che l'intero contenuto rientri nello schermo
// * senza generare micro-zoom.
//   */
//   function getMobileSafeZoom() {
//   const zoomTarget =
//   document.getElementById("preset") || document.getElementById("pedalboard");

// if (!zoomTarget) return 1;

// const rect = zoomTarget.getBoundingClientRect();

// const screenWidth = window.innerWidth;
// const screenHeight = window.innerHeight;

// const margin = 24; // margine di sicurezza

// // Calcolo fattori di scala basati solo su dimensioni reali (niente zoomLevel!)
// const scaleX = (screenWidth - margin * 2) / rect.width;
// const scaleY = (screenHeight - margin * 2) / rect.height;

// // Lo zoom deve essere <= 1 (mai ingrandire su mobile)
// const mobileZoom = Math.min(scaleX, scaleY, 1);

// return mobileZoom;
// }

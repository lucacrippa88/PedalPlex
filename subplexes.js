// Livelli di modifica
const SUBPLEX_LEVELS = ["original", "modified", "heavily_modified", "custom"];

function getHigherSubplexLevel(a, b) {
  return SUBPLEX_LEVELS.indexOf(a) > SUBPLEX_LEVELS.indexOf(b) ? a : b;
}

// Ottieni il valore corrente del controllo
function getCurrentControlValue($pedalDiv, ctrl) {
  const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
  if (!$control.length) return null;

  switch (ctrl.type) {
    case "knob":
    case "smallknob":
    case "largeknob":
    case "xlargeknob": {
      // 1️⃣ valore label
      const $label = $control.closest(".knob-wrapper").find(".knob-value-label");
      if ($label.length && $label.text().trim() !== "") return parseFloat($label.text());

      // 2️⃣ fallback tooltip
      const $tooltip = $control.closest(".knob-wrapper").find(".bx--tooltip__label");
      if ($tooltip.length && $tooltip.text().trim() !== "") return parseFloat($tooltip.text());

      return null;
    }

    case "slider":
    case "lcd":
    case "multi":
      return $control.val();

    case "led":
      return $control.data("colorIndex");

    default:
      return null;
  }
}

// Delta normalizzato tra originale e corrente
function computeControlDelta(ctrl, originalValue, currentValue) {
  if (currentValue === null || originalValue === undefined) return 0;

  if (typeof originalValue === "number" && typeof currentValue === "number") {
    const min = ctrl.min ?? 0;
    const max = ctrl.max ?? 100;
    const range = max - min || 100;
    const delta = Math.abs(currentValue - originalValue) / range;
    return Math.min(delta, 1);
  }

  return originalValue !== currentValue ? 1 : 0;
}

// Classifica il livello di modifica
function classifySubplexModificationNormalized($pedalDiv) {
  const subplex = $pedalDiv.data("applied-subplex");
  const originalControls = $pedalDiv.data("subplex-original-controls");

  if (!subplex || !Array.isArray(originalControls)) return "original";

  let totalDelta = 0;
  let totalControls = 0;

  originalControls.forEach(ctrl => {
    const currentValue = getCurrentControlValue($pedalDiv, ctrl);
    const delta = computeControlDelta(ctrl, ctrl.value, currentValue);
    totalDelta += delta;
    totalControls++;
  });

  if (totalControls === 0) return "original";

  const ratio = totalDelta / totalControls;

  if (ratio === 0) return "original";
  if (ratio < 0.15) return "modified";
  if (ratio < 0.4) return "heavily_modified";
  return "custom";
}

// Aggiorna il titolo nella UI
function updateSubplexTitleUI($pedalDiv, level) {
  const $title = $pedalDiv.closest(".pedal-wrapper")
    .find(".applied-preset-name");

  if (!$title.length) return;

  const baseName = $title.data("base-name") || $title.text().trim().replace(/\*+$/, "");
  $title.data("base-name", baseName);

  if (level === "original") {
    $title.text(baseName).removeAttr("contenteditable");
  } else if (level === "modified") {
    $title.text(baseName + "*").removeAttr("contenteditable");
  } else if (level === "heavily_modified") {
    $title.text(baseName + "**").removeAttr("contenteditable");
  } else if (level === "custom") {
    $title.text("Custom SubPlex")
      .attr("contenteditable", "true")
      .focus();
  }

  console.log("🔵 SubPlex title updated:", $title.text(), "level:", level);
}





// Triggera quando cambia un controllo
function onPedalControlChangeNormalized($pedalDiv) {
  const subplex = $pedalDiv.data("applied-subplex");
  if (!subplex) return;

  const previousLevel = $pedalDiv.data("subplex-modification-level") || "original";
  const calculatedLevel = classifySubplexModificationNormalized($pedalDiv);

  const newLevel = getHigherSubplexLevel(previousLevel, calculatedLevel);

  if (newLevel !== previousLevel) {
    $pedalDiv.data("subplex-modification-level", newLevel);
    updateSubplexTitleUI($pedalDiv, newLevel);
  }
}


// -------------------------------------------------
// Setup tracking
function setupSubplexChangeTracking($pedalDiv) {
  if (!$pedalDiv) return;

  const handler = () => onPedalControlChangeNormalized($pedalDiv);

  $pedalDiv
    .find("input, select, textarea")
    .off(".subplexTrack")
    .on("input.subplexTrack change.subplexTrack", handler);

  $pedalDiv
    .find("[data-control-label]")
    .off(".subplexTrack")
    .on("mousedown.subplexTrack click.subplexTrack", handler);
}







// Invalida SubPlex e aggiorna UI
// function invalidateSubplexForPedal($pedalDiv) {
//   if (!$pedalDiv) return;

//   const applied = $pedalDiv.data("applied-subplex");
//   if (!applied) return;

//   // Rimuove stato
//   $pedalDiv.removeData('applied-subplex');
//   $pedalDiv.removeAttr("data-applied-preset");
//   $pedalDiv.data("subplexInvalidated", true);

//   // Aggiorna UI
//   const $wrapper = $pedalDiv.closest(".pedal-wrapper");
//   $wrapper.find(".applied-preset-info").hide();
//   $wrapper.find(".new-subplex-btn").show();
//   $wrapper.find(".preset-dropdown-wrapper").removeClass("is-open");
// }


// Controlla se i valori dei controlli differiscono dal SubPlex applicato
// function onPedalControlChange($pedalDiv) {
//   const subplex = $pedalDiv.data('applied-subplex');
//   if (!subplex) return; // niente SubPlex → nulla da fare

//   let changed = false;

//   if (Array.isArray(subplex.controls)) {
//     subplex.controls.forEach(ctrl => {
//       const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
//       if (!$control.length) return;

//       let currentValue;
//       switch (ctrl.type) {
//         case "knob":
//         case "smallknob":
//         case "largeknob":
//         case "xlargeknob":
//           currentValue = parseFloat($control.closest(".knob-wrapper").find(".knob-value-label").text());
//           break;
//         case "slider":
//         case "lcd":
//         case "multi":
//           currentValue = $control.val();
//           break;
//         case "led":
//           currentValue = $control.data("colorIndex");
//           break;
//       }

//       if (currentValue != ctrl.value) changed = true;
//     });
//   }

//   if (changed && !$pedalDiv.data("subplexInvalidated")) {
//     invalidateSubplexForPedal($pedalDiv);
//   }
// }


// Al momento del render dal DB
// function setupSubplexInvalidationOnDBLoad($pedalDiv) {
//   if (!$pedalDiv) return;

//   const invalidate = () => invalidateSubplexForPedal($pedalDiv);

//   // rimuovi eventuali listener duplicati
//   $pedalDiv
//     .find('input, select, textarea')
//     .off('.subplexInvalidate')
//     .on('input.subplexInvalidate change.subplexInvalidate', invalidate);

//   // knob / custom controls
//   $pedalDiv
//     .find('[data-control-label]')
//     .off('.subplexInvalidate')
//     .on('mousedown.subplexInvalidate click.subplexInvalidate', invalidate);
// }




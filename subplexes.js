// Livelli in ordine crescente (monotono)
const SUBPLEX_LEVELS = ["original", "modified", "heavily_modified", "custom"];

function getHigherSubplexLevel(a, b) {
  return SUBPLEX_LEVELS.indexOf(a) > SUBPLEX_LEVELS.indexOf(b) ? a : b;
}

// -------------------------------------------------
// Restituisce il valore corrente di un controllo
function getCurrentControlValue($pedalDiv, ctrl) {
  const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
  if (!$control.length) return null;

  switch (ctrl.type) {
    case "knob":
    case "smallknob":
    case "largeknob":
    case "xlargeknob":
      // Valore reale dal label interno o tooltip
      const $valLabel = $control.closest(".knob-wrapper").find(".knob-value-label");
      if ($valLabel.length) return parseFloat($valLabel.text());
      const $tooltip = $control.closest(".knob-wrapper").find(".bx--tooltip__label");
      if ($tooltip.length) return parseFloat($tooltip.text());
      return null;

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

function computeControlDelta(ctrl, originalValue, currentValue) {
  if (currentValue === null || originalValue === undefined) return 0;

  // Controlli continui
  if (typeof originalValue === "number" && typeof currentValue === "number") {
    const min = ctrl.min ?? 0;
    const max = ctrl.max ?? 100; // fallback sicuro
    const range = max - min || 100;

    const delta = Math.abs(currentValue - originalValue) / range;
    return Math.min(delta, 1);
  }

  // Switch / LED / discreti
  return originalValue !== currentValue ? 1 : 0;
}

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

function updateSubplexTitleUI($pedalDiv, level) {
  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  const $title = $wrapper.find(".applied-preset-title");

  if (!$title.length) return;

  const baseName = $title.data("base-name") || $title.text().replace(/\*+$/, "");
  $title.data("base-name", baseName);

  if (level === "original") {
    $title.text(baseName);
  } else if (level === "modified") {
    $title.text(baseName + "*");
  } else if (level === "heavily_modified") {
    $title.text(baseName + "**");
  } else if (level === "custom") {
    $title
      .text("Custom SubPlex")
      .attr("contenteditable", "true")
      .focus();
  }
}





function onPedalControlChangeNormalized($pedalDiv) {
  console.log("🟢 control change detected");
  const subplex = $pedalDiv.data("applied-subplex");
  if (!subplex) {
    console.log("❌ no applied-subplex");
    return;
  }

  const previousLevel = $pedalDiv.data("subplex-modification-level") || "original";
  const calculatedLevel = classifySubplexModificationNormalized($pedalDiv);

  const newLevel = getHigherSubplexLevel(previousLevel, calculatedLevel);

  if (newLevel !== previousLevel) {
    $pedalDiv.data("subplex-modification-level", newLevel);
    updateSubplexTitleUI($pedalDiv, newLevel);
  }

  // Invalidazione VERA solo al livello massimo
  if (newLevel === "custom" && !$pedalDiv.data("subplexInvalidated")) {
    invalidateSubplexForPedal($pedalDiv);
  }
}


// -------------------------------------------------
// Aggancia tracking modifiche SubPlex
function setupSubplexChangeTracking($pedalDiv) {
  if (!$pedalDiv || !$pedalDiv.length) {
    console.warn("🔵 setupSubplexChangeTracking – $pedalDiv undefined");
    return;
  }

  const handler = () => {
    // microtimeout per assicurarsi che il valore sia aggiornato
    setTimeout(() => {
      console.log("🟢 control change detected");
      onPedalControlChangeNormalized($pedalDiv);
    }, 0);
  };

  // Delegazione eventi su tutti i controlli
  $pedalDiv.off(".subplexTrack").on(
    "input.subplexTrack change.subplexTrack mousedown.subplexTrack mouseup.subplexTrack click.subplexTrack",
    "[data-control-label], input, select, textarea",
    handler
  );
}







// Invalida SubPlex e aggiorna UI
function invalidateSubplexForPedal($pedalDiv) {
  if (!$pedalDiv) return;

  const applied = $pedalDiv.data("applied-subplex");
  if (!applied) return;

  // Rimuove stato
  $pedalDiv.removeData('applied-subplex');
  $pedalDiv.removeAttr("data-applied-preset");
  $pedalDiv.data("subplexInvalidated", true);

  // Aggiorna UI
  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  $wrapper.find(".applied-preset-info").hide();
  $wrapper.find(".new-subplex-btn").show();
  $wrapper.find(".preset-dropdown-wrapper").removeClass("is-open");
}


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




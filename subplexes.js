// ------------------------
// SubPlex Modification Levels
// ------------------------
const SUBPLEX_LEVELS = ["original", "modified", "heavily_modified", "custom"];

function getHigherSubplexLevel(a, b) {
  return SUBPLEX_LEVELS.indexOf(a) > SUBPLEX_LEVELS.indexOf(b) ? a : b;
}

// ------------------------
// Ottieni il valore corrente di un controllo
// ------------------------
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
    case "switch":
      return $control.data("colorIndex") ?? $control.prop("checked") ?? 0;

    default:
      return null;
  }
}

// ------------------------
// Calcola delta normalizzato tra valore originale e corrente
// ------------------------
function computeControlDelta(ctrl, originalValue, currentValue) {
  if (currentValue === null || originalValue === undefined) return 0;

  // Controlli numerici
  if (typeof originalValue === "number" && typeof currentValue === "number") {
    const min = ctrl.min ?? 0;
    const max = ctrl.max ?? 100;
    const range = max - min || 100;
    const delta = Math.abs(currentValue - originalValue) / range;
    return Math.min(delta, 1);
  }

  // Switch, LED o discreti
  return originalValue !== currentValue ? 1 : 0;
}

// ------------------------
// Classifica livello di modifica del SubPlex (NORMALIZZATO + LOG)
// ------------------------
function classifySubplexModificationNormalized($pedalDiv) {
  const subplex = $pedalDiv.data("applied-subplex");
  const originalControls = $pedalDiv.data("subplex-original-controls");

  console.group("📊 classifySubplexModificationNormalized");

  if (!subplex) {
    console.warn("❌ No applied subplex");
    console.groupEnd();
    return "original";
  }

  if (!Array.isArray(originalControls) || originalControls.length === 0) {
    console.warn("❌ No original controls baseline", originalControls);
    console.groupEnd();
    return "original";
  }

  const controlCount = originalControls.length;

  let totalDelta = 0;
  let changedControls = 0;
  let strongChanges = 0;

  originalControls.forEach((ctrl, index) => {
    const originalValue = ctrl.value;
    const currentValue = getCurrentControlValue($pedalDiv, ctrl);
    const delta = computeControlDelta(ctrl, originalValue, currentValue);

    if (delta > 0.01) changedControls++;
    if (delta > 0.25) strongChanges++;

    totalDelta += delta;

    console.log(
      `🔍 [${index}]`,
      ctrl.label || "unnamed",
      "| orig:", originalValue,
      "| curr:", currentValue,
      "| delta:", delta
    );
  });

  const avgDelta = totalDelta / controlCount;
  const changedRatio = changedControls / controlCount;

  console.log("📈 STATS", {
    controlCount,
    totalDelta,
    avgDelta,
    changedControls,
    changedRatio,
    strongChanges
  });

  /*
    🔑 LOGICA DECISIONALE
    - pedali piccoli → conta QUANTI controlli tocchi
    - pedali grandi → conta QUANTO tocchi
  */

  let level = "original";

  // Nessuna modifica reale
  if (changedControls === 0) {
    level = "original";
  }

  // Poche modifiche leggere
  else if (
    changedRatio <= 0.25 &&
    avgDelta < 0.08
  ) {
    level = "modified";
  }

  // Modifiche evidenti ma ancora riconducibili al SubPlex
  else if (
    changedRatio <= 0.6 &&
    (avgDelta < 0.25 || strongChanges <= 2)
  ) {
    level = "heavily_modified";
  }

  // Stravolto
  else {
    level = "custom";
  }

  console.log("🏷️ RESULT LEVEL:", level);
  console.groupEnd();

  return level;
}



// ------------------------
// Aggiorna il titolo del SubPlex nella UI (CON LOG)
// ------------------------
function updateSubplexTitleUI($pedalDiv, level) {
  console.group("📝 updateSubplexTitleUI");

  if (!$pedalDiv || !$pedalDiv.length) {
    console.warn("❌ Invalid $pedalDiv");
    console.groupEnd();
    return;
  }

  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  if (!$wrapper.length) {
    console.warn("❌ .pedal-wrapper not found");
    console.groupEnd();
    return;
  }

  const $title = $wrapper.find(".applied-preset-name").first();
  if (!$title.length) {
    console.warn("❌ .applied-preset-name not found");
    console.groupEnd();
    return;
  }

  console.log("📌 Requested level:", level);
  console.log("📌 Current title text:", $title.text());

  // Base name stabile (senza asterischi)
  let baseName = $title.data("base-name");

  if (!baseName) {
    baseName = $title.text().trim().replace(/\*+$/, "");
    $title.data("base-name", baseName);
    console.log("🧱 Base name initialized:", baseName);
  } else {
    console.log("🧱 Base name from data:", baseName);
  }

  // Applica stato
  switch (level) {
    case "original":
      $title
        .text(baseName)
        .removeAttr("contenteditable");
      console.log("✅ UI set to ORIGINAL");
      break;

    case "modified":
      $title
        .text(baseName + " *")
        .removeAttr("contenteditable");
      console.log("✅ UI set to MODIFIED");
      break;

    case "heavily_modified":
      $title
        .text(baseName + " **")
        .removeAttr("contenteditable");
      console.log("✅ UI set to HEAVILY MODIFIED");
      break;

    case "custom":
      $title
        .text("Custom SubPlex")
        .attr("contenteditable", "true");
      console.log("✅ UI set to CUSTOM (editable)");
      break;

    default:
      console.warn("⚠️ Unknown level:", level);
  }

  console.log("🏷️ Final title text:", $title.text());
  console.groupEnd();
}


// ------------------------
// Trigger quando un controllo cambia
// ------------------------
function onPedalControlChangeNormalized($pedalDiv) {
  const subplex = $pedalDiv.data("applied-subplex");
    if (!subplex) {
    console.warn("🟡 change ignored: no applied subplex");
    return;
  }

  const previousLevel = $pedalDiv.data("subplex-modification-level") || "original";
  const calculatedLevel = classifySubplexModificationNormalized($pedalDiv);
  console.log(
    "🟣 SubPlex level",
    "previous:", previousLevel,
    "calculated:", calculatedLevel
  );
  const newLevel = getHigherSubplexLevel(previousLevel, calculatedLevel);

  if (newLevel !== previousLevel) {
    console.log("🟠 Level upgrade:", previousLevel, "→", newLevel);
    $pedalDiv.data("subplex-modification-level", newLevel);
    updateSubplexTitleUI($pedalDiv, newLevel);
  }
}

// ------------------------
// Setup tracking completo dei controlli
// ------------------------
function setupSubplexChangeTracking($pedalDiv) {
  if (!$pedalDiv) return;
   console.log(
    "🔵 setupSubplexChangeTracking",
    $pedalDiv.attr("data-pedal-id"),
    "has subplex:",
    !!$pedalDiv.data("applied-subplex"),
    "original controls:",
    $pedalDiv.data("subplex-original-controls")
  );

  const handler = () => {
    console.log("🟢 control change detected");
    onPedalControlChangeNormalized($pedalDiv);
  };

  // Input standard
  $pedalDiv.find("input, select, textarea")
    .off(".subplexTrack")
    .on("input.subplexTrack change.subplexTrack", handler);

  // LED / switch cliccabili
  $pedalDiv.find("[data-control-label].led, [data-control-label].switch")
    .off(".subplexTrack")
    .on("click.subplexTrack", handler);

  // Knob visuali: osserva il cambio del valore nel label o tooltip
  $pedalDiv.find(".knob-value-label, .bx--tooltip__label").each(function () {
    const target = this;
    const observer = new MutationObserver(handler);
    observer.observe(target, { childList: true, characterData: true, subtree: true });
  });
}

// ------------------------
// Invalida SubPlex e reset UI (solo se serve)
// ------------------------
function invalidateSubplexForPedal($pedalDiv) {
  if (!$pedalDiv) return;
  const applied = $pedalDiv.data("applied-subplex");
  if (!applied) return;

  $pedalDiv.removeData("applied-subplex");
  $pedalDiv.removeAttr("data-applied-preset");
  $pedalDiv.data("subplexInvalidated", true);

  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  $wrapper.find(".applied-preset-info").hide();
  $wrapper.find(".new-subplex-btn").show();
  $wrapper.find(".preset-dropdown-wrapper").removeClass("is-open");
}





// ------------------------
// Cattura baseline controlli DAL DOM
// ------------------------
function captureSubplexBaselineFromDOM($pedalDiv) {
  const controls = [];

  $pedalDiv.find("[data-control-label]").each(function () {
    const $ctrl = $(this);
    const label = $ctrl.data("control-label");

    let type = "unknown";
    let value = null;

    if ($ctrl.hasClass("knob")) type = "knob";
    else if ($ctrl.is("input[type=range]")) type = "slider";
    else if ($ctrl.hasClass("led")) type = "led";

    switch (type) {
      case "knob": {
        const $labelValue = $ctrl
          .closest(".knob-wrapper")
          .find(".knob-value-label");
        if ($labelValue.length) value = parseFloat($labelValue.text());
        break;
      }

      case "slider":
        value = $ctrl.val();
        break;

      case "led":
        value = $ctrl.data("colorIndex");
        break;
    }

    if (label && value !== null) {
      controls.push({
        label,
        type,
        value
      });
    }
  });

  console.log(
    "📸 SubPlex baseline captured:",
    controls.length,
    controls
  );

  return controls;
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




// HELPER FUNCTIONS AI PRESET DROPDOWN =======
$(document).on("click", function () { $(".preset-dropdown-wrapper").removeClass("is-open") });


// Build Preset from AI Catalog
async function buildPresetDropdown($ul, pedalId) {

  // 1️⃣ Cache hit → nessuna fetch
  if (window.presetCatalogCache[pedalId]) {
    renderPresetList($ul, pedalId, window.presetCatalogCache[pedalId]);
    return;
  }

  // 2️⃣ Stato loading (una sola volta)
  $ul.empty().append("<li class='loading'>Loading SubPlexes</li>");

  const token = localStorage.getItem("authToken");
  if (!token) { $ul.html("<li class='error'>Login to see all SubPlexes</li>"); return; }

  try {
    const res = await fetch(
      "https://api.pedalplex.com/GET_PRESETS_BY_PEDAL.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ pedalId })
      }
    );

    if (!res.ok) { throw new Error("HTTP " + res.status); }

    const data = await res.json();
    const presets = Array.isArray(data.presets) ? data.presets : [];

    // 3️⃣ Salva in cache
    window.presetCatalogCache[pedalId] = presets;
    renderPresetList($ul, pedalId, presets);

  } catch (err) {
    console.error("Preset dropdown error:", err);
    $ul.html("<li class='error'>Error loading SubPlexes</li>");
  }
}


function applyCatalogPresetToSinglePedal(pedalId, preset) {
  // Trova il pedale nel DOM
  const $pedalDiv = $(`.pedal-catalog[data-pedal-id="${pedalId}"]`);
  if (!$pedalDiv.length) { console.warn("Pedal not found on board:", pedalId); return; }

  // ⛔️ PREVENT DOUBLE APPLY OF SAME PRESET
  const applied = $pedalDiv.attr("data-applied-preset");
  if (applied) {
    try {
      const parsed = JSON.parse(applied);
      if (parsed.id === preset._id) { return; }
    } catch (e) {}
  }

  const defaultPedal = window.catalogMap?.[pedalId] || window.catalogMap?.[String(pedalId).trim()];

  if (!defaultPedal) { console.warn("Pedal not found in catalogMap:", pedalId); return; }

  // Deep clone del pedale di catalogo
  const pedalClone = JSON.parse(JSON.stringify(defaultPedal));

  // Applica i controls del preset
  if (preset.controls) {
    pedalClone.controls.forEach(row => {
      row.row.forEach(ctrl => {
        const label = ctrl.label;
        if (preset.controls.hasOwnProperty(label)) { ctrl.value = preset.controls[label]; }
      });
    });
  }

  // Rimuove i controlli attuali
  $pedalDiv.find('.row').remove();

  // Ri-render dei controlli
  renderPedalControls(pedalClone, $pedalDiv);

  // Aggiorna il nome (se serve)
  const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();
  let nameClass = 'pedal-name';
  let $referenceNode = null;

  if ($existingName.length) {
    nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
    $referenceNode = $existingName.next();
    $existingName.remove();
  }

  const $nameDiv = $("<div>").addClass(nameClass).html(pedalClone.name).attr("style", pedalClone.logo || "");

  if ($referenceNode && $referenceNode.length) { $nameDiv.insertBefore($referenceNode);
  } else {$pedalDiv.prepend($nameDiv); }


  // Aggiorna UI (se presente)
  if (typeof updateSavePresetButtonState === 'function') { updateSavePresetButtonState(); }

  // Reset invalidazione
  $pedalDiv.removeData("subplexInvalidated");

  // Stato SubPlex applicato sul div
  const appliedSubplex = { id: preset._id, presetName: preset.presetName || preset.name || preset._id, published: preset.published, source: preset.source, description: preset.description || '', style: preset.style || [], authorId: preset.authorId || preset.user_id || '', version: preset.version || 1 };
  $pedalDiv.data('applied-subplex', appliedSubplex);
  $pedalDiv.data('subplex-original-controls', JSON.parse(JSON.stringify(appliedSubplex.controls)));
  $pedalDiv.data('subplex-modification-level', 'original');
  $pedalDiv.removeData('subplexInvalidated');
  $pedalDiv.attr("data-applied-preset", JSON.stringify({ id: appliedSubplex.id, name: appliedSubplex.presetName, style: appliedSubplex.style, published: appliedSubplex.published }));

  // ✅ Aggiorna globale
  window.currentSubPlex = window.currentSubPlex || {};
  window.currentSubPlex[pedalId] = appliedSubplex;


// 🔵 Attiva tracking modifiche: titolo e stato si aggiornano automaticamente
setupSubplexChangeTracking($pedalDiv);

// 🔹 Render della UI del preset applicato (icone, titolo, tags, ecc.)
renderAppliedPresetInfo($pedalDiv, appliedSubplex);

}

// END HELPER FUNCTIONS AI PRESET DROPDOWN =======



// Render applied SubPlex info box
// function renderAppliedPresetInfo($pedalDiv, subplex) {

//   const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";

//   if (!subplex || (!subplex.presetName && !subplex.name && !subplex.preset_name && !subplex.id)) { return; }

//   const $wrapper = $pedalDiv.closest(".pedal-wrapper");
//   const $infoBox = $wrapper.find(".applied-preset-info");
//   if (!$infoBox.length) return;
//   const description = subplex.description || "No description available";

//   // Nome + icona AI
//   const $nameEl = $infoBox.find(".applied-preset-name");
//   $nameEl.empty();
//   if (subplex.source === "ai") { $nameEl.append(`<svg class="ai-preset-icon" focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="14" height="14" viewBox="0 0 32 32" aria-hidden="true"><path d="M19 21v-2h1v-7h-1v-2h4v2h-1v7h1v2h-4zM15.5005 21h2l-3.5005-11h-3l-3.4966 11h1.9988l.6018-2h4.7781l.6184 2zM10.7058 17l1.6284-5.4111.2559-.0024 1.6736 5.4136h-3.5579z"></path><path d="M32,32H0V0h32v32ZM2,30h28V2H2v28Z"></path></svg>`); }
//   $nameEl.append(document.createTextNode(" " + presetName));

//   // Icona info + tooltip
//   const $iconWrapper = $infoBox.find(".applied-preset-info-icon");
//   $iconWrapper.empty().append(`<svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="12" height="12" viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M17 22L17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22zM16 8a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 8z"></path><path d="M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z"></path></svg>`);

//   $iconWrapper.off("mouseenter mouseleave")
//     .on("mouseenter", function () {
//       const safeDescription = decodeHTMLEntities(description);
//       const $tooltip = $(`<div class="preset-tooltip-popup"></div>`).text(safeDescription);

//       $("body").append($tooltip);
//       const offset = $iconWrapper.offset();
//       $tooltip.css({ position: "absolute", top: offset.top - $tooltip.outerHeight() - 6, left: offset.left, zIndex: 2000, maxWidth: "250px", backgroundColor: "rgba(0,0,0,0.85)", color: "#fff", padding: "6px 8px", borderRadius: "4px", fontSize: "0.85rem", pointerEvents: "none" });
//       $iconWrapper.data("tooltipEl", $tooltip);
//     })
//     .on("mouseleave", function () {
//       const $tooltip = $iconWrapper.data("tooltipEl");
//       if ($tooltip) $tooltip.remove();
//     });

//   // Tags
//   const $tagsBox = $infoBox.find(".applied-preset-tags");
//   if ($tagsBox.length) {
//     $tagsBox.empty();
//     const styles = subplex.style || [];
//     styles.forEach(style => {
//       const color = STYLE_TAG_MAP[style] || "gray";
//       $tagsBox.append(`<span class="bx--tag bx--tag--${color} bx--tag--sm">${style}</span>`);
//     });
//   }

//   $infoBox.show();
//   $wrapper.find(".new-subplex-btn").hide();

// }

function renderAppliedPresetInfo($pedalDiv, subplex) {
  if (!subplex) return;

  // Assicuriamoci che il container info esista
  let $infoBox = $pedalDiv.find(".applied-preset-info");
  if (!$infoBox.length) {
    $infoBox = $(`
      <div class="applied-preset-info" style="display:none">
        <div class="applied-preset-title-row">
          <span class="applied-preset-name"></span>
          <span class="applied-preset-info-icon"></span>
        </div>
        <div class="applied-preset-tags"></div>
      </div>
    `).appendTo($pedalDiv.find(".preset-container"));
  }

  const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";
  const description = subplex.description || "No description available";

  // --- Nome + icona AI ---
  const $nameEl = $infoBox.find(".applied-preset-name");
  $nameEl.empty();
  if (subplex.source === "ai") {
    $nameEl.append(`<svg class="ai-preset-icon" ...></svg>`); // svg completo
  }
  $nameEl.append(document.createTextNode(" " + presetName));

  // --- Icona info + tooltip ---
  const $iconWrapper = $infoBox.find(".applied-preset-info-icon");
  $iconWrapper.empty().append(`<svg ...></svg>`); // svg completo
  $iconWrapper.off("mouseenter mouseleave")
    .on("mouseenter", function () {
      const $tooltip = $(`<div class="preset-tooltip-popup"></div>`).text(description);
      $("body").append($tooltip);
      const offset = $iconWrapper.offset();
      $tooltip.css({ position: "absolute", top: offset.top - $tooltip.outerHeight() - 6, left: offset.left, zIndex:2000 });
      $iconWrapper.data("tooltipEl", $tooltip);
    })
    .on("mouseleave", function () {
      const $tooltip = $iconWrapper.data("tooltipEl");
      if ($tooltip) $tooltip.remove();
    });

  // --- Tags ---
  const $tagsBox = $infoBox.find(".applied-preset-tags");
  $tagsBox.empty();
  const styles = subplex.style || [];
  styles.forEach(style => {
    const color = STYLE_TAG_MAP[style] || "gray";
    $tagsBox.append(`<span class="bx--tag bx--tag--${color} bx--tag--sm">${style}</span>`);
  });

  // Mostra il container
  $infoBox.show();
  $pedalDiv.find(".new-subplex-btn").hide();
}




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
  if (!ctrl || !ctrl.type) return null;

  const label = ctrl.label || ctrl.id;
  let $control;

  switch (ctrl.type) {
    case "led":
      $control = $pedalDiv.find(`.led[data-control-label="${label}"]`);
      return $control.hasClass("active") ? 1 : 0;

    case "knob":
      $control = $pedalDiv.find(`.knob[data-control-label="${label}"]`);
      if (!ctrl.discrete && !ctrl.multi) {
        // Knob numerico → usa tooltip o rotazione
        const tooltipVal = parseFloat($control.siblings(".bx--tooltip").find("span.bx--tooltip__label").text());
        return isNaN(tooltipVal) ? 0 : tooltipVal;
      } else {
        // Knob discreto → prendi il valore testuale visibile
        const $label = $control.closest(".knob-wrapper").find(".knob-value-label, .label-top");
        return $label.text().trim();
      }

    case "multi":
      $control = $pedalDiv.find(`select[data-control-label="${label}"]`);
      return $control.val();

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
  console.group("📊 classifySubplexModificationNormalized");

  const subplex = $pedalDiv.data("applied-subplex");
  const originalControls = $pedalDiv.data("subplex-original-controls");

  if (!subplex) {
    console.warn("❌ No applied subplex");
    console.groupEnd();
    return "original";
  }

  if (!Array.isArray(originalControls) || originalControls.length === 0) {
    console.warn("❌ No baseline controls");
    console.groupEnd();
    return "original";
  }

  let changedControls = 0;
  let numericDeltaSum = 0;
  let numericCount = 0;
  let discreteChanges = 0;

  originalControls.forEach((ctrl, index) => {
    const originalValue = ctrl.value;
    const currentValue = getCurrentControlValue($pedalDiv, ctrl);

    let changed = false;
    let delta = 0;

    // 🔹 NUMERICO
    if (
      typeof originalValue === "number" &&
      typeof currentValue === "number" &&
      !isNaN(originalValue) &&
      !isNaN(currentValue)
    ) {
      const min = ctrl.min ?? 0;
      const max = ctrl.max ?? 100;
      const range = max - min || 100;

      delta = Math.abs(currentValue - originalValue) / range;
      delta = Math.min(delta, 1);

      if (delta > 0.01) {
        changed = true;
        numericDeltaSum += delta;
        numericCount++;
      }
    }

    // 🔹 DISCRETO (led, mode, multi, knob discreto)
    else if (originalValue !== currentValue) {
      changed = true;
      discreteChanges++;
      delta = 1;
    }

    if (changed) changedControls++;

    console.log(
      `🔍 [${index}]`,
      ctrl.label,
      "| type:", ctrl.type,
      "| orig:", originalValue,
      "| curr:", currentValue,
      "| delta:", delta
    );
  });

  const controlCount = originalControls.length;
  const changedRatio = changedControls / controlCount;
  const avgNumericDelta = numericCount > 0 ? numericDeltaSum / numericCount : 0;

  console.log("📈 STATS", {
    controlCount,
    changedControls,
    changedRatio,
    numericCount,
    avgNumericDelta,
    discreteChanges
  });

  let level = "original";

  if (changedControls === 0) {
    level = "original";
  }
  else if (changedRatio < 0.25 && discreteChanges <= 1) {
    level = "modified";
  }
  else if (changedRatio < 0.6 || discreteChanges === 1) {
    level = "heavily_modified";
  }
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




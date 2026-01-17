// Render applied SubPlex info box
function renderAppliedPresetInfo($pedalDiv, subplex) {


  const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";

  
  if (!subplex || (!subplex.presetName && !subplex.name && !subplex.preset_name && !subplex.id)) {
    console.log("No valid SubPlex found, skipping render.");
    return;
  }

  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  const $infoBox = $wrapper.find(".applied-preset-info");
  if (!$infoBox.length) return;

  // const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || "SubPlex";
  const description = subplex.description || "No description available";

  // Nome + icona AI
  const $nameEl = $infoBox.find(".applied-preset-name");
  $nameEl.empty();
  if (subplex.source === "ai") {
    $nameEl.append(`
      <svg class="ai-preset-icon" focusable="false" preserveAspectRatio="xMidYMid meet"
        fill="currentColor" width="14" height="14" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19 21v-2h1v-7h-1v-2h4v2h-1v7h1v2h-4zM15.5005 21h2l-3.5005-11h-3l-3.4966 11h1.9988l.6018-2h4.7781l.6184 2zM10.7058 17l1.6284-5.4111.2559-.0024 1.6736 5.4136h-3.5579z"></path>
        <path d="M32,32H0V0h32v32ZM2,30h28V2H2v28Z"></path>
      </svg>
    `);
  }
  $nameEl.append(document.createTextNode(" " + presetName));

  // Icona info + tooltip
  const $iconWrapper = $infoBox.find(".applied-preset-info-icon");
  $iconWrapper.empty().append(`
    <svg focusable="false" preserveAspectRatio="xMidYMid meet"
      fill="currentColor" width="12" height="12"
      viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 22L17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22zM16 8a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 8z"></path>
      <path d="M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z"></path>
    </svg>
  `);

  $iconWrapper.off("mouseenter mouseleave")
    .on("mouseenter", function () {
      // const $tooltip = $(`<div class="preset-tooltip-popup">${description}</div>`);
      // Safe description (no HTML injection)
      const safeDescription = decodeHTMLEntities(description);
      const $tooltip = $(`<div class="preset-tooltip-popup"></div>`).text(safeDescription);

      $("body").append($tooltip);
      const offset = $iconWrapper.offset();
      $tooltip.css({
        position: "absolute",
        top: offset.top - $tooltip.outerHeight() - 6,
        left: offset.left,
        zIndex: 2000,
        maxWidth: "250px",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: "4px",
        fontSize: "0.85rem",
        pointerEvents: "none"
      });
      $iconWrapper.data("tooltipEl", $tooltip);
    })
    .on("mouseleave", function () {
      const $tooltip = $iconWrapper.data("tooltipEl");
      if ($tooltip) $tooltip.remove();
    });

  // Tags
  const $tagsBox = $infoBox.find(".applied-preset-tags");
  if ($tagsBox.length) {
    $tagsBox.empty();
    const styles = subplex.style || [];
    styles.forEach(style => {
      const color = STYLE_TAG_MAP[style] || "gray";
      $tagsBox.append(`<span class="bx--tag bx--tag--${color} bx--tag--sm">${style}</span>`);
    });
  }

  $infoBox.show();
  $wrapper.find(".new-subplex-btn").hide();
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
function onPedalControlChange($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  if (!subplex) return; // niente SubPlex → nulla da fare

  let changed = false;

  if (Array.isArray(subplex.controls)) {
    subplex.controls.forEach(ctrl => {
      const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
      if (!$control.length) return;

      let currentValue;
      switch (ctrl.type) {
        case "knob":
        case "smallknob":
        case "largeknob":
        case "xlargeknob":
          currentValue = parseFloat($control.closest(".knob-wrapper").find(".knob-value-label").text());
          break;
        case "slider":
        case "lcd":
        case "multi":
          currentValue = $control.val();
          break;
        case "led":
          currentValue = $control.data("colorIndex");
          break;
      }

      if (currentValue != ctrl.value) changed = true;
    });
  }

  if (changed && !$pedalDiv.data("subplexInvalidated")) {
    // invalidateSubplexForPedal($pedalDiv);
    updateSubplexStatus($pedalDiv);
  }
}


// Al momento del render dal DB
function setupSubplexInvalidationOnDBLoad($pedalDiv) {
  if (!$pedalDiv) return;

  // const invalidate = () => invalidateSubplexForPedal($pedalDiv);
  const updateStatus = () => updateSubplexStatus($pedalDiv);

  // rimuovi eventuali listener duplicati
  $pedalDiv
    .find('input, select, textarea')
    .off('.subplexInvalidate')
    // .on('input.subplexInvalidate change.subplexInvalidate', invalidate);
    .on('input.subplexInvalidate change.subplexInvalidate', updateStatus);

  // knob / custom controls
  $pedalDiv
    .find('[data-control-label]')
    .off('.subplexInvalidate')
    // .on('mousedown.subplexInvalidate click.subplexInvalidate', invalidate);
    .on('mousedown.subplexInvalidate click.subplexInvalidate', updateStatus);
}



// New
function updateSubplexStatus($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  if (!subplex) return;

  let totalScore = 0;

  if (Array.isArray(subplex.controls)) {
    subplex.controls.forEach(row => {
      if (!Array.isArray(row.row)) return;
      row.row.forEach(ctrl => {
        const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
        if (!$control.length) return;

        totalScore += calculateControlChangeScore(ctrl, $control);
      });
    });
  }

  let state = '';
  let displayName = subplex.presetName || subplex.name || 'SubPlex';

  if (totalScore === 0) state = 'original';
  else if (totalScore <= 2) { state = 'modified'; displayName += '*'; }
  else if (totalScore <= 5) { state = 'based_on'; displayName += '**'; }
  else { state = 'custom'; displayName = 'Custom SubPlex'; }

  $pedalDiv.data('applied-subplex-state', state);

  // Aggiorna anche il SubPlex in window.currentSubPlex per il salvataggio
  subplex.presetName = displayName;
  window.currentSubPlex[$pedalDiv.data('pedal-id')] = subplex;

  renderAppliedPresetInfo($pedalDiv, subplex, displayName, state);
}



// New
function calculateControlChangeScore(ctrl, $control) {
  let score = 0;

  switch (ctrl.type) {
    case "knob":
    case "smallknob":
    case "largeknob":
    case "xlargeknob":
    case "slider":
      const currentVal = parseFloat($control.closest(".knob-wrapper").find(".knob-value-label").text()) || parseFloat($control.val());
      const originalVal = parseFloat(ctrl.value);
      if (isNaN(currentVal) || isNaN(originalVal)) break;

      const range = ctrl.max - ctrl.min || 100;
      const relativeDiff = Math.abs(currentVal - originalVal) / range;

      score += relativeDiff < 0.1 ? 1 : 2; // piccola modifica -> *, grande -> **
      break;

    case "led":
    case "multi":
    case "dropdown":
    case "knob_discrete":
      const currentValue = $control.val() ?? $control.data("colorIndex");
      if (currentValue != ctrl.value) score += 2; // sempre **
      break;

    case "lcd":
    default:
      break; // ignoriamo
  }

  return score;
}

function getAllSubplexControls(subplex) {
    console.log("[getAllSubplexControls] subplex:", subplex);
    if (!subplex || !Array.isArray(subplex.controls)) return [];

    if (!subplex.controls[0]?.row) {
        console.log("[getAllSubplexControls] flat controls found");
        return subplex.controls;
    }

    console.log("[getAllSubplexControls] row controls found");
    return subplex.controls.flatMap(r => Array.isArray(r.row) ? r.row : []);
}






// Render applied SubPlex info box
function renderAppliedPresetInfo($pedalDiv, subplex) {
    console.log("[renderAppliedPresetInfo] called for pedal:", $pedalDiv.data("pedal-id"), "subplex:", subplex);

    const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";

    if (!subplex || (!subplex.presetName && !subplex.name && !subplex.preset_name && !subplex.id)) {
        console.log("[renderAppliedPresetInfo] No valid SubPlex found, skipping render.");
        return;
    }

    const $wrapper = $pedalDiv.closest(".pedal-wrapper");
    const $infoBox = $wrapper.find(".applied-preset-info");
    if (!$infoBox.length) {
        console.log("[renderAppliedPresetInfo] No info box found");
        return;
    }

    console.log("[renderAppliedPresetInfo] Rendering presetName:", presetName);

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
    console.log("[onPedalControlChange] called for pedal:", $pedalDiv.data("pedal-id"));
    const subplex = $pedalDiv.data('applied-subplex');
    if (!subplex) {
        console.log("[onPedalControlChange] No subplex applied");
        return;
    }

    let changed = false;
    const controls = getAllSubplexControls(subplex);

    controls.forEach(ctrl => {
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
            case "dropdown":
            case "knob_discrete":
                currentValue = $control.val() ?? $control.data("colorIndex");
                break;
        }

        if (currentValue != ctrl.value) {
            console.log("[onPedalControlChange] Control changed:", ctrl.label, "from", ctrl.value, "to", currentValue);
            changed = true;
        }
    });

    if (changed && !$pedalDiv.data("subplexInvalidated")) {
        console.log("[onPedalControlChange] Changes detected, updating SubPlex status");
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

// function setupSubplexInvalidationOnDBLoad($pedalDiv) {
//   if (!$pedalDiv) return;

//   const debug = () => debugPedalControlValues($pedalDiv);

//   $pedalDiv
//     .find('input, select, textarea')
//     .off('.subplexDebug')
//     .on('input.subplexDebug change.subplexDebug', debug);

//   $pedalDiv
//     .find('[data-control-label]')
//     .off('.subplexDebug')
//     .on('mousedown.subplexDebug click.subplexDebug', debug);
// }




// New
function updateSubplexStatus($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  const originalControls = $pedalDiv.data('subplex-original-controls');

  if (!subplex || !originalControls) return;

  console.log('[updateSubplexStatus] called for pedal:', $pedalDiv.data('pedal-name'));

  // Valori attuali
  const currentControls = collectSinglePedalControls($pedalDiv);

  let totalScore = 0;
  let changedControls = 0;

  originalControls.forEach(orig => {
    const label = orig.label;
    const origValue = orig.value;

    const current = currentControls.find(c => c.label === label);
    if (!current) return;

    const currValue = current.value;

    let score = calculateControlDelta(orig, current);
    if (score > 0) {
      totalScore += score;
      changedControls++;
    }
  });

  console.log('[updateSubplexStatus] totalScore =', totalScore);

  // Nome base (immutabile)
  if (!subplex._originalName) {
    subplex._originalName = subplex.presetName;
  }

  const baseName = subplex._originalName;
  let displayName = baseName;
  let state = 'original';

  if (totalScore === 0) {
    state = 'original';
  } else if (totalScore <= 2) {
    state = 'modified';
    displayName = baseName + '*';
  } else if (totalScore <= 5) {
    state = 'based_on';
    displayName = baseName + '**';
  } else {
    state = 'custom';
    displayName = 'Custom SubPlex';
  }

  subplex.presetName = displayName;
  $pedalDiv.data('applied-subplex-state', state);

  window.currentSubPlex = window.currentSubPlex || {};
  window.currentSubPlex[$pedalDiv.data('pedal-id')] = subplex;

  console.log('[updateSubplexStatus] state =', state, 'name =', displayName);

  renderAppliedPresetInfo($pedalDiv, subplex);
}






// New
function calculateControlChangeScore(ctrl, $control) {
    let score = 0;

    switch (ctrl.type) {
        case "knob":
        case "smallknob":
        case "largeknob":
        case "xlargeknob": {

        // rotazione attuale dal DOM
        let currentRotation = 0;
        const transform = $control.css('transform');

        if (transform && transform !== 'none') {
            const values = transform.match(/matrix\((.+)\)/)[1].split(', ');
            const a = parseFloat(values[0]);
            const b = parseFloat(values[1]);
            currentRotation = Math.atan2(b, a) * (180 / Math.PI);
        } else {
            const style = $control.attr('style');
            const match = style && style.match(/rotate\((-?\d+(\.\d+)?)deg\)/);
            currentRotation = match ? parseFloat(match[1]) : 0;
        }

        // rotazione ORIGINALE dal SubPlex
        const originalRotation = getRotationFromValue(ctrl, ctrl.value);

        const diff = Math.abs(currentRotation - originalRotation);

        // soglie (da tarare se vuoi)
        if (diff < 3) {
            score += 1;        // *
        } else {
            score += 2;        // **
        }

        break;
        }


        case "slider":
            const sliderVal = parseFloat($control.val());
            const origSlider = ctrl.value ?? ctrl._originalValue ?? 0;
            const sliderRange = ctrl.max - ctrl.min || 100;
            const relDiff = Math.abs(sliderVal - origSlider) / sliderRange;
            score += relDiff < 0.1 ? 1 : 2;
            break;

        case "knob_discrete":
        case "multi":
        case "dropdown":
        case "led":
            const val = $control.val() ?? $control.data("colorIndex");
            if (String(val) !== String(ctrl.value)) score += 2;
            break;

        case "lcd":
        default:
            break; // ignoriamo
    }

    return score;
}



function calculateControlDelta(original, current) {
  const orig = original.value;
  const curr = current.value;

  // Numerici (knob continui, slider)
  if (typeof orig === 'number' && typeof curr === 'number') {
    const diff = Math.abs(curr - orig);

    if (diff < 0.5) return 0;       // tolleranza
    if (diff < 3) return 1;         // *
    return 2;                       // **
  }

  // Discreti / dropdown / LED
  if (String(orig) !== String(curr)) {
    return 2;
  }

  return 0;
}









function debugPedalControlValues($pedalDiv) {
  const pedalName = $pedalDiv.data('pedal-name');
  const pedalId = $pedalDiv.data('pedal-id');

  console.group(`[DEBUG] Pedal controls changed → ${pedalName}`);

  // --- KNOBS ---
  $pedalDiv.find('.knob').each(function () {
    const label = $(this).data('control-label');
    const $valueLabel = $(this).closest('.knob-wrapper').children('.knob-value-label');

    let value;

    if ($valueLabel.length && $valueLabel.text().trim() !== '') {
      value = $valueLabel.text().trim();
    } else {
      const transform = $(this).css('transform');
      let angle = 0;

      if (transform && transform !== 'none') {
        const values = transform.match(/matrix\((.+)\)/)[1].split(', ');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        angle = Math.atan2(b, a) * (180 / Math.PI);
      } else {
        const style = $(this).attr('style');
        const match = style && style.match(/rotate\((-?\d+(\.\d+)?)deg\)/);
        angle = match ? parseFloat(match[1]) : 0;
      }

      value = angle;
    }

    console.log(`KNOB → ${label}:`, value);
  });

  // --- SLIDERS ---
  $pedalDiv.find('input[type="range"][data-control-label]').each(function () {
    console.log(
      `SLIDER → ${$(this).data('control-label')}:`,
      $(this).val()
    );
  });

  // --- DROPDOWNS / MULTI ---
  $pedalDiv.find('select[data-control-label]').each(function () {
    console.log(
      `SELECT → ${$(this).data('control-label')}:`,
      $(this).val()
    );
  });

  // --- LCD ---
  $pedalDiv.find('input[type="text"][data-control-label]').each(function () {
    console.log(
      `LCD → ${$(this).data('control-label')}:`,
      $(this).val()
    );
  });

  // --- LED ---
  $pedalDiv.find('.led[data-control-label]').each(function () {
    console.log(
      `LED → ${$(this).data('control-label')}:`,
      $(this).data('colorIndex')
    );
  });

  console.groupEnd();
}

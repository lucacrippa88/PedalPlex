// ===============================
// SUBPLEX.JS – VERSIONE SEMPLIFICATA
// ===============================

// Ottiene tutti i controlli di un SubPlex
function getAllSubplexControls(subplex) {
    if (!subplex || !Array.isArray(subplex.controls)) return [];
    if (!subplex.controls[0]?.row) return subplex.controls;
    return subplex.controls.flatMap(r => Array.isArray(r.row) ? r.row : []);
}

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

// ===============================
// AGGIORNA LO STATO DEL SUBPLEX
// ===============================
function updateSubplexStatus($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  const originalControls = $pedalDiv.data('subplex-original-controls');

  if (!subplex || !originalControls) return;

  const currentControls = collectSinglePedalControls($pedalDiv);

  // Controlla se ci sono modifiche
  const changed = currentControls.some(curr => {
    const orig = originalControls.find(o => o.label === curr.label);
    return orig && orig.value !== curr.value;
  });

  if (changed) {
    subplex.presetName = subplex._originalName + '*';
    $pedalDiv.data('applied-subplex-state', 'modified');
  } else {
    subplex.presetName = subplex._originalName;
    $pedalDiv.data('applied-subplex-state', 'original');
  }

  renderAppliedPresetInfo($pedalDiv, subplex);
}


// ===============================
// SETUP EVENTI CONTROLLI PEDALE
// ===============================
function setupSubplexInvalidationOnDBLoad($pedalDiv) {
    if (!$pedalDiv) return;

    const updateStatus = () => updateSubplexStatus($pedalDiv);

    $pedalDiv
        .find('input, select, textarea')
        .off('.subplexInvalidate')
        .on('input.subplexInvalidate change.subplexInvalidate', updateStatus);

    $pedalDiv
        .find('[data-control-label]')
        .off('.subplexInvalidate')
        .on('mousedown.subplexInvalidate click.subplexInvalidate', updateStatus);
}

// ===============================
// CREAZIONE SUBPLEX CUSTOM SE NON PRESENTE
// ===============================
function createCustomSubplex($pedalDiv) {
    const custom = {
        id: 'custom_' + Date.now(),
        presetName: 'Custom SubPlex',
        source: 'custom',
        style: [],
        description: '',
        controls: []
    };
    $pedalDiv.data('applied-subplex', custom);
    $pedalDiv.data('subplex-original-controls', []);
    updateSubplexStatus($pedalDiv);
}

// ===============================
// UTILITA
// ===============================
function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}

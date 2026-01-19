// ===============================
// SUBPLEX.JS – VERSIONE SEMPLIFICATA
// ===============================

// Ottiene tutti i controlli di un SubPlex
// function getAllSubplexControls(subplex) {
//     if (!subplex || !Array.isArray(subplex.controls)) return [];
//     if (!subplex.controls[0]?.row) return subplex.controls;
//     return subplex.controls.flatMap(r => Array.isArray(r.row) ? r.row : []);
// }


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

  // ⛔️ ignora bootstrap
  if ($pedalDiv.data('subplex-hydrating')) return;

  const subplex = $pedalDiv.data('applied-subplex');
  if (!subplex) return;

  // 🔒 finché l'utente non tocca nulla davvero, NON sporcare
  if (!$pedalDiv.data('subplex-dirty-enabled')) {
    $pedalDiv.data('subplex-dirty-enabled', true);
    return;
  }

  if (!subplex._originalName) {
    subplex._originalName = subplex.presetName || 'SubPlex';
  }

  if ($pedalDiv.data('applied-subplex-state') !== 'modified') {
    subplex.presetName = subplex._originalName + '*';
    $pedalDiv.data('applied-subplex-state', 'modified');
    renderAppliedPresetInfo($pedalDiv, subplex);
  }
}





function invalidateSubplex($pedalDiv) {

  if (!$pedalDiv.data("subplex-listeners-armed")) return;

  const subplex = $pedalDiv.data("applied-subplex");
  if (!subplex) return;

  if (!subplex._originalName) {
    subplex._originalName = subplex.presetName;
  }

  if (!subplex.presetName.endsWith("*")) {
    subplex.presetName += "*";
    renderAppliedPresetInfo($pedalDiv, subplex);
  }
}






// ===============================
// SETUP EVENTI CONTROLLI PEDALE
// ===============================
function setupSubplexInvalidationOnDBLoad($pedalDiv) {
  if (!$pedalDiv) return;

  const updateStatus = () => updateSubplexStatus($pedalDiv);

  // Input classici
  $pedalDiv
    .find('input, select, textarea')
    .off('.subplexInvalidate')
    .on('input.subplexInvalidate change.subplexInvalidate', updateStatus);

  // Controlli custom (knob, switch, ecc.)
  $pedalDiv
    .find('[data-control-label]')
    .off('.subplexInvalidate')
    .on('mousedown.subplexInvalidate click.subplexInvalidate', updateStatus);
}


// ===============================
// CREAZIONE SUBPLEX CUSTOM SE NON PRESENTE
// ===============================
function createCustomSubplex($pedalDiv) {
  // 1️⃣ Crea SubPlex custom in memoria
  const custom = {
    id: 'custom_' + Date.now(),
    presetName: 'Custom SubPlex',
    source: 'custom',
    tags: [],
    description: '',
    controls: []
  };
  $pedalDiv.data('applied-subplex', custom);
  $pedalDiv.data('subplex-original-controls', []);
  $pedalDiv.data('subplex-dirty-enabled', true);

  // 2️⃣ Aggiorna stato iniziale (* se necessario)
  updateSubplexStatus($pedalDiv);

  // 3️⃣ Apri modal per modificare nome, tag e descrizione
  editCustomSubplexUI($pedalDiv);
}


// ===============================
// UTILITA
// ===============================
function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}



function applyCatalogPresetToSinglePedal(pedalId, preset) {
  // Trova il pedale nel DOM
  const $pedalDiv = $(`.pedal-catalog[data-pedal-id="${pedalId}"]`);
  if (!$pedalDiv.length) {
    console.warn("Pedal not found on board:", pedalId);
    return;
  }

  $pedalDiv.data("subplex-listeners-armed", false);


  // ⛔️ PREVENT DOUBLE APPLY OF SAME PRESET
  const applied = $pedalDiv.attr("data-applied-preset");
  if (applied) {
    try {
      const parsed = JSON.parse(applied);
      if (parsed.id === preset._id) {
        return; // già applicato → esci
      }
    } catch (e) {}
  }

  const defaultPedal =
    window.catalogMap?.[pedalId] ||
    window.catalogMap?.[String(pedalId).trim()];

  if (!defaultPedal) {
    console.warn("Pedal not found in catalogMap:", pedalId);
    return;
  }

  // Deep clone del pedale di catalogo
  const pedalClone = JSON.parse(JSON.stringify(defaultPedal));

  // Applica i controls del preset
  if (preset.controls) {
    pedalClone.controls.forEach(row => {
      row.row.forEach(ctrl => {
        const label = ctrl.label;
        if (preset.controls.hasOwnProperty(label)) {
          ctrl.value = preset.controls[label];
        }
      });
    });
  }

  // Rimuove i controlli attuali
  $pedalDiv.find('.row').remove();

  // Ri-render dei controlli
  renderPedalControls(pedalClone, $pedalDiv);
  // Arma invalidazione subplex
  setupSubplexInvalidationOnDBLoad($pedalDiv);

  // Aggiorna il nome (se serve)
  const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();
  let nameClass = 'pedal-name';
  let $referenceNode = null;

  if ($existingName.length) {
    nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
    $referenceNode = $existingName.next();
    $existingName.remove();
  }

  const $nameDiv = $("<div>")
    .addClass(nameClass)
    .html(pedalClone.name)
    .attr("style", pedalClone.logo || "");

  if ($referenceNode && $referenceNode.length) {
    $nameDiv.insertBefore($referenceNode);
  } else {
    $pedalDiv.prepend($nameDiv);
  }


  // Aggiorna UI (se presente)
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }

  // Reset invalidazione
  $pedalDiv.removeData("subplexInvalidated");

  // Stato SubPlex applicato sul div
  const appliedSubplex = {
    id: preset._id,
    presetName: preset.presetName || preset.name || preset._id,
    published: preset.published,
    source: preset.source,
    description: preset.description || '',
    style: preset.style || [],
    authorId: preset.authorId || preset.user_id || '',
    version: preset.version || 1
  };

  // Salva il nome originale subito
  appliedSubplex._originalName = appliedSubplex.presetName;
  $pedalDiv.data('applied-subplex-state', 'original');
  $pedalDiv.data('subplex-dirty-enabled', false);
  $pedalDiv.data('applied-subplex', appliedSubplex);
  $pedalDiv.attr("data-applied-preset", JSON.stringify({
    id: appliedSubplex.id,
    name: appliedSubplex.presetName,
    style: appliedSubplex.style,
    published: appliedSubplex.published
  }));

  // ✅ Aggiorna globale
  window.currentSubPlex = window.currentSubPlex || {};
  window.currentSubPlex[pedalId] = appliedSubplex;

  // Salva i controlli originali per confronti futuri
  const originalControls = collectSinglePedalControls($pedalDiv);
  $pedalDiv.data('subplex-original-controls', JSON.parse(JSON.stringify(originalControls)));
  // Salva il nome originale
  if (!appliedSubplex._originalName) appliedSubplex._originalName = appliedSubplex.presetName;


  renderAppliedPresetInfo($pedalDiv, appliedSubplex);

  setTimeout(() => {
    $pedalDiv.data("subplex-listeners-armed", true);
  }, 0);


}



function collectSinglePedalControls($pedalDiv) {
  const controls = [];

  $pedalDiv.find('[data-control-label]').each(function () {
    const $el = $(this);
    const label = $el.data('control-label');
    let value = null;

    // knob con rotazione
    if ($el.hasClass('knob')) {
      const transform = $el.css('transform');
      value = transform || null;
    }
    // input / select
    else if ($el.is('input, select, textarea')) {
      value = $el.val();
    }
    // fallback
    else {
      value = $el.text();
    }

    controls.push({ label, value });
  });

  return controls;
}



function editCustomSubplexUI($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  if (!subplex) return;

  const currentName = subplex.presetName || subplex.name || '';
  const currentDesc = subplex.description || '';
  const currentStyles = subplex.style || [];

  // Costruisci options per dropdown tag
  let tagOptionsHtml = '';
  Object.keys(STYLE_TAG_MAP).forEach(tag => {
    const selected = currentStyles.includes(tag) ? 'selected' : '';
    tagOptionsHtml += `<option value="${tag}" ${selected}>${tag}</option>`;
  });

  Swal.fire({
    title: 'Edit Custom SubPlex',
    html: `
      <div style="text-align:left">

        <label class="bx--label">Name</label>
        <input id="swal-subplex-name"
               class="bx--text-input swal2-input"
               maxlength="20"
               placeholder="Name (max 20 chars)"
               value="${currentName}">

        <label class="bx--label" style="margin-top:10px;">Style Tags</label>
        <select id="swal-subplex-tags"
                class="bx--select-input"
                multiple
                style="width:100%; min-height:120px;">
          ${tagOptionsHtml}
        </select>

        <label class="bx--label" style="margin-top:10px;">Description</label>
        <textarea id="swal-subplex-desc"
                  class="bx--text-area swal2-textarea"
                  maxlength="100"
                  placeholder="Description (max 100 chars)">${currentDesc}</textarea>

        <div style="font-size:0.8rem; color:#666; margin-top:6px;">
          Hold Ctrl / Cmd to select multiple tags.
        </div>

      </div>
    `,
    showCancelButton: true,
    showConfirmButton: true,
    focusConfirm: false,
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    preConfirm: () => {
      const name = document.getElementById('swal-subplex-name').value.trim();
      const desc = document.getElementById('swal-subplex-desc').value.trim();
      const select = document.getElementById('swal-subplex-tags');

      const selectedTags = Array.from(select.selectedOptions).map(opt => opt.value);

      // Validazioni
      if (name.length === 0) {
        Swal.showValidationMessage('Name cannot be empty');
        return false;
      }
      if (name.length > 20) {
        Swal.showValidationMessage('Name must be max 20 characters');
        return false;
      }
      if (desc.length > 100) {
        Swal.showValidationMessage('Description must be max 100 characters');
        return false;
      }

      return {
        name,
        styles: selectedTags,
        desc
      };
    }
  }).then((result) => {
    if (!result.isConfirmed || !result.value) return;

    // 🔹 Aggiorna SubPlex in memoria (nomi corretti!)
    subplex.presetName = result.value.name;
    subplex.style = result.value.styles;
    subplex.description = result.value.desc;

    // Abilita dirty state
    $pedalDiv.data('subplex-dirty-enabled', true);

    // Forza invalidazione (*)
    updateSubplexStatus($pedalDiv);

    // Sync UI
    renderAppliedPresetInfo($pedalDiv, subplex);
    
    // ✅ REGISTRA PER IL SALVATAGGIO GLOBALE
    const pedalId = $pedalDiv.data('pedal-id');
    window.currentSubPlex = window.currentSubPlex || {};
    window.currentSubPlex[pedalId] = subplex;
  });
}

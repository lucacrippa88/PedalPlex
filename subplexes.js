// ===============================
// SUBPLEX.JS
// ===============================

// Render applied SubPlex info box
function renderAppliedPresetInfo($pedalDiv, subplex) {

  const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";
  
  if (!subplex || (!subplex.presetName && !subplex.name && !subplex.preset_name && !subplex.id)) {
    // console.log("No valid SubPlex found, skipping render.");
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

  // Make icon wrapper position relative so tooltip can be positioned relative to it
  $iconWrapper.css({
    position: "relative",
    display: "inline-block"
  });

  $iconWrapper.off("mouseenter mouseleave")
    .on("mouseenter", function () {
      // Safe description (no HTML injection)
      const safeDescription = decodeHTMLEntities(description);
      const $tooltip = $(`<div class="preset-tooltip-popup"></div>`).text(safeDescription);

      // Append tooltip directly to the icon wrapper (inside zoomed container)
      $iconWrapper.append($tooltip);
      
      // Position tooltip relative to icon wrapper
      $tooltip.css({
        position: "absolute",
        bottom: "calc(100% + 6px)", // Position above the icon
        left: "50%",
        transform: "translateX(-50%)", // Center horizontally
        zIndex: 2000,
        maxWidth: "330px",
        width: "330px",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: "4px",
        fontSize: "0.85rem",
        pointerEvents: "none",
        whiteSpace: "normal",
        wordWrap: "break-word"
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

  if (!subplex) return;

  if ($pedalDiv.data('subplex-hydrating')) return;

  // Non attivare dirty automaticamente
  if (!$pedalDiv.data('subplex-dirty-enabled')) {
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
    description: '',
    userId: window.currentUser.username || ''
  };
  $pedalDiv.data('applied-subplex', custom);
  $pedalDiv.data('subplex-original-controls', []);
  $pedalDiv.data('subplex-dirty-enabled', true);

  // 2️⃣ Aggiorna stato iniziale (* se necessario)
  updateSubplexStatus($pedalDiv);

  // 3️⃣ Apri modal per modificare nome, tag e descrizione
  editCustomSubplexUI($pedalDiv);

  updateSubplexButtonsUI($pedalDiv);

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
    // console.warn("Pedal not found on board:", pedalId);
    return;
  }

  $pedalDiv.data("subplex-listeners-armed", false);


  // PREVENT DOUBLE APPLY OF SAME PRESET
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
    // console.warn("Pedal not found in catalogMap:", pedalId);
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
  updateSubplexButtonsUI($pedalDiv);


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

  const currentName = (subplex.presetName || subplex.name || '').replace(/\*$/, '');
  const currentDesc = subplex.description || '';
  const currentStyles = subplex.style || [];
  const isLoggedIn = !!(window.currentUser && window.currentUser.username);
  // Show "save to catalog" only for purely in-memory custom subplexes (not already saved)
  const isAlreadySaved = !!(subplex.private_id);

  // Build style tag chips with per-tag Carbon color
  const tagChips = Object.keys(STYLE_TAG_MAP).map(tag => {
    const color    = STYLE_TAG_MAP[tag] || "";
    const active   = currentStyles.includes(tag) ? ' explore-chip--active' : '';
    const colorCls = color ? ` explore-chip--${color}` : '';
    return `<button type="button" class="explore-chip explore-chip--style${colorCls}${active}" data-value="${tag}">${tag}</button>`;
  }).join('');

  const saveToCatalogRow = isLoggedIn && !isAlreadySaved ? `
    <div class="explore-section" style="margin-top:4px;">
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem;">
        <input type="checkbox" id="swal-subplex-save-private" style="width:auto; margin:0;">
        <span>Save to my private SubPlex catalog</span>
      </label>
      <p style="font-size:0.75rem; color:#888; margin:2px 0 0 24px;">Only you will see it in the SubPlex dropdown.</p>
    </div>
  ` : '';

  Swal.fire({
    title: 'Add SubPlex',
    html: `
      <div class="explore-modal">

        <div class="explore-section">
          <div class="explore-section-header">Name</div>
          <input id="swal-subplex-name"
                class="explore-text-input"
                placeholder="Add a name here..."
                value="${currentName}">
        </div>

        <div class="explore-section">
          <div class="explore-section-header">Style <span class="explore-hint">pick one or more</span></div>
          <div class="explore-chips" id="swal-subplex-chips">${tagChips}</div>
        </div>

        <div class="explore-section">
          <div class="explore-section-header">Description <span class="explore-hint">max 100 chars</span></div>
          <textarea id="swal-subplex-desc"
                    class="explore-text-input"
                    maxlength="100"
                    style="height:52px; resize:vertical;"
                    placeholder="How would you describe your sound...?">${currentDesc}</textarea>
        </div>

        ${saveToCatalogRow}

      </div>
    `,
    showCancelButton: false,
    showCloseButton: true,
    showConfirmButton: true,
    focusConfirm: false,
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24 4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'></path></svg>Save SubPlex",
    didOpen: () => {
      document.querySelectorAll('#swal-subplex-chips .explore-chip').forEach(chip => {
        chip.addEventListener('click', () => chip.classList.toggle('explore-chip--active'));
      });
    },
    preConfirm: () => {
      const name = document.getElementById('swal-subplex-name').value.trim();
      const desc = document.getElementById('swal-subplex-desc').value.trim();
      const savePrivateEl = document.getElementById('swal-subplex-save-private');

      const selectedTags = [...document.querySelectorAll('#swal-subplex-chips .explore-chip--active')].map(c => c.dataset.value);
      const savePrivate = savePrivateEl ? savePrivateEl.checked : false;

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
        desc,
        savePrivate
      };
    }
  }).then(async (result) => {
    if (!result.isConfirmed || !result.value) return;

    const { name, styles, desc, savePrivate } = result.value;

    // Aggiorna SubPlex in memoria
    subplex.presetName = name;
    subplex.style = styles;
    subplex.description = desc;

    // Abilita dirty state
    $pedalDiv.data('subplex-dirty-enabled', true);

    // Forza invalidazione (*)
    updateSubplexStatus($pedalDiv);

    // Sync UI
    renderAppliedPresetInfo($pedalDiv, subplex);

    // REGISTRA PER IL SALVATAGGIO GLOBALE
    const pedalId = $pedalDiv.data('pedal-id');
    window.currentSubPlex = window.currentSubPlex || {};
    window.currentSubPlex[pedalId] = subplex;

    // Save to private catalog if requested
    if (savePrivate) {
      await saveSubplexToPrivateCatalog($pedalDiv, subplex, pedalId);
    }
  });
}


// Collect controls from a single pedal div as the {label: value} flat map
// expected by the SubPlex catalog (same format as existing presets).
function collectSinglePedalControlsMap($pedalDiv, pedalId) {
  const controlsMap = {};
  const pedalName = $pedalDiv.data('pedal-name');

  // --- Knobs ---
  $pedalDiv.find('.knob').each(function () {
    const label = $(this).data('control-label');
    if (!label) return;
    const $valueLabel = $(this).closest('.knob-wrapper').children('.knob-value-label');
    let value;
    if ($valueLabel.length && $valueLabel.text().trim() !== '') {
      value = $valueLabel.text().trim();
    } else {
      const transform = $(this).css('transform');
      let angle = 0;
      if (transform && transform !== 'none') {
        const vals = transform.match(/matrix\((.+)\)/);
        if (vals) {
          const parts = vals[1].split(', ');
          const a = parseFloat(parts[0]);
          const b = parseFloat(parts[1]);
          angle = Math.atan2(b, a) * (180 / Math.PI);
        }
      } else {
        const style = $(this).attr('style');
        const match = style && style.match(/rotate\((-?\d+)deg\)/);
        angle = match ? parseInt(match[1], 10) : 0;
      }
      value = getValueFromRotation(angle);
    }
    controlsMap[label] = isNaN(value) ? value : parseFloat(value);
  });

  // --- Selects (multi / discrete knob) ---
  $pedalDiv.find('select[data-control-label]').each(function () {
    const label = $(this).data('control-label');
    if (!label) return;
    controlsMap[label] = $(this).val();
  });

  // --- Sliders ---
  $pedalDiv.find('input[type="range"][data-control-label]').each(function () {
    const label = $(this).data('control-label');
    if (!label) return;
    controlsMap[label] = parseFloat($(this).val());
  });

  // --- LCDs / text inputs ---
  $pedalDiv.find('input[type="text"][data-control-label]').each(function () {
    const label = $(this).data('control-label');
    if (!label) return;
    controlsMap[label] = $(this).val().trim();
  });

  // --- LEDs: store the color index (0 = off, 1+ = on) ---
  $pedalDiv.find('.led[data-control-label]').each(function () {
    const label = $(this).data('control-label');
    if (!label) return;
    const bgColor = ($(this).css('background-color') || '').trim();
    const hexColor = typeof normalizeHex === 'function' ? normalizeHex(bgColor) : bgColor;

    let matchedIndex = 0;
    if (Array.isArray(window.catalog)) {
      const pedalData =
        window.catalog.find(p => p._id === pedalId) ||
        window.catalog.find(p => p.name === pedalName);

      if (pedalData && Array.isArray(pedalData.controls)) {
        outerLoop: for (const rowWrapper of pedalData.controls) {
          if (!Array.isArray(rowWrapper.row)) continue;
          for (const ctrl of rowWrapper.row) {
            if (ctrl.label === label && Array.isArray(ctrl.colors)) {
              const catalogColors = ctrl.colors.map(c => typeof normalizeHex === 'function' ? normalizeHex(c) : c);
              const idx = catalogColors.indexOf(hexColor);
              if (idx !== -1) { matchedIndex = idx; break outerLoop; }
            }
          }
        }
      }
    }
    controlsMap[label] = matchedIndex;
  });

  return controlsMap;
}


// Save a custom subplex to the user's private catalog
async function saveSubplexToPrivateCatalog($pedalDiv, subplex, pedalId) {
  const token = localStorage.getItem('authToken');
  if (!token) return;

  const controlsMap = collectSinglePedalControlsMap($pedalDiv, pedalId);

  try {
    Swal.fire({ title: 'Saving SubPlex...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const res = await fetch('https://api.pedalplex.com/SAVE_PRIVATE_SUBPLEX.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        pedalId: pedalId,
        presetName: subplex.presetName,
        description: subplex.description || '',
        style: subplex.style || [],
        controls: controlsMap
      })
    });

    const data = await res.json();
    Swal.close();

    if (data.ok && data.id) {
      // Mark the subplex as saved so we don't show the checkbox again
      subplex.private_id = data.id;
      subplex.private_owner = window.currentUser.username;
      $pedalDiv.data('applied-subplex', subplex);

      // Invalidate dropdown cache for this pedal so private subplex appears
      if (window.presetCatalogCache) {
        delete window.presetCatalogCache[pedalId];
      }

      Swal.fire({
        icon: 'success',
        title: 'SubPlex saved!',
        text: 'Your private SubPlex is now available in the dropdown.',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire('Error', data.error || 'Failed to save SubPlex to catalog', 'error');
    }
  } catch (err) {
    Swal.close();
    console.error('saveSubplexToPrivateCatalog error:', err);
    Swal.fire('Error', 'Network error while saving SubPlex', 'error');
  }
}




function clearAppliedSubplexState($pedalDiv) {
  if (!$pedalDiv || !$pedalDiv.length) return;

  const pedalId = $pedalDiv.data('pedal-id');

  $pedalDiv.removeData('applied-subplex');
  $pedalDiv.removeData('subplex-original-controls');
  $pedalDiv.removeData('applied-subplex-state');
  $pedalDiv.removeData('subplex-dirty-enabled');
  $pedalDiv.removeData('subplex-listeners-armed');
  $pedalDiv.removeData('subplexInvalidated');
  $pedalDiv.removeAttr('data-applied-preset');

  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  $wrapper.find(".applied-preset-info").hide();
  $wrapper.find(".applied-preset-tags").empty();
  $wrapper.find(".applied-preset-name").empty();
  $wrapper.find(".applied-preset-info-icon").empty();

  updateSubplexButtonsUI($pedalDiv);

  if (window.currentSubPlex && pedalId && window.currentSubPlex[pedalId]) {
    delete window.currentSubPlex[pedalId];
  }
}


function resetSubplexOnSinglePedal($pedalDiv) {
  if (!$pedalDiv || !$pedalDiv.length) return;

  const pedalId = $pedalDiv.data('pedal-id');

  // 1️⃣ Recupera il pedale di catalogo originale
  const defaultPedal =
    window.catalogMap?.[pedalId] ||
    window.catalogMap?.[String(pedalId).trim()];

  if (!defaultPedal) {
    // console.warn("Default pedal not found for reset:", pedalId);
    return;
  }

  // 2️⃣ Deep clone del pedale originale
  const pedalClone = JSON.parse(JSON.stringify(defaultPedal));

  // 3️⃣ Rimuove tutti i controlli attuali
  $pedalDiv.find('.row').remove();

  // 4️⃣ Ri-render controlli originali
  renderPedalControls(pedalClone, $pedalDiv);

  // 5️⃣ Ri-arma invalidazione (se serve in futuro)
  setupSubplexInvalidationOnDBLoad($pedalDiv);

  // 6️⃣ Ripristina nome/logo se era stato toccato
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

  // 7️⃣ Pulisce stato SubPlex sul DOM
  clearAppliedSubplexState($pedalDiv);

  // 🔟 Aggiorna stato del tasto Save (se esiste)
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }

  // console.log("SubPlex reset completed for pedal:", pedalId);
}

function updateSubplexButtonsUI($pedalDiv) {
  const $wrapper = $pedalDiv.closest('.pedal-wrapper');
  const $presetContainer = $wrapper.find('.preset-container');

  const $newBtn = $presetContainer.find(".new-subplex-btn");
  const $resetBtn = $presetContainer.find(".reset-subplex-btn");

  const isEditMode = !!window.SUBPLEX_EDIT_MODE;

  const hasApplied =
    !!$pedalDiv.attr("data-applied-preset") ||
    !!$pedalDiv.data("applied-subplex");

  // Read-only mode (catalogo / pagine statiche)
  if (!isEditMode) {
    $newBtn.hide(); // Mai mostrare il +

    if (hasApplied) {
      $resetBtn.show();  // Permetti reset (opzionale UX)
    } else {
      $resetBtn.hide();
    }

    return;
  }

  // Edit mode (plexes.html)
  if (hasApplied) {
    $newBtn.hide();
    $resetBtn.show();
  } else {
    $newBtn.show();
    $resetBtn.hide();
  }
}

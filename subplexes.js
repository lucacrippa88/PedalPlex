// ======================
// Recupera i controlli di un singolo pedale
// ======================
function collectSinglePedalControls($pedalDiv) {
    const controls = [];

    // --- KNOBS ---
    $pedalDiv.find('.knob').each(function () {
        const label = $(this).data('control-label');
        let value = 0;

        const $valueLabel = $(this).closest('.knob-wrapper').children('.knob-value-label');
        if ($valueLabel.length && $valueLabel.text().trim() !== '') {
            value = parseFloat($valueLabel.text().trim());
        } else {
            // fallback: legge angolo dal transform
            const transform = $(this).css('transform');
            if (transform && transform !== 'none') {
                const values = transform.match(/matrix\((.+)\)/)[1].split(', ');
                const a = parseFloat(values[0]);
                const b = parseFloat(values[1]);
                value = Math.atan2(b, a) * (180 / Math.PI);
            }
        }

        controls.push({ label, value, type: 'knob' });
    });

    // --- SLIDERS ---
    $pedalDiv.find('input[type="range"][data-control-label]').each(function () {
        controls.push({
            label: $(this).data('control-label'),
            value: parseFloat($(this).val()),
            type: 'slider'
        });
    });

    // --- DROPDOWNS / MULTI ---
    $pedalDiv.find('select[data-control-label]').each(function () {
        controls.push({
            label: $(this).data('control-label'),
            value: $(this).val(),
            type: 'dropdown'
        });
    });

    // --- LCD ---
    $pedalDiv.find('input[type="text"][data-control-label]').each(function () {
        controls.push({
            label: $(this).data('control-label'),
            value: $(this).val(),
            type: 'lcd'
        });
    });

    // --- LED ---
    $pedalDiv.find('.led[data-control-label]').each(function () {
        controls.push({
            label: $(this).data('control-label'),
            value: $(this).data('colorIndex'),
            type: 'led'
        });
    });

    return controls;
}


// ======================
// Applica o aggiorna SubPlex su un pedale
// ======================
function updateSubplexStatus($pedalDiv) {
    let subplex = $pedalDiv.data('applied-subplex');
    if (!subplex) return;

    // Se non è già modificato, aggiungi *
    if (!subplex.presetName?.endsWith('*')) {
        subplex.presetName = (subplex.presetName || 'SubPlex') + '*';
    }

    // Salva stato
    $pedalDiv.data('applied-subplex-state', 'modified');

    // Aggiorna globalmente
    window.currentSubPlex = window.currentSubPlex || {};
    window.currentSubPlex[$pedalDiv.data('pedal-id')] = subplex;

    // Aggiorna UI
    renderAppliedPresetInfo($pedalDiv, subplex);
}


// ======================
// Crea un SubPlex custom
// ======================
function createCustomSubplex($pedalDiv) {
    const custom = {
        id: 'custom-' + Date.now(),
        presetName: 'Custom SubPlex',
        description: '',
        style: [],
        source: 'user',
        authorId: 'currentUser',
        version: 1,
        controls: collectSinglePedalControls($pedalDiv)
    };

    $pedalDiv.data('applied-subplex', custom);
    $pedalDiv.data('subplex-original-controls', collectSinglePedalControls($pedalDiv));
    $pedalDiv.data('applied-subplex-state', 'custom');

    window.currentSubPlex = window.currentSubPlex || {};
    window.currentSubPlex[$pedalDiv.data('pedal-id')] = custom;

    renderAppliedPresetInfo($pedalDiv, custom);
}


// ======================
// Imposta listener per modifiche controlli
// ======================
function setupSubplexInvalidationOnDBLoad($pedalDiv) {
    if (!$pedalDiv) return;

    const markModified = () => updateSubplexStatus($pedalDiv);

    // input, select, textarea → qualsiasi modifica
    $pedalDiv.find('input, select, textarea')
        .off('.subplexInvalidate')
        .on('input.subplexInvalidate change.subplexInvalidate', markModified);

    // knob / custom controls
    $pedalDiv.find('[data-control-label]')
        .off('.subplexInvalidate')
        .on('mousedown.subplexInvalidate click.subplexInvalidate', markModified);
}


// ======================
// Render info SubPlex (titolo, tag, descrizione)
// ======================
function renderAppliedPresetInfo($pedalDiv, subplex) {
    const presetName = subplex.presetName || 'SubPlex';
    const $wrapper = $pedalDiv.closest('.pedal-wrapper');
    const $infoBox = $wrapper.find('.applied-preset-info');
    if (!$infoBox.length) return;

    const description = subplex.description || 'No description available';

    const $nameEl = $infoBox.find('.applied-preset-name');
    $nameEl.empty();
    if (subplex.source === 'ai') {
        $nameEl.append('<svg class="ai-preset-icon" ...>...</svg>'); // tua icona AI
    }
    $nameEl.append(document.createTextNode(' ' + presetName));

    const $tagsBox = $infoBox.find('.applied-preset-tags');
    if ($tagsBox.length) {
        $tagsBox.empty();
        (subplex.style || []).forEach(style => {
            const color = STYLE_TAG_MAP[style] || 'gray';
            $tagsBox.append(`<span class="bx--tag bx--tag--${color} bx--tag--sm">${style}</span>`);
        });
    }

    $infoBox.show();
    $wrapper.find('.new-subplex-btn').hide();
}

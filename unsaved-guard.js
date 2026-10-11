// ===============================
// unsaved-guard.js
// Avvisa l'utente se sta lasciando la pagina con un Rig o un Preset modificato e non salvato.
// Incluso in rigs.html e plexes.html.
//
// Strategia: si confronta lo stato corrente con uno "snapshot" preso quando il Rig/Preset
// è stato caricato (o salvato) l'ultima volta. Se coincidono, non c'è nulla da salvare.
// ===============================
(function () {

  // --- RIG --------------------------------------------------------------
  // Snapshot per Rig (chiave = _id o nome), preso al primo render del Rig.
  const rigBaselines = {};

  const rigKey = (board) => board && (board._id || board.board_name || 'rig');
  const rigSignature = (board) => JSON.stringify(board.pedals || []);

  function captureRigBaseline() {
    const board = window.pedalboard;
    if (!board) return;
    const key = rigKey(board);
    if (!(key in rigBaselines)) rigBaselines[key] = rigSignature(board);
  }

  function markRigClean() {
    const board = window.pedalboard;
    if (!board) return;
    rigBaselines[rigKey(board)] = rigSignature(board);
  }

  // Scarta le modifiche non salvate del Rig corrente ripristinando lo snapshot
  function discardRig() {
    const board = window.pedalboard;
    if (!board) return;
    const key = rigKey(board);
    if (key in rigBaselines) board.pedals = JSON.parse(rigBaselines[key]);
  }

  function isRigDirty() {
    const board = window.pedalboard;
    if (!board) return false;
    const key = rigKey(board);
    return (key in rigBaselines) && rigBaselines[key] !== rigSignature(board);
  }

  // --- PRESET -----------------------------------------------------------
  // Snapshot dei controlli dei gear, preso dopo l'applicazione del Preset.
  let presetBaseline = null;

  function presetSignature() {
    try {
      return JSON.stringify(collectPedalControlValues('preset'));
    } catch (e) {
      return null;
    }
  }

  function capturePresetBaseline() {
    presetBaseline = presetSignature();
  }

  function isPresetDirty() {
    if (window.isPreviewMode) return false;
    if (presetBaseline === null) return false;
    if (typeof currentPresetId === 'undefined' || !currentPresetId) return false;
    const current = presetSignature();
    return current !== null && current !== presetBaseline;
  }

  function discardAll() {
    discardRig();
    presetBaseline = null; // il Preset successivo riscatterà lo snapshot all'applicazione
  }

  // --- API + listener ---------------------------------------------------
  window.PPUnsaved = {
    captureRigBaseline,
    markRigClean,
    capturePresetBaseline,
    markPresetClean: capturePresetBaseline,
    isDirty: () => isRigDirty() || isPresetDirty()
  };

  // --- Conferma sul cambio dropdown --------------------------------------
  const GUARDED_SELECTS = ['pedalboardSelect', 'folderSelect', 'presetSelect'];
  const prevValues = {};

  // Memorizza il valore del dropdown prima che l'utente lo cambi (per poterlo ripristinare)
  ['focusin', 'pointerdown', 'keydown'].forEach(evt => {
    document.addEventListener(evt, (e) => {
      const t = e.target;
      if (t && GUARDED_SELECTS.includes(t.id)) prevValues[t.id] = t.value;
    }, true);
  });

  // Fase di capture sul document: gira prima di qualsiasi handler registrato sul <select>.
  // Gli eventi sintetici (dispatchEvent) non sono "trusted" e passano senza controllo.
  document.addEventListener('change', (e) => {
    const sel = e.target;
    if (!e.isTrusted || !sel || !GUARDED_SELECTS.includes(sel.id)) return;
    if (!window.PPUnsaved.isDirty()) return;

    const newValue = sel.value;
    const prev = prevValues[sel.id];

    // Blocca il cambio e ripristina la selezione precedente
    e.stopImmediatePropagation();
    if (prev !== undefined) sel.value = prev;

    Swal.fire({
      icon: 'warning',
      title: 'Unsaved changes',
      text: 'You have unsaved changes. If you continue they will be lost. Save them first, or discard and switch?',
      showCancelButton: true,
      confirmButtonText: 'Discard & switch',
      cancelButtonText: 'Stay here',
      customClass: {
        confirmButton: 'bx--btn bx--btn--danger',
        cancelButton: 'bx--btn bx--btn--secondary'
      },
      buttonsStyling: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      discardAll();
      sel.value = newValue;
      prevValues[sel.id] = newValue;
      sel.dispatchEvent(new Event('change', { bubbles: true })); // evento sintetico: bypassa il guard
    });
  }, true);

  window.addEventListener('beforeunload', (e) => {
    if (!window.PPUnsaved.isDirty()) return;
    // Il browser mostra il proprio messaggio standard di conferma.
    e.preventDefault();
    e.returnValue = '';
  });

})();

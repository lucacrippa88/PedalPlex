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

  // Firma di TUTTI i gear in pagina. Non si usa collectPedalControlValues perché
  // include solo i pedali con un LED acceso: le modifiche agli altri non risultavano "dirty".
  function presetSignature() {
    try {
      if (typeof collectSinglePedalControlsMap === 'function') {
        const sig = {};
        const $pedals = $('.pedal-catalog[data-pedal-id]');
        if (!$pedals.length) return null; // gear non ancora renderizzati: nessuna firma valida
        $pedals.each(function () {
          const id = $(this).data('pedal-id');
          sig[id] = collectSinglePedalControlsMap($(this), id);
        });
        return JSON.stringify(sig);
      }
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
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M6,30H18a2.0023,2.0023,0,0,0,2-2V25H18v3H6V4H18V7h2V4a2.0023,2.0023,0,0,0-2-2H6A2.0023,2.0023,0,0,0,4,4V28A2.0023,2.0023,0,0,0,6,30Z'></path><path d='M20.586 20.586 24.172 17 10 17 10 15 24.172 15 20.586 11.414 22 10 28 16 22 22 20.586 20.586z'></path></svg>Discard & switch",
      cancelButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M24 9.4 22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z'/></svg>Stay here",
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

  // --- Conferma sull'uscita dalla pagina (link e bottoni di navigazione) ---
  // Il popup nativo di beforeunload non è personalizzabile: intercettiamo il click
  // prima che parta la navigazione e mostriamo uno Swal. Se l'utente conferma,
  // rilanciamo il click (evento non "trusted", quindi non ri-intercettato) e
  // disattiviamo temporaneamente beforeunload.
  const NAV_BUTTONS = '#profileBtn, #settingsBtn, #logoutBtn, #loginFullscreenBtn, #loginBtn, #loginBtnMobile';
  let leaving = false;

  document.addEventListener('click', (e) => {
    if (!e.isTrusted || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!e.target.closest) return;

    const btn = e.target.closest(NAV_BUTTONS);
    const link = btn ? null : e.target.closest('a[href]');

    if (link) {
      const href = link.getAttribute('href') || '';
      const opensElsewhere = link.target && link.target !== '_self';
      const notNavigation = /^(#|javascript:|mailto:|tel:)/i.test(href) || link.hasAttribute('download');
      if (opensElsewhere || notNavigation) return;
    } else if (!btn) {
      return;
    }

    if (!window.PPUnsaved.isDirty()) return;

    const el = btn || link;
    e.preventDefault();
    e.stopImmediatePropagation();

    Swal.fire({
      icon: 'warning',
      title: 'Unsaved changes',
      text: 'You have unsaved changes. If you leave this page they will be lost.',
      showCancelButton: true,
      confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M6,30H18a2.0023,2.0023,0,0,0,2-2V25H18v3H6V4H18V7h2V4a2.0023,2.0023,0,0,0-2-2H6A2.0023,2.0023,0,0,0,4,4V28A2.0023,2.0023,0,0,0,6,30Z'></path><path d='M20.586 20.586 24.172 17 10 17 10 15 24.172 15 20.586 11.414 22 10 28 16 22 22 20.586 20.586z'></path></svg>Leave page",
      cancelButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M24 9.4 22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z'/></svg>Stay here",
      customClass: {
        container: 'swal-above-menu',
        confirmButton: 'bx--btn bx--btn--danger',
        cancelButton: 'bx--btn bx--btn--secondary'
      },
      buttonsStyling: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      leaving = true;
      setTimeout(() => { leaving = false; }, 1500); // se l'azione non porta via dalla pagina, riattiva il guard
      el.click();
    });
  }, true);

  // Mobile: iOS Safari ignora del tutto beforeunload, e Chrome Android non lo mostra
  // con il pull-to-refresh. Finché ci sono modifiche non salvate si disattiva quindi il
  // gesto "tira per ricaricare" (il controllo è fatto all'inizio di ogni tocco).
  document.addEventListener('touchstart', () => {
    const dirty = window.PPUnsaved.isDirty();
    document.documentElement.style.overscrollBehaviorY = dirty ? 'contain' : '';
    document.body.style.overscrollBehaviorY = dirty ? 'contain' : '';
  }, { passive: true, capture: true });

  window.addEventListener('beforeunload', (e) => {
    if (leaving || !window.PPUnsaved.isDirty()) return;
    // Il browser mostra il proprio messaggio standard di conferma.
    e.preventDefault();
    e.returnValue = '';
  });

})();

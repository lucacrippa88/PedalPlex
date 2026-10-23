/**
 * rigs-dnd-slots.js
 * Variante di rigs-dnd.js adattata al sistema con slot vuoti (rigs-test.html).
 *
 * Differenze rispetto a rigs-dnd.js:
 *
 * 1. onPointerDown: ignora elementi con [data-empty-slot] — gli slot vuoti non
 *    avviano il drag.
 *
 * 2. insertionCandidate: usa row.children (tutti i figli diretti) invece di
 *    querySelectorAll(.pedal-wrapper, .pedal-catalog). Questo include gli slot
 *    vuoti come ancore visive per il posizionamento orizzontale del placeholder,
 *    evitando che il cursore "cada nel vuoto" tra un pedale e uno slot.
 *
 * 3. onPointerUp — positionInRow: conta solo i .pedal-wrapper / .pedal-catalog
 *    (pedali reali) che precedono il placeholder, ignorando gli slot vuoti.
 *    Questo dà il corretto indice logico dentro la riga.
 *
 * 4. onPointerUp — insertAt calcolato PRE-splice: computeAbsoluteInsertIndex
 *    viene chiamato PRIMA di rimuovere il pedale dall'array. Dopo lo splice,
 *    se insertAt > srcIdx l'indice viene decrementato di 1 per compensare
 *    lo shift dell'array.
 *
 * 5. cleanupEmptyRows: disabilitata. renderPedalboard() ricostruisce l'intero
 *    DOM da zero; rimuovere righe manualmente prima del re-render conflitterebbe
 *    con le righe che contengono solo slot vuoti (sempre presenti by design).
 */

(function () {
  const SELECT = {
    BOARD: '#pedalboard',
    ROW: '.pedal-row',
    WRAPPER: '.pedal-wrapper',
    FALLBACK: '.pedal-catalog'
  };

  const $ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));
  const one = (sel, root = document) => (root || document).querySelector(sel);

  let state = {
    draggingEl: null,
    draggingId: null,
    placeholder: null,
    originAbsIndex: null,
    originRowNum: null,
    isDragging: false,
    pointerId: null
  };

  let dragStartPos = null;
  const DRAG_THRESHOLD = 6;
  // Touch: il drag parte solo dopo una pressione prolungata (evita drag accidentali durante lo scroll)
  const LONG_PRESS_MS = 350;
  const LONG_PRESS_MOVE_TOLERANCE = 10;

  function injectCSS() {
    if (document.getElementById('pedalboard-dnd-slots-css')) return;
    const s = document.createElement('style');
    s.id = 'pedalboard-dnd-slots-css';
    s.textContent = `
.pedalboard-dnd-placeholder {
  box-sizing: border-box;
  border: 2px dashed rgba(0,0,0,0.45);
  border-radius: 8px;
  background: rgba(0,0,0,0.02);
  margin: 0 8px;
  flex: 0 0 auto;
}
.dnd-dragging {
  opacity: 0.92;
  transform: scale(1.02);
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
  transition: none !important;
  pointer-events: none !important;
}
.pedal-wrapper, .pedal-catalog {
  transition: transform 160ms ease, box-shadow 120ms ease;
  will-change: transform;
}
@media (pointer: coarse) {
  #pedalboard .pedal-wrapper, #pedalboard .pedal-catalog {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
}
#dnd-touch-hint {
  display: none;
  margin: 6px 0 0;
  font-size: 11px;
  color: #8d8d8d;
}
@media (pointer: coarse) {
  #dnd-touch-hint { display: block; }
}
`;
    document.head.appendChild(s);
  }

  function getPedalId(el) {
    if (!el) return null;
    const catalog = el.matches(SELECT.FALLBACK) ? el : el.querySelector(SELECT.FALLBACK);
    if (catalog) return catalog.getAttribute('data-pedal-id') || catalog.dataset.pedalId || null;
    return el.getAttribute('data-pedal-id') || el.dataset.pedalId || null;
  }

  function findAbsIndex(pedalId) {
    if (!window.pedalboard || !Array.isArray(window.pedalboard.pedals)) return -1;
    return window.pedalboard.pedals.findIndex(p => String(p.pedal_id) === String(pedalId));
  }

  function ensureRows() {
    const board = one(SELECT.BOARD);
    if (!board) return;
    let rows = $(SELECT.ROW);
    if (!rows.length) {
      const children = Array.from(board.children);
      children.forEach((c, i) => {
        const st = window.getComputedStyle(c);
        if (st && st.display && st.display.indexOf('flex') !== -1) {
          c.classList.add('pedal-row');
          if (!c.dataset.row) c.dataset.row = (i + 1);
        }
      });
      rows = $(SELECT.ROW);
    }
    rows.forEach((r, i) => {
      if (!r.dataset.row) r.dataset.row = r.dataset.rownum || (i + 1);
    });
  }

  function createPlaceholderFromRect(rect) {
    const ph = document.createElement('div');
    ph.className = 'pedalboard-dnd-placeholder';
    ph.style.width = rect.width + 'px';
    ph.style.height = rect.height + 'px';
    return ph;
  }

  function rowUnderPoint(x, y) {
    // Esclude sempre la riga amp (data-row=2) — non accetta drop di pedali normali
    const rows = $(SELECT.ROW).filter(r => parseInt(r.dataset.row, 10) !== 2);
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return r;
    }
    if (rows.length) {
      const last = rows[rows.length - 1].getBoundingClientRect();
      if (y > last.bottom) return rows[rows.length - 1];
      if (y < rows[0].top) return rows[0];
    }
    return null;
  }

  // FIX 2: usa row.children invece di querySelectorAll(.pedal-wrapper/.pedal-catalog)
  // così gli slot vuoti fungono da ancore visive per il placeholder
  function insertionCandidate(row, clientX) {
    const items = Array.from(row.children).filter(n =>
      !n.classList.contains('pedalboard-dnd-placeholder') &&
      !n.classList.contains('dnd-dragging') &&
      !n.closest('.dnd-dragging')
    );
    for (const it of items) {
      const r = it.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (clientX < mid) return it;
    }
    return null;
  }

  function createNewRow() {
    const board = one(SELECT.BOARD);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = 'pedal-row';
    // Calcola il prossimo numero di riga escludendo la riga amp (row 2)
    const rows = $(SELECT.ROW).filter(r => parseInt(r.dataset.row, 10) !== 2);
    let max = 0;
    rows.forEach(r => {
      const n = parseInt(r.dataset.row || 0, 10) || 0;
      if (n > max) max = n;
    });
    // Salta il 2 che è riservato all'amp
    newRow.dataset.row = (max >= 1 ? max + 1 : 1) === 2 ? 3 : (max >= 1 ? max + 1 : 1);
    newRow.style.display = 'flex';
    newRow.style.flexWrap = 'nowrap';
    newRow.style.gap = '10px';
    newRow.style.minHeight = '60px';
    // Inserisce PRIMA della riga amp nel DOM, così è visivamente sopra l'amp
    const ampRow = one('[data-row="2"]', board);
    if (ampRow) board.insertBefore(newRow, ampRow);
    else board.appendChild(newRow);
    return newRow;
  }

  // FIX 5: no-op — renderPedalboard() ricostruisce tutto il DOM da zero,
  // quindi la pulizia manuale conflitterebbe con le righe con soli slot vuoti.
  function cleanupEmptyRows() {}

  function computeAbsoluteInsertIndex(targetRowNum, positionInRow) {
    const arr = window.pedalboard.pedals;
    if (!Array.isArray(arr)) return arr ? arr.length : 0;
    const indices = [];
    for (let i = 0; i < arr.length; i++) if ((arr[i].row || 1) === targetRowNum) indices.push(i);
    if (indices.length === 0) {
      for (let i = 0; i < arr.length; i++) {
        if ((arr[i].row || 1) > targetRowNum) return i;
      }
      return arr.length;
    }
    if (positionInRow <= 0) return indices[0];
    if (positionInRow >= indices.length) return indices[indices.length - 1] + 1;
    return indices[positionInRow];
  }

  // --- DRAG LOGIC WITH THRESHOLD ---
  function onPointerDown(e) {
    window.__blockAutoSave = true;

    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const candidate = e.target.closest(SELECT.WRAPPER) || e.target.closest(SELECT.FALLBACK);
    if (!candidate) return;
    // FIX 1: gli slot vuoti non avviano il drag
    if (candidate.dataset.emptySlot) return;

    // Touch: serve una pressione prolungata per iniziare il drag
    if (e.pointerType === 'touch') {
      startTouchHold(e, candidate);
      return;
    }

  // NON usiamo setPointerCapture qui: catturerebbe tutti i pointermove
  // impedendo al threshold check di riceverli su document.
    dragStartPos = { x: e.clientX, y: e.clientY, el: candidate, target: e.target, pointerId: e.pointerId };

    document.addEventListener('pointermove', onPointerMoveStart, { passive: false });
    document.addEventListener('pointerup', onPointerUpClick, { passive: false });
  }

  function startTouchHold(e, candidate) {
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    dragStartPos = { x: startX, y: startY, el: candidate, target: e.target, pointerId };

    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onCancel);
    };
    // Dito che si sposta prima del timeout = scroll: nessun drag
    const onMove = (ev) => {
      if (ev.pointerId !== pointerId) return;
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE) {
        cleanup();
        dragStartPos = null;
      }
    };
    // Tap breve: comportamento di click invariato
    const onEnd = (ev) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
      onPointerUpClick(ev);
    };
    const onCancel = () => { cleanup(); dragStartPos = null; };

    const timer = setTimeout(() => {
      cleanup();
      const s = dragStartPos;
      dragStartPos = null;
      if (!s) return;
      if (navigator.vibrate) { try { navigator.vibrate(20); } catch (_) {} }
      onPointerDownStartDrag({ pointerId: s.pointerId, clientX: s.x, clientY: s.y }, s.el, s.pointerId);
    }, LONG_PRESS_MS);

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onCancel);
  }

  function onPointerMoveStart(e) {
    if (!dragStartPos) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      document.removeEventListener('pointermove', onPointerMoveStart);
      document.removeEventListener('pointerup', onPointerUpClick);
      onPointerDownStartDrag(e, dragStartPos.el, dragStartPos.pointerId);
      dragStartPos = null;
    }
  }

  function onPointerUpClick(e) {
    document.removeEventListener('pointermove', onPointerMoveStart);
    document.removeEventListener('pointerup', onPointerUpClick);
    const originalTarget = dragStartPos && dragStartPos.target;
    dragStartPos = null;
    if (originalTarget) {
      setTimeout(() => originalTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), 0);
    }
  }

  function onPointerDownStartDrag(e, candidate, pointerId) {
    injectCSS();
    ensureNormalization();

    const wrapper = candidate.closest(SELECT.WRAPPER) || candidate;
    const pid = getPedalId(wrapper);
    if (!pid) return;

    state.draggingEl = wrapper;
    state.draggingId = pid;
    state.isDragging = true;
    state.pointerId = e.pointerId;
    state.originAbsIndex = findAbsIndex(pid);
    state.originRowNum = parseInt((wrapper.closest(SELECT.ROW) || {}).dataset.row || 1, 10) || 1;

    const rect = wrapper.getBoundingClientRect();
    state.placeholder = createPlaceholderFromRect(rect);

    const parentRow = wrapper.parentElement;
    if (parentRow) parentRow.insertBefore(state.placeholder, wrapper.nextSibling);

    // Ora che il drag è iniziato davvero, cattura il pointer sull'elemento
    try { wrapper.setPointerCapture(pointerId); } catch(_) {}
    wrapper.classList.add('dnd-dragging');
    wrapper.style.position = 'fixed';
    wrapper.style.left = rect.left + 'px';
    wrapper.style.top = rect.top + 'px';
    wrapper.style.width = rect.width + 'px';
    wrapper.style.height = rect.height + 'px';
    wrapper.style.zIndex = 99999;
    wrapper.style.pointerEvents = 'none';

    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    const w = state.draggingEl.getBoundingClientRect().width;
    const h = state.draggingEl.getBoundingClientRect().height;
    state.draggingEl.style.left = (x - w / 2) + 'px';
    state.draggingEl.style.top  = (y - h / 2) + 'px';

    let targetRow = rowUnderPoint(x, y); // già esclude row 2 (amp)
    const rows = $(SELECT.ROW).filter(r => parseInt(r.dataset.row, 10) !== 2);
    if (!targetRow && rows.length) {
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      // Appena sotto l'ultima riga non-amp → riga temporanea per il drop
      if (y > lastRect.bottom) {
        // Riusa la riga temporanea se già esiste (evita di crearne una per frame)
        targetRow = one('[data-dnd-temp-row]') || createNewRow();
        targetRow.setAttribute('data-dnd-temp-row', '1');
      } else {
        targetRow = rows[rows.length - 1];
      }
    }
    if (!targetRow) return;

    const afterEl = insertionCandidate(targetRow, x);
    if (!afterEl) {
      targetRow.appendChild(state.placeholder);
    } else if (afterEl !== state.placeholder) {
      targetRow.insertBefore(state.placeholder, afterEl);
    }
  }

  function onPointerUp(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);


    if (!state.placeholder || !state.placeholder.parentElement) {
      restoreDraggedElement();
      resetState();
      return;
    }

    const targetRow = state.placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.row || 1, 10) || 1;
    const arr = window.pedalboard && window.pedalboard.pedals;

    // Strategia: trova il primo pedale reale DOPO il placeholder nel DOM
    // (escludendo il pedale in drag che è position:fixed ma ancora nel DOM).
    // Il suo indice nell'array è esattamente dove inserire — nessuna compensazione.
    // Se non c'è nessun pedale dopo il placeholder → inserisci in fondo alla riga.
    let insertAt = arr ? arr.length : 0;

    if (arr) {
      const nodes = Array.from(targetRow.children);
      const phIndex = nodes.indexOf(state.placeholder);
      // Cerca il primo .pedal-wrapper non-dragging dopo il placeholder
      const nextRealNode = nodes.slice(phIndex + 1).find(n =>
        (n.classList.contains('pedal-wrapper') || n.classList.contains('pedal-catalog')) &&
        !n.classList.contains('dnd-dragging')
      );
      if (nextRealNode) {
        // insertAt = indice di quel pedale nell'array (il draggato verrà inserito prima di lui)
        const nextPid = nextRealNode.dataset.pedalId || nextRealNode.getAttribute('data-pedal-id');
        const nextIdx = arr.findIndex(p => String(p.pedal_id) === String(nextPid));
        if (nextIdx !== -1) insertAt = nextIdx;
      } else {
        // Nessun pedale dopo: inserisci dopo l'ultimo pedale della riga target
        const lastInRow = [...arr].reduce((last, p, i) => (p.row || 1) === targetRowNum ? i : last, -1);
        insertAt = lastInRow === -1 ? arr.length : lastInRow + 1;
      }
    }

    // Ripristina elemento nel DOM (renderPedalboard ricostruisce tutto)
    state.placeholder.parentElement.insertBefore(state.draggingEl, state.placeholder);
    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left     = '';
    state.draggingEl.style.top      = '';
    state.draggingEl.style.width    = '';
    state.draggingEl.style.height   = '';
    state.draggingEl.style.zIndex   = '';
    state.draggingEl.style.pointerEvents = '';

    state.placeholder.remove();

    if (arr) {
      const pid = state.draggingId;
      let srcIdx = state.originAbsIndex;
      if (srcIdx == null || srcIdx === -1) srcIdx = findAbsIndex(pid);

      let removed = null;
      if (srcIdx !== -1 && srcIdx != null) {
        removed = arr.splice(srcIdx, 1)[0];
        // Dopo lo splice gli indici > srcIdx shiftano di -1: aggiusta insertAt
        if (insertAt > srcIdx) insertAt--;
      } else {
        removed = { pedal_id: pid, rotation: 0, row: targetRowNum };
      }
      removed.row = targetRowNum;

      if (insertAt >= 0 && insertAt <= arr.length) {
        arr.splice(insertAt, 0, removed);
      } else {
        arr.push(removed);
      }
    }

    // Se il drop è avvenuto su una riga temporanea, registrala negli _extraRows
    // così renderPedalboard la include nel re-render
    const tempRow = one('[data-dnd-temp-row]');
    if (tempRow) {
      const newRowNum = parseInt(tempRow.dataset.row, 10);
      if (newRowNum && newRowNum !== 2) {
        window._extraRows = window._extraRows || [];
        if (window._extraRows.indexOf(newRowNum) === -1) window._extraRows.push(newRowNum);
      }
      tempRow.removeAttribute('data-dnd-temp-row');
    }

    cleanupEmptyRows();

    if (typeof renderPedalboard === 'function') {
      setTimeout(() => { renderPedalboard(); }, 30);
    }

    resetState();
  }

  function restoreDraggedElement() {
    try {
      if (!state.draggingEl) return;
      const rows = $(SELECT.ROW);
      let originRowEl = rows.find(r => parseInt(r.dataset.row || 1, 10) === (state.originRowNum || 1));
      if (!originRowEl) originRowEl = rows[0] || one(SELECT.BOARD);
      if (originRowEl) originRowEl.appendChild(state.draggingEl);
    } catch (e) {}
    if (state.draggingEl) {
      state.draggingEl.classList.remove('dnd-dragging');
      state.draggingEl.style.position = '';
      state.draggingEl.style.left     = '';
      state.draggingEl.style.top      = '';
      state.draggingEl.style.width    = '';
      state.draggingEl.style.height   = '';
      state.draggingEl.style.zIndex   = '';
      state.draggingEl.style.pointerEvents = '';
    }
    if (state.placeholder && state.placeholder.parentElement) state.placeholder.remove();
    // Rimuovi riga temporanea se il drag è stato annullato
    const tempRow = one('[data-dnd-temp-row]');
    if (tempRow) tempRow.remove();
  }

  function resetState() {
    state.draggingEl      = null;
    state.draggingId      = null;
    state.placeholder     = null;
    state.originAbsIndex  = null;
    state.originRowNum    = null;
    state.isDragging      = false;
    state.pointerId       = null;
  }

  function ensureNormalization() { ensureRows(); }

  function init() {
    injectCSS();
    ensureNormalization();
    const board = one(SELECT.BOARD);
    if (!board) return;
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });

    // Touch: durante il drag attivo blocca lo scroll della pagina
    document.addEventListener('touchmove', (ev) => {
      if (state.isDragging && ev.cancelable) ev.preventDefault();
    }, { passive: false });
    // Touch: niente menu contestuale sulla pressione prolungata dei gear
    board.addEventListener('contextmenu', (ev) => {
      if (window.matchMedia('(pointer: coarse)').matches) ev.preventDefault();
    });

    // Avviso (solo dispositivi touch, via CSS)
    if (!document.getElementById('dnd-touch-hint') && board.parentNode) {
      const hint = document.createElement('p');
      hint.id = 'dnd-touch-hint';
      hint.textContent = 'Tip: press and hold a gear to move it.';
      board.parentNode.insertBefore(hint, board);
    }
    const mo = new MutationObserver(() => ensureRows());
    mo.observe(board, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  } else {
    setTimeout(init, 60);
  }

  window.PedalboardDNDSlots = { init, resetState, restoreDraggedElement };
})();

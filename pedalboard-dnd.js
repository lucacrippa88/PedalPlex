/**
 * pedalboard-dnd-real-v2.js
 * Drag & Drop migliorato (righe/colonne) — REAL ELEMENT moves + placeholder chiaro
 * - Pointer Events (mouse + touch)
 * - Dynamic rows (crea/rimuove righe)
 * - Feedback visivo con placeholder e animazione pedali circostanti
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

  function injectCSS() {
    if (document.getElementById('pedalboard-dnd-real-css')) return;
    const s = document.createElement('style');
    s.id = 'pedalboard-dnd-real-css';
    s.textContent = `
.pedalboard-dnd-placeholder {
  box-sizing: border-box;
  border: 3px dashed rgba(50,50,200,0.7);
  border-radius: 8px;
  background: rgba(50,50,200,0.1);
  margin: 0 8px;
  flex: 0 0 auto;
  transition: height 100ms ease, width 100ms ease;
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
`;
    document.head.appendChild(s);
  }

  function getPedalId(el) {
    if (!el) return null;
    const catalog = el.matches(SELECT.FALLBACK) ? el : el.querySelector(SELECT.FALLBACK);
    if (catalog) return catalog.dataset.pedalId || catalog.getAttribute('data-pedal-id') || null;
    return el.dataset.pedalId || el.getAttribute('data-pedal-id') || null;
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
      Array.from(board.children).forEach((c, i) => {
        const st = window.getComputedStyle(c);
        if (st.display.includes('flex')) c.classList.add('pedal-row');
        if (!c.dataset.row) c.dataset.row = i + 1;
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
    const rows = $(SELECT.ROW);
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

  function insertionCandidate(row, clientX) {
    const items = Array.from(row.querySelectorAll(`${SELECT.WRAPPER}:not(.dnd-dragging), ${SELECT.FALLBACK}:not(.dnd-dragging)`));
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
    const rows = $(SELECT.ROW);
    const max = rows.reduce((acc, r) => Math.max(acc, parseInt(r.dataset.row || 0, 10)), 0);
    newRow.dataset.row = max + 1;
    newRow.style.display = 'flex';
    newRow.style.flexWrap = 'nowrap';
    newRow.style.gap = '10px';
    newRow.style.minHeight = '60px';
    board.appendChild(newRow);
    return newRow;
  }

  function cleanupEmptyRows() {
    $(SELECT.ROW).forEach(r => {
      const has = r.querySelector(SELECT.WRAPPER) || r.querySelector(SELECT.FALLBACK);
      if (!has) r.remove();
    });
  }

  function computeAbsoluteInsertIndex(targetRowNum, positionInRow) {
    const arr = window.pedalboard.pedals;
    if (!Array.isArray(arr)) return arr ? arr.length : 0;
    const indices = arr.map((p, i) => ((p.row || 1) === targetRowNum ? i : -1)).filter(i => i !== -1);
    if (!indices.length) {
      for (let i = 0; i < arr.length; i++) if ((arr[i].row || 1) > targetRowNum) return i;
      return arr.length;
    }
    if (positionInRow <= 0) return indices[0];
    if (positionInRow >= indices.length) return indices[indices.length - 1] + 1;
    return indices[positionInRow];
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const candidate = e.target.closest(SELECT.WRAPPER) || e.target.closest(SELECT.FALLBACK);
    if (!candidate) return;
    e.preventDefault();
    candidate.setPointerCapture?.(e.pointerId);

    injectCSS();
    ensureRows();

    const wrapper = candidate.closest(SELECT.WRAPPER) || candidate;
    const pid = getPedalId(wrapper);
    if (!pid) return;

    state.draggingEl = wrapper;
    state.draggingId = pid;
    state.isDragging = true;
    state.pointerId = e.pointerId;
    state.originAbsIndex = findAbsIndex(pid);
    state.originRowNum = parseInt((wrapper.closest(SELECT.ROW)?.dataset.row) || 1, 10);

    const rect = wrapper.getBoundingClientRect();
    state.placeholder = createPlaceholderFromRect(rect);

    wrapper.parentElement.insertBefore(state.placeholder, wrapper.nextSibling);

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
  }

  function onPointerMove(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;

    const w = state.draggingEl.getBoundingClientRect().width;
    const h = state.draggingEl.getBoundingClientRect().height;
    state.draggingEl.style.left = (x - w / 2) + 'px';
    state.draggingEl.style.top = (y - h / 2) + 'px';

    let targetRow = rowUnderPoint(x, y);
    if (!targetRow) targetRow = createNewRow() || one(SELECT.BOARD);

    const afterEl = insertionCandidate(targetRow, x);
    if (!afterEl) targetRow.appendChild(state.placeholder);
    else if (afterEl !== state.placeholder) targetRow.insertBefore(state.placeholder, afterEl);
  }

  function onPointerUp(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    if (!state.placeholder?.parentElement) {
      restoreDraggedElement();
      resetState();
      return;
    }

    const targetRow = state.placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.row || 1, 10);

    const nodes = Array.from(targetRow.querySelectorAll(`${SELECT.WRAPPER}, ${SELECT.FALLBACK}, .pedalboard-dnd-placeholder`));
    const phIndex = nodes.indexOf(state.placeholder);
    let positionInRow = 0;
    if (phIndex > 0) positionInRow = nodes.slice(0, phIndex).filter(n => !n.classList.contains('pedalboard-dnd-placeholder')).length;

    targetRow.insertBefore(state.draggingEl, state.placeholder);

    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';

    state.placeholder.remove();

    if (window.pedalboard?.pedals) {
      let removed = null;
      const srcIdx = state.originAbsIndex ?? findAbsIndex(state.draggingId);
      if (srcIdx !== -1 && srcIdx != null) removed = window.pedalboard.pedals.splice(srcIdx, 1)[0];
      else removed = { pedal_id: state.draggingId, rotation: 0, row: targetRowNum };
      removed.row = targetRowNum;

      const insertAt = computeAbsoluteInsertIndex(targetRowNum, positionInRow);
      if (insertAt >= 0 && insertAt <= window.pedalboard.pedals.length) {
        window.pedalboard.pedals.splice(insertAt, 0, removed);
      } else window.pedalboard.pedals.push(removed);
    }

    cleanupEmptyRows();

    if (typeof renderPedalboard === 'function') {
      setTimeout(() => {
        renderPedalboard();
        try {
          if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') saveGuestPedalboard();
          else saveSelectedBoardToLocalStorage();
        } catch (err) {}
      }, 30);
    }

    resetState();
  }

  function restoreDraggedElement() {
    if (!state.draggingEl) return;
    const rows = $(SELECT.ROW);
    let originRowEl = rows.find(r => parseInt(r.dataset.row || 1, 10) === (state.originRowNum || 1)) || rows[0] || one(SELECT.BOARD);
    originRowEl.appendChild(state.draggingEl);

    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';
    state.placeholder?.remove();
  }

  function resetState() {
    state = { draggingEl: null, draggingId: null, placeholder: null, originAbsIndex: null, originRowNum: null, isDragging: false, pointerId: null };
  }

  function init() {
    injectCSS();
    ensureRows();
    const board = one(SELECT.BOARD);
    if (!board) return;
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });
    const mo = new MutationObserver(() => ensureRows());
    mo.observe(board, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  else setTimeout(init, 60);

  window.PedalboardDNDReal = { init, resetState, restoreDraggedElement };
})();

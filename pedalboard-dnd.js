/**
 * pedalboard-dnd-real.js
 * Drag & Drop (rows/columns) — REAL ELEMENT moves + dashed placeholder
 * Click breve lascia attivo il modal swal
 * - Pointer Events (mouse + touch)
 * - Dynamic rows (create below last, remove empty)
 * - Updates window.pedalboard.pedals and calls renderPedalboard() once on drop
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

  // state
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
  const DRAG_THRESHOLD = 6; // pixel

  // inject CSS
  function injectCSS() {
    if (document.getElementById('pedalboard-dnd-real-css')) return;
    const s = document.createElement('style');
    s.id = 'pedalboard-dnd-real-css';
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

  function createNewRow(afterRow = null) {
    const board = one(SELECT.BOARD);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = 'pedal-row';
    const rows = $(SELECT.ROW);
    let max = 0;
    rows.forEach(r => {
      const n = parseInt(r.dataset.row || r.dataset.rownum || 0, 10) || 0;
      if (n > max) max = n;
    });
    newRow.dataset.row = (max + 1) || 1;
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
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const candidate = e.target.closest(SELECT.WRAPPER) || e.target.closest(SELECT.FALLBACK);
    if (!candidate) return;

    candidate.setPointerCapture?.(e.pointerId);
    dragStartPos = { x: e.clientX, y: e.clientY, el: candidate };

    document.addEventListener('pointermove', onPointerMoveStart, { passive: false });
    document.addEventListener('pointerup', onPointerUpClick, { passive: false });
  }

  function onPointerMoveStart(e) {
    if (!dragStartPos) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;
    if (Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) {
      // start real drag
      document.removeEventListener('pointermove', onPointerMoveStart);
      document.removeEventListener('pointerup', onPointerUpClick);
      onPointerDownStartDrag(e, dragStartPos.el);
      dragStartPos = null;
    }
  }

  function onPointerUpClick(e) {
    // click breve → modal swal può triggerare
    document.removeEventListener('pointermove', onPointerMoveStart);
    document.removeEventListener('pointerup', onPointerUpClick);
    dragStartPos = null;
  }

  function onPointerDownStartDrag(e, candidate) {
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
    const rows = $(SELECT.ROW);
    if (!targetRow && rows.length) {
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      if (y > lastRect.bottom + 20) {
        targetRow = createNewRow(rows[rows.length - 1]);
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

    if (!state.placeholder || !state.placeholder.parentElement) {
      restoreDraggedElement();
      resetState();
      return;
    }

    const targetRow = state.placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.row || 1, 10) || 1;

    const nodes = Array.from(targetRow.querySelectorAll(`${SELECT.WRAPPER}, ${SELECT.FALLBACK}, .pedalboard-dnd-placeholder`));
    const phIndex = nodes.indexOf(state.placeholder);
    let positionInRow = 0;
    if (phIndex > 0) positionInRow = nodes.slice(0, phIndex).filter(n => !n.classList.contains('pedalboard-dnd-placeholder')).length;

    state.placeholder.parentElement.insertBefore(state.draggingEl, state.placeholder);
    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';

    state.placeholder.remove();

    if (window.pedalboard && Array.isArray(window.pedalboard.pedals)) {
      const pid = state.draggingId;
      let srcIdx = state.originAbsIndex;
      if (srcIdx == null || srcIdx === -1) srcIdx = findAbsIndex(pid);

      let removed = null;
      if (srcIdx !== -1 && srcIdx != null) {
        removed = window.pedalboard.pedals.splice(srcIdx, 1)[0];
      } else {
        removed = { pedal_id: pid, rotation: 0, row: targetRowNum };
      }
      removed.row = targetRowNum;

      const insertAt = computeAbsoluteInsertIndex(targetRowNum, positionInRow);
      if (insertAt >= 0 && insertAt <= window.pedalboard.pedals.length) {
        window.pedalboard.pedals.splice(insertAt, 0, removed);
      } else {
        window.pedalboard.pedals.push(removed);
      }
    }

    cleanupEmptyRows();

    if (typeof renderPedalboard === 'function') {
      setTimeout(() => {
        renderPedalboard();
        if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
          try { saveGuestPedalboard(); } catch (err) {}
        } 
        // else {
        //   try { saveSelectedBoardToLocalStorage(); } catch (err) {}
        // }
      }, 30);
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
      state.draggingEl.style.left = '';
      state.draggingEl.style.top = '';
      state.draggingEl.style.width = '';
      state.draggingEl.style.height = '';
      state.draggingEl.style.zIndex = '';
      state.draggingEl.style.pointerEvents = '';
    }
    if (state.placeholder && state.placeholder.parentElement) state.placeholder.remove();
  }

  function resetState() {
    state.draggingEl = null;
    state.draggingId = null;
    state.placeholder = null;
    state.originAbsIndex = null;
    state.originRowNum = null;
    state.isDragging = false;
    state.pointerId = null;
  }

  function ensureNormalization() {
    ensureRows();
  }

  function init() {
    injectCSS();
    ensureNormalization();
    const board = one(SELECT.BOARD);
    if (!board) return;
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });
    const mo = new MutationObserver(() => ensureRows());
    mo.observe(board, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  } else {
    setTimeout(init, 60);
  }

  window.PedalboardDNDReal = { init, resetState, restoreDraggedElement };
})();

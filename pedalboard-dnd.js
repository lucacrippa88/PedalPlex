/**
 * pedalboard-dnd-real.js
 * Drag & Drop (rows/columns) — REAL ELEMENT moves + dashed placeholder
 * - Pointer Events (mouse + touch)
 * - Dynamic rows (create below last, remove empty)
 * - Updates window.pedalboard.pedals and calls renderPedalboard() once on drop
 *
 * Assumptions:
 * - Board container: #pedalboard
 * - Rows: elements with class .pedal-row (if not present, script will normalize first-level flex children)
 * - Items: .pedal-wrapper preferred; fallback to .pedal-catalog (uses data-pedal-id)
 *
 * Notes:
 * - pedal_id matching uses data-pedal-id (string). If duplicates exist, first match in array is used.
 * - If you want unique identity per pedal instance, we can add UID handling.
 */

(function () {
  const SELECT = {
    BOARD: '#pedalboard',
    ROW: '.pedal-row',
    WRAPPER: '.pedal-wrapper',
    FALLBACK: '.pedal-catalog'
  };

  // quick helpers
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

  // inject minimal CSS for placeholder and dragging look
  function injectCSS() {
    if (document.getElementById('pedalboard-dnd-real-css')) return;
    const s = document.createElement('style');
    s.id = 'pedalboard-dnd-real-css';
    s.textContent = `
/* placeholder dashed */
.pedalboard-dnd-placeholder {
  box-sizing: border-box;
  border: 2px dashed rgba(0,0,0,0.45);
  border-radius: 8px;
  background: rgba(0,0,0,0.02);
  margin: 0 8px;
  flex: 0 0 auto;
}
/* dragging visual (real element) */
.dnd-dragging {
  opacity: 0.92;
  transform: scale(1.02);
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
  transition: none !important;
  pointer-events: none !important;
}
/* ensure wrappers transition nicely when placeholder inserted */
.pedal-wrapper, .pedal-catalog {
  transition: transform 160ms ease, box-shadow 120ms ease;
  will-change: transform;
}
`;
    document.head.appendChild(s);
  }

  // get pedal_id from an element
  function getPedalId(el) {
    if (!el) return null;
    // prefer element with data-pedal-id (catalog inside wrapper)
    const catalog = el.matches(SELECT.FALLBACK) ? el : el.querySelector(SELECT.FALLBACK);
    if (catalog) return catalog.getAttribute('data-pedal-id') || catalog.dataset.pedalId || null;
    return el.getAttribute('data-pedal-id') || el.dataset.pedalId || null;
  }

  // find absolute index in window.pedalboard.pedals by pedal_id (first match)
  function findAbsIndex(pedalId) {
    if (!window.pedalboard || !Array.isArray(window.pedalboard.pedals)) return -1;
    return window.pedalboard.pedals.findIndex(p => String(p.pedal_id) === String(pedalId));
  }

  // normalize rows: if no .pedal-row, mark first-level flex children as rows
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
    // ensure dataset row numbers
    rows.forEach((r, i) => {
      if (!r.dataset.row) r.dataset.row = r.dataset.rownum || (i + 1);
    });
  }

  // create placeholder sized to an element's rect
  function createPlaceholderFromRect(rect) {
    const ph = document.createElement('div');
    ph.className = 'pedalboard-dnd-placeholder';
    ph.style.width = rect.width + 'px';
    ph.style.height = rect.height + 'px';
    return ph;
  }

  // find row element under (x,y)
  function rowUnderPoint(x, y) {
    const rows = $(SELECT.ROW);
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return r;
    }
    // fallback: if below last row return last
    if (rows.length) {
      const last = rows[rows.length - 1].getBoundingClientRect();
      if (y > last.bottom) return rows[rows.length - 1];
      if (y < rows[0].top) return rows[0];
    }
    return null;
  }

  // determine element to insert before in a row based on clientX
  function insertionCandidate(row, clientX) {
    const items = Array.from(row.querySelectorAll(`${SELECT.WRAPPER}:not(.dnd-dragging), ${SELECT.FALLBACK}:not(.dnd-dragging)`));
    for (const it of items) {
      const r = it.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (clientX < mid) return it;
    }
    return null;
  }

  // create new row after last row (used when dragging below last)
  function createNewRow(afterRow = null) {
    const board = one(SELECT.BOARD);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = 'pedal-row';
    // assign next row number
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

  // remove empty rows (no wrapper/fallback children)
  function cleanupEmptyRows() {
    $(SELECT.ROW).forEach(r => {
      const has = r.querySelector(SELECT.WRAPPER) || r.querySelector(SELECT.FALLBACK);
      if (!has) r.remove();
    });
  }

  // compute absolute insert index in pedalboard.pedals for target row number and positionInRow
  function computeAbsoluteInsertIndex(targetRowNum, positionInRow) {
    const arr = window.pedalboard.pedals;
    if (!Array.isArray(arr)) return arr ? arr.length : 0;
    const indices = [];
    for (let i = 0; i < arr.length; i++) if ((arr[i].row || 1) === targetRowNum) indices.push(i);
    if (indices.length === 0) {
      // insert before first item with row > targetRowNum, or at end
      for (let i = 0; i < arr.length; i++) {
        if ((arr[i].row || 1) > targetRowNum) return i;
      }
      return arr.length;
    }
    if (positionInRow <= 0) return indices[0];
    if (positionInRow >= indices.length) return indices[indices.length - 1] + 1;
    return indices[positionInRow];
  }

  // handle pointerdown: start dragging
  function onPointerDown(e) {
    // only left mouse / touch / pen
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const candidate = e.target.closest(SELECT.WRAPPER) || e.target.closest(SELECT.FALLBACK);
    if (!candidate) return;

    e.preventDefault();
    candidate.setPointerCapture && candidate.setPointerCapture(e.pointerId);

    injectCSS();
    ensureNormalization();

    // determine wrapper element (prefer wrapper)
    const wrapper = candidate.closest(SELECT.WRAPPER) || candidate;
    const pid = getPedalId(wrapper);
    if (!pid) return;

    state.draggingEl = wrapper;
    state.draggingId = pid;
    state.isDragging = true;
    state.pointerId = e.pointerId;
    state.originAbsIndex = findAbsIndex(pid);
    state.originRowNum = parseInt((wrapper.closest(SELECT.ROW) || {}).dataset.row || (wrapper.closest(SELECT.ROW) || {}).getAttribute('data-row') || 1, 10) || 1;

    // placeholder
    const rect = wrapper.getBoundingClientRect();
    state.placeholder = createPlaceholderFromRect(rect);

    // insert placeholder where element is (so others move)
    const parentRow = wrapper.parentElement;
    if (parentRow) parentRow.insertBefore(state.placeholder, wrapper.nextSibling);

    // make element fixed-position so it follows pointer (this is the REAL element moving)
    wrapper.classList.add('dnd-dragging');
    wrapper.style.position = 'fixed';
    wrapper.style.left = rect.left + 'px';
    wrapper.style.top = rect.top + 'px';
    wrapper.style.width = rect.width + 'px';
    wrapper.style.height = rect.height + 'px';
    wrapper.style.zIndex = 99999;
    wrapper.style.pointerEvents = 'none';

    // start listening to moves
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
  }

  // pointermove: move the fixed element and move placeholder accordingly
  function onPointerMove(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    // move the real element (fixed) to follow pointer center
    const w = state.draggingEl.getBoundingClientRect().width;
    const h = state.draggingEl.getBoundingClientRect().height;
    state.draggingEl.style.left = (x - w / 2) + 'px';
    state.draggingEl.style.top = (y - h / 2) + 'px';

    // detect target row under pointer (create if below last)
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

    // insert placeholder in targetRow in correct place
    if (!afterEl) {
      targetRow.appendChild(state.placeholder);
    } else {
      // avoid re-inserting before itself
      if (afterEl !== state.placeholder) targetRow.insertBefore(state.placeholder, afterEl);
    }
  }

  // pointerup: finalize drop
  function onPointerUp(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    // if placeholder missing -> cancel and restore
    if (!state.placeholder || !state.placeholder.parentElement) {
      restoreDraggedElement();
      resetState();
      return;
    }

    const targetRow = state.placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.row || targetRow.dataset.rowNum || targetRow.getAttribute('data-row') || 1, 10) || 1;

    // compute positionInRow: count real items before placeholder (exclude placeholder)
    const children = Array.from(targetRow.querySelectorAll(`${SELECT.WRAPPER}, ${SELECT.FALLBACK}`));
    // note: draggingEl may be still in DOM as fixed element; exclude it
    const realChildren = children.filter(n => n !== state.draggingEl);
    // we want count of elements before placeholder among nodes that are not placeholder
    const nodes = Array.from(targetRow.querySelectorAll(`${SELECT.WRAPPER}, ${SELECT.FALLBACK}, .pedalboard-dnd-placeholder`));
    const phIndex = nodes.indexOf(state.placeholder);
    let positionInRow = 0;
    if (phIndex <= 0) positionInRow = 0;
    else positionInRow = nodes.slice(0, phIndex).filter(n => !n.classList.contains('pedalboard-dnd-placeholder')).length;

    // update DOM: insert draggingEl at placeholder position
    state.placeholder.parentElement.insertBefore(state.draggingEl, state.placeholder);

    // cleanup inline styles from draggingEl (restore)
    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';

    // remove placeholder element
    state.placeholder.remove();

    // update model: remove original object (first match) and insert at computed absolute index
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

    // remove empty rows
    cleanupEmptyRows();

    // call renderPedalboard once (if available) to rebuild DOM consistent with new model
    if (typeof renderPedalboard === 'function') {
      setTimeout(() => {
        renderPedalboard();
        // try to persist: guest or local
        if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
          try { saveGuestPedalboard(); } catch (err) {}
        } else {
          try { saveSelectedBoardToLocalStorage(); } catch (err) {}
        }
      }, 30);
    }

    // done
    resetState();
  }

  // restore dragged element in case of cancel
  function restoreDraggedElement() {
    try {
      if (!state.draggingEl) return;
      // find a row to put it back: original row if exists
      const rows = $(SELECT.ROW);
      let originRowEl = rows.find(r => parseInt(r.dataset.row || r.dataset.rowNum || r.getAttribute('data-row') || 1, 10) === (state.originRowNum || 1));
      if (!originRowEl) originRowEl = rows[0] || one(SELECT.BOARD);
      if (originRowEl) originRowEl.appendChild(state.draggingEl);
    } catch (e) { /* swallow */ }
    // cleanup styles
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

  // ensure rows exist and attach listener (delegated)
  function ensureNormalization() {
    ensureRows();
  }

  // init: attach pointerdown to board (delegation)
  function init() {
    injectCSS();
    ensureNormalization();
    const board = one(SELECT.BOARD);
    if (!board) return;
    // avoid duplicate handlers
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });
    // observe for dynamic content changes to re-normalize rows
    const mo = new MutationObserver(() => ensureRows());
    mo.observe(board, { childList: true, subtree: true });
  }

  // auto init after DOM ready (short timeout to let pedalboard render)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  } else {
    setTimeout(init, 60);
  }

  // expose for debugging
  window.PedalboardDNDReal = {
    init,
    resetState,
    restoreDraggedElement
  };
})();

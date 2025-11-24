/**
 * pedalboard-dnd-v2.js
 * Grid DnD (rows/columns) with animated shifting (FLIP) + pointer/touch support
 *
 * - Requires rows: .pedal-row (data-rowNum attribute optional)
 * - Items: .pedal-wrapper (preferred) OR .pedal-catalog (fallback)
 * - Updates window.pedalboard.pedals (row + order) and calls renderPedalboard() after drop
 *
 * Features:
 * - Placeholder that receives insert position
 * - FLIP animation for smooth shifting of items
 * - Ghost that follows pointer (so original can be removed from flow)
 * - Dynamic rows creation/removal
 * - Mouse + Touch via Pointer Events
 */

(function () {
  const SELECTORS = {
    board: '#pedalboard',
    row: '.pedal-row',
    wrapper: '.pedal-wrapper',
    fallbackItem: '.pedal-catalog'
  };

  // small helpers
  const $ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const one = (sel, root = document) => root.querySelector(sel);

  // state
  let state = {
    draggingEl: null,    // original wrapper element removed-from-flow (kept for reinsertion)
    ghost: null,         // visual ghost following pointer
    placeholder: null,   // placeholder inside rows for insertion
    originAbsIndex: null,
    originRowNum: null,
    draggingId: null,
    isDragging: false,
    pointerId: null,
    lastTargetRow: null,
    lastAfterEl: null,
    lastRects: null // for FLIP animate
  };

  // CSS that we will inject (transitions + classes)
  const injectedCSS = `
/* DnD helper styles (injected by script) */
.dnd-placeholder {
  box-sizing: border-box;
  border: 2px dashed rgba(0,0,0,0.2);
  border-radius: 6px;
  margin: 0 6px;
  background: rgba(0,0,0,0.02);
  flex: 0 0 auto;
}
.dnd-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  transform: translate(-50%, -50%);
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  opacity: 0.95;
}
.pedal-wrapper,
.pedal-catalog {
  transition: transform 180ms ease, box-shadow 120ms ease;
  will-change: transform;
}
.pedal-wrapper.dnd-dragging,
.pedal-catalog.dnd-dragging {
  opacity: 0.85;
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
  transform-origin: center center;
}
`;

  // inject CSS once
  function ensureCSS() {
    if (document.getElementById('pedalboard-dnd-v2-css')) return;
    const s = document.createElement('style');
    s.id = 'pedalboard-dnd-v2-css';
    s.textContent = injectedCSS;
    document.head.appendChild(s);
  }

  // create placeholder sized like sourceRect
  function makePlaceholder(sourceRect) {
    const ph = document.createElement('div');
    ph.className = 'dnd-placeholder';
    ph.style.width = sourceRect.width + 'px';
    ph.style.height = sourceRect.height + 'px';
    return ph;
  }

  // create ghost node (clone visual) that follows pointer
  function makeGhost(sourceEl) {
    const g = sourceEl.cloneNode(true);
    g.classList.add('dnd-ghost');
    // remove any interactive attributes
    g.removeAttribute('id');
    g.style.width = sourceEl.getBoundingClientRect().width + 'px';
    g.style.height = sourceEl.getBoundingClientRect().height + 'px';
    g.style.pointerEvents = 'none';
    // optional minor scale
    g.style.transform = 'translate(-50%, -50%) scale(1.02)';
    document.body.appendChild(g);
    return g;
  }

  // get pedal id from element
  function getPedalId(el) {
    if (!el) return null;
    const catalog = el.matches('.pedal-catalog') ? el : el.querySelector('.pedal-catalog');
    if (catalog) {
      return catalog.getAttribute('data-pedal-id') || catalog.dataset.pedalId;
    }
    return el.getAttribute('data-pedal-id') || el.dataset.pedalId || null;
  }

  // find absolute index in window.pedalboard.pedals by pedal_id; returns first match
  function findAbsIndexById(pedalId) {
    if (!window.pedalboard || !Array.isArray(window.pedalboard.pedals)) return -1;
    return window.pedalboard.pedals.findIndex(p => String(p.pedal_id) === String(pedalId));
  }

  // pick candidate row under point
  function rowUnderPoint(x, y) {
    const rows = $(SELECTORS.row);
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return r;
    }
    // fallback: if y below last row, return last row (for new row creation)
    if (rows.length) {
      const last = rows[rows.length - 1].getBoundingClientRect();
      if (y > last.bottom) return rows[rows.length - 1];
      if (y < rows[0].top) return rows[0];
    }
    return null;
  }

  // find next element to insert before in a given row based on clientX
  function afterElementInRow(row, clientX) {
    const candidates = Array.from(row.querySelectorAll(`${SELECTORS.wrapper}:not(.dnd-dragging), ${SELECTORS.fallbackItem}:not(.dnd-dragging)`));
    for (const c of candidates) {
      const rect = c.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (clientX < mid) return c;
    }
    return null;
  }

  // FLIP helpers
  function recordRects(rootSelector) {
    const nodes = Array.from(document.querySelectorAll(`${SELECTORS.wrapper}, ${SELECTORS.fallbackItem}`));
    const map = new Map();
    nodes.forEach(n => {
      map.set(n, n.getBoundingClientRect());
    });
    return map;
  }

  function playFLIP(prevRects) {
    const nodes = Array.from(document.querySelectorAll(`${SELECTORS.wrapper}, ${SELECTORS.fallbackItem}`));
    nodes.forEach(node => {
      const prev = prevRects.get(node);
      const next = node.getBoundingClientRect();
      if (!prev) return;
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        node.style.transition = 'none';
        node.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          node.style.transition = 'transform 200ms ease';
          node.style.transform = '';
          // cleanup after transition
          const cleanup = () => {
            node.style.transition = '';
            node.removeEventListener('transitionend', cleanup);
          };
          node.addEventListener('transitionend', cleanup);
        });
      }
    });
  }

  // remove empty rows (rows without wrappers or fallback items)
  function cleanupEmptyRows() {
    const rows = $(SELECTORS.row);
    rows.forEach(r => {
      const has = r.querySelector(SELECTORS.wrapper) || r.querySelector(SELECTORS.fallbackItem);
      if (!has) {
        r.parentElement && r.remove();
      }
    });
  }

  // create new empty row after last
  function createNewRow(afterEl = null) {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = 'pedal-row';
    // compute new row number
    const rows = $(SELECTORS.row);
    let max = 0;
    rows.forEach(r => {
      const n = parseInt(r.dataset.rowNum || r.dataset.row || r.getAttribute('data-row') || 0, 10) || 0;
      if (n > max) max = n;
    });
    newRow.dataset.rowNum = (max + 1) || 1;
    newRow.style.display = 'flex';
    newRow.style.flexWrap = 'nowrap';
    newRow.style.gap = '10px';
    newRow.style.minHeight = '60px';
    if (afterEl && afterEl.parentNode === board) {
      afterEl.parentNode.insertBefore(newRow, afterEl.nextSibling);
    } else {
      board.appendChild(newRow);
    }
    return newRow;
  }

  // Ensure at least one row exists (normalize)
  function ensureRows() {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return;
    let rows = $(SELECTORS.row);
    if (!rows.length) {
      // try: direct children that are flex containers
      const children = Array.from(board.children);
      children.forEach((c, i) => {
        const style = window.getComputedStyle(c);
        if (style.display.indexOf('flex') !== -1) {
          c.classList.add('pedal-row');
          c.dataset.rowNum = c.dataset.rowNum || (i + 1);
        }
      });
    }
    // if still none, create one
    if ($(SELECTORS.row).length === 0) createNewRow();
  }

  // main pointerdown start
  function onPointerDown(e) {
    // only left clicks/touches
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target.closest(SELECTORS.wrapper) || e.target.closest(SELECTORS.fallbackItem);
    if (!target) return;

    e.preventDefault();
    target.setPointerCapture && target.setPointerCapture(e.pointerId);

    ensureCSS();

    // compute IDs and indices
    const pedalId = getPedalId(target);
    const absIdx = findAbsIndexById(pedalId);

    // store pre-rects for FLIP before we remove element from flow
    const prevRects = recordRects();

    state.originAbsIndex = absIdx;
    state.originRowNum = parseInt((target.closest(SELECTORS.row) || {}).dataset.rowNum || (target.closest(SELECTORS.row) || {}).getAttribute('data-row') || 1, 10) || 1;
    state.draggingEl = target.closest(SELECTORS.wrapper) || target;
    state.draggingId = pedalId;
    state.isDragging = true;
    state.pointerId = e.pointerId;
    state.lastRects = prevRects;

    // create placeholder sized like element
    const srcRect = state.draggingEl.getBoundingClientRect();
    state.placeholder = makePlaceholder(srcRect);

    // create ghost and hide original from flow
    state.ghost = makeGhost(state.draggingEl);
    positionGhost(state.ghost, e.clientX, e.clientY);

    // mark dragging element and remove it from normal flow so others reflow
    state.draggingEl.classList.add('dnd-dragging');
    // keep size so layout doesn't collapse
    state.draggingEl.style.width = srcRect.width + 'px';
    state.draggingEl.style.height = srcRect.height + 'px';
    // place absolute to follow pointer visually (we use ghost for following, but keep original absolute to avoid jump)
    const docScrollTop = window.scrollY || document.documentElement.scrollTop;
    state.draggingEl.style.position = 'absolute';
    state.draggingEl.style.left = srcRect.left + 'px';
    state.draggingEl.style.top = (srcRect.top + docScrollTop) + 'px';
    state.draggingEl.style.zIndex = 99998;
    state.draggingEl.style.pointerEvents = 'none';

    // insert placeholder where original was (so others shift)
    const parentRow = state.draggingEl.parentElement;
    if (parentRow) parentRow.insertBefore(state.placeholder, state.draggingEl.nextSibling);

    // remove original from parent flow (we keep it absolute over page)
    // NOTE: we keep original in DOM, but absolute so placeholder holds its place
    // attach listeners
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
  }

  // update ghost position
  function positionGhost(ghost, clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';
  }

  // pointermove: move ghost, detect row and placeholder insertion; do FLIP animation when placeholder changes
  function onPointerMove(e) {
    if (!state.isDragging) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    // move ghost
    if (state.ghost) positionGhost(state.ghost, x, y);

    // detect row under pointer
    let targetRow = rowUnderPoint(x, y);
    const rows = $(SELECTORS.row);
    if (!targetRow && rows.length) {
      // if pointer is below last row by a margin, create new row
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      if (y > lastRect.bottom + 30) {
        targetRow = createNewRow(rows[rows.length - 1]);
      } else {
        targetRow = rows[rows.length - 1];
      }
    }

    if (!targetRow) return;

    // find afterElement
    const afterEl = afterElementInRow(targetRow, x);

    // if placeholder is already at the right spot, do nothing
    if (state.lastTargetRow === targetRow && state.lastAfterEl === afterEl) {
      return;
    }

    // record rects for FLIP BEFORE DOM change
    const beforeRects = state.lastRects || recordRects();

    // insert placeholder
    if (!afterEl) {
      targetRow.appendChild(state.placeholder);
    } else {
      targetRow.insertBefore(state.placeholder, afterEl);
    }

    // then play FLIP from beforeRects to current
    const currentRects = recordRects();
    playFLIP(beforeRects);

    // update last trackers
    state.lastTargetRow = targetRow;
    state.lastAfterEl = afterEl;
    state.lastRects = currentRects;
  }

  // pointerup: finalize drop, update data model and re-render once
  function onPointerUp(e) {
    if (!state.isDragging) return;
    e.preventDefault();

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    // compute final target
    const ph = state.placeholder;
    if (!ph || !ph.parentElement) {
      // cancel: restore original
      restoreOriginal();
      cleanupState();
      return;
    }

    const targetRowEl = ph.parentElement;
    const targetRowNum = parseInt(targetRowEl.dataset.rowNum || targetRowEl.dataset.row || targetRowEl.getAttribute('data-row') || 1, 10) || 1;

    // determine position index in that row (count real items before placeholder)
    const children = Array.from(targetRowEl.querySelectorAll(`${SELECTORS.wrapper}, ${SELECTORS.fallbackItem}`));
    const phIndex = children.indexOf(ph);
    let positionInRow = 0;
    if (phIndex <= 0) positionInRow = 0;
    else positionInRow = children.slice(0, phIndex).filter(n => !n.classList.contains('dnd-placeholder')).length;

    // remove original (source) from window.pedalboard.pedals (by abs index)
    let removed = null;
    if (window.pedalboard && Array.isArray(window.pedalboard.pedals)) {
      const pid = state.draggingId;
      let srcIdx = state.originAbsIndex;
      if (srcIdx == null || srcIdx === -1) srcIdx = findAbsIndexById(pid);
      if (srcIdx !== -1 && srcIdx != null) {
        removed = window.pedalboard.pedals.splice(srcIdx, 1)[0];
      } else {
        // fallback create minimal object
        removed = { pedal_id: state.draggingId, rotation: 0, row: targetRowNum };
      }
      removed.row = targetRowNum;

      // compute absolute insert index
      // collect indices of items belonging to target row
      const indices = [];
      for (let i = 0; i < window.pedalboard.pedals.length; i++) {
        if ((window.pedalboard.pedals[i].row || 1) === targetRowNum) indices.push(i);
      }
      let insertAt = window.pedalboard.pedals.length;
      if (indices.length === 0) {
        // insert before first item with row greater than targetRowNum, else end
        insertAt = window.pedalboard.pedals.length;
        for (let i = 0; i < window.pedalboard.pedals.length; i++) {
          if ((window.pedalboard.pedals[i].row || 1) > targetRowNum) { insertAt = i; break; }
        }
      } else {
        if (positionInRow <= 0) insertAt = indices[0];
        else if (positionInRow >= indices.length) insertAt = indices[indices.length - 1] + 1;
        else insertAt = indices[positionInRow];
      }

      // insert removed at insertAt
      if (insertAt < 0 || insertAt > window.pedalboard.pedals.length) {
        window.pedalboard.pedals.push(removed);
      } else {
        window.pedalboard.pedals.splice(insertAt, 0, removed);
      }
    }

    // remove placeholder and put original element in place (we'll re-render to be safe)
    try {
      if (state.ghost && state.ghost.parentElement) state.ghost.remove();
    } catch (e) {}
    // remove the absolute original from DOM (we will re-render)
    if (state.draggingEl && state.draggingEl.parentElement) {
      state.draggingEl.remove();
    }

    // cleanup empty rows
    cleanupEmptyRows();

    // re-render once (renderPedalboard should recreate DOM properly)
    if (typeof renderPedalboard === 'function') {
      setTimeout(() => {
        renderPedalboard();
        // persist
        if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
          try { saveGuestPedalboard(); } catch (e) {}
        } else {
          try { saveSelectedBoardToLocalStorage(); } catch (e) {}
        }
      }, 30);
    } else {
      // if no render, we attempted to remove original from DOM and inserted placeholder; do nothing else
    }

    // cleanup
    cleanupState();
  }

  function restoreOriginal() {
    // place original back where placeholder was (if exists)
    try {
      if (state.placeholder && state.draggingEl) {
        state.placeholder.parentElement && state.placeholder.parentElement.insertBefore(state.draggingEl, state.placeholder);
        state.placeholder.remove();
      }
      if (state.ghost) state.ghost.remove();
      // reset styles
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
    } catch (e) { /* ignore */ }
  }

  function cleanupState() {
    state.draggingEl = null;
    state.ghost = null;
    state.placeholder = null;
    state.originAbsIndex = null;
    state.originRowNum = null;
    state.draggingId = null;
    state.isDragging = false;
    state.pointerId = null;
    state.lastTargetRow = null;
    state.lastAfterEl = null;
    state.lastRects = null;
  }

  // observe board to ensure rows exist and normalize dataset row numbers
  function observeBoard() {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return;
    function normalize() {
      const rows = $(SELECTORS.row);
      if (rows.length === 0) {
        // try to set first-level flex children as rows
        const children = Array.from(board.children);
        children.forEach((c, idx) => {
          const style = window.getComputedStyle(c);
          if (style.display.includes('flex')) {
            c.classList.add('pedal-row');
            c.dataset.rowNum = c.dataset.rowNum || (idx + 1);
          }
        });
      }
      // ensure row numbers
      $(SELECTORS.row).forEach((r, i) => {
        if (!r.dataset.rowNum) r.dataset.rowNum = r.dataset.row || (i + 1);
      });
    }
    normalize();
    const mo = new MutationObserver(() => normalize());
    mo.observe(board, { childList: true, subtree: true });
  }

  // attach delegated pointerdown on board
  function init() {
    ensureCSS();
    const board = document.querySelector(SELECTORS.board);
    if (!board) return;
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });
    observeBoard();
  }

  // auto-init after load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }

  // expose for debugging
  window.PedalboardDNDv2 = { init, makePlaceholder, makeGhost, cleanupState };
})();

/**
 * pedalboard-dnd.js
 * Drag & Drop (grid rows/columns) — mouse + touch (pointer events)
 * - Dynamic rows: dragging under last row creates a new row; empty rows removed
 * - Works with elements: .pedal-row (container) and .pedal-wrapper (item)
 * - Fallback: works if items are .pedal-catalog (uses data-pedal-id)
 *
 * Include AFTER pedalboard.js and after renderPedalboard() is available.
 */

(function () {
  const SELECTORS = {
    board: '#pedalboard',
    row: '.pedal-row',
    wrapper: '.pedal-wrapper',
    fallbackItem: '.pedal-catalog' // in case wrapper class isn't present
  };

  // Small utilities
  const $ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const el = id => document.getElementById(id);

  // State during a drag
  let state = {
    draggingEl: null,      // actual DOM element being dragged (wrapper or pedal-catalog)
    draggingId: null,      // pedal_id (string)
    placeholder: null,
    originRowEl: null,
    originIndexAbsolute: null,
    pointerId: null,
    isDragging: false
  };

  // Create a visible placeholder that matches dragged element size
  function makePlaceholder(sourceRect) {
    const ph = document.createElement('div');
    ph.className = 'dnd-placeholder';
    ph.style.boxSizing = 'border-box';
    ph.style.border = '2px dashed rgba(0,0,0,0.25)';
    ph.style.borderRadius = '6px';
    ph.style.width = sourceRect.width + 'px';
    ph.style.height = sourceRect.height + 'px';
    ph.style.margin = '0 5px';
    ph.style.flex = '0 0 auto';
    return ph;
  }

  // Find pedal id from element
  function getPedalIdFromElement(wrapperOrCatalog) {
    if (!wrapperOrCatalog) return null;
    // wrapper might contain child .pedal-catalog
    const catalog = wrapperOrCatalog.closest ? wrapperOrCatalog.querySelector('.pedal-catalog') : null;
    if (catalog && catalog.dataset && (catalog.dataset.pedalId || catalog.dataset.pedalId === '')) {
      return catalog.dataset.pedalId || catalog.getAttribute('data-pedal-id');
    }
    // fallback to dataset on wrapper itself
    if (wrapperOrCatalog.dataset && (wrapperOrCatalog.dataset.pedalId || wrapperOrCatalog.dataset.pedalId === '')) {
      return wrapperOrCatalog.dataset.pedalId || wrapperOrCatalog.getAttribute('data-pedal-id');
    }
    // try data-pedal-id attribute directly
    return wrapperOrCatalog.getAttribute && wrapperOrCatalog.getAttribute('data-pedal-id');
  }

  // Determine row element under a point (x,y)
  function findRowUnderPoint(x, y) {
    const rows = $(SELECTORS.row);
    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return r;
    }
    // If not found, but y below last row -> return last row
    if (rows.length) {
      const last = rows[rows.length - 1].getBoundingClientRect();
      if (y > last.bottom) return rows[rows.length - 1];
      if (y < rows[0].top) return rows[0];
    }
    return null;
  }

  // Given a row element and an x coordinate, find the sibling element after which we should insert
  function getAfterElementForRow(rowEl, clientX) {
    // consider only non-placeholder wrappers
    const candidates = Array.from(rowEl.querySelectorAll(`${SELECTORS.wrapper}:not(.dnd-dragging), .pedal-catalog:not(.dnd-dragging)`));
    for (const child of candidates) {
      const rect = child.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      if (clientX < mid) return child;
    }
    return null;
  }

  // Convert absolute pedalboard array index -> absolute index of a pedal object in window.pedalboard.pedals
  // We will use matching by pedal_id (the pedal_id should be unique or near-unique in a board)
  function findAbsoluteIndexByPedalId(pedalId) {
    if (!window.pedalboard || !Array.isArray(window.pedalboard.pedals)) return -1;
    return window.pedalboard.pedals.findIndex(p => String(p.pedal_id) === String(pedalId));
  }

  // Compute absolute insertion index in window.pedalboard.pedals for a drop into targetRow at position targetPosition (0..n)
  function computeAbsoluteInsertIndex(targetRowNum, targetPositionInRow) {
    const arr = window.pedalboard.pedals;
    // collect indices of pedals who belong to targetRowNum
    const indices = [];
    for (let i = 0; i < arr.length; i++) {
      if ((arr[i].row || 1) === targetRowNum) indices.push(i);
    }
    if (indices.length === 0) {
      // no items in that row: insertion at end (after all items with row < targetRowNum)
      let idx = arr.length;
      // But better place after all items with row < targetRowNum
      for (let i = 0; i < arr.length; i++) {
        if ((arr[i].row || 1) > targetRowNum) {
          idx = i;
          break;
        }
      }
      return idx;
    }
    if (targetPositionInRow <= 0) return indices[0];
    if (targetPositionInRow >= indices.length) return indices[indices.length - 1] + 1;
    return indices[targetPositionInRow];
  }

  // Remove a row element if it has no pedal children
  function cleanupEmptyRows() {
    const rows = $(SELECTORS.row);
    for (const r of rows) {
      const hasPedals = r.querySelector(SELECTORS.wrapper) || r.querySelector(SELECTORS.fallbackItem);
      if (!hasPedals) {
        r.remove();
      }
    }
  }

  // Create a new empty row after last row and return it
  function createNewRow(afterRowEl = null) {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = (board.classList.contains('pedalboard-grid') ? 'pedal-row' : 'pedal-row');
    // set dataset row number as max existing + 1
    const rows = $(SELECTORS.row);
    let maxRow = 0;
    for (const r of rows) {
      const rn = parseInt(r.dataset.rowNum || r.dataset.row || r.getAttribute('data-row') || r.dataset.rownum || 0, 10) || 0;
      if (rn > maxRow) maxRow = rn;
    }
    const newRowNum = maxRow + 1 || 1;
    newRow.dataset.rowNum = newRowNum;
    newRow.style.display = 'flex';
    newRow.style.flexWrap = 'nowrap';
    newRow.style.gap = '10px';
    newRow.style.minHeight = '60px';
    if (afterRowEl && afterRowEl.parentNode === board) {
      afterRowEl.parentNode.insertBefore(newRow, afterRowEl.nextSibling);
    } else {
      board.appendChild(newRow);
    }
    return newRow;
  }

  // Attach pointer listeners to items (delegation style)
  function attachDelegatedListeners() {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return;

    // Remove previous handler to avoid double-binding
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, { passive: false });
  }

  // When pointerdown occurs, detect the item and start drag
  function onPointerDown(e) {
    // Only left button or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const candidate = e.target.closest(SELECTORS.wrapper) || e.target.closest(SELECTORS.fallbackItem);
    if (!candidate) return;

    e.preventDefault();
    candidate.setPointerCapture && candidate.setPointerCapture(e.pointerId);

    const wrapper = candidate.closest(SELECTORS.wrapper) || candidate; // prefer wrapper if nested
    state.draggingEl = wrapper;
    state.draggingId = getPedalIdFromElement(wrapper) || getPedalIdFromElement(candidate);
    state.isDragging = true;
    state.pointerId = e.pointerId;

    // compute original absolute index (to remove later)
    state.originIndexAbsolute = findAbsoluteIndexByPedalId(state.draggingId);
    state.originRowEl = wrapper.closest(SELECTORS.row);

    // prepare placeholder sized like element
    const srcRect = wrapper.getBoundingClientRect();
    state.placeholder = makePlaceholder(srcRect);

    // add dragging class
    wrapper.classList.add('dnd-dragging');
    wrapper.style.width = srcRect.width + 'px';
    wrapper.style.height = srcRect.height + 'px';
    wrapper.style.position = 'absolute';
    wrapper.style.left = srcRect.left + 'px';
    wrapper.style.top = srcRect.top + 'px';
    wrapper.style.zIndex = 9999;
    wrapper.style.pointerEvents = 'none';

    // insert placeholder where original was
    const parentRow = wrapper.parentElement;
    if (parentRow) parentRow.insertBefore(state.placeholder, wrapper.nextSibling);

    // listen movement & up globally
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    // ensure rows exist even if none (if user has no rows, create one)
    if ($(SELECTORS.row).length === 0) {
      createNewRow();
    }
  }

  function onPointerMove(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    // move the dragged element following pointer (account for page scroll)
    state.draggingEl.style.left = (x - state.draggingEl.offsetWidth / 2) + 'px';
    state.draggingEl.style.top = (y - state.draggingEl.offsetHeight / 2) + 'px';

    // find row under pointer
    let targetRow = findRowUnderPoint(x, y);
    // if user is below last row by some margin, create a new row
    const rows = $(SELECTORS.row);
    if (!targetRow && rows.length) {
      const lastRect = rows[rows.length - 1].getBoundingClientRect();
      if (y > lastRect.bottom + 20) {
        targetRow = createNewRow(rows[rows.length - 1]);
      } else {
        targetRow = rows[rows.length - 1];
      }
    }

    if (!targetRow) return;

    // compute where to insert placeholder based on X
    const afterEl = getAfterElementForRow(targetRow, x);
    if (!afterEl) {
      targetRow.appendChild(state.placeholder);
    } else {
      // If afterEl is placeholder itself ignore
      if (afterEl !== state.placeholder) targetRow.insertBefore(state.placeholder, afterEl);
    }
  }

  function onPointerUp(e) {
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    // Stop listening
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    // finalize: determine target row and position
    const placeholder = state.placeholder;
    if (!placeholder || !placeholder.parentElement) {
      // cancel: restore original
      cleanupAfterCancel();
      return;
    }

    const targetRow = placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.rowNum || targetRow.dataset.row || targetRow.getAttribute('data-row') || targetRow.dataset.rownum || 1, 10) || 1;

    // compute position in row (index among pedal wrappers)
    const siblings = Array.from(targetRow.querySelectorAll(`${SELECTORS.wrapper}, ${SELECTORS.fallbackItem}`)).filter(n => n !== placeholder);
    const positionInRow = siblings.indexOf(state.draggingEl);
    // but since we haven't yet inserted draggingEl, we should compute position by looking where placeholder sits:
    const children = Array.from(targetRow.querySelectorAll(`${SELECTORS.wrapper}, ${SELECTORS.fallbackItem}, .dnd-placeholder`));
    const phIndex = children.indexOf(placeholder);
    let posInRow = 0;
    if (phIndex <= 0) posInRow = 0;
    else {
      // count how many actual pedal items are before placeholder
      posInRow = children.slice(0, phIndex).filter(c => !c.classList.contains('dnd-placeholder')).length;
    }

    // Remove dragging element visually
    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.pointerEvents = '';

    // Insert element at placeholder position
    placeholder.parentElement.insertBefore(state.draggingEl, placeholder);
    // remove placeholder
    placeholder.remove();

    // Now update window.pedalboard.pedals (array)
    if (window.pedalboard && Array.isArray(window.pedalboard.pedals)) {
      const pid = state.draggingId;
      let sourceAbsIdx = state.originIndexAbsolute;
      if (sourceAbsIdx === -1 || sourceAbsIdx === null) {
        // Try to find by pedal_id again
        sourceAbsIdx = findAbsoluteIndexByPedalId(pid);
      }
      // Remove source item (if found)
      let removed = null;
      if (sourceAbsIdx !== -1 && sourceAbsIdx !== null) {
        removed = window.pedalboard.pedals.splice(sourceAbsIdx, 1)[0];
      } else {
        // If not found, try to match by object reference inside DOM order (last-resort)
        // Nothing to remove
      }

      // set row on removed item
      if (!removed) {
        // create minimal object if none (shouldn't normally happen)
        removed = { pedal_id: pid, rotation: 0, row: targetRowNum };
      }
      removed.row = targetRowNum;

      // compute absolute insert index
      const insertAt = computeAbsoluteInsertIndex(targetRowNum, posInRow);

      // insert
      if (insertAt >= 0 && insertAt <= window.pedalboard.pedals.length) {
        window.pedalboard.pedals.splice(insertAt, 0, removed);
      } else {
        window.pedalboard.pedals.push(removed);
      }

      // cleanup empty rows
      cleanupEmptyRows();

      // re-render once to ensure DOM/indices consistent
      // call renderPedalboard if available, else just save
      if (typeof renderPedalboard === 'function') {
        // slight timeout to let DOM settle if needed
        setTimeout(() => {
          renderPedalboard();
          // after render, attempt to persist: guest/local or just saveSelectedBoardToLocalStorage
          if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
            try { saveGuestPedalboard(); } catch (e) { /* ignore */ }
          } else {
            try { saveSelectedBoardToLocalStorage(); } catch (e) { /* ignore */ }
          }
        }, 30);
      } else {
        // persist if possible
        if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
          try { saveGuestPedalboard(); } catch (e) { /* ignore */ }
        } else {
          try { saveSelectedBoardToLocalStorage(); } catch (e) { /* ignore */ }
        }
      }
    }

    // reset state
    state.draggingEl = null;
    state.draggingId = null;
    state.placeholder = null;
    state.originRowEl = null;
    state.originIndexAbsolute = null;
    state.isDragging = false;
    state.pointerId = null;
  }

  function cleanupAfterCancel() {
    if (!state.draggingEl) return;
    state.draggingEl.classList.remove('dnd-dragging');
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.pointerEvents = '';
    if (state.placeholder && state.placeholder.parentElement) state.placeholder.remove();
    state.draggingEl = null;
    state.placeholder = null;
    state.isDragging = false;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }

  // MutationObserver: when pedalboard DOM changes, ensure rows have data-rowNum set and attach listeners
  function observeBoard() {
    const board = document.querySelector(SELECTORS.board);
    if (!board) return;
    // ensure rows have dataset.rowNum
    function normalizeRows() {
      const rows = $(SELECTORS.row);
      if (rows.length === 0) {
        // try to detect row-like divs (fallback) - direct children of board with display:flex
        const directChildren = Array.from(board.children);
        directChildren.forEach((c, i) => {
          const style = window.getComputedStyle(c);
          if (style.display === 'flex') {
            c.classList.add('pedal-row');
            c.dataset.rowNum = c.dataset.rowNum || i + 1;
          }
        });
      } else {
        rows.forEach((r, idx) => {
          if (!r.dataset.rowNum) {
            r.dataset.rowNum = r.dataset.row || (idx + 1);
          }
        });
      }
    }
    normalizeRows();

    const mo = new MutationObserver((mutations) => {
      // whenever DOM under board changes, re-normalize rows; we don't reattach listeners per item (we use delegation)
      normalizeRows();
    });

    mo.observe(board, { childList: true, subtree: true });
  }

  // Initialization
  function init() {
    // Attach delegated listener to board
    attachDelegatedListeners();
    observeBoard();
  }

  // auto-init after short delay (allow pedalboard.js to run)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }

  // expose for debugging
  window.PedalboardDND = {
    init,
    makePlaceholder,
    cleanupAfterCancel
  };
})();

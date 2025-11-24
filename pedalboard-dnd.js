/*
 pedalboard-dnd-fix.js
 Drag & Drop (real element moves) tuned to your markup:
 - draggable element: .pedal-catalog (fallback if wrapped)
 - rows: children of #pedalboard with display:flex (or .pedal-row)
 - placeholder: dashed rectangle that follows insertion position
 - updates window.pedalboard.pedals (by data-pedal-id) and calls renderPedalboard()
 - pointer events (mouse + touch)
*/

(function(){
  const BOARD_SEL = "#pedalboard";
  const CATALOG_SEL = ".pedal-catalog";
  const WRAPPER_SEL = ".pedal-wrapper"; // not required in your markup, kept as option
  const PLACEHOLDER_CLASS = "pedalboard-dnd-placeholder";
  const DRAGGING_CLASS = "dnd-dragging";

  // state
  let state = {
    draggingEl: null,        // actual element we set fixed (wrapper or catalog)
    draggingCatalog: null,   // the .pedal-catalog node (source)
    placeholder: null,
    originRowNum: null,
    originAbsIndex: null,
    draggingId: null,
    isDragging: false,
    pointerId: null
  };

  // inject CSS (only once)
  function injectCSS(){
    if (document.getElementById("pedalboard-dnd-fix-css")) return;
    const s = document.createElement("style");
    s.id = "pedalboard-dnd-fix-css";
    s.textContent = `
.${PLACEHOLDER_CLASS} {
  box-sizing: border-box;
  border: 2px dashed rgba(0,0,0,0.45);
  border-radius: 8px;
  background: rgba(0,0,0,0.03);
  margin: 0 8px;
  flex: 0 0 auto;
}
.${DRAGGING_CLASS} {
  opacity: 0.95;
  transform: scale(1.02);
  box-shadow: 0 12px 28px rgba(0,0,0,0.45);
  transition: none !important;
  pointer-events: none !important;
}
.${WRAPPER_SEL.replace('.','')}, ${CATALOG_SEL} {
  transition: transform 140ms ease, box-shadow 120ms ease;
  will-change: transform;
}
`;
    document.head.appendChild(s);
  }

  // helpers: select nodes
  const $ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const one = (sel, root=document) => root.querySelector(sel);

  // normalize rows: ensure there are elements with class .pedal-row
  function normalizeRows() {
    const board = one(BOARD_SEL);
    if (!board) return;
    const rows = $( ".pedal-row", board );
    if (rows.length === 0) {
      // detect direct children that are flex containers and mark them .pedal-row
      Array.from(board.children).forEach((child, idx) => {
        const style = window.getComputedStyle(child);
        if (style && style.display && style.display.indexOf('flex') !== -1) {
          child.classList.add('pedal-row');
          if (!child.dataset.row) child.dataset.row = idx + 1;
        }
      });
    }
    // ensure row numbers
    $( ".pedal-row", board ).forEach((r, i) => {
      if (!r.dataset.row) r.dataset.row = r.dataset.rownum || (i+1);
    });
  }

  // find row under point
  function findRowUnderPoint(x,y){
    const rows = $( ".pedal-row" );
    for (const r of rows){
      const rect = r.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return r;
    }
    if (rows.length) {
      const last = rows[rows.length-1].getBoundingClientRect();
      if (y > last.bottom) return rows[rows.length-1];
      if (y < rows[0].top) return rows[0];
    }
    return null;
  }

  // compute item to insert before in row based on clientX
  function findInsertBeforeInRow(row, clientX){
    const items = Array.from(row.querySelectorAll(`${WRAPPER_SEL}:not(.${DRAGGING_CLASS}), ${CATALOG_SEL}:not(.${DRAGGING_CLASS})`));
    for (const it of items){
      const r = it.getBoundingClientRect();
      const mid = r.left + r.width/2;
      if (clientX < mid) return it;
    }
    return null;
  }

  // create placeholder sized after element rect
  function createPlaceholder(rect){
    const ph = document.createElement("div");
    ph.className = PLACEHOLDER_CLASS;
    ph.style.width = rect.width + "px";
    ph.style.height = rect.height + "px";
    return ph;
  }

  // find pedal_id from .pedal-catalog
  function getPedalIdFromCatalog(node){
    if (!node) return null;
    return node.getAttribute("data-pedal-id") || node.dataset.pedalId || null;
  }

  // find absolute index in window.pedalboard.pedals by pedal_id (first match)
  function findAbsoluteIndexByPedalId(pedalId){
    if (!window.pedalboard || !Array.isArray(window.pedalboard.pedals)) return -1;
    return window.pedalboard.pedals.findIndex(p => String(p.pedal_id) === String(pedalId));
  }

  // create new empty row after last row
  function createNewRow(afterRowEl = null){
    const board = one(BOARD_SEL);
    if (!board) return null;
    const newRow = document.createElement('div');
    newRow.className = 'pedal-row';
    // compute next row number
    const rows = $( ".pedal-row" );
    let max = 0;
    rows.forEach(r => { const rn = parseInt(r.dataset.row||0,10)||0; if (rn>max) max=rn; });
    newRow.dataset.row = (max+1) || 1;
    newRow.style.display = 'flex';
    newRow.style.flexWrap = 'nowrap';
    newRow.style.gap = '10px';
    newRow.style.minHeight = '60px';
    if (afterRowEl && afterRowEl.parentNode === board) {
      afterRowEl.parentNode.insertBefore(newRow, afterRowEl.nextSibling);
    } else board.appendChild(newRow);
    return newRow;
  }

  // remove empty rows
  function cleanupEmptyRows(){
    const rows = $( ".pedal-row" );
    rows.forEach(r => {
      const has = r.querySelector(WRAPPER_SEL) || r.querySelector(CATALOG_SEL);
      if (!has) r.remove();
    });
  }

  // compute absolute insert index for pedalboard.pedals
  function computeAbsoluteInsertIndex(targetRowNum, positionInRow){
    const arr = window.pedalboard && window.pedalboard.pedals ? window.pedalboard.pedals : [];
    const indices = [];
    for (let i=0;i<arr.length;i++){
      if ((arr[i].row||1) === targetRowNum) indices.push(i);
    }
    if (indices.length === 0) {
      // insert before first item with row > targetRowNum or at end
      for (let i=0;i<arr.length;i++){
        if ((arr[i].row||1) > targetRowNum) return i;
      }
      return arr.length;
    }
    if (positionInRow <= 0) return indices[0];
    if (positionInRow >= indices.length) return indices[indices.length-1] + 1;
    return indices[positionInRow];
  }

  // start drag handler
  function onPointerDown(e){
    // only left mouse / touch / pen
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // target can be .pedal-catalog or a child inside it
    const catalog = e.target.closest(CATALOG_SEL);
    if (!catalog) return;

    e.preventDefault();

    injectCSS();
    normalizeRows();

    // the wrapper is the immediate parent that visually contains catalog (in your markup parent div)
    const wrapper = catalog.closest(WRAPPER_SEL) || catalog.parentElement;

    const rect = wrapper.getBoundingClientRect();
    const pedalId = getPedalIdFromCatalog(catalog);
    if (!pedalId) return;

    state.draggingEl = wrapper;
    state.draggingCatalog = catalog;
    state.draggingId = pedalId;
    state.isDragging = true;
    state.pointerId = e.pointerId;
    state.originAbsIndex = findAbsoluteIndexByPedalId(pedalId);
    state.originRowNum = parseInt((wrapper.closest('.pedal-row')||{}).dataset.row || wrapper.parentElement && wrapper.parentElement.dataset && wrapper.parentElement.dataset.row ? wrapper.parentElement.dataset.row : 1, 10) || 1;

    // create placeholder and insert after element
    state.placeholder = createPlaceholder(rect);
    wrapper.parentElement.insertBefore(state.placeholder, wrapper.nextSibling);

    // convert real element to fixed position so it moves with pointer
    wrapper.classList.add(DRAGGING_CLASS);
    wrapper.style.position = 'fixed';
    wrapper.style.left = rect.left + 'px';
    wrapper.style.top = rect.top + 'px';
    wrapper.style.width = rect.width + 'px';
    wrapper.style.height = rect.height + 'px';
    wrapper.style.zIndex = 99999;
    wrapper.style.pointerEvents = 'none';

    // events
    document.addEventListener('pointermove', onPointerMove, {passive:false});
    document.addEventListener('pointerup', onPointerUp);
  }

  // pointer move
  function onPointerMove(e){
    if (!state.isDragging || !state.draggingEl) return;
    e.preventDefault();

    const x = e.clientX;
    const y = e.clientY;

    // move fixed element (centered to pointer)
    const wRect = state.draggingEl.getBoundingClientRect();
    const w = wRect.width, h = wRect.height;
    state.draggingEl.style.left = (x - w/2) + 'px';
    state.draggingEl.style.top = (y - h/2) + 'px';

    // find target row under pointer (create new if pointer below last)
    let targetRow = findRowUnderPoint(x,y);
    const rows = $( ".pedal-row" );
    if (!targetRow && rows.length) {
      const last = rows[rows.length-1].getBoundingClientRect();
      if (y > last.bottom + 20) {
        targetRow = createNewRow(rows[rows.length-1]);
      } else targetRow = rows[rows.length-1];
    }
    if (!targetRow) return;

    // find insertion candidate inside target row
    const afterEl = findInsertBeforeInRow(targetRow, x);
    if (!afterEl) {
      // append placeholder to end
      if (state.placeholder.parentElement !== targetRow) targetRow.appendChild(state.placeholder);
    } else {
      if (afterEl !== state.placeholder) targetRow.insertBefore(state.placeholder, afterEl);
    }
  }

  // pointer up -> finalize
  function onPointerUp(e){
    if (!state.isDragging) return;
    e.preventDefault();

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    if (!state.placeholder || !state.placeholder.parentElement) {
      // cancel: restore element (append back)
      restoreDraggedElement();
      resetState();
      return;
    }

    // determine target row and position
    const targetRow = state.placeholder.parentElement;
    const targetRowNum = parseInt(targetRow.dataset.row || targetRow.dataset.rowNum || targetRow.getAttribute('data-row') || 1, 10) || 1;

    // compute positionInRow by counting non-placeholder items before placeholder
    const nodes = Array.from(targetRow.querySelectorAll(`${WRAPPER_SEL}, ${CATALOG_SEL}, .${PLACEHOLDER_CLASS}`));
    const phIndex = nodes.indexOf(state.placeholder);
    let posInRow = 0;
    if (phIndex <= 0) posInRow = 0;
    else posInRow = nodes.slice(0, phIndex).filter(n => !n.classList.contains(PLACEHOLDER_CLASS)).length;

    // insert the real element at placeholder
    try {
      state.placeholder.parentElement.insertBefore(state.draggingEl, state.placeholder);
    } catch (err) {
      // fallback append
      targetRow.appendChild(state.draggingEl);
    }

    // restore style of draggingEl
    state.draggingEl.classList.remove(DRAGGING_CLASS);
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';

    // remove placeholder
    state.placeholder.remove();

    // update model: remove old and insert at computed absolute index
    if (window.pedalboard && Array.isArray(window.pedalboard.pedals)) {
      const pid = state.draggingId;
      let srcIdx = state.originAbsIndex;
      if (srcIdx == null || srcIdx === -1) srcIdx = findAbsoluteIndexByPedalId(pid);
      let removed = null;
      if (srcIdx !== -1 && srcIdx != null) {
        removed = window.pedalboard.pedals.splice(srcIdx, 1)[0];
      } else {
        removed = { pedal_id: pid, rotation: 0, row: targetRowNum };
      }
      removed.row = targetRowNum;
      const insertAt = computeAbsoluteInsertIndex(targetRowNum, posInRow);
      if (insertAt >= 0 && insertAt <= window.pedalboard.pedals.length) {
        window.pedalboard.pedals.splice(insertAt, 0, removed);
      } else {
        window.pedalboard.pedals.push(removed);
      }
    }

    // cleanup empty rows
    cleanupEmptyRows();

    // re-render once to normalize DOM/state
    if (typeof renderPedalboard === 'function') {
      setTimeout(() => {
        renderPedalboard();
        // persist if guest
        if (typeof saveGuestPedalboard === 'function' && window.currentUser?.role === 'guest') {
          try { saveGuestPedalboard(); } catch(e) {}
        } else {
          try { saveSelectedBoardToLocalStorage(); } catch(e) {}
        }
      }, 40);
    }

    // done
    resetState();
  }

  function restoreDraggedElement(){
    if (!state.draggingEl) return;
    // try to append back to a row (original row if exists)
    const rows = $( ".pedal-row" );
    let originRow = rows.find(r => parseInt(r.dataset.row||r.dataset.rowNum||0,10) === (state.originRowNum || 1));
    if (!originRow) originRow = rows[0] || one(BOARD_SEL);
    if (originRow) originRow.appendChild(state.draggingEl);
    state.draggingEl.classList.remove(DRAGGING_CLASS);
    state.draggingEl.style.position = '';
    state.draggingEl.style.left = '';
    state.draggingEl.style.top = '';
    state.draggingEl.style.width = '';
    state.draggingEl.style.height = '';
    state.draggingEl.style.zIndex = '';
    state.draggingEl.style.pointerEvents = '';
    if (state.placeholder && state.placeholder.parentElement) state.placeholder.remove();
  }

  function resetState(){
    state.draggingEl = null;
    state.draggingCatalog = null;
    state.placeholder = null;
    state.originRowNum = null;
    state.originAbsIndex = null;
    state.draggingId = null;
    state.isDragging = false;
    state.pointerId = null;
  }

  // observe board for changes and re-normalize
  function observeBoard(){
    const board = one(BOARD_SEL);
    if (!board) return;
    normalizeRows();
    const mo = new MutationObserver(() => normalizeRows());
    mo.observe(board, { childList: true, subtree: true });
  }

  // init attach listeners (delegated)
  function init(){
    injectCSS();
    normalizeRows();
    const board = one(BOARD_SEL);
    if (!board) return;
    // avoid double-binding
    board.removeEventListener('pointerdown', onPointerDown);
    board.addEventListener('pointerdown', onPointerDown, {passive:false});
    observeBoard();
  }

  // auto init after small delay (let pedalboard render)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  } else setTimeout(init, 60);

  // expose for debugging
  window.PedalboardDNDFix = { init, resetState };

})();

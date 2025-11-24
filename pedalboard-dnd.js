/*
 * pedalboard-dragdrop.js
 * Drag & Drop stile Trello (opzione A): ghost clone + placeholder
 * Funziona con la struttura della tua pedalboard.
 */

(function () {
  let dragInfo = null;

  function initDragDrop() {
    const board = document.querySelector("#pedalboard");
    if (!board) return;

    board.addEventListener("pointerdown", onPointerDown);
    board.addEventListener("touchstart", onPointerDown, { passive: false });
  }

  function onPointerDown(e) {
    const target = e.target.closest(".pedal-wrapper");
    if (!target) return;

    e.preventDefault();

    const rect = target.getBoundingClientRect();
    const pointer = getPointerPos(e);

    dragInfo = {
      original: target,
      startX: pointer.x,
      startY: pointer.y,
      offsetX: pointer.x - rect.left,
      offsetY: pointer.y - rect.top,
      ghost: null,
      placeholder: null,
      currentRow: target.parentElement,
    };

    createGhost(target, rect, pointer);
    createPlaceholder(target);

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("touchmove", onPointerMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);
  }

  function createGhost(element, rect, pointer) {
    const ghost = element.cloneNode(true);
    ghost.style.position = "fixed";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    ghost.style.width = rect.width + "px";
    ghost.style.height = rect.height + "px";
    ghost.style.opacity = "0.6";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = 9999;
    ghost.classList.add("drag-ghost");
    document.body.appendChild(ghost);
    dragInfo.ghost = ghost;
  }

  function createPlaceholder(element) {
    const ph = document.createElement("div");
    ph.className = "pedal-placeholder";
    ph.style.width = element.offsetWidth + "px";
    ph.style.height = element.offsetHeight + "px";
    ph.style.border = "2px dashed #999";
    ph.style.borderRadius = "6px";
    ph.style.boxSizing = "border-box";
    dragInfo.original.after(ph);
    dragInfo.placeholder = ph;
  }

  function onPointerMove(e) {
    if (!dragInfo) return;
    e.preventDefault();

    const pointer = getPointerPos(e);
    const ghost = dragInfo.ghost;

    ghost.style.left = pointer.x - dragInfo.offsetX + "px";
    ghost.style.top = pointer.y - dragInfo.offsetY + "px";

    updatePlaceholder(pointer);
  }

  function updatePlaceholder(pointer) {
    const rows = [...document.querySelectorAll(".pedal-row")];
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (pointer.y >= rect.top && pointer.y <= rect.bottom) {
        dragInfo.currentRow = row;
        const pedals = [...row.querySelectorAll(".pedal-wrapper")].filter(
          (p) => p !== dragInfo.original
        );

        let inserted = false;
        for (const pedal of pedals) {
          const pRect = pedal.getBoundingClientRect();
          if (pointer.x < pRect.left + pRect.width / 2) {
            row.insertBefore(dragInfo.placeholder, pedal);
            inserted = true;
            break;
          }
        }

        if (!inserted) row.appendChild(dragInfo.placeholder);
        break;
      }
    }
  }

  function onPointerUp() {
    if (!dragInfo) return;

    const { ghost, placeholder, original, currentRow } = dragInfo;

    ghost.remove();

    currentRow.insertBefore(original, placeholder);
    placeholder.remove();

    updateDataStructure();
    window.renderPedalboard();

    dragInfo = null;

    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("touchmove", onPointerMove);
    document.removeEventListener("touchend", onPointerUp);
  }

  function updateDataStructure() {
    const rows = [...document.querySelectorAll(".pedal-row")];
    const pedals = [];

    rows.forEach((row, rowIndex) => {
      const items = row.querySelectorAll(".pedal-wrapper");
      items.forEach((item, colIndex) => {
        const id = item.getAttribute("data-id");
        const pedal = window.pedalboard.pedals.find((p) => p.id == id);
        if (pedal) {
          pedal.row = rowIndex;
          pedal.col = colIndex;
        }
        pedals.push(pedal);
      });
    });

    window.pedalboard.pedals = pedals;
  }

  function getPointerPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  document.addEventListener("DOMContentLoaded", initDragDrop);
})();

(function () {

    let dragged = null;
    let placeholder = null;
    let startRow = null;
    let startIndex = null;
    let isDragging = false;

    // stile placeholder
    const createPlaceholder = () => {
        const ph = document.createElement("div");
        ph.className = "pedal-placeholder";
        ph.style.width = "80px";
        ph.style.height = "120px";
        ph.style.border = "2px dashed #aaa";
        ph.style.borderRadius = "6px";
        ph.style.boxSizing = "border-box";
        return ph;
    };

    // disattiva click mentre trascino
    function disableClicks() {
        document.querySelectorAll(".pedal-item, .pedal-catalog").forEach(el => {
            el.style.pointerEvents = "none";
        });
    }

    function enableClicks() {
        document.querySelectorAll(".pedal-item, .pedal-catalog").forEach(el => {
            el.style.pointerEvents = "auto";
        });
    }

    // trova riga sotto il cursore
    function getRowUnderPointer(x, y) {
        const rows = Array.from(document.querySelectorAll(".pedal-row"));
        return rows.find(r => {
            const rect = r.getBoundingClientRect();
            return y >= rect.top && y <= rect.bottom;
        });
    }

    // trova posizione nella riga
    function getInsertPosition(row, x) {
        const items = Array.from(row.children).filter(el => el !== dragged && el !== placeholder);
        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            if (x < rect.left + rect.width / 2) return i;
        }
        return items.length;
    }

    // aggiorna il modello dati in window.pedalboard
    function updateModel() {
        const rows = document.querySelectorAll(".pedal-row");
        const updated = [];
        let rowNum = 1;

        rows.forEach(row => {
            const items = Array.from(row.children).filter(el => el.classList.contains("pedal-item") || el.classList.contains("pedal-catalog"));
            items.forEach((el, idx) => {
                updated.push({
                    pedal_id: el.dataset.pedalId,
                    rotation: parseInt(el.dataset.rotation || "0"),
                    row: rowNum,
                    position: idx
                });
            });
            rowNum++;
        });
        window.pedalboard.pedals = updated;
    }

    // ricrea righe vuote
    function cleanupEmptyRows() {
        document.querySelectorAll(".pedal-row").forEach(row => {
            if (row.children.length === 0) row.remove();
        });
    }

    // MAIN INIT chiamato dopo renderPedalboard()
    window.initPedalboardDND = function () {

        // pulizia eventuali duplicati
        document.querySelectorAll(".pedal-item, .pedal-catalog").forEach(el => {
            el.onmousedown = null;
            el.ontouchstart = null;
        });

        // setup drag su ogni pedale
        document.querySelectorAll(".pedal-item, .pedal-catalog").forEach(el => {
            el.addEventListener("mousedown", startDrag);
            el.addEventListener("touchstart", startDrag, { passive: false });
        });
    };

    // --------------------------
    //         DRAG START
    // --------------------------
    function startDrag(e) {
        e.preventDefault();

        dragged = e.target.closest(".pedal-item, .pedal-catalog");
        if (!dragged) return;

        disableClicks();
        isDragging = true;

        const rect = dragged.getBoundingClientRect();

        const pageX = e.touches ? e.touches[0].pageX : e.pageX;
        const pageY = e.touches ? e.touches[0].pageY : e.pageY;

        dragged._offsetX = pageX - rect.left;
        dragged._offsetY = pageY - rect.top;

        startRow = dragged.parentElement;
        startIndex = Array.from(startRow.children).indexOf(dragged);

        // placeholder
        placeholder = createPlaceholder();
        startRow.insertBefore(placeholder, dragged.nextSibling);

        // posizione assoluta per trascinamento
        dragged.style.position = "absolute";
        dragged.style.zIndex = 9999;
        dragged.style.pointerEvents = "none";
        dragged.style.width = rect.width + "px";
        dragged.style.height = rect.height + "px";

        moveDragged(pageX, pageY);

        document.addEventListener("mousemove", duringDrag);
        document.addEventListener("touchmove", duringDrag, { passive: false });
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchend", endDrag);
    }

    // --------------------------
    //        DRAG MOVE
    // --------------------------
    function duringDrag(e) {
        if (!isDragging) return;

        const pageX = e.touches ? e.touches[0].pageX : e.pageX;
        const pageY = e.touches ? e.touches[0].pageY : e.pageY;

        moveDragged(pageX, pageY);

        const row = getRowUnderPointer(pageX, pageY);
        if (!row) return;

        const pos = getInsertPosition(row, pageX);

        if (placeholder.parentElement !== row || Array.from(row.children).indexOf(placeholder) !== pos) {
            row.insertBefore(placeholder, row.children[pos] || null);
        }
    }

    function moveDragged(x, y) {
        dragged.style.left = (x - dragged._offsetX) + "px";
        dragged.style.top = (y - dragged._offsetY) + "px";
    }

    // --------------------------
    //         DRAG END
    // --------------------------
    function endDrag() {
        if (!isDragging) return;
        isDragging = false;

        enableClicks();

        // rimetto il pedale dove c'è il placeholder
        placeholder.parentElement.insertBefore(dragged, placeholder);

        // pulizia
        dragged.style.position = "";
        dragged.style.zIndex = "";
        dragged.style.left = "";
        dragged.style.top = "";
        dragged.style.pointerEvents = "";
        dragged.style.width = "";
        dragged.style.height = "";

        placeholder.remove();
        placeholder = null;

        cleanupEmptyRows();
        updateModel();
        renderPedalboard(); // ridisegna tutto

        document.removeEventListener("mousemove", duringDrag);
        document.removeEventListener("touchmove", duringDrag);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchend", endDrag);
    }

})();

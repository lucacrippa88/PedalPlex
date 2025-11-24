// -------------------------------------------------------
//  PEDALBOARD DRAG & DROP – SortableJS
//  Supports: reorder inside row + move to any row
//  Auto-create new row + cleanup empty rows
// -------------------------------------------------------

window.initPedalboardDND = function () {
    console.log("Initializing drag & drop…");

    const board = document.getElementById("pedalboard");
    if (!board) return;

    // Trova tutte le righe (create da renderPedalboard)
    const rows = board.querySelectorAll(".pedal-row");

    rows.forEach((row) => makeRowSortable(row));

    // Aggiungi una "zona drop" finale per creare nuove righe
    ensureAddRowZone();
};

// -------------------------------------------------------
//   CREAZIONE SORTABLE PER OGNI RIGA
// -------------------------------------------------------
function makeRowSortable(rowEl) {

    Sortable.create(rowEl, {
        group: "pedals",          // permette di spostare tra righe
        animation: 150,
        ghostClass: "drag-ghost",
        dragClass: "drag-active",
        chosenClass: "drag-chosen",

        onStart() {
            // Mostra la zona nuova riga quando inizi a trascinare
            document.getElementById("add-row-zone").style.display = "block";
        },

        onEnd(evt) {
            // Nasconde zona nuova riga quando finito
            document.getElementById("add-row-zone").style.display = "none";

            cleanupEmptyRows();
            rebuildPedalboardModel();
            renderPedalboard(); // ridisegna tutto in modo coerente
        }
    });
}

// -------------------------------------------------------
//  CREA / AGGIORNA LA ZONA PER AGGIUNGERE UNA NUOVA RIGA
// -------------------------------------------------------
function ensureAddRowZone() {
    let zone = document.getElementById("add-row-zone");
    if (!zone) {
        zone = document.createElement("div");
        zone.id = "add-row-zone";
        zone.style.border = "2px dashed #888";
        zone.style.margin = "20px 0";
        zone.style.padding = "20px";
        zone.style.textAlign = "center";
        zone.style.color = "#777";
        zone.style.fontSize = "14px";
        zone.textContent = "Drop here to create a new row";
        zone.style.display = "none";
        document.getElementById("pedalboard").appendChild(zone);
    }

    // Rende droppabile
    Sortable.create(zone, {
        group: "pedals",
        animation: 150,

        onAdd(evt) {
            // Crea una nuova riga
            const newRow = document.createElement("div");
            newRow.className = "pedal-row";
            newRow.style.display = "flex";
            newRow.style.gap = "12px";
            newRow.style.marginBottom = "20px";

            // Inserisci il pedale dentro la riga nuova
            newRow.appendChild(evt.item);

            // Inserisci la riga prima della zona
            zone.before(newRow);

            // Rende la nuova riga sortable
            makeRowSortable(newRow);

            cleanupEmptyRows();
            rebuildPedalboardModel();
            renderPedalboard();
        }
    });
}

// -------------------------------------------------------
//  ELIMINA LE RIGHE VUOTE
// -------------------------------------------------------
function cleanupEmptyRows() {
    document.querySelectorAll(".pedal-row").forEach(row => {
        if (row.children.length === 0) row.remove();
    });
}

// -------------------------------------------------------
//  RICOSTRUISCE window.pedalboard.pedals IN MODO COERENTE
// -------------------------------------------------------
function rebuildPedalboardModel() {
    const rows = document.querySelectorAll(".pedal-row");
    const newList = [];

    let rowIndex = 1;

    rows.forEach(row => {
        const pedals = row.querySelectorAll(".pedal-catalog, .pedal-item");

        pedals.forEach((pedalEl, idx) => {
            const pedalId = pedalEl.dataset.pedalId;
            const rotation = parseInt(pedalEl.dataset.rotation || "0");

            newList.push({
                pedal_id: pedalId,
                rotation,
                row: rowIndex,
                position: idx,
            });
        });

        rowIndex++;
    });

    window.pedalboard.pedals = newList;
}

// -------------------------------------------------------
//  CHIAMA initPedalboardDND() OGNI VOLTA CHE REDRAW
// -------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Hook automatico dopo ogni render
    const origRender = window.renderPedalboard;

    window.renderPedalboard = function () {
        origRender();
        setTimeout(() => initPedalboardDND(), 10); // assicura che il DOM sia pronto
    };
});

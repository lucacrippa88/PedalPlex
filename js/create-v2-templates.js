/* Gear Builder v2 — "Start from a template".
 *
 * Templates are normal gears with published="template" (same ones listed in the catalog).
 * Picking one just calls the existing syncUIFromJSON() with a cleaned copy, so the saved JSON
 * still comes only from buildJSON() in js/create.js. Nothing is sent anywhere by this file
 * except one read-only search request (same endpoint and token the catalog uses).
 */
(function () {
    "use strict";

    var API = "https://api.pedalplex.com/SEARCH_GEAR_LAZY.php";
    var PAGE = 100, MAX_PAGES = 5;
    var cache = null, loading = null;
    var usedName = null;       // set after a template has been applied
    var dlg = null;

    function currentUser() { try { return parent && parent.window && parent.window.currentUser; } catch (e) { return null; } }

    function fetchTemplates() {
        if (cache) return Promise.resolve(cache);
        if (loading) return loading;
        var token = localStorage.getItem("authToken");
        var headers = token ? { Authorization: "Bearer " + token } : {};
        var all = [], seen = {};

        function page(bookmark, n) {
            var url = API + "?q=&published=template&limit=" + PAGE + (bookmark ? "&bookmark=" + encodeURIComponent(bookmark) : "");
            return fetch(url, { headers: headers }).then(function (r) { return r.json(); }).then(function (d) {
                var docs = (d && Array.isArray(d.docs)) ? d.docs : [];
                docs.forEach(function (x) {
                    if (!x || !x._id || seen[x._id] || String(x.published || "").toLowerCase() !== "template") return;
                    seen[x._id] = 1; all.push(x);
                });
                // full page + bookmark → there may be more
                if (docs.length >= PAGE && d.bookmark && n + 1 < MAX_PAGES) return page(d.bookmark, n + 1);
            });
        }
        loading = page(null, 0).then(function () {
            all.sort(function (a, b) { return String(a._id).localeCompare(String(b._id)); });
            cache = all; loading = null; return cache;
        }, function (e) { loading = null; throw e; });
        return loading;
    }

    // ---------- dialog ----------
    function ensureDialog() {
        if (dlg) return dlg;
        dlg = document.createElement("dialog");
        dlg.id = "tpl-dialog";
        dlg.innerHTML =
            '<div class="tpl-head">' +
              '<h3>Templates</h3>' +
              '<input type="text" id="tpl-filter" placeholder="Search templates..." autocomplete="off" autocapitalize="off" spellcheck="false">' +
              '<button type="button" class="bx--btn bx--btn--sm bx--btn--secondary" id="tpl-close" style="color:#fff">Close</button>' +
            '</div>' +
            '<div class="tpl-body"><div class="tpl-status" id="tpl-status"></div><div class="tpl-grid" id="tpl-grid"></div></div>';
        document.body.appendChild(dlg);
        dlg.querySelector("#tpl-close").addEventListener("click", function () { dlg.close(); });
        dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // backdrop
        dlg.querySelector("#tpl-filter").addEventListener("input", applyFilter);
        dlg.querySelector("#tpl-grid").addEventListener("click", function (e) {
            var card = e.target.closest(".tpl-card");
            if (card) choose(cache[+card.getAttribute("data-i")]);
        });
        return dlg;
    }

    function applyFilter() {
        var q = dlg.querySelector("#tpl-filter").value.trim().toLowerCase(), shown = 0;
        dlg.querySelectorAll(".tpl-card").forEach(function (c) {
            var ok = !q || c.getAttribute("data-search").indexOf(q) !== -1;
            c.style.display = ok ? "" : "none";
            if (ok) shown++;
        });
        dlg.querySelector("#tpl-status").textContent = shown ? "" : "No template matches.";
    }

    function fitThumb(thumb, ped) {
        var w = ped.offsetWidth + 10, h = ped.offsetHeight + 10;
        var s = Math.min(1, (thumb.clientWidth - 12) / w, (thumb.clientHeight - 12) / h);
        thumb.firstChild.style.zoom = s < 1 ? s.toFixed(3) : "";
    }

    function render() {
        var grid = dlg.querySelector("#tpl-grid");
        grid.textContent = "";
        cache.forEach(function (t, i) {
            var card = document.createElement("button");
            card.type = "button";
            card.className = "tpl-card";
            card.setAttribute("data-i", i);
            card.setAttribute("data-search", [t._id, t.category, t.type, t.author].join(" ").toLowerCase());

            var thumb = document.createElement("div");
            thumb.className = "tpl-thumb";
            var holder = document.createElement("div");
            thumb.appendChild(holder);
            try {
                var $p = renderPedal(JSON.parse(JSON.stringify(t)), "guest", true);
                holder.appendChild($p[0]);
            } catch (e) { holder.textContent = "(preview unavailable)"; }

            var meta = document.createElement("div");
            meta.className = "tpl-meta";
            var b = document.createElement("b"); b.textContent = t._id;
            var s1 = document.createElement("span"); s1.textContent = [t.type, t.width + " × " + t.height].filter(Boolean).join(" · ");
            var n = 0; (t.controls || []).forEach(function (r) { n += (r.row || []).length; });
            var s2 = document.createElement("span"); s2.textContent = (t.controls || []).length + (((t.controls || []).length === 1) ? " row · " : " rows · ") + n + (n === 1 ? " control" : " controls") + (t.category ? " · " + t.category : "");
            var use = document.createElement("span"); use.className = "tpl-use"; use.textContent = "Use this template";
            meta.appendChild(b); meta.appendChild(s1); meta.appendChild(s2); meta.appendChild(use);

            card.appendChild(thumb); card.appendChild(meta);
            grid.appendChild(card);
        });
        // scale once laid out
        requestAnimationFrame(function () {
            grid.querySelectorAll(".tpl-thumb").forEach(function (th) {
                var ped = th.querySelector(".pedal-catalog");
                if (ped) fitThumb(th, ped);
            });
        });
        applyFilter();
    }

    function open() {
        ensureDialog();
        var status = dlg.querySelector("#tpl-status");
        dlg.querySelector("#tpl-grid").textContent = "";
        status.textContent = "Loading templates...";
        if (!dlg.open) dlg.showModal();
        fetchTemplates().then(function (list) {
            if (!list.length) {
                status.textContent = localStorage.getItem("authToken")
                    ? "There are no templates yet."
                    : "No templates available. Log in to see them.";
                return;
            }
            status.textContent = "";
            render();
        }).catch(function () { status.textContent = "Could not load templates. Check your connection and try again."; });
    }

    // ---------- apply ----------
    function pristine() {
        return !$("#pedal-id").val().trim() && !$("#pedal-name").val().trim() && !$("#controls .control").length;
    }

    function apply(tpl) {
        var t = JSON.parse(JSON.stringify(tpl));
        Object.keys(t).forEach(function (k) { if (k.charAt(0) === "_") delete t[k]; }); // _id, _rev, _attachments…
        delete t.id; delete t.verified;
        t.published = "draft";
        var u = currentUser();
        if (u) { t.author = u.username; t.authorId = u.userid; } else { delete t.author; delete t.authorId; }

        syncUIFromJSON(t);
        usedName = tpl._id;
        setTimeout(function () {
            refreshStart();
            var id = document.getElementById("pedal-id");
            id.scrollIntoView({ block: "center", behavior: "smooth" });
            if (!window.matchMedia("(max-width: 860px)").matches) id.focus(); // don't pop the keyboard on phones
        }, 60);
    }

    function choose(tpl) {
        if (!tpl) return;
        dlg.close();
        if (pristine() || (usedName && !hasEdits())) { apply(tpl); return; }
        Swal.fire({
            title: "Replace what you have?",
            text: "Loading a template replaces everything currently in the builder.",
            showCancelButton: true,
            confirmButtonText: "Yes, use template",
            cancelButtonText: "Cancel",
            background: "#2e2e2e", color: "#ffffff",
            customClass: { confirmButton: "bx--btn bx--btn--primary", cancelButton: "bx--btn bx--btn--secondary" }
        }).then(function (r) { if (r.isConfirmed) apply(tpl); });
    }
    // We can't diff cheaply; after a template is applied any later change counts as an edit.
    var editedAfter = false;
    function hasEdits() { return editedAfter; }

    // ---------- start card ----------
    function refreshStart() {
        var card = document.getElementById("tpl-start");
        if (!card) return;
        var editing = $("#pedal-id").prop("disabled");   // edit-handler locks the ID of an existing gear
        card.hidden = !!editing || !(pristine() || usedName);
        var note = document.getElementById("tpl-note"), btn = document.getElementById("tpl-open");
        if (usedName) {
            note.textContent = "Started from template “" + usedName + "”. Give your gear a new unique ID, then adapt it.";
            btn.textContent = "Change template";
        } else {
            note.textContent = "Pick an existing template and adapt it, or build from scratch below.";
            btn.textContent = "Browse templates";
        }
    }

    $(function () {
        document.getElementById("tpl-open").addEventListener("click", open);
        new MutationObserver(refreshStart).observe(document.getElementById("pedal-box"), { childList: true });
        // anything the user changes after applying a template makes "change template" ask for confirmation
        $("#editor").on("input change click", "input, select, button", function (e) {
            if (usedName && e.target.id !== "tpl-open") editedAfter = true;
        });
        refreshStart();
    });

    window.__gearTemplates = { open: open, apply: apply, fetchTemplates: fetchTemplates };
})();

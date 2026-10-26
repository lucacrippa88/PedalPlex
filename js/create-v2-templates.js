/* Gear Builder v2 — "Start from a template" and "Clone a gear".
 *
 * Both are only a way to FILL the builder: picking a gear calls the existing syncUIFromJSON()
 * with a cleaned copy, so the saved JSON still comes only from buildJSON() in js/create.js.
 * Nothing is written anywhere by this file. It only does read-only requests, same endpoints and
 * token the catalog already uses:
 *   - templates : SEARCH_GEAR_LAZY.php?published=template
 *   - clone     : GET_CATALOG_LAZY.php  (the server decides what the user may see:
 *                 admin = everything, other users = public + own; we additionally keep ONLY
 *                 the gears authored by the logged user, unless he is admin)
 */
(function () {
    "use strict";

    var TPL_API = "https://api.pedalplex.com/SEARCH_GEAR_LAZY.php";
    var CAT_API = "https://api.pedalplex.com/GET_CATALOG_LAZY.php";
    var PAGE = 100;        // server page size
    var TPL_MAX_PAGES = 5;
    var WANT = 24;         // "my gears": keep scanning pages until we have this many new ones…
    var SCAN = 5;          // …or we scanned this many pages

    var dlg = null, mode = "tpl";
    var usedName = null, usedKind = null, editedAfter = false;
    var T = { list: null, loading: null };
    var M = { list: [], seen: {}, page: 0, done: false, loading: false, started: false, search: "", gen: 0, rendered: 0 };
    var io = null, searchTimer = 0, resizeTimer = 0;

    // ---------- who is logged in ----------
    function me() {
        var u = null;
        try { u = parent && parent.window && parent.window.currentUser; } catch (e) { /* cross-origin parent */ }
        if (!u || (!u.userid && !u.username) || String(u.role || "").toLowerCase() === "guest") {
            // standalone page (no parent builder): read the same token the site uses
            try {
                var tok = localStorage.getItem("authToken");
                if (tok) {
                    var p = JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                    if (p && (p.userid || p.username)) u = p;
                }
            } catch (e) { /* not a JWT: keep what we have */ }
        }
        if (!u || (!u.userid && !u.username)) return { guest: true, admin: false };
        var role = String(u.role || "user").toLowerCase();
        return { guest: role === "guest", admin: role === "admin", username: u.username, userid: u.userid };
    }
    function authHeaders() {
        var t = localStorage.getItem("authToken");
        return t ? { Authorization: "Bearer " + t } : {};
    }

    // ---------- data ----------
    function fetchTemplates() {
        if (T.list) return Promise.resolve(T.list);
        if (T.loading) return T.loading;
        var all = [], seen = {};
        function page(bookmark, n) {
            var url = TPL_API + "?q=&published=template&limit=" + PAGE + (bookmark ? "&bookmark=" + encodeURIComponent(bookmark) : "");
            return fetch(url, { headers: authHeaders() }).then(function (r) { return r.json(); }).then(function (d) {
                var docs = (d && Array.isArray(d.docs)) ? d.docs : [];
                docs.forEach(function (x) {
                    if (!x || !x._id || seen[x._id] || String(x.published || "").toLowerCase() !== "template") return;
                    seen[x._id] = 1; all.push(x);
                });
                if (docs.length >= PAGE && d.bookmark && n + 1 < TPL_MAX_PAGES) return page(d.bookmark, n + 1);
            });
        }
        T.loading = page(null, 0).then(function () {
            all.sort(function (a, b) { return String(a._id).localeCompare(String(b._id)); });
            T.list = all; T.loading = null; return all;
        }, function (e) { T.loading = null; throw e; });
        return T.loading;
    }

    function resetMine(term) {
        M.gen++; M.list = []; M.seen = {}; M.page = 0; M.done = false; M.loading = false;
        M.started = false; M.rendered = 0; M.search = term || "";
        if (dlg) dlg.querySelector("#mine-grid").textContent = "";
    }

    // Reads catalog pages until WANT new gears are found (or SCAN pages were read, or the end).
    function fetchMine() {
        if (M.loading || M.done) return Promise.resolve();
        M.loading = true;
        var gen = M.gen, who = me(), added = 0, pages = 0;
        function step() {
            M.page++; pages++;
            var url = CAT_API + "?page=" + M.page + "&limit=" + PAGE + (M.search ? "&search=" + encodeURIComponent(M.search) : "");
            return fetch(url, { headers: authHeaders() }).then(function (r) { return r.json(); }).then(function (d) {
                if (gen !== M.gen) return;
                if (!Array.isArray(d)) throw new Error("bad response");
                if (!d.length) { M.done = true; return; }
                d.forEach(function (x) {
                    if (!x || !x._id || M.seen[x._id]) return;
                    var mine = x.author === who.username || (who.userid && x.authorId === who.userid);
                    if (!who.admin && !mine) return;      // the logged user only ever sees his own gears
                    M.seen[x._id] = 1; M.list.push(x); added++;
                });
                // admin sees every document, so a short page is really the last one
                if (who.admin && d.length < PAGE) { M.done = true; return; }
                if (added < WANT && pages < SCAN) return step();
            });
        }
        return step().then(function () { if (gen === M.gen) M.loading = false; },
            function (e) { if (gen === M.gen) M.loading = false; throw e; });
    }

    // ---------- dialog ----------
    function ensureDialog() {
        if (dlg) return dlg;
        dlg = document.createElement("dialog");
        dlg.id = "tpl-dialog";
        dlg.innerHTML =
            '<div class="tpl-head">' +
              '<h3>Start from…</h3>' +
              '<div class="tpl-tabs" role="tablist">' +
                '<button type="button" role="tab" class="tpl-tab" data-mode="tpl">Templates</button>' +
                '<button type="button" role="tab" class="tpl-tab" data-mode="mine" id="tab-mine">My gears</button>' +
              '</div>' +
              '<input type="text" id="tpl-filter" placeholder="Search..." autocomplete="off" autocapitalize="off" spellcheck="false">' +
              '<button type="button" class="bx--btn bx--btn--sm bx--btn--secondary" id="tpl-close" style="color:#fff">Close</button>' +
            '</div>' +
            '<div class="tpl-body" id="tpl-body">' +
              '<div class="tpl-status" id="tpl-status"></div>' +
              '<div class="tpl-grid" id="tpl-grid"></div>' +
              '<div class="tpl-grid" id="mine-grid" hidden></div>' +
              '<div class="tpl-more"><button type="button" class="bx--btn bx--btn--sm bx--btn--tertiary" id="mine-more" style="color:#fff" hidden>Load more gears</button></div>' +
            '</div>';
        document.body.appendChild(dlg);

        dlg.querySelector("#tpl-close").addEventListener("click", function () { dlg.close(); });
        dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // backdrop
        dlg.querySelectorAll(".tpl-tab").forEach(function (b) {
            b.addEventListener("click", function () { switchMode(b.getAttribute("data-mode")); });
        });
        dlg.querySelector("#tpl-filter").addEventListener("input", onSearch);
        dlg.querySelector("#mine-more").addEventListener("click", loadMoreMine);

        function pick(e) {
            var card = e.target.closest(".tpl-card");
            if (card && card.__gear) choose(card.__gear, card.__kind);
        }
        dlg.addEventListener("click", pick);
        dlg.addEventListener("keydown", function (e) {
            if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("tpl-card")) { e.preventDefault(); pick(e); }
        });

        if ("IntersectionObserver" in window) {
            io = new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    io.unobserve(e.target);
                    drawThumb(e.target);
                });
            }, { root: dlg.querySelector("#tpl-body"), rootMargin: "300px" });
        }
        window.addEventListener("resize", function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (dlg.open) dlg.querySelectorAll(".tpl-card[data-drawn]").forEach(function (c) { fitThumb(c.firstChild); });
            }, 150);
        });
        dlg.addEventListener("close", function () { clearTimeout(searchTimer); });
        return dlg;
    }

    function Q(sel) { return dlg.querySelector(sel); }
    function activeGrid() { return mode === "tpl" ? Q("#tpl-grid") : Q("#mine-grid"); }
    function setStatus(t) { Q("#tpl-status").textContent = t || ""; }

    // ---------- cards ----------
    function clean(s) { return String(s == null ? "" : s); }
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

    function makeCard(t, kind, who) {
        var card = el("div", "tpl-card");
        card.setAttribute("role", "button");
        card.tabIndex = 0;
        card.__gear = t; card.__kind = kind;
        if (typeof getPedalWidth === "function" && parseInt(getPedalWidth(t.width), 10) > 400) card.className += " wide";
        card.setAttribute("data-search", [t._id, t.category, t.type, t.author, t.published].join(" ").toLowerCase());

        var thumb = el("div", "tpl-thumb");
        thumb.appendChild(el("div", "tpl-holder"));

        var meta = el("div", "tpl-meta");
        var title = el("b", null, clean(t._id));
        var n = 0; (t.controls || []).forEach(function (r) { n += (r.row || []).length; });
        var rows = (t.controls || []).length;
        meta.appendChild(title);
        meta.appendChild(el("span", null, [t.type, t.width + " × " + t.height].filter(Boolean).join(" · ")));
        meta.appendChild(el("span", null, rows + (rows === 1 ? " row · " : " rows · ") + n + (n === 1 ? " control" : " controls") + (t.category ? " · " + t.category : "")));
        if (kind === "clone") {
            var st = clean(t.published || "draft").toLowerCase();
            var line = el("span", "tpl-state");
            var badge = el("em", "tpl-badge st-" + st.replace(/[^a-z]/g, ""), st);
            line.appendChild(badge);
            if (who.admin && t.author) line.appendChild(document.createTextNode(" by " + t.author));
            meta.appendChild(line);
        }
        meta.appendChild(el("span", "tpl-use", kind === "clone" ? "Clone this gear" : "Use this template"));

        card.appendChild(thumb); card.appendChild(meta);
        return card;
    }

    function appendCards(grid, list, from, kind) {
        var who = me(), frag = document.createDocumentFragment(), cards = [];
        for (var i = from; i < list.length; i++) { var c = makeCard(list[i], kind, who); frag.appendChild(c); cards.push(c); }
        grid.appendChild(frag);
        cards.forEach(function (c) { if (io) io.observe(c); else drawThumb(c); });
        return list.length;
    }

    // Draws the gear at its REAL size and then zooms the whole thing to fit the thumb.
    function drawThumb(card) {
        if (card.hasAttribute("data-drawn")) return;
        card.setAttribute("data-drawn", "1");
        var holder = card.querySelector(".tpl-holder");
        try {
            var $p = renderPedal(JSON.parse(JSON.stringify(card.__gear)), "guest", true);
            holder.appendChild($p[0]);
        } catch (e) { holder.textContent = "(preview unavailable)"; return; }
        requestAnimationFrame(function () { fitThumb(card.querySelector(".tpl-thumb")); });
    }

    function fitThumb(th) {
        var h = th.firstChild, ped = h && h.querySelector(".pedal-catalog");
        if (!ped || !th.clientWidth) return;
        h.style.zoom = ""; h.style.width = ""; h.style.height = "";
        // real extent = the box AND whatever overflows it (big LCDs, tall labels…)
        var w = Math.max(ped.offsetWidth, ped.scrollWidth + 10) + 4;
        var ht = Math.max(ped.offsetHeight, ped.scrollHeight + 10) + 10;
        var s = Math.min(1, (th.clientWidth - 16) / w, (th.clientHeight - 16) / ht);
        h.style.width = w + "px"; h.style.height = ht + "px";
        if (s < 1) h.style.zoom = s.toFixed(4);
    }

    // ---------- views ----------
    function applyFilter() {
        var q = Q("#tpl-filter").value.trim().toLowerCase(), shown = 0, grid = activeGrid();
        grid.querySelectorAll(".tpl-card").forEach(function (c) {
            var ok = !q || c.getAttribute("data-search").indexOf(q) !== -1;
            c.style.display = ok ? "" : "none";
            if (ok) shown++;
        });
        var total = grid.querySelectorAll(".tpl-card").length;
        if (shown) { setStatus(""); return; }
        if (mode === "tpl") {
            if (T.loading) setStatus("Loading templates...");
            else setStatus(total ? "No template matches." : (localStorage.getItem("authToken") ? "There are no templates yet." : "No templates available. Log in to see them."));
        } else if (M.loading) {
            setStatus("Loading gears...");
        } else {
            setStatus(total ? "No gear matches." : (M.search ? "No gear found for this search." : (me().admin ? "There are no gears yet." : "You have not created any gear yet.")));
        }
    }

    function refreshView() {
        Q("#tpl-grid").hidden = mode !== "tpl";
        Q("#mine-grid").hidden = mode !== "mine";
        Q("#mine-more").hidden = !(mode === "mine" && M.started && !M.done && !M.loading);
        dlg.querySelectorAll(".tpl-tab").forEach(function (b) {
            var on = b.getAttribute("data-mode") === mode;
            b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false");
        });
        Q("#tab-mine").textContent = me().admin ? "All gears" : "My gears";
        applyFilter();
        // thumbs of a grid that was hidden could not be measured: refit now that it is visible
        requestAnimationFrame(function () {
            activeGrid().querySelectorAll(".tpl-card[data-drawn]").forEach(function (c) { fitThumb(c.firstChild); });
        });
    }

    function switchMode(m) {
        if (m === mode && dlg.open && (m === "tpl" ? T.list : M.started)) return;
        mode = m;
        Q("#tpl-filter").value = "";
        if (m === "mine" && M.search) resetMine("");
        load();
    }

    function load() {
        refreshView();
        if (mode === "tpl") {
            if (T.list) { if (!Q("#tpl-grid").firstChild) appendCards(Q("#tpl-grid"), T.list, 0, "tpl"); refreshView(); return; }
            setStatus("Loading templates...");
            fetchTemplates().then(function (list) {
                if (!Q("#tpl-grid").firstChild) appendCards(Q("#tpl-grid"), list, 0, "tpl");
                refreshView();
            }).catch(function () { setStatus("Could not load templates. Check your connection and try again."); });
        } else {
            if (me().guest || !localStorage.getItem("authToken")) { setStatus("Log in to clone your gears."); return; }
            if (!M.started) startMine(); else refreshView();
        }
    }

    function startMine() {
        M.started = true;
        setStatus("Loading gears...");
        var gen = M.gen, btn = Q("#mine-more");
        btn.disabled = true;
        fetchMine().then(function () {
            if (gen !== M.gen) return;
            M.rendered = appendCards(Q("#mine-grid"), M.list, M.rendered, "clone");
        }).catch(function () {
            if (gen === M.gen) { M.started = M.list.length > 0; setStatus("Could not load gears. Check your connection and try again."); }
        }).then(function () {
            btn.disabled = false;
            if (gen === M.gen) refreshView();
        });
    }
    function loadMoreMine() { if (!M.loading && !M.done) startMine(); }

    function onSearch() {
        applyFilter();
        if (mode !== "mine") return;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            var term = Q("#tpl-filter").value.trim();
            if (term !== M.search) { resetMine(term); startMine(); }
        }, 450);
    }

    function open(m) {
        ensureDialog();
        refreshStart();   // the admin/user label depends on who is logged in NOW
        mode = m === "mine" ? "mine" : "tpl";
        if (!dlg.open) dlg.showModal();
        Q("#tpl-filter").value = "";
        if (mode === "mine" && M.search) resetMine("");
        load();
    }

    // ---------- apply ----------
    function pristine() {
        var $ = window.jQuery;
        return !$("#pedal-id").val().trim() && !$("#pedal-name").val().trim() && !$("#controls .control").length;
    }

    function apply(src, kind) {
        var t = JSON.parse(JSON.stringify(src));
        Object.keys(t).forEach(function (k) { if (k.charAt(0) === "_") delete t[k]; }); // _id, _rev, _attachments…
        delete t.id; delete t.verified; delete t.canEdit;
        t.published = "draft";
        var u = me();
        if (!u.guest) { t.author = u.username; t.authorId = u.userid; } else { delete t.author; delete t.authorId; }

        editedAfter = false;
        syncUIFromJSON(t);
        usedName = src._id; usedKind = kind;
        setTimeout(function () {
            refreshStart();
            var id = document.getElementById("pedal-id");
            id.scrollIntoView({ block: "center", behavior: "smooth" });
            if (!window.matchMedia("(max-width: 860px)").matches) id.focus(); // don't pop the keyboard on phones
        }, 60);
    }

    function choose(src, kind) {
        if (!src) return;
        dlg.close();
        if (pristine() || (usedName && !editedAfter)) { apply(src, kind); return; }
        Swal.fire({
            title: "Replace what you have?",
            text: "Loading " + (kind === "clone" ? "this gear" : "a template") + " replaces everything currently in the builder.",
            showCancelButton: true,
            confirmButtonText: kind === "clone" ? "Yes, clone it" : "Yes, use template",
            cancelButtonText: "Cancel",
            background: "#2e2e2e", color: "#ffffff",
            customClass: { confirmButton: "bx--btn bx--btn--primary", cancelButton: "bx--btn bx--btn--secondary" }
        }).then(function (r) { if (r.isConfirmed) apply(src, kind); });
    }

    // ---------- start card ----------
    function refreshStart() {
        var card = document.getElementById("tpl-start");
        if (!card) return;
        var editing = window.jQuery("#pedal-id").prop("disabled");   // edit-handler locks the ID of an existing gear
        card.hidden = !!editing || !(pristine() || usedName);
        var note = document.getElementById("tpl-note"), btn = document.getElementById("clone-open");
        var admin = me().admin;
        btn.textContent = admin ? "Clone any gear" : "Clone my gear";
        if (usedName && usedKind === "clone") note.textContent = "Cloned from “" + usedName + "”. Give the copy a new unique ID, then adapt it.";
        else if (usedName) note.textContent = "Started from template “" + usedName + "”. Give your gear a new unique ID, then adapt it.";
        else note.textContent = admin
            ? "Start from a template or clone any existing gear, or build from scratch below."
            : "Start from a template or clone one of your gears, or build from scratch below.";
    }

    window.jQuery(function () {
        document.getElementById("tpl-open").addEventListener("click", function () { open("tpl"); });
        document.getElementById("clone-open").addEventListener("click", function () { open("mine"); });
        new MutationObserver(refreshStart).observe(document.getElementById("pedal-box"), { childList: true });
        // anything the user changes after applying a gear makes the next pick ask for confirmation
        window.jQuery("#editor").on("input change click", "input, select, button", function (e) {
            if (usedName && e.target.id !== "tpl-open" && e.target.id !== "clone-open") editedAfter = true;
        });
        refreshStart();
    });

    window.__gearTemplates = { open: open, apply: apply, fetchTemplates: fetchTemplates };
})();

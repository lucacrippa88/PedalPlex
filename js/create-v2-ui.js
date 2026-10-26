/* Gear Builder v2 — UI layer only.
 *
 * Does NOT build, parse or validate the pedal JSON: that stays 100% in js/create.js
 * (buildJSON / syncUIFromJSON / getPedalValidation), unchanged.
 * This file only adds: collapsible control cards with summaries, section hints,
 * status pills, fit-to-width preview and a standalone load/copy test bar.
 */
(function () {
    "use strict";

    var MOBILE = window.matchMedia("(max-width: 860px)");
    var userAdd = false;      // true while the user (not syncUIFromJSON) is adding a control
    var previewMode = "fit";  // "fit" | "actual"
    var raf = 0;

    // ---------- helpers ----------
    function esc(s) { return String(s == null ? "" : s); }

    function setCollapsed($c, collapsed) {
        $c.toggleClass("collapsed", collapsed);
        $c.find("> .ctrl-head").attr("aria-expanded", String(!collapsed));
    }

    // ---------- card summaries ----------
    function refreshCard($c) {
        var type = $c.data("type");
        var label = ($c.find(".ctrl-label").first().val() || "").trim();
        var sub = "";

        if (type && String(type).indexOf("knob") !== -1) {
            var size = $c.find(".ctrl-size option:selected").text();
            if ($c.find(".ctrl-knob-type").val() === "discrete") {
                sub = size + " · " + esc($c.find(".ctrl-values-list").val());
            } else {
                sub = size + " · " + esc($c.find(".ctrl-min").val()) + "–" + esc($c.find(".ctrl-max").val()) +
                    " (" + esc($c.find(".ctrl-value").first().val()) + ")";
            }
        } else if (type === "led") {
            sub = $c.find(".led-colors-container .ctrl-color").length + " colors";
        } else if (type === "slider") {
            sub = esc($c.find(".ctrl-orientation").val()) + " · " + esc($c.find(".ctrl-min").val()) + "–" + esc($c.find(".ctrl-max").val());
        } else if (type === "lcd") {
            sub = '"' + esc($c.find(".ctrl-text").val()) + '"';
        } else if (type === "multi") {
            sub = esc($c.find(".ctrl-values").val());
        }

        var isKnob = type && String(type).indexOf("knob") !== -1;
        var missingValues =
            (type === "multi" && !($c.find(".ctrl-values").val() || "").trim()) ||
            (isKnob && $c.find(".ctrl-knob-type").val() === "discrete" &&
                !($c.find(".ctrl-values-list").val() || "").trim());

        // Problems go in a full-width band under the header: always readable, even when collapsed
        var issues = [];
        if (!label) issues.push("Label is required.");
        if (missingValues) issues.push("Values are required.");
        if (label && duplicateLabels[label] > 1) issues.push("Another control already uses the label “" + label + "”. Labels must be unique.");

        $c.find("> .ctrl-head .ctrl-title").text(label || "(no label yet)").toggleClass("is-empty", !label);
        $c.find("> .ctrl-head .ctrl-sub").text(sub);
        $c.find("> .ctrl-issue").text(issues.join(" "));
        $c.toggleClass("has-error", issues.length > 0);
    }

    function refreshSections() {
        var id = ($("#pedal-id").val() || "").trim();
        $("#sec-identity .sec-hint").text(id || "ID required");

        var cats = typeof getSelectedCategories === "function" ? getSelectedCategories().length : 0;
        $("#sec-shape .sec-hint").text(
            $("#pedal-type").val() + " · " + $("#pedal-width").val() + " × " + $("#pedal-height").val() +
            (cats ? " · " + cats + " cat." : ""));

        var rows = $("#controls .row").length, ctrls = $("#controls .control").length;
        $("#sec-controls .sec-hint").text(rows + " row" + (rows === 1 ? "" : "s") + " · " + ctrls + " control" + (ctrls === 1 ? "" : "s"));

        var status = ($("#pedal-published-button").text() || "").trim();
        $("#sec-publish .sec-hint").text(status);
        $("#pedal-published-options li").each(function () {
            $(this).toggleClass("active", $(this).text().trim().toLowerCase() === status.toLowerCase());
        });
    }

    // ---------- preview fit ----------
    // Desktop: fit to width. Phones: fit to width AND to the (short) sticky preview height,
    // so the whole gear is visible while editing. "100%" disables scaling.
    function fitPreview() {
        var box = document.getElementById("pedal-box");
        var preview = document.getElementById("preview");
        if (!box || !preview) return;

        // keep scrollIntoView / focus from landing underneath the sticky preview on phones
        var stickyH = MOBILE.matches ? preview.getBoundingClientRect().height + 8 : 0;
        document.documentElement.style.scrollPaddingTop = stickyH ? Math.round(stickyH) + "px" : "";

        box.style.zoom = "";
        var ped = box.querySelector(".pedal-catalog");
        if (!ped || previewMode !== "fit") return;

        var cs = getComputedStyle(preview);
        var availW = preview.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var scale = availW / (ped.offsetWidth + 10);

        if (MOBILE.matches) {
            var maxH = parseFloat(cs.maxHeight); // px (resolved from 30vh)
            var bar = preview.querySelector(".preview-bar");
            var err = document.getElementById("json-error");
            var used = (bar ? bar.offsetHeight + 4 : 0) + (err && err.offsetHeight ? err.offsetHeight + 8 : 0);
            if (maxH > 0) scale = Math.min(scale, (maxH - used) / (ped.offsetHeight + 10));
        }
        if (scale > 0 && scale < 1) box.style.zoom = scale.toFixed(3);
        // keep the sticky offset in sync with the final height
        if (MOBILE.matches) document.documentElement.style.scrollPaddingTop =
            Math.round(preview.getBoundingClientRect().height + 8) + "px";
    }

    var duplicateLabels = {};
    function refreshAll() {
        duplicateLabels = {};
        $("#controls .ctrl-label").each(function () {
            var l = ($(this).val() || "").trim();
            if (l) duplicateLabels[l] = (duplicateLabels[l] || 0) + 1;
        });
        $("#controls .control").each(function () { refreshCard($(this)); });
        refreshSections();
        refreshIssuesButton();
        fitPreview();
    }

    // "Show issues": jumps to the first card with a problem and opens it
    function refreshIssuesButton() {
        var n = $("#controls .control.has-error").length;
        $("#show-issues").prop("hidden", n === 0).text(n === 1 ? "Show issue" : "Show " + n + " issues");
    }

    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; refreshAll(); });
    }

    // ---------- new cards ----------
    function onControlsMutation(records) {
        var fresh = [];
        records.forEach(function (r) {
            r.addedNodes.forEach(function (n) {
                if (n.nodeType !== 1) return;
                var $n = $(n);
                $n.filter(".control").add($n.find(".control")).each(function () {
                    if (!this.__v2) { this.__v2 = true; fresh.push(this); }
                });
            });
        });
        if (fresh.length) {
            fresh.forEach(function (el) {
                // cards loaded from JSON start collapsed; cards the user adds start open
                setCollapsed($(el), !userAdd);
            });
            if (userAdd) {
                var el = fresh[fresh.length - 1];
                var input = el.querySelector(".ctrl-label");
                if (el.scrollIntoView) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                if (input && !MOBILE.matches) input.focus(); // on phones don't pop the keyboard unasked
            }
            userAdd = false;
        }
        schedule();
    }

    // ---------- init ----------
    $(function () {
        // flag set in CAPTURE phase: the add handler (delegated on #controls) would otherwise run first
        document.addEventListener("click", function (e) {
            if (e.target.closest && e.target.closest(".add-control")) {
                userAdd = true;
                setTimeout(function () { userAdd = false; }, 0);
            }
        }, true);

        new MutationObserver(onControlsMutation).observe(document.getElementById("controls"), { childList: true, subtree: true });
        new MutationObserver(schedule).observe(document.getElementById("pedal-box"), { childList: true });
        new MutationObserver(schedule).observe(document.getElementById("pedal-published-button"), { childList: true, characterData: true, subtree: true });
        if (window.ResizeObserver) new ResizeObserver(fitPreview).observe(document.getElementById("preview"));

        // card collapse / expand
        $("#controls").on("click", ".ctrl-head", function (e) {
            if ($(e.target).closest("button, input, select, a").length) return;
            var $c = $(this).closest(".control");
            setCollapsed($c, !$c.hasClass("collapsed"));
        });
        $("#controls").on("keydown", ".ctrl-head", function (e) {
            if (e.target !== this || (e.key !== "Enter" && e.key !== " ")) return;
            e.preventDefault();
            var $c = $(this).closest(".control");
            setCollapsed($c, !$c.hasClass("collapsed"));
        });
        $("#expand-all").on("click", function () { setCollapsed($("#controls .control"), false); });
        $("#collapse-all").on("click", function () { setCollapsed($("#controls .control"), true); });

        $("#show-issues").on("click", function () {
            var $c = $("#controls .control.has-error").first();
            if (!$c.length) return;
            setCollapsed($c, false);
            $("#sec-controls").prop("open", true);
            $c[0].scrollIntoView({ block: "center", behavior: "smooth" });
        });

        // live summaries
        $("#editor").on("input change", "input, select", schedule);

        // preview fit toggle
        $("#preview-zoom").text("Fit").on("click", function () {
            previewMode = previewMode === "fit" ? "actual" : "fit";
            $(this).text(previewMode === "fit" ? "Fit" : "100%");
            fitPreview();
        });

        // phones: start with the secondary sections closed (their hint still shows the value)
        if (MOBILE.matches) $("#sec-appearance, #sec-knobs, #sec-publish").prop("open", false);

        // ---- standalone test bar (not shown when embedded in the Swal iframe) ----
        if (window.parent === window) {
            var $bar = $('<div class="v2-testbar">' +
                '<span>Standalone test</span>' +
                '<button type="button" class="bx--btn bx--btn--sm bx--btn--tertiary" id="v2-load">Load JSON</button>' +
                '<button type="button" class="bx--btn bx--btn--sm bx--btn--tertiary" id="v2-copy">Copy JSON</button>' +
                '</div>');
            $("#editor").prepend($bar);

            $("#v2-load").on("click", function () {
                Swal.fire({
                    title: "Load gear JSON",
                    html: '<textarea id="v2-json-in" style="width:100%;min-height:40vh;font:12px monospace"></textarea>',
                    showCancelButton: true, confirmButtonText: "Load", width: "100%",
                    background: "#2e2e2e", color: "#fff",
                    preConfirm: function () {
                        try { return JSON.parse(document.getElementById("v2-json-in").value); }
                        catch (e) { Swal.showValidationMessage("Invalid JSON: " + e.message); return false; }
                    }
                }).then(function (r) { if (r.isConfirmed) syncUIFromJSON(r.value); });
            });
            $("#v2-copy").on("click", function () {
                var v = window.getPedalValidation();
                var txt = JSON.stringify(v.pedal, null, 2);
                if (navigator.clipboard) navigator.clipboard.writeText(txt);
                Swal.fire({ title: "Copied", text: "Gear JSON copied to clipboard", timer: 900, showConfirmButton: false, background: "#2e2e2e", color: "#fff" });
            });
        }

        refreshAll();
    });
})();

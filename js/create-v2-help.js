/* Gear Builder v2 — live checker for Name / Logo style + "what can I use" + fonts list.
 *
 * IMPORTANT: this is ADVICE for the user only. It never changes what is saved and never
 * replaces the real filters, which stay authoritative:
 *   - backend/CREATE_GEAR.php  → sanitizeHTML(), $dangerousPatterns
 *   - js/helpers.js            → sanitizePedalHTML(), safeLogoStyle()
 *   - js/create.js             → "position:relative" check on Name / Logo
 * The lists below MIRROR those files. If you change a rule there, change it here too
 * (a drift test compares them: see .bob/tmp/t/drift.js).
 */
(function () {
    "use strict";

    var RULES = {
        // sanitizeHTML() in CREATE_GEAR.php
        tags: ["span", "div", "br", "hr"],
        blockedTags: ["script", "iframe", "object", "embed", "svg", "math", "video", "audio", "source"],
        attrs: ["class", "style"],
        css: ["color", "font-size", "font-weight", "font-style", "font-family", "vertical-align",
            "background-color", "padding", "position", "margin", "margin-left", "margin-right", "margin-bottom",
            "bottom", "top", "left", "right", "letter-spacing", "word-spacing", "display", "border", "margin-top",
            "line-height", "transform", "height", "width", "border-radius", "box-shadow", "background-size",
            "background-image", "text-align", "background", "rotate", "overflow", "white-space", "text-shadow",
            "text-decoration", "text-decoration-style", "text-decoration-line", "text-decoration-color",
            "outline", "outline-offset"],
        // $dangerousPatterns in CREATE_GEAR.php: ANY of these anywhere in ANY text rejects the whole save
        dangerous: [
            { re: /\$/, label: "the “$” character" },
            { re: /javascript/i, label: "the word “javascript”" },
            { re: /on\w+=/i, label: "anything that looks like an event handler (on…=)" },
            { re: /<script>/i, label: "a <script> tag" },
            { re: /<iframe>/i, label: "an <iframe> tag" },
            { re: /expression\s*\(/i, label: "“expression(”" },
            { re: /url\s*\(\s*javascript:/i, label: "“url(javascript:”" }
        ],
        generic: ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "inherit", "initial", "unset"]
    };
    window.GEAR_RULES = RULES;

    // ---------- tiny DOM helpers (user text is never injected as HTML) ----------
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function chips(list, cls) {
        var w = el("div");
        list.forEach(function (t) { w.appendChild(el("span", "chip " + (cls || ""), t)); });
        return w;
    }
    function item(kind, parts) {
        var d = el("div", "lint-item " + kind);
        parts.forEach(function (p) {
            if (typeof p === "string") d.appendChild(document.createTextNode(p));
            else d.appendChild(el("code", null, p.code));
        });
        return d;
    }

    // ---------- fonts (parsed from css/style.css so the list never goes stale) ----------
    var fontsPromise = null, FONTS = [];
    function loadFonts() {
        if (fontsPromise) return fontsPromise;
        var link = document.querySelector('link[href$="style.css"]');
        var url = link ? link.href : "css/style.css";
        fontsPromise = fetch(url).then(function (r) { return r.text(); }).then(function (css) {
            var re = /@font-face\s*\{\s*font-family:\s*([^;]+?)\s*;\s*src:\s*url\(\s*["']([^"']+)["']\s*\)/g, m, byFile = {}, order = [];
            while ((m = re.exec(css))) {
                var src = m[2].replace(/\\ /g, " ");
                if (!byFile[src]) { byFile[src] = { src: src, names: [] }; order.push(src); }
                byFile[src].names.push(m[1].replace(/["']/g, ""));
            }
            FONTS = order.map(function (s) {
                var f = byFile[s];
                f.label = decodeURIComponent(s.split("/").pop()).replace(/\.[a-z0-9]+$/i, "");
                return f;
            });
            return FONTS;
        }).catch(function () { FONTS = []; return FONTS; });
        return fontsPromise;
    }
    function knownFont(name) {
        name = name.toLowerCase();
        return FONTS.some(function (f) { return f.names.some(function (n) { return n.toLowerCase() === name; }); });
    }

    // ---------- checks ----------
    function decodeEntities(s) {
        var t = document.createElement("textarea");
        t.innerHTML = s;
        return t.value;
    }

    function checkDangerous(v, out) {
        var hits = RULES.dangerous.filter(function (d) { return d.re.test(v); });
        if (hits.length) {
            out.push(item("err", ["This will be REJECTED when saving: it contains " +
                hits.map(function (h) { return h.label; }).join(", ") + ". Remove it."]));
        }
        return hits.length > 0;
    }

    function checkFontFamilies(v, out, seen) {
        var re = /font-family\s*:\s*([^;"']+)/gi, m;
        while ((m = re.exec(v))) {
            var first = m[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
            if (!first) continue;
            var low = first.toLowerCase();
            if (RULES.generic.indexOf(low) !== -1 || low === "ibm plex sans" || seen[low]) continue;
            seen[low] = 1;
            if (FONTS.length && !knownFont(first)) {
                out.push(item("warn", ["Font ", { code: first }, " is not one of the site fonts, so other people's devices will show a fallback. See “Fonts you can use”."]));
            }
        }
    }

    function checkStyleDecls(styleVal, out, seen, where) {
        styleVal.split(";").forEach(function (part) {
            if (!part.trim()) return;
            var i = part.indexOf(":");
            if (i < 0) { warnOnce(out, seen, "nocolon:" + part.trim(), ["“" + part.trim() + "” is not a valid declaration (use property: value). It will be ignored."]); return; }
            var prop = part.slice(0, i).trim().toLowerCase(), val = part.slice(i + 1).trim();
            if (RULES.css.indexOf(prop) === -1) { warnOnce(out, seen, "prop:" + prop, ["CSS property ", { code: prop }, " is not allowed in " + where + " and will be dropped."]); return; }
            if (/expression\s*\(|javascript\s*:/i.test(val)) warnOnce(out, seen, "val:" + prop, ["The value of ", { code: prop }, " contains something forbidden and will be dropped."]);
            else if (/url\s*\(\s*data\s*:/i.test(val)) warnOnce(out, seen, "data:" + prop, [{ code: "url(data:…)" }, " is not allowed (use a normal image address)."]);
            else if (/[<>{}]/.test(val)) warnOnce(out, seen, "chars:" + prop, ["The value of ", { code: prop }, " contains < > { or }, so it will be dropped."]);
            if (prop === "position" && /^relative$/i.test(val)) {
                warnOnce(out, seen, "posrel", [{ code: "position: relative" }, " is not allowed here (the builder blocks saving)."], "err");
            }
        });
    }
    function warnOnce(out, seen, key, parts, kind) {
        if (seen[key]) return;
        seen[key] = 1;
        out.push(item(kind || "warn", parts));
    }

    // Name = limited HTML. Mirrors sanitizeHTML() step by step (regexes copied).
    function lintName(raw) {
        var out = [];
        if (!raw.trim()) return out;
        checkDangerous(raw, out);
        var s = decodeEntities(raw), seen = {};
        var blocked = new RegExp("<(" + RULES.blockedTags.join("|") + ")(?:[\\s>/])", "ig"), b;
        while ((b = blocked.exec(s))) warnOnce(out, seen, "blk:" + b[1].toLowerCase(), [{ code: "<" + b[1].toLowerCase() + ">" }, " is blocked: the tag and everything inside it will be removed."]);

        var tagRe = /<([a-z0-9]+)(\s[^>]*)?>/gi, m;
        while ((m = tagRe.exec(s))) {
            var tag = m[1].toLowerCase();
            if (RULES.blockedTags.indexOf(tag) !== -1) continue;
            if (RULES.tags.indexOf(tag) === -1) { warnOnce(out, seen, "tag:" + tag, [{ code: "<" + tag + ">" }, " is not allowed: the tag is removed (its text stays). Allowed tags: " + RULES.tags.join(", ") + "."]); continue; }
            var attrRe = /([a-z\-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi, a;
            var attrString = m[2] || "";
            while ((a = attrRe.exec(attrString))) {
                var an = a[1].toLowerCase();
                var av = a[2] != null && a[2] !== "" ? a[2] : (a[3] != null && a[3] !== "" ? a[3] : (a[4] || ""));
                if (RULES.attrs.indexOf(an) === -1) { warnOnce(out, seen, "attr:" + an, ["Attribute ", { code: an }, " is removed. Only class and style are kept."]); continue; }
                if (an === "class" && /[^A-Za-z0-9 _\-]/.test(av)) warnOnce(out, seen, "class", ["In ", { code: "class" }, " only letters, digits, space, _ and - are kept."]);
                if (an === "style") { checkStyleDecls(av, out, seen, "Name"); checkFontFamilies(av, out, seen); }
            }
        }
        if (!out.length) out.push(item("ok", ["All good: nothing in the name will be removed."]));
        return out;
    }

    // Logo style = plain CSS declarations. Mirrors safeLogoStyle() + the position:relative check.
    function lintLogo(raw) {
        var out = [];
        if (!raw.trim()) return out;
        var dangerous = checkDangerous(raw, out), seen = {};
        if (/<|>/.test(raw)) warnOnce(out, seen, "html", ["This field is plain CSS (", { code: "color: red; font-size: 20px;" }, "), not HTML."]);
        if (/expression\s*\(|javascript:/i.test(raw)) warnOnce(out, seen, "whole", ["The whole logo style is discarded when it contains expression( or javascript:."], "err");
        checkStyleDecls(raw, out, seen, "Logo style");
        checkFontFamilies(raw, out, seen);
        if (!out.length && !dangerous) out.push(item("ok", ["All good: every declaration is allowed."]));
        return out;
    }

    function paint(sel, nodes) {
        var box = document.querySelector(sel);
        if (!box) return;
        box.textContent = "";
        nodes.forEach(function (n) { box.appendChild(n); });
    }
    var rafLint = 0;
    function runLint() {
        paint("#lint-name", lintName(document.getElementById("pedal-name").value || ""));
        paint("#lint-logo", lintLogo(document.getElementById("pedal-logo").value || ""));
        markUsedFonts();
    }
    function scheduleLint() {
        if (rafLint) return;
        rafLint = requestAnimationFrame(function () { rafLint = 0; runLint(); });
    }

    // ---------- "what can I use" panel ----------
    function buildRules() {
        var b = document.getElementById("help-rules-body");
        if (!b) return;
        b.textContent = "";
        function h(t) { b.appendChild(el("h5", null, t)); }
        function p(t) { b.appendChild(el("p", "help-p", t)); }

        h("Name — limited HTML");
        p("The name is shown as the gear's logo. You can style it with these tags only:");
        b.appendChild(chips(RULES.tags, "yes"));
        p("Anything else (b, i, p, a, img, style…) is removed but its text stays. These are blocked together with their content:");
        b.appendChild(chips(RULES.blockedTags, "no"));
        p("Only the attributes class and style are kept; every other attribute is removed.");

        h("Logo style — plain CSS");
        p("Write declarations like property: value; separated by semicolons. Allowed properties (also usable inside style=\"…\" in the Name):");
        b.appendChild(chips(RULES.css, "yes"));

        h("Never allowed");
        var ul = el("ul", "rule-list");
        [
            "position: relative (use the other values, or margins/top/left)",
            "url(data:…), expression(…), javascript: and the characters < > { } inside a CSS value",
            "These in ANY field reject the whole save: the “$” character, the word “javascript”, anything like onclick=, <script> and <iframe>"
        ].forEach(function (t) { ul.appendChild(el("li", null, t)); });
        b.appendChild(ul);

        h("Examples");
        [
            ['<span style="font-size:22px;color:#ff0">FUZZ</span><br><span style="font-size:10px">deluxe</span>', "Name"],
            ["font-family: boss; font-size: 18px; letter-spacing: 2px; color: #ffcc00;", "Logo style"]
        ].forEach(function (e) {
            var row = el("div", "example");
            row.appendChild(el("code", null, e[0]));
            row.appendChild(el("span", null, e[1]));
            b.appendChild(row);
        });
        p("The checker under each field tells you what would be removed, as you type. The server applies the final filter when you save.");
    }

    // ---------- fonts panel ----------
    var fontsBuilt = false, io = null;
    function buildFonts() {
        if (fontsBuilt) return;
        fontsBuilt = true;
        loadFonts().then(function () {
            var grid = document.getElementById("font-grid");
            document.querySelector("#help-fonts .help-count").textContent = FONTS.length + " fonts";
            if (!FONTS.length) { grid.appendChild(el("p", "help-p", "Could not read the font list.")); return; }
            io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    var s = e.target;
                    s.style.fontFamily = s.getAttribute("data-font"); // downloads the file only now
                    io.unobserve(s);
                });
            }, { root: grid, rootMargin: "200px" }) : null;

            FONTS.forEach(function (f) {
                var tile = el("div", "font-tile");
                tile.setAttribute("data-search", (f.label + " " + f.names.join(" ")).toLowerCase());
                var sample = el("div", "font-sample", "Fuzz Face 123");
                sample.setAttribute("data-font", f.names[0]);
                if (io) io.observe(sample); else sample.style.fontFamily = f.names[0];
                tile.appendChild(sample);
                tile.appendChild(el("div", "cap", f.label));
                var names = el("div", "font-names");
                f.names.forEach(function (n) {
                    var c = el("button", "chip yes", n);
                    c.type = "button";
                    c.title = "Use font-family: " + n;
                    c.setAttribute("data-use", n);
                    names.appendChild(c);
                });
                tile.appendChild(names);
                grid.appendChild(tile);
            });
            markUsedFonts();
            runLint();
        });
    }
    function markUsedFonts() {
        var logo = (document.getElementById("pedal-logo").value || "") + " " + (document.getElementById("pedal-name").value || "");
        var used = {}, re = /font-family\s*:\s*([^;"']+)/gi, m;
        while ((m = re.exec(logo))) used[m[1].split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase()] = 1;
        $("#font-grid .font-tile").each(function () {
            var on = false;
            $(this).find("[data-use]").each(function () { if (used[this.getAttribute("data-use").toLowerCase()]) on = true; });
            $(this).toggleClass("is-used", on);
        });
    }
    function useFont(name) {
        var $l = $("#pedal-logo"), v = $l.val() || "", decl = "font-family: " + name;
        if (/font-family\s*:[^;]*/i.test(v)) v = v.replace(/font-family\s*:[^;]*/i, decl);
        else { var t = v.trim(); if (t && !/;$/.test(t)) t += ";"; v = (t ? t + " " : "") + decl + ";"; }
        $l.val(v).trigger("input").trigger("change");
    }

    $(function () {
        buildRules();
        loadFonts().then(runLint);
        $("#pedal-name, #pedal-logo").on("input change", scheduleLint);
        // syncUIFromJSON fills the fields programmatically (no input event) → re-lint on every preview rebuild
        new MutationObserver(scheduleLint).observe(document.getElementById("pedal-box"), { childList: true });

        document.getElementById("help-fonts").addEventListener("toggle", function () { if (this.open) buildFonts(); });
        $("#font-grid").on("click", "[data-use]", function () { useFont(this.getAttribute("data-use")); });
        $("#font-filter").on("input", function () {
            var q = this.value.trim().toLowerCase();
            $("#font-grid .font-tile").each(function () {
                this.style.display = !q || this.getAttribute("data-search").indexOf(q) !== -1 ? "" : "none";
            });
        });
        runLint();
    });

    // exposed for tests
    window.__gearLint = { name: lintName, logo: lintLogo };
})();

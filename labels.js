// ---- Global label configuration ----
// Set USE_PRESET_LABELS = true  → show "Preset" / "Gear Preset" to users
// Set USE_PRESET_LABELS = false → show "Plex" / "SubPlex" to users (original branding)
//
// L and USE_PRESET_LABELS are on window so every other <script> tag can read them.

window.USE_PRESET_LABELS = true;

window.L = window.USE_PRESET_LABELS
  ? {
      Plex:      "Preset",
      plex:      "preset",
      SubPlex:   "Gear Preset",
      subplex:   "gear preset",
      Plexes:    "Presets",
      plexes:    "presets",
      SubPlexes: "Gear Presets",
      subplexes: "gear presets",
    }
  : {
      Plex:      "Plex",
      plex:      "plex",
      SubPlex:   "SubPlex",
      subplex:   "subplex",
      Plexes:    "Plexes",
      plexes:    "plexes",
      SubPlexes: "SubPlexes",
      subplexes: "subplexes",
    };

// Shorthand alias — var (not const/let) so it is truly global in classic scripts
var L = window.L; 

// ---- DOM label replacement ----
// Replaces visible text nodes and key attributes (title, aria-label, placeholder)
// on every element in <body>, skipping <script>, <style>, <svg> and SEO tags.
// Safe rule: "PedalPlex" (brand name) is never modified.
// Call window.applyLabels() again after injecting dynamic HTML if needed.

window.applyLabels = (function () {
  if (!window.USE_PRESET_LABELS) {
    return function () {}; // no-op
  }

  var SKIP_TAGS = {
    HEAD: 1, SCRIPT: 1, STYLE: 1, META: 1, LINK: 1,
    NOSCRIPT: 1, TITLE: 1, TEMPLATE: 1,
    SVG: 1, PATH: 1, CIRCLE: 1, POLYGON: 1, RECT: 1, LINE: 1, G: 1
  };

  var ATTR_NAMES = ['aria-label', 'title', 'placeholder', 'alt'];

  // Each pair: [regex, replacement]
  // Order: longest/most-specific tokens first.
  // "PedalPlex" is preserved by the negative lookbehind on Plex patterns.
  var TEXT_RULES = [
    // SubPlexes before SubPlex, Plexes before Plex
    [/\bSubPlexes\b/g,                         L.SubPlexes],
    [/\bSubPlex\b/g,                            L.SubPlex],
    [/\bPlexes\b/g,                             L.Plexes],
    // \bPlex\b would match inside "PedalPlex" because \b fires between 'l' and 'P'.
    // Use a negative lookbehind: don't match "Plex" if preceded by "Pedal".
    [/(?<!Pedal)(?<!\w)Plex(?!\w)/g,            L.Plex],
  ];

  function replaceInString(str) {
    for (var i = 0; i < TEXT_RULES.length; i++) {
      str = str.replace(TEXT_RULES[i][0], TEXT_RULES[i][1]);
    }
    return str;
  }

  function walkNode(node) {
    if (node.nodeType === 3) { // TEXT_NODE
      var orig = node.nodeValue;
      var repl = replaceInString(orig);
      if (repl !== orig) node.nodeValue = repl;
      return;
    }
    if (node.nodeType !== 1) return;
    if (SKIP_TAGS[node.tagName]) return;

    for (var a = 0; a < ATTR_NAMES.length; a++) {
      var val = node.getAttribute(ATTR_NAMES[a]);
      if (val) {
        var rv = replaceInString(val);
        if (rv !== val) node.setAttribute(ATTR_NAMES[a], rv);
      }
    }

    var ch = node.childNodes;
    for (var c = 0; c < ch.length; c++) walkNode(ch[c]);
  }

  function run() {
    walkNode(document.body || document.documentElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  return run;
}());

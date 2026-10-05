// ---- Global label configuration ----
// Set USE_PRESET_LABELS = true  → show "Preset" / "Gear Preset" to users
// Set USE_PRESET_LABELS = false → show "Plex" / "SubPlex" to users (original branding)

const USE_PRESET_LABELS = true;

const L = USE_PRESET_LABELS
  ? {
      // singular
      Plex:    "Preset",
      plex:    "preset",
      SubPlex: "Gear Preset",
      subplex: "gear preset",
      // plural
      Plexes:    "Presets",
      plexes:    "presets",
      SubPlexes: "Gear Presets",
      subplexes: "gear presets",
    }
  : {
      // singular
      Plex:    "Plex",
      plex:    "plex",
      SubPlex: "SubPlex",
      subplex: "subplex",
      // plural
      Plexes:    "Plexes",
      plexes:    "plexes",
      SubPlexes: "SubPlexes",
      subplexes: "subplexes",
    };

// ---- DOM label replacement ----
// Walks all visible text nodes and applies L substitutions.
// Skips <head>, <script>, <style>, <meta>, <link>, <noscript>, <title>.
// Also patches aria-label, title, placeholder, and alt attributes on elements
// that contain the Plex/SubPlex tokens.
(function applyLabels() {
  if (!USE_PRESET_LABELS) return; // no-op when using original labels

  // Tags whose content must NOT be touched (SEO, code, invisible)
  const SKIP_TAGS = new Set([
    'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'TITLE',
    'TEMPLATE', 'SVG', 'PATH', 'CIRCLE', 'POLYGON', 'RECT'
  ]);

  // Ordered pairs: longer/more specific first to avoid double-replace
  const TEXT_REPLACEMENTS = [
    [/SubPlexes/g,  L.SubPlexes],
    [/subplexes/g,  L.subplexes],
    [/SubPlex/g,    L.SubPlex],
    [/subplex/g,    L.subplex],
    [/Plexes/g,     L.Plexes],
    [/plexes/g,     L.plexes],
    [/\bPlex\b/g,   L.Plex],
    [/\bplex\b/g,   L.plex],
  ];

  // Attributes to patch on elements
  const ATTR_NAMES = ['aria-label', 'title', 'placeholder', 'alt'];

  function replaceInString(str) {
    for (const [re, val] of TEXT_REPLACEMENTS) {
      str = str.replace(re, val);
    }
    return str;
  }

  function walkNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const original = node.nodeValue;
      const replaced = replaceInString(original);
      if (replaced !== original) node.nodeValue = replaced;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;

    // Patch visible attributes
    for (const attr of ATTR_NAMES) {
      const val = node.getAttribute(attr);
      if (val) {
        const replaced = replaceInString(val);
        if (replaced !== val) node.setAttribute(attr, replaced);
      }
    }

    for (const child of node.childNodes) {
      walkNode(child);
    }
  }

  function run() {
    walkNode(document.body || document.documentElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

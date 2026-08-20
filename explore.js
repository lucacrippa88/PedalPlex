// ===============================
// EXPLORE YOUR RIG — explore.js
// ===============================

// ---- Vibe → keyword mapping (matched against subplex name + description + style tags) ----
const VIBE_KEYWORDS = {
  "Huge":         ["wall", "huge", "massive", "thick", "big", "giant", "full"],
  "Aggressive":   ["aggressive", "harsh", "angry", "attack", "punchy", "hard", "brutal"],
  "Dreamy":       ["dreamy", "dream", "haze", "hazy", "float", "lush", "shimmer"],
  "Dark":         ["dark", "black", "murky", "deep", "heavy", "shadow", "doom"],
  "Warm":         ["warm", "smooth", "soft", "round", "mellow", "silky"],
  "Bright":       ["bright", "sparkle", "clear", "crisp", "airy", "chime"],
  "Tight":        ["tight", "punchy", "clean", "precise", "focused", "controlled"],
  "Dirty":        ["dirty", "grit", "grunge", "raw", "filthy", "nasty", "broken"],
  "Atmospheric":  ["atmospheric", "ambient", "atmosphere", "space", "pad", "endless", "infinite", "swirl"],
  "Weird":        ["weird", "strange", "alien", "experimental", "odd", "unusual", "glitch"]
};

// Style -> related style tags (broader set for looser matching at high experimentation)
const STYLE_RELATIVES = {
  rock:        ["rock", "stoner", "blues", "punk", "grunge", "altern"],
  "hard rock": ["rock", "stoner", "metal", "punk", "grunge"],
  metal:       ["metal", "stoner", "rock", "prog"],
  blues:       ["blues", "rock", "funk", "jazz", "folk"],
  funk:        ["funk", "jazz", "pop", "beat"],
  pop:         ["pop", "indie", "folk", "beat", "chill"],
  shoegaze:    ["ambient", "psych", "altern", "indie", "wave", "chill"],
  ambient:     ["ambient", "psych", "chill", "wave"],
  "post-rock": ["ambient", "psych", "prog", "rock", "altern"],
  psychedelic: ["psych", "ambient", "prog", "altern", "wave"],
  experimental:["psych", "altern", "prog", "wave", "beat"]
};

// Categories to skip entirely
const SKIP_CATEGORIES = new Set([
  "tuner", "tuner/boost",
  "power supply", "footswitch",
  "midi controller", "controller",
  "wireless", "buffer", "buffer/boost", "buffer/splitter"
]);

// Cached subplex pool per pedal for the current explore session
let _exploreSubplexPool = null;

// ---- Entry point ----
async function openExploreModal() {
  const pedalsOnBoard = getPedalsOnBoard();

  if (!pedalsOnBoard.length) {
    Swal.fire({
      icon: "info", title: "No Rig loaded",
      text: "Please select a Rig first.",
      showConfirmButton: true,
      customClass: { confirmButton: "bx--btn bx--btn--primary" }
    });
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    Swal.fire({
      icon: "info", title: "Login required",
      text: "Login to use the Explore feature.",
      confirmButtonText: "Login",
      customClass: { confirmButton: "bx--btn bx--btn--primary" }
    }).then(r => { if (r.isConfirmed) window.location.href = "login"; });
    return;
  }

  _exploreSubplexPool = null; // reset cache on each fresh open
  _showExploreStep1();
}


// ---- Step 1: input modal ----
function _showExploreStep1(prefillState = null) {
  const styles = [
    "Rock", "Hard Rock", "Metal", "Blues", "Funk",
    "Pop", "Shoegaze", "Ambient", "Post-Rock",
    "Psychedelic", "Experimental", "Grunge", "Indie",
    "Punk", "Jazz", "Folk", "Prog"
  ];
  const vibes = Object.keys(VIBE_KEYWORDS);

  const prevStyles  = prefillState?.styles  || [];
  const prevVibes   = prefillState?.vibes   || [];
  const prevExp     = prefillState?.exp     ?? 50;
  const prevKeyword = prefillState?.keyword || "";

  const styleChips = styles.map(s => {
    const active = prevStyles.includes(s.toLowerCase()) ? " explore-chip--active" : "";
    return `<button type="button" class="explore-chip explore-chip--style${active}" data-value="${s.toLowerCase()}">${s}</button>`;
  }).join("");

  const vibeChips = vibes.map(v => {
    const active = prevVibes.includes(v) ? " explore-chip--active" : "";
    return `<button type="button" class="explore-chip explore-chip--vibe${active}" data-value="${v}">${v}</button>`;
  }).join("");

  Swal.fire({
    title: `<span style="font-size:1.1rem; font-weight:600; letter-spacing:0.02em;">&#x1F50E; Explore your Rig</span>`,
    html: `
      <div class="explore-modal">
        <p class="explore-section-label">What do you want to sound like?</p>

        <div class="explore-section">
          <div class="explore-section-header">Style <span class="explore-hint">pick one or more</span></div>
          <div class="explore-chips" id="styleChipsContainer">${styleChips}</div>
        </div>

        <div class="explore-section">
          <div class="explore-section-header">Vibe <span class="explore-hint">optional</span></div>
          <div class="explore-chips" id="vibeChipsContainer">${vibeChips}</div>
        </div>

        <div class="explore-section">
          <div class="explore-section-header">How adventurous?</div>
          <div class="explore-slider-row">
            <span class="explore-slider-label explore-slider-label--left">Keep it familiar</span>
            <input type="range" id="explorationSlider" min="0" max="100" value="${prevExp}" class="explore-slider">
            <span class="explore-slider-label explore-slider-label--right">Surprise me</span>
          </div>
        </div>

        <div class="explore-section">
          <div class="explore-section-header">Or describe what you&rsquo;re looking for <span class="explore-hint">coming soon &mdash; keyword search</span></div>
          <input type="text"
                 id="exploreKeyword"
                 class="swal2-input"
                 placeholder="e.g. huge Muse-style sound, but darker..."
                 value="${prevKeyword}"
                 disabled
                 style="width:85%; margin:0.4rem auto 0; opacity:0.45; cursor:not-allowed;">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Explore &#x2192;",
    cancelButtonText: "Cancel",
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton:  "bx--btn bx--btn--secondary",
      popup: "explore-popup"
    },
    focusConfirm: false,
    width: "600px",

    didOpen: () => {
      document.querySelectorAll(".explore-chip").forEach(chip => {
        chip.addEventListener("click", () => chip.classList.toggle("explore-chip--active"));
      });
    },

    preConfirm: () => {
      const selStyles = [...document.querySelectorAll(".explore-chip--style.explore-chip--active")].map(c => c.dataset.value);
      const selVibes  = [...document.querySelectorAll(".explore-chip--vibe.explore-chip--active")].map(c => c.dataset.value);
      const expVal    = parseInt(document.getElementById("explorationSlider").value, 10);
      const keyword   = document.getElementById("exploreKeyword").value.trim();

      if (!selStyles.length) {
        Swal.showValidationMessage("Pick at least one Style to continue.");
        return false;
      }
      return { styles: selStyles, vibes: selVibes, exp: expVal, keyword };
    }
  }).then(async result => {
    if (!result.isConfirmed || !result.value) return;
    await _runExplore(result.value);
  });
}


// ---- Scoring + picking engine ----
async function _runExplore(params) {
  Swal.fire({ title: "Finding your sound...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  const pedals   = getPedalsOnBoard();
  const eligible = pedals.filter(p => !SKIP_CATEGORIES.has((p.category || "").toLowerCase()));

  if (!eligible.length) {
    Swal.fire({
      icon: "info", title: "Nothing to explore",
      text: "Your rig only contains utilities or tuners.",
      showConfirmButton: true,
      customClass: { confirmButton: "bx--btn bx--btn--primary" }
    });
    return;
  }

  // Fetch subplex catalogs for all eligible pedals (parallel, cached)
  if (!_exploreSubplexPool) {
    _exploreSubplexPool = {};
    const token = localStorage.getItem("authToken");
    await Promise.all(eligible.map(async p => {
      if (window.presetCatalogCache && window.presetCatalogCache[p.id]) {
        _exploreSubplexPool[p.id] = window.presetCatalogCache[p.id];
        return;
      }
      try {
        const res = await fetch("https://api.pedalplex.com/GET_PLEX_BY_GEAR.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ pedalId: p.id })
        });
        const data = await res.json();
        const presets = Array.isArray(data.presets) ? data.presets : [];
        _exploreSubplexPool[p.id] = presets;
        if (window.presetCatalogCache) window.presetCatalogCache[p.id] = presets;
      } catch (e) {
        _exploreSubplexPool[p.id] = [];
      }
    }));
  }

  const combination = _pickCombination(eligible, params);
  Swal.close();

  if (!combination || !combination.length) {
    Swal.fire({
      icon: "info", title: "No matches found",
      text: "There are no SubPlexes available for your Rig yet. Try different settings or build your first SubPlex!",
      confirmButtonText: "Got it",
      customClass: { confirmButton: "bx--btn bx--btn--primary" }
    });
    return;
  }

  _showExploreStep2(combination, params);
}


// ---- Pick one combination (weighted random) ----
function _pickCombination(eligiblePedals, params, excludeSeed = null) {
  const { styles, vibes, exp } = params;
  const experimentFactor = exp / 100; // 0 = familiar, 1 = wildcard
  const combination = [];

  for (const pedal of eligiblePedals) {
    const pool = _exploreSubplexPool[pedal.id] || [];
    if (!pool.length) continue;

    // Score every subplex in this pedal's pool
    const scored = pool
      .map(sp => ({ sp, score: _scoreSubplex(sp, styles, vibes, experimentFactor) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) continue;

    const picked = _weightedRandom(scored, experimentFactor, excludeSeed ? excludeSeed[pedal.id] : null);
    if (picked) combination.push({ pedal, subplex: picked.sp, score: picked.score });
  }

  return combination;
}


// ---- Score a single subplex against user params ----
function _scoreSubplex(sp, selectedStyles, selectedVibes, experimentFactor) {
  let score = 0;

  const spStyles   = (sp.style || []).map(s => s.toLowerCase());
  const searchText = ((sp.presetName || sp.name || "") + " " + (sp.description || "")).toLowerCase();

  // 1. Direct style match — strongest signal
  for (const sel of selectedStyles) {
    if (spStyles.includes(sel)) score += 10;
  }

  // 2. Adjacent style match — weighted by experimentFactor
  for (const sel of selectedStyles) {
    for (const rel of (STYLE_RELATIVES[sel] || [])) {
      if (spStyles.includes(rel) && rel !== sel) score += 2 + experimentFactor * 3;
    }
  }

  // 3. Vibe keyword match against name + description
  for (const vibe of selectedVibes) {
    const keywords = VIBE_KEYWORDS[vibe] || [];
    if (keywords.some(kw => searchText.includes(kw))) score += 4;
    if (spStyles.some(st => keywords.some(kw => st.includes(kw)))) score += 2;
  }

  // 4. Scaled noise — allows lower-ranked items to surface when exp is high
  score += experimentFactor * (Math.random() * 6);

  // 5. At very high exp, give truly unrelated subplexes a tiny chance too
  if (experimentFactor > 0.6 && score === 0) score += experimentFactor * Math.random() * 3;

  return score;
}


// ---- Weighted-random pick from a sorted scored list ----
// Low exp -> steep decay (almost always rank #1)
// High exp -> flat weights (any rank can win)
function _weightedRandom(scoredList, experimentFactor, excludeId = null) {
  let pool = excludeId ? scoredList.filter(x => x.sp._id !== excludeId) : scoredList;
  if (!pool.length) pool = scoredList;

  const steepness = 3 - experimentFactor * 2.5; // 3 (familiar) .. 0.5 (wild)
  const weights   = pool.map((_, i) => Math.exp(-steepness * i));
  const total     = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}


// ---- Generate human-readable explanation from metadata (no AI required) ----
function _generateExplanation(combination, params) {
  if (!combination.length) return "";

  const styleLabel = params.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");
  const vibeWords  = (params.vibes || []).join(" and ").toLowerCase();

  const categoryGroups = {
    fuzz:       ["fuzz", "fuzz/distortion", "fuzz/modulation", "fuzz/octaver", "octaver/fuzz", "synth/fuzz"],
    drive:      ["overdrive", "distortion", "boost", "booster", "overdrive/distortion", "overdrive/boost", "distortion/booster"],
    modulation: ["chorus", "flanger", "phaser", "tremolo", "vibrato", "rotary", "modulation"],
    delay:      ["delay", "delay/looper", "reverb/delay"],
    reverb:     ["reverb", "reverb/delay", "tremolo/reverb"]
  };

  function catGroup(cat) {
    const c = (cat || "").toLowerCase();
    for (const [g, cats] of Object.entries(categoryGroups)) {
      if (cats.some(x => c.includes(x))) return g;
    }
    return null;
  }

  const parts = [];
  const used  = new Set();

  for (const { pedal, subplex } of combination) {
    const group = catGroup(pedal.category);
    if (!group || used.has(group)) continue;
    used.add(group);

    const name = subplex.presetName || subplex.name;
    const base = vibeWords || styleLabel.toLowerCase();

    if (group === "fuzz")            parts.push(`The <em>${name}</em> on <strong>${pedal.name}</strong> builds the ${base} foundation`);
    else if (group === "drive")      parts.push(`<strong>${pedal.name}</strong> (<em>${name}</em>) adds grit and character`);
    else if (group === "modulation") parts.push(`<strong>${pedal.name}</strong> (<em>${name}</em>) creates movement and width`);
    else if (group === "delay")      parts.push(`<strong>${pedal.name}</strong> (<em>${name}</em>) shapes the atmospheric tail`);
    else if (group === "reverb")     parts.push(`<strong>${pedal.name}</strong> (<em>${name}</em>) opens up the space`);
  }

  if (!parts.length) return `A ${styleLabel} combination assembled from what's on your board right now.`;
  return parts.join(", ") + ".";
}


// ---- Step 2: Result screen ----
function _showExploreStep2(combination, params) {
  const titleStyle = params.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" \u00b7 ");
  const vibeLabel  = params.vibes.length ? params.vibes.join(" \u00b7 ") : "";
  const expPct     = params.exp;
  const expLabel   = expPct < 30 ? "Familiar" : expPct < 70 ? "Balanced" : "Adventurous";

  const explanation = _generateExplanation(combination, params);

  const rigRows = combination.map(({ pedal, subplex }) => {
    const spName = subplex.presetName || subplex.name || "SubPlex";
    const spDesc = subplex.description
      ? `<span class="explore-result-desc">${subplex.description}</span>`
      : "";
    const tags = (subplex.style || []).map(s => {
      const color = STYLE_TAG_MAP[s] || "gray";
      return `<span class="bx--tag bx--tag--${color} bx--tag--sm">${s}</span>`;
    }).join("");
    return `
      <div class="explore-result-row">
        <div class="explore-result-pedal">${pedal.name}</div>
        <div class="explore-result-subplex">
          <span class="explore-result-sp-name">${spName}</span>
          ${spDesc}
          <div class="explore-result-tags">${tags}</div>
        </div>
      </div>`;
  }).join("");

  Swal.fire({
    title: `<span style="font-size:1rem; font-weight:600; letter-spacing:0.02em;">&#x1F30C; Your new experiment</span>`,
    html: `
      <div class="explore-modal explore-modal--result">

        <div class="explore-result-meta">
          <span class="explore-result-badge">${titleStyle}</span>
          ${vibeLabel ? `<span class="explore-result-badge explore-result-badge--vibe">${vibeLabel}</span>` : ""}
          <span class="explore-result-badge explore-result-badge--exp">${expLabel}</span>
        </div>

        <div class="explore-result-list">${rigRows}</div>

        <div class="explore-result-why">
          <div class="explore-result-why-label">Why this combination?</div>
          <div class="explore-result-why-text">${explanation}</div>
        </div>

        <div class="explore-result-actions">
          <button id="exploreApplyBtn" class="bx--btn bx--btn--primary bx--btn--sm">
            &#x1F3DB; Apply to my Rig
          </button>
          <button id="exploreTryBtn" class="bx--btn bx--btn--secondary bx--btn--sm">
            &#x1F500; Try another
          </button>
          <button id="exploreSaveBtn" class="bx--btn bx--btn--tertiary bx--btn--sm">
            &#x1F4BE; Save experiment
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: { popup: "explore-popup explore-popup--result" },
    width: "640px",

    didOpen: () => {
      document.getElementById("exploreApplyBtn")?.addEventListener("click", () => {
        Swal.close();
        _applyExploreResult(combination);
      });

      document.getElementById("exploreTryBtn")?.addEventListener("click", async () => {
        Swal.close();
        const excludeSeed = {};
        combination.forEach(({ pedal, subplex }) => { excludeSeed[pedal.id] = subplex._id; });

        const eligiblePedals = getPedalsOnBoard()
          .filter(p => !SKIP_CATEGORIES.has((p.category || "").toLowerCase()));
        const newCombo = _pickCombination(eligiblePedals, params, excludeSeed);

        if (newCombo && newCombo.length) {
          _showExploreStep2(newCombo, params);
        } else {
          Swal.fire({
            icon: "info", title: "No more combinations",
            text: "You've seen everything available for this Rig. Try adjusting your settings.",
            showConfirmButton: true,
            customClass: { confirmButton: "bx--btn bx--btn--primary" }
          });
        }
      });

      document.getElementById("exploreSaveBtn")?.addEventListener("click", () => {
        Swal.close();
        _saveExploreExperiment(combination);
      });
    }
  });
}


// ---- Apply: load each SubPlex onto its pedal without touching Plex data ----
function _applyExploreResult(combination) {
  let applied = 0;
  for (const { pedal, subplex } of combination) {
    if ($(`.pedal-catalog[data-pedal-id="${pedal.id}"]`).length) {
      applyCatalogPresetToSinglePedal(pedal.id, subplex);
      applied++;
    }
  }
  Swal.fire({
    icon: "success",
    title: "Experiment applied!",
    html: `${applied} SubPlex${applied !== 1 ? "es" : ""} loaded onto your Rig.<br>
           <small style="color:#888">Use <strong>Lock Tone</strong> to save it as a Plex.</small>`,
    timer: 2500,
    showConfirmButton: false
  });
}


// ---- Save as a new Plex ----
// Apply subplexes to the live DOM first, then delegate to the
// existing createPreset() which reads controls from the board.
async function _saveExploreExperiment(combination) {
  // Silent apply — no toast
  for (const { pedal, subplex } of combination) {
    if ($(`.pedal-catalog[data-pedal-id="${pedal.id}"]`).length) {
      applyCatalogPresetToSinglePedal(pedal.id, subplex);
    }
  }

  // Let the DOM settle, then open the standard create-plex flow
  await new Promise(r => setTimeout(r, 150));

  if (typeof createPreset === "function") {
    await createPreset();
  }
}


// ---- Helper: pedals currently on the board ----
// Returns [{id, name, category}], sourced from window.pedalboard + window.catalogMap.
function getPedalsOnBoard() {
  const result = [];
  const pedals = window.pedalboard?.pedals || [];

  for (const p of pedals) {
    const id  = p.pedal_id || p._id || p.id;
    const cat = window.catalogMap?.[id]?.category
             || window.catalog?.find(c => c._id === id)?.category
             || "";
    const name = window.catalogMap?.[id]?.name || id;
    result.push({ id, name, category: cat });
  }

  return result;
}

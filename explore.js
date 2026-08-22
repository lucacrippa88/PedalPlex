// ===============================
// EXPLORE YOUR RIG — explore.js
// ===============================

// ---- Vibe -> keyword mapping (matched against subplex name + description + style tags) ----
const VIBE_KEYWORDS = {
  "Huge":         ["wall", "huge", "massive", "thick", "big", "giant", "full"],
  "Aggressive":   ["aggressive", "harsh", "angry", "attack", "punchy", "hard", "brutal"],
  "Dreamy":       ["dreamy", "dream", "haze", "hazy", "float", "lush", "shimmer"],
  "Dark":         ["dark", "black", "murky", "deep", "heavy", "shadow", "doom"],
  "Warm":         ["warm", "smooth", "soft", "round", "mellow", "silky"],
  "Bright":       ["bright", "sparkle", "clear", "crisp", "airy", "chime"],
  "Tight":        ["tight", "punchy", "precise", "focused", "controlled", "compressed"],
  "Dirty":        ["dirty", "grit", "grunge", "raw", "filthy", "nasty", "broken"],
  "Atmospheric":  ["atmospheric", "ambient", "atmosphere", "space", "pad", "endless", "infinite", "swirl"],
  "Weird":        ["weird", "strange", "alien", "experimental", "odd", "unusual", "glitch"]
};

// Style -> related style tags (broader set for looser matching at high experimentation)
const STYLE_RELATIVES = {
  rock:        ["rock", "stoner", "blues", "punk", "grunge", "altern"],
  "hard rock": ["rock", "stoner", "metal", "punk", "grunge"],
  metal:       ["metal", "stoner", "prog"],
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

// Category groups — used both for explanation text and for deduplication
// (at most one pedal per group per experiment)
const EXPLORE_CATEGORY_GROUPS = {
  fuzz:       ["fuzz", "fuzz/distortion", "fuzz/modulation", "fuzz/octaver", "octaver/fuzz", "synth/fuzz",
               "bass/overdrive/fuzz"],
  // "drive" is checked before "amp", so any overdrive/* or preamp/* category
  // that also contains "amp simulator" is intentionally captured here.
  drive:      ["overdrive", "distortion", "boost", "booster", "overdrive/distortion", "overdrive/boost",
               "distortion/booster", "overdrive/fuzz", "overdrive/preamp", "preamp", "preamp/boost",
               "preamp/distortion/boost", "modulation/overdrive", "overdrive/echo/boost",
               "overdrive/bass", "bass/overdrive", "bass/preamp", "preamp/bass",
               "distortion/overdrive/preamp", "preamp/di", "preamp/booster",
               "vibrato/drive", "octaver/distortion/booster", "overdrive/amp simulator"],
  amp:        ["amp simulator", "amp simulator/distortion", "amp simulator/ir loader",
               "cab simulator", "combo", "combo/frfr",
               "head", "power amp", "ir loader", "ir loader/power amp",
               "acoustic simulator", "acoustic simulator/ir loader"],
  modulation: ["chorus", "flanger", "phaser", "tremolo", "vibrato", "rotary", "modulation",
               "chorus/vibrato", "chorus/flanger", "vibrato/rotary", "rotary/chorus",
               "rotary/flanger/chorus", "fuzz/modulation", "chorus/bass",
               "chorus/vibrato/rotary", "vibrato/chorus"],
  delay:      ["delay", "delay/looper", "reverb/delay", "delay/reverb"],
  reverb:     ["reverb", "reverb/delay", "tremolo/reverb", "reverb/distortion", "delay/reverb"],
  eq:         ["eq", "equalizer", "bass/boost/equalizer", "boost/equalizer"],
  looper:     ["looper", "looper/drum machine", "delay/looper"],
  pitch:      ["pitch shifter", "octaver", "harmonizer", "harmonizer/octaver", "octaver/bass",
               "fuzz/octaver", "bitcrusher/pitch shifter/modulation",
               "bitcrusher/pitch shifter/modulation/fuzz"],
  wah:        ["wah", "wah/volume", "filter", "filter/bass", "talk box"],
  compressor: ["compressor", "compressor/bass", "bass/compressor",
               "limiter", "sustainer", "noise gate", "noise-gate/bass"],
  synth:      ["synth", "bass/synth", "arpeggiator", "vocoder"],
  volume:     ["volume", "volume/expression", "volume/attenuator", "expression"]
};

function _categoryGroup(cat) {
  const c = (cat || "").toLowerCase();
  // Pass 1: exact match — a compound category like "amp simulator/distortion"
  // should match "amp" (exact entry) before "drive" (substring "distortion").
  for (const [g, cats] of Object.entries(EXPLORE_CATEGORY_GROUPS)) {
    if (cats.includes(c)) return g;
  }
  // Pass 2: substring match — handles partial overlaps (e.g. "overdrive/bass" → "drive")
  for (const [g, cats] of Object.entries(EXPLORE_CATEGORY_GROUPS)) {
    if (cats.some(x => c.includes(x))) return g;
  }
  return "other_" + c; // unique fallback — each "other" pedal is its own group
}

// Cached subplex pool per pedal for the current explore session
let _exploreSubplexPool = null;

// Truncate a pedal ID for display (strip special chars, max 22 chars)
function _truncatePedalId(id, max = 22) {
  if (!id) return "Pedal";
  // Replace common separators with space, trim, capitalize words
  const clean = id.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trim() + "\u2026";
}

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

  // Map each style label to its STYLE_TAG_MAP color (lowercase key lookup)
  const STYLE_CHIP_COLOR = {
    rock: "red", "hard rock": "red", metal: "black", blues: "blue",
    funk: "green", pop: "warm-gray", shoegaze: "magenta", ambient: "magenta",
    "post-rock": "purple", psychedelic: "purple", experimental: "purple",
    grunge: "cool-gray", indie: "cyan", punk: "orange", jazz: "gray",
    folk: "yellow", prog: "purple"
  };

  const styleChips = styles.map(s => {
    const key    = s.toLowerCase();
    const color  = STYLE_CHIP_COLOR[key] || "";
    const active = prevStyles.includes(key) ? " explore-chip--active" : "";
    const colorCls = color ? ` explore-chip--${color}` : "";
    return `<button type="button" class="explore-chip explore-chip--style${colorCls}${active}" data-value="${key}">${s}</button>`;
  }).join("");

  const vibeChips = vibes.map(v => {
    const active = prevVibes.includes(v) ? " explore-chip--active" : "";
    return `<button type="button" class="explore-chip explore-chip--vibe${active}" data-value="${v}">${v}</button>`;
  }).join("");

  Swal.fire({
    title: "Explore your Rig",
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
            <span class="explore-slider-label explore-slider-label--left">Familiar</span>
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
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12zM21.65 10.35l-8.59 3.74-3.71 8.56 8.59-3.74zm-8.07 8.08 2.35-5.42 5.42 5.42-5.42 2.35z'/></svg>Explore",
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


// ---- Pick one combination ----
// Groups are only included if they have a SubPlex that genuinely matches the
// request. At low exp, non-matching groups are skipped. At high exp, every
// group gets a chance regardless. Stacking only kicks in above 70% exp.
function _pickCombination(eligiblePedals, params, excludeSeed = null) {
  const { styles, vibes, exp } = params;
  const experimentFactor = exp / 100;

  // A score >= this threshold means the group has a genuinely relevant SubPlex.
  // Scored at exp=0 so noise doesn't inflate it.
  // Threshold=4 means only direct style-tag match (+10) or vibe keyword match (+4)
  // qualify — adjacent-style-only matches (+2) do not, preventing unrelated pedals
  // like delay/flanger from sneaking in on "metal" just because they have "rock" tags.
  const RELEVANCE_THRESHOLD = 4;

  function groupIsRelevant(group) {
    return group.some(pedal =>
      (_exploreSubplexPool[pedal.id] || []).some(sp =>
        _scoreSubplex(sp, styles, vibes, 0) >= RELEVANCE_THRESHOLD
      )
    );
  }

  // Group pedals by category
  const groupMap = {};
  for (const pedal of eligiblePedals) {
    const g = _categoryGroup(pedal.category);
    if (!groupMap[g]) groupMap[g] = [];
    groupMap[g].push(pedal);
  }

  const selectedPedals = [];
  for (const group of Object.values(groupMap)) {
    const relevant = groupIsRelevant(group);

    // At low exp, skip groups with no matching SubPlex entirely.
    // At high exp, include them with increasing probability.
    if (!relevant) {
      // Probability of including an irrelevant group:
      //   0% at exp≤30, ramps to 80% at exp=100
      const includeProb = Math.max(0, (experimentFactor - 0.3) / 0.7) * 0.8;
      if (Math.random() > includeProb) continue;
    }

    // Shuffle so Retry varies which pedal from a group is picked
    const shuffled = [...group].sort(() => Math.random() - 0.5);

    // Always include one pedal from each accepted group
    selectedPedals.push(shuffled[0]);

    // Stacking: only activates above 70% exp, modest probability even then
    //   exp=0.7 → max stack prob = 0%
    //   exp=1.0 → max stack prob = 45% for 2nd, 15% for 3rd
    for (let i = 1; i < shuffled.length; i++) {
      const stackProb = Math.max(0, (experimentFactor - 0.7) / 0.3) * (i === 1 ? 0.45 : 0.15);
      if (Math.random() < stackProb) selectedPedals.push(shuffled[i]);
    }
  }

  // Minimum raw score (before noise) for a subplex to be selectable.
  // At low exp we require a real match (direct tag or vibe keyword);
  // at high exp we relax this so unrelated picks can surface.
  // Score is calculated at exp=0 to exclude noise from the gate check.
  const MIN_PICK_SCORE = Math.max(0, 4 - experimentFactor * 4); // 4→0 as exp goes 0→1

  const combination = [];

  for (const pedal of selectedPedals) {
    const pool = _exploreSubplexPool[pedal.id] || [];
    if (!pool.length) continue;

    // Score all subplexes at exp=0 (noise-free) to find the best raw match.
    // Then re-score with full experimentFactor for weighted-random selection.
    const scored = pool
      .map(sp => {
        const rawScore = _scoreSubplex(sp, styles, vibes, 0);
        const fullScore = rawScore > 0
          ? _scoreSubplex(sp, styles, vibes, experimentFactor)
          : 0.1 + Math.random() * 0.4; // tiny baseline for zero-score entries
        return { sp, rawScore, score: fullScore };
      })
      .sort((a, b) => b.score - a.score);

    // Gate: at low exp, skip this pedal entirely if even its best SubPlex
    // doesn't reach the minimum raw score. This prevents unrelated pedals
    // (e.g. a blues/rock delay on a metal rig at familiar setting) from
    // sneaking through just because they hit a loose vibe keyword like "clean".
    const bestRaw = scored[0]?.rawScore ?? 0;
    if (bestRaw < MIN_PICK_SCORE) continue;

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
function _weightedRandom(scoredList, experimentFactor, excludeId = null) {
  let pool = excludeId ? scoredList.filter(x => x.sp._id !== excludeId) : scoredList;
  if (!pool.length) pool = scoredList;

  const steepness = 3 - experimentFactor * 2.5;
  const weights   = pool.map((_, i) => Math.exp(-steepness * i));
  const total     = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}


// ---- Generate human-readable explanation from metadata ----
function _generateExplanation(combination, params) {
  if (!combination.length) return "";

  const styleLabel = params.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");
  const vibeWords  = (params.vibes || []).join(" and ").toLowerCase();

  const parts = [];
  const used  = new Set();

  for (const { pedal, subplex } of combination) {
    const group = _categoryGroup(pedal.category);
    // Skip "other_*" groups (misc utility pedals) and duplicates
    if (group.startsWith("other_") || used.has(group)) continue;
    used.add(group);

    const spName = subplex.presetName || subplex.name;
    const base   = vibeWords || styleLabel.toLowerCase();
    const pid    = _truncatePedalId(pedal.id, 20);

    if (group === "fuzz")            parts.push(`The <em>${spName}</em> on <strong>${pid}</strong> builds the ${base} foundation`);
    else if (group === "drive")      parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) adds grit and character`);
    else if (group === "amp")        parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) defines the core tone and body`);
    else if (group === "modulation") parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) creates movement and width`);
    else if (group === "delay")      parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) shapes the atmospheric tail`);
    else if (group === "reverb")     parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) opens up the space`);
    else if (group === "wah")        parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) sculpts the frequency response`);
    else if (group === "compressor") parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) controls the dynamics`);
    else if (group === "eq")         parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) shapes the frequency balance`);
    else if (group === "pitch")      parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) adds pitch colour and depth`);
    else if (group === "synth")      parts.push(`<strong>${pid}</strong> (<em>${spName}</em>) brings in texture and synth character`);
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
    const spName   = subplex.presetName || subplex.name || "SubPlex";
    const pedalLabel = _truncatePedalId(pedal.id, 20);
    const spDesc   = subplex.description
      ? `<span class="explore-result-desc">${subplex.description}</span>`
      : "";
    const tags = (subplex.style || []).map(s => {
      const color = STYLE_TAG_MAP[s] || "gray";
      return `<span class="bx--tag bx--tag--${color} bx--tag--sm">${s}</span>`;
    }).join("");
    return `
      <div class="explore-result-row">
        <div class="explore-result-pedal">${pedalLabel}</div>
        <div class="explore-result-subplex">
          <span class="explore-result-sp-name">${spName}</span>
          ${spDesc}
          <div class="explore-result-tags">${tags}</div>
        </div>
      </div>`;
  }).join("");

  // Carbon icons for the three action buttons
  const iconApply = `<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M13 24L4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z"/></svg>`;
  const iconTry   = `<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M12 10H6.78A11 11 0 1 1 5 16H3A13 13 0 1 0 6 7.22V2L0 8l6 6V9h4z"/></svg>`;
  const iconSave  = `<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon"><path d="M27.71 9.29l-5-5A1 1 0 0 0 22 4H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V10a1 1 0 0 0-.29-.71zM12 6h8v4h-8zm8 20h-8v-8h8zm2 0v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8H6V6h4v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.41L26 10v16z"/></svg>`;

  Swal.fire({
    title: `<span style="font-size:1rem; font-weight:600; letter-spacing:0.02em;">Your new experiment</span>`,
    willOpen: () => Swal.hideLoading(),
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
          <button id="exploreApplyBtn" class="bx--btn bx--btn--primary">
            ${iconApply}Apply to Plex
          </button>
          <button id="exploreTryBtn" class="bx--btn bx--btn--secondary">
            ${iconTry}Retry
          </button>
          <button id="exploreSaveBtn" class="bx--btn bx--btn--tertiary">
            ${iconSave}Save to new Plex
          </button>
        </div>
        <br>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
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
        _saveExploreExperiment(combination, params);
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
// Creates the plex on the server with controls already included,
// bypassing the standard createPreset() which does an empty-pedals create + reload.
async function _saveExploreExperiment(combination, params) {
  const styleLabel = params.styles.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ");

  // 1. Ask for a name
  const nameResult = await Swal.fire({
    title: "Save experiment as Plex",
    input: "text",
    inputValue: `Explore: ${styleLabel}`,
    inputPlaceholder: "Name your experiment...",
    showCancelButton: true,
    showCloseButton: true,
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24L4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'/></svg>Save",
    cancelButtonText: "Cancel",
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton:  "bx--btn bx--btn--secondary"
    },
    inputValidator: v => {
      if (!v || !v.trim()) return "Please enter a name.";
      if (v.trim().length > 40) return "Name must be 40 characters or less.";
    }
  });

  if (!nameResult.isConfirmed || !nameResult.value) return;
  const presetName = nameResult.value.trim();

  // 2. Ask for folder (reuse window.folders already loaded)
  const folderOptions = [
    { id: "", name: "No Folder" },
    ...(window.folders || []).map(f => ({ id: f.id || f._id, name: f.name }))
  ];
  const folderHtml = `<select id="exploreFolderSelect" class="swal2-select">
    ${folderOptions.map(f => `<option value="${f.id}">${f.name}</option>`).join("")}
  </select>`;

  const folderResult = await Swal.fire({
    title: "Select folder for this Plex",
    html: folderHtml,
    showCancelButton: false,
    showCloseButton: true,
    confirmButtonText: "<svg focusable='false' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg' fill='currentColor' width='16' height='16' viewBox='0 0 32 32' aria-hidden='true' class='bx--btn__icon'><path d='M13 24L4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z'/></svg>Select this",
    customClass: {
      confirmButton: "bx--btn bx--btn--primary",
      cancelButton:  "bx--btn bx--btn--secondary"
    },
    preConfirm: () => document.getElementById("exploreFolderSelect").value
  });

  if (folderResult.value === undefined) return;
  const selectedFolderId = folderResult.value;

  Swal.fire({ title: "Saving experiment...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });

  // 3. Apply subplexes to DOM so they are visible on board
  for (const { pedal, subplex } of combination) {
    if ($(`.pedal-catalog[data-pedal-id="${pedal.id}"]`).length) {
      applyCatalogPresetToSinglePedal(pedal.id, subplex);
    }
  }

  // Small pause for DOM to settle after applying subplexes
  await new Promise(r => setTimeout(r, 150));

  // 4. Collect current control values from the live DOM
  const collectResult = typeof collectPedalControlValues === "function"
    ? collectPedalControlValues(presetName)
    : null;

  if (!collectResult) {
    Swal.fire("Error", "Could not read board controls.", "error");
    return;
  }

  const pedalArray   = collectResult[presetName] || [];
  const pedalsObject = {};

  for (const pedal of pedalArray) {
    if (!pedal.id) continue;
    const flatControls = {};
    for (const ctrl of pedal.controls) {
      const key = Object.keys(ctrl)[0];
      flatControls[key] = ctrl[key];
    }
    pedalsObject[pedal.id] = { controls: flatControls };

    // Carry over the subplex that was just applied
    const matched = combination.find(c => c.pedal.id === pedal.id);
    if (matched) {
      pedalsObject[pedal.id].subplex = {
        id:          matched.subplex._id,
        presetName:  matched.subplex.presetName || matched.subplex.name,
        source:      matched.subplex.source || "catalog",
        style:       matched.subplex.style || [],
        description: matched.subplex.description || ""
      };
    }
  }

  // 5. Create the plex on the server with controls included
  const pedalboardSelect = document.getElementById("pedalboardSelect");
  const boardId   = pedalboardSelect?.value;
  const boardName = pedalboardSelect?.selectedOptions[0]?.text;

  if (!boardId) {
    Swal.fire("Error", "No Rig selected.", "error");
    return;
  }

  const token = localStorage.getItem("authToken");

  try {
    const createRes = await fetch("https://api.pedalplex.com/CREATE_PLEX.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({
        board_name:  boardName,
        board_id:    boardId,
        preset_name: presetName,
        pedals:      pedalsObject
      })
    });
    const createData = await createRes.json();

    if (!createRes.ok || !createData.ok) {
      Swal.fire("Error", "Failed to create Plex: " + (createData.error || "Unknown error"), "error");
      return;
    }

    const newPresetId = createData.id;

    // 6. Assign to folder if selected
    if (selectedFolderId && typeof movePresetToFolder === "function") {
      await movePresetToFolder(newPresetId, selectedFolderId);
    }

    Swal.close();
    Swal.fire({
      icon: "success",
      title: "Experiment saved!",
      text: `Plex "${presetName}" created successfully.`,
      timer: 1800,
      showConfirmButton: false
    }).then(() => window.location.reload());

  } catch (err) {
    Swal.fire("Error", "Network error: " + err.message, "error");
  }
}


// ---- Helper: pedals currently on the board ----
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

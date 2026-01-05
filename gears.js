
let pedals = []; // global state
let pedalJSON = null;

// Save JSON for other scripts
function setPedalJSON(jsonString) {
  pedalJSON = jsonString;
}


// Creation of new gear pedal (only for logged-in users)
function createNewPedal() {
  if (!window.currentUser || window.currentUser.role === "guest") {
    Swal.fire('Access Denied', 'Guests cannot create pedals. Please log in.', 'warning');
    return;
  }

  Swal.fire({
    title: 'Gear Builder',
    html: `<iframe src="create.html" style="width:100%; height:80vh; border:none;" id="swal-builder-iframe"></iframe>`,
    width: '100%',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCloseButton: false,
    showConfirmButton: true,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: 'Save',
    denyButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      denyButton: 'bx--btn bx--btn--danger',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    background: '#2e2e2e',
    color: '#ffffff',
    preConfirm: () => {
      const iframe = document.getElementById('swal-builder-iframe');
      if (!iframe || !iframe.contentWindow || !iframe.contentWindow.getPedalValidation) {
        Swal.showValidationMessage('Builder not ready');
        return false;
      }

      const validation = iframe.contentWindow.getPedalValidation();

      if (validation.cssError) {
        Swal.showValidationMessage(`CSS Error: ${validation.cssError}`);
        return false;
      }
      if (validation.hasMissingFields) {
        Swal.showValidationMessage("Please fill all required fields!");
        return false;
      }
      if (validation.duplicateFound) {
        Swal.showValidationMessage("Duplicate control labels detected!");
        return false;
      }

      return validation.pedal;
    }
  }).then(result => {
    if (result.isConfirmed) {
      const newPedal = result.value;

      // Attach author info
      newPedal.author = window.currentUser.username || "unknown";
      newPedal.authorId = window.currentUser.userid || null;

      const token = localStorage.getItem('authToken');

      fetch('https://www.cineteatrosanluigi.it/plex/CREATE_GEAR.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(newPedal)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire({
            title: 'Created!',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'bx--btn bx--btn--primary' }
          }).then(() => {
            const resultsDiv = document.getElementById("catalog");
            const createdPedal = {
              ...newPedal,
              _id: data.id,
              _rev: data.rev,
              author: data.author || newPedal.author,
              canEdit: true
            };
            pedals.push(createdPedal);
            // const $pedalDiv = renderPedal(createdPedal, window.currentUser.role || "user");
            appendNewPedalWithSubPlex(createdPedal); // new with subplexes
            $pedalDiv.attr("data-author", createdPedal.author || "");
            $pedalDiv.attr("data-published", (createdPedal.published || "draft").toLowerCase());
            $pedalDiv.find(".edit-btn").data("pedal", createdPedal);
            $(resultsDiv).append($pedalDiv);
            updatePedalCounts();
            setupEditPedalHandler(pedals);
          });
        } else {
          Swal.fire('Error', data.error || 'Failed to create', 'error');
        }
      })
      .catch(err => {
        Swal.fire('Error', err.message || 'Failed to create', 'error');
      });
    }
  });
}


// Category keywords → accepted variants
const pedalCategoryMap = {
  acoustic: ["acoustic", "acoustic simulator", "ac sim", "simulator", "sim"],
  ambient: ["ambient", "ambi", "amb", "dimension", "space"],
  ampli: ["combo", "all-in-one", "all in one", "amplifier head", "amp head", "head", "amped", "marshall"],
  boost: ["boost", "blst", "bst"],
  chorus: ["chorus", "cho"],
  compressor: ["compressor", "comp", "compr", "sustainer", "sustain"],
  delay: ["delay", "dly", "del", "echo", "ech"],
  distortion: ["distortion", "dist", "distort", "metal", "heavy", "dark", "feedbacker", "feedback", "overdrive", "drive", "od", "drv", "driving"],
  drum: ["drum machine", "drum", "rhythm", "beat", "pad"],
  eq: ["equal", "equalizer", "equaliser", "filter", "filt",],
  expression: ["expression", "expr", "exp", "volume", "volum", "swell", "volume swell", "swl", "slow"],
  flanger: ["flanger", "flg", "flange"],
  fuzz: ["fuzz", "muff"],
  looper: ["looper", "loop", "loop station", "loopstation"],
  modulation: ["modulation", "mod"],
  multifx: ["multifx", "multi-fx", "multi fx", "fx"],
  octaver: ["octaver", "octave", "oct", "octa"],
  phaser: ["phaser", "phase", "pha"],
  pitchshifter: ["pitchshifter", "pitch shifter", "pshift", "pitch", "harmonist", "harmonizer", "shifter", "shift", "whammy"],
  preamp: ["stack", "rig", "full rig", "amp stack", "preamp", "pre-amp", "pre amp", "irloader", "ir loader", "ir"],
  reverb: ["reverb", "verb", "rvb", "shimmer", "shim"],
  vibrato: ["tremolo", "trem","rotary", "rotovibe", "roto-vibe", "vibrato", "vibe", "vib"],
  synth: ["spectrum", "enhancer", "spec", "sampler", "sample", "samp", "formant", "lfo", "synth", "synthesizer", "synthesiser", "slicer", "processor", "organ", "bitcrusher", "bit crusher", "crusher", "lofi", "lo-fi"],
  utility: ["buffer", "bfr", "buff", "switcher", "switch", "footswitch", "loop switcher", "ab switcher", "aby", "dibox", "di box", "direct box", "utility", "util", "misc", "miscellaneous", "tuner", "tunr", "tnr", "noisegate", "noise gate", "suppressor"],
  vocoder: ["vocoder", "voco", "vokoder", "talk box"],
  wah: ["wah", "wah-wah"]
};

// === CATEGORY FILTER LOGIC ===
$(document).on("change", "#categoryFilter", function () {
  const selected = $(this).val();

  if (selected === "all") {
    $(".pedal-catalog").show();
    updatePedalCounts();
    return;
  }
  const variants = pedalCategoryMap[selected] || [];

  $(".pedal-catalog").each(function() {
    const id = ($(this).data("pedal-id") || "").toLowerCase();
    const matches = variants.some(keyword => id.includes(keyword));
    $(this).toggle(matches);
  });

  updatePedalCounts();
});




// =======================
// SUBPLEX CARBON STYLE
// =======================

// Funzione per ottenere i SubPlex di un pedal (da adattare alla tua logica)
function getSubPlexForPedal(pedalId) {
  const pedal = pedals.find(p => p._id === pedalId);
  return pedal && pedal.subplexes ? pedal.subplexes : [];
}

// Render SubPlex Carbon-style
function renderSubPlexDropdown(pedal) {
  const subPlexes = getSubPlexForPedal(pedal._id);

  // Costruisci lista Carbon
  let itemsHtml = "";
  subPlexes.forEach(sub => {
    itemsHtml += `
      <li class="bx--list-box__menu-item subplex-item" role="option" tabindex="0">
        ${sub.name}
      </li>
    `;
  });

  return `
    <div class="subplex-container" data-pedal-id="${pedal._id}" style="margin-top:8px;">
      <div class="bx--list-box bx--list-box--light" style="width: 180px;">
        <button class="bx--list-box__field bx--btn bx--btn--tertiary subplex-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
          <span class="bx--list-box__label">SubPlex</span>
          <svg focusable="false" preserveAspectRatio="xMidYMid meet"
               xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" class="bx--list-box__menu-icon">
            <path d="M16 4L20 12H12L16 4Z M16 28L12 20H20L16 28Z M4 16L12 20V12L4 16Z M28 16L20 12V20L28 16Z"/>
          </svg>
        </button>
        <ul class="bx--list-box__menu subplex-dropdown" style="display:none;">
          ${itemsHtml || '<li class="bx--list-box__menu-item" role="option" tabindex="0">No SubPlex</li>'}
        </ul>
      </div>
    </div>
  `;
}

// Setup eventi dropdown
function setupSubPlexEvents() {
  $(".subplex-btn").off("click").on("click", function () {
    const $container = $(this).closest(".subplex-container");
    const expanded = $(this).attr("aria-expanded") === "true";
    $(this).attr("aria-expanded", !expanded);
    $container.find(".subplex-dropdown").toggle();
  });

  // Chiudi dropdown cliccando fuori
  $(document).on("click", function(e) {
    if (!$(e.target).closest(".subplex-container").length) {
      $(".subplex-dropdown").hide();
      $(".subplex-btn").attr("aria-expanded", false);
    }
  });
}

// =======================
// RENDER PEDAL CON SUBPLEX CARBON
// =======================
function renderPedalWithSubPlexCarbon(pedal, role) {
  const $pedalDiv = renderPedal(pedal, role); // funzione esistente per pedal normale
  $pedalDiv.append(renderSubPlexDropdown(pedal));
  setupSubPlexEvents();
  return $pedalDiv;
}

// =======================
// POPOLAMENTO CATALOG
// =======================
function populateCatalogWithSubPlexCarbon(pedalArray, role) {
  const $resultsDiv = $("#catalog");
  $resultsDiv.empty();

  pedalArray.forEach(pedal => {
    const $pedalDiv = renderPedalWithSubPlexCarbon(pedal, role);
    $pedalDiv.attr("data-author", pedal.author || "");
    $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
    $pedalDiv.find(".edit-btn").data("pedal", pedal);
    $resultsDiv.append($pedalDiv);
  });

  updatePedalCounts();
}

// =======================
// INTEGRAZIONE CON CREATE NEW PEDAL
// =======================
function appendNewPedalWithSubPlex(newPedal) {
  pedals.push(newPedal);
  const $pedalDiv = renderPedalWithSubPlexCarbon(newPedal, window.currentUser.role || "user");
  $pedalDiv.attr("data-author", newPedal.author || "");
  $pedalDiv.attr("data-published", (newPedal.published || "draft").toLowerCase());
  $pedalDiv.find(".edit-btn").data("pedal", newPedal);
  $("#catalog").append($pedalDiv);
  updatePedalCounts();
  setupEditPedalHandler(pedals);
}

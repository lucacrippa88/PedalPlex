
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

      fetch('https://api.pedalplex.com/CREATE_GEAR.php', {
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






$(document).ready(() => {

  const $goToRigs = $('#goToRigs');
  const $addToRig = $('#addToRig');
  const $categoryFilter = $('#categoryFilter');

  const isCatalog = !window.location.search.includes('id=');
  const isSingleGear = !isCatalog;

  // Nascondiamo entrambi all’inizio
  $goToRigs.hide();
  $addToRig.hide();

  if (isCatalog) {
    // Solo catalogo → mostra Go to Rigs
    $goToRigs.show();
    $addToRig.hide();
    $('#backToCatalog').remove(); // rimuoviamo eventuale pulsante legacy
  }

  if (isSingleGear) {
    // Pagina singolo pedale → mostra Add to Rig e Back to Catalog
    $addToRig.show();
    $goToRigs.hide(); // <-- garantito nascondere Go to Rigs

    // Aggiungiamo il pulsante "Back to Catalog" accanto al dropdown
    let $backToCatalog = $('#backToCatalog');
    if ($backToCatalog.length === 0) {
      $backToCatalog = $(`
        <a id="backToCatalog" href="gears" class="bx--btn bx--btn--tertiary" 
           style="margin-left:8px; max-width:500px!important;">
          Back to Catalog
          <svg focusable="false" preserveAspectRatio="xMidYMid meet"
               xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M14 26L15.41 24.59 7.83 17 28 17 28 15 7.83 15 15.41 7.41 14 6 4 16 14 26z"></path>
          </svg>
        </a>
      `);
      $categoryFilter.after($backToCatalog);
    }
  }

});


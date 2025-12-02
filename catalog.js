
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
            const $pedalDiv = renderPedal(createdPedal, window.currentUser.role || "user");
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
  // acoustic: ["acoustic", "acoustic simulator", "ac sim", "simulator", "sim"],
  // ambient: ["ambient", "ambi", "amb", "dimension", "space"],
  // bitcrusher: ["bitcrusher", "bit crusher", "crusher", "lofi", "lo-fi"],
  // boost: ["boost", "blst", "bst"],
  // buffer: ["buffer", "bfr", "buff"],
  // chorus: ["chorus", "cho"],
  // combo: ["combo", "all-in-one", "all in one"],
  // compressor: ["compressor", "comp", "compr"],
  // delay: ["delay", "dly", "del"],
  // dibox: ["dibox", "di box", "direct box"],
  // distortion: ["distortion", "dist", "distort", "metal", "heavy", "dark"],
  // echo: ["echo", "ech"],
  // eq: ["equal", "equalizer", "equaliser"],
  // expression: ["expression", "expr", "exp"],
  // feedbacker: ["feedbacker", "feedback"],
  // filter: ["filter", "filt", "formant", "lfo"],
  // flanger: ["flanger", "flg", "flange"],
  // fuzz: ["fuzz", "muff"],
  // head: ["amplifier head", "amp head", "head", "amped"],
  // irloader: ["irloader", "ir loader", "ir"],
  // looper: ["looper", "loop", "loop station", "loopstation"],
  // modulation: ["modulation", "mod"],
  // multifx: ["multifx", "multi-fx", "multi fx", "fx"],
  // noisegate: ["noisegate", "ng", "noise gate", "suppressor"],
  // octaver: ["octaver", "octave", "oct", "octa"],
  // overdrive: ["overdrive", "drive", "od", "drv", "driving"],
  // phaser: ["phaser", "phase", "pha"],
  // pitchshifter: ["pitchshifter", "pitch shifter", "pshift", "pitch", "harmonist", "harmonizer", "shifter", "shift", "whammy"],
  // preamp: ["preamp", "pre-amp", "pre amp"],
  // reverb: ["reverb", "verb", "rvb"],
  // rotary: ["rotary", "rotovibe", "roto-vibe"],
  // sampler: ["sampler", "sample", "samp"],
  // spectrumenhancer: ["spectrum", "enhancer", "spec"],
  // stack: ["stack", "rig", "full rig", "amp stack"],
  // sustainer: ["sustainer", "sustain"],
  // swell: ["swell", "volume swell", "swl", "slow"],
  // switcher: ["switcher", "switch", "sw", "footswitch", "loop switcher", "ab switcher", "drop", "aby"],
  // synth: ["synth", "synthesizer", "synthesiser", "slicer", "processor", "organ"],
  // tremolo: ["tremolo", "trem"],
  // tuner: ["tuner", "tunr", "tnr"],
  // vibrato: ["vibrato", "vibe", "vib"],
  // vocoder: ["vocoder", "voco", "vokoder", "talk box"],
  // volume: ["volume", "volum"],
  // wah: ["wah", "wah-wah"]
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
// ==================== Global State ====================
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentCategory = 'all';
let pedals = [];
let catalogData = [];
let catalogRenderIndex = 0;
let currentSearchQuery = null;
let pedalJSON = null;
let sentinel = null;
let searchBookmark = null;


// ==================== Helpers ====================
function setPedalJSON(jsonString) { pedalJSON = jsonString; }

function resetCatalogState() {
  currentPage = 0;
  isLoading = false;
  hasMore = true;
  pedals = [];
  catalogData = [];
  catalogRenderIndex = 0;
  currentSearchQuery = null;
  searchBookmark = null;   // ← AGGIUNTA

  const catalog = document.getElementById("catalog");
  catalog.innerHTML = "";

  if (sentinel) { sentinel.remove(); sentinel = null; }
  setupCatalogObserver();
}


// ==================== Category Filter ====================
const pedalCategoryMap = {
  acoustic: ["acoustic","acoustic simulator","ac sim","simulator","sim"],
  ambient: ["ambient","ambi","amb","dimension","space"],
  ampli: ["combo","all-in-one","all in one","amplifier head","amp head","head","amped","marshall"],
  boost: ["boost","blst","bst"],
  chorus: ["chorus","cho"],
  compressor: ["compressor","comp","compr","sustainer","sustain"],
  delay: ["delay","dly","del","echo","ech"],
  distortion: ["distortion","dist","distort","metal","heavy","dark","feedbacker","feedback","overdrive","drive","od","drv","driving"],
  drum: ["drum machine","drum","rhythm","beat","pad"],
  eq: ["equal","equalizer","equaliser","filter","filt"],
  expression: ["expression","expr","exp","volume","volum","swell","volume swell","swl","slow"],
  flanger: ["flanger","flg","flange"],
  fuzz: ["fuzz","muff"],
  looper: ["looper","loop","loop station","loopstation"],
  modulation: ["modulation","mod"],
  multifx: ["multifx","multi-fx","multi fx","fx"],
  octaver: ["octaver","octave","oct","octa"],
  phaser: ["phaser","phase","pha"],
  pitchshifter: ["pitchshifter","pitch shifter","pshift","pitch","harmonist","harmonizer","shifter","shift","whammy"],
  preamp: ["stack","rig","full rig","amp stack","preamp","pre-amp","pre amp","irloader","ir loader","ir"],
  reverb: ["reverb","verb","rvb","shimmer","shim"],
  vibrato: ["tremolo","trem","rotary","rotovibe","roto-vibe","vibrato","vibe","vib"],
  synth: ["spectrum","enhancer","spec","sampler","sample","samp","formant","lfo","synth","synthesizer","synthesiser","slicer","processor","organ","bitcrusher","bit crusher","crusher","lofi","lo-fi"],
  utility: ["buffer","bfr","buff","switcher","switch","footswitch","loop switcher","ab switcher","aby","dibox","di box","direct box","utility","util","misc","miscellaneous","tuner","tunr","tnr","noisegate","noise gate","suppressor"],
  vocoder: ["vocoder","voco","vokoder","talk box"],
  wah: ["wah","wah-wah"]
};

$(document).on("change", "#categoryFilter", function () {
  currentCategory = $(this).val();
  resetCatalogState();
  loadNextCatalogPage();
});

// ==================== Lazy Catalog Render ====================
function renderCatalogIncremental(_, containerId, userRole, batchSize = 12) {
  const container = document.getElementById(containerId);
  const data = catalogData;
  const batch = data.slice(catalogRenderIndex, catalogRenderIndex + batchSize);
  const frag = document.createDocumentFragment();

  batch.forEach(pedal => {
    const $pedalDiv = renderPedal(pedal, userRole);
    $pedalDiv.attr("data-author", pedal.author || "");
    $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
    frag.appendChild($pedalDiv[0]);
  });

  container.appendChild(frag);
  catalogRenderIndex += batch.length;

  if (sentinel) container.appendChild(sentinel);

  updatePedalCountsFromServer();
  if (userRole !== "guest") setupEditPedalHandler(batch);

  checkLoadNext();
}

// ==================== Lazy Load ====================
function loadNextCatalogPage() {
  if (isLoading || !hasMore) return;

  if (catalogRenderIndex < catalogData.length) {
    renderCatalogIncremental([], 'catalog', (window.currentUser?.role) || 'guest', 12);
    return;
  }

  isLoading = true;
  currentPage++;

  // let url;
  // if (currentSearchQuery) {
  //   url = 'https://api.pedalplex.com/SEARCH_GEAR_LAZY.php' +
  //         '?q=' + encodeURIComponent(currentSearchQuery) +
  //         '&page=' + currentPage +
  //         '&limit=20';
  // } else {
  //   url = 'https://api.pedalplex.com/GET_CATALOG_LAZY.php' +
  //         '?page=' + currentPage +
  //         '&limit=100' +
  //         '&category=' + encodeURIComponent(currentCategory);
  // }

  let url;

if (currentSearchQuery) {
  url = 'https://api.pedalplex.com/SEARCH_GEAR_LAZY.php' +
        '?q=' + encodeURIComponent(currentSearchQuery) +
        '&limit=20';

  if (searchBookmark) {
    url += '&bookmark=' + encodeURIComponent(searchBookmark);
  }

} else {
  url = 'https://api.pedalplex.com/GET_CATALOG_LAZY.php' +
        '?page=' + currentPage +
        '&limit=100' +
        '&category=' + encodeURIComponent(currentCategory);
}


  const headers = {};
  const token = localStorage.getItem('authToken');
  if(token) headers['Authorization'] = 'Bearer '+token;

  fetch(url, { headers })
    .then(r => r.json())
    // .then(data => {
    //   if (!Array.isArray(data) || data.length === 0) {
    //     hasMore = false;
    //     if (sentinel) sentinel.remove();
    //     return;
    //   }
    //   catalogData = catalogData.concat(data);
    //   renderCatalogIncremental([], 'catalog', (window.currentUser?.role) || 'guest', 12);
    // })
    .then(data => {
  if (!data || !Array.isArray(data.docs) || data.docs.length === 0) {
    hasMore = false;
    if (sentinel) sentinel.remove();
    return;
  }

  catalogData = catalogData.concat(data.docs);
  searchBookmark = data.bookmark || null;

  if (!searchBookmark) {
    hasMore = false; // fine risultati search
    if (sentinel) sentinel.remove();
  }

  renderCatalogIncremental([], 'catalog', (window.currentUser?.role) || 'guest', 12);
})

    .catch(err => console.error('Catalog lazy load error', err))
    .finally(() => isLoading = false);
}

// ==================== Scroll Observer ====================
function checkLoadNext() {
  if (isLoading || !hasMore || !sentinel) return;
  const rect = sentinel.getBoundingClientRect();
  if (rect.top - window.innerHeight < 500) loadNextCatalogPage();
}

function setupCatalogObserver() {
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.id = 'catalog-sentinel';
    sentinel.style.height = '1px';
    document.getElementById('catalog').appendChild(sentinel);
  }
}

window.addEventListener('scroll', checkLoadNext);
window.addEventListener('resize', checkLoadNext);

// ==================== Search ====================
let searchTimeout = null;
$("#pedalFilterInput").on("input", function(){
  const query = $(this).val().trim();

  if(searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(function(){
    resetCatalogState();
    currentSearchQuery = query === "" ? null : query;
    loadNextCatalogPage();
  }, 500);
});

// ==================== Single Pedal View ====================
function getPedalIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function initSinglePedalView(pedalId, userRole){
  window.singlePedalMode = true;
  const token = localStorage.getItem("authToken");
  const resultsDiv = $("#catalog");
  resultsDiv.empty();
  resultsDiv.append('<div id="catalog-global-loader"></div>');

  const cleanId = decodeURIComponent(pedalId.trim());

  fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token ? "Bearer "+token : ""
    },
    body: JSON.stringify({ids:[cleanId]})
  })
  .then(r=>r.json())
  .then(data=>{
    $("#catalog-global-loader").remove();
    const pedals = data.docs || [];
    if(pedals.length===0){
      Swal.fire({icon:"error", title:"Pedal not found", confirmButtonText:"Back to Catalog"})
        .then(()=>window.location.href="gears");
      return;
    }
    catalogData = pedals;
    catalogRenderIndex = 0;
    renderCatalogIncremental([], 'catalog', userRole, 50);
    if(userRole!=="guest") setupEditPedalHandler(pedals);
  });
}

// ==================== Navigation + Init ====================
function initNavCatalog(userRole){
  renderNavBar(userRole);
  updatePedalCountsFromServer();
  const pedalIdFromURL = getPedalIdFromURL();
  if(pedalIdFromURL) initSinglePedalView(pedalIdFromURL,userRole);
  else {
    setupCatalogObserver();
    loadNextCatalogPage();
  }
}

// ==================== CREATE NEW PEDAL ====================
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
            pedals.push({...newPedal, _id:data.id, _rev:data.rev, canEdit:true});
            catalogData.push({...newPedal, _id:data.id, _rev:data.rev, canEdit:true});
            renderCatalogIncremental([], 'catalog', window.currentUser.role || "user", 12);
            updatePedalCountsFromServer();
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


// ==================== UPDATE PEDAL COUNTS ====================
function updatePedalCountsFromServer(activeFilter = null) {
  const token = localStorage.getItem("authToken");

  fetch("https://api.pedalplex.com/GET_CATALOG_COUNTS.php", {
    headers: token ? { Authorization: "Bearer " + token } : {}
  })
  .then(r => r.json())
  .then(counts => {
    let countsHtml =
      `${counts.total} gear${counts.total === 1 ? "" : "s"} ` +
      `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${counts.total}</span>`;

    if (window.currentUser?.role !== "guest") {
      countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${counts.draft}</span>, 
       Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${counts.private}</span>, 
       Review: <span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">${counts.reviewing}</span>, 
       By me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${counts.publicByMe}</span>;
       Template: <span class="status-filter ${activeFilter === "template" ? "active-filter" : ""}" data-filter="template">${counts.template}</span>`;

      if (window.currentUser?.role === "admin") {
        countsHtml += `, By Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${counts.byUsers}</span>`;
      }
    }

    countsHtml += `)`;
    $("#pedalCount").html(countsHtml);

    $(".status-filter").off("click").on("click", function() {
      const filter = $(this).data("filter");
      filterPedalsByStatus(filter);
    });
  })
  .catch(err => console.error("Counts fetch error:", err));
}

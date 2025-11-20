// nav-catalog.js

// Initialize navigation catalog
function initNavCatalog(userRole) {
  const isAdmin = (userRole === "admin");

  // Nav HTML
  const navHtml = `
    <header style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <div class="pedalplex-logo"></div>
        </button>

        <div class="title">PedalPlex</div>
        <span class="subtitle" style="font-size: 1.25rem; color: #aaa; font-weight: 600">Gears</span>
      </div>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="pedalCount" style="font-size: 0.75rem; color:#aaa"></span>

        <button id="toggleFilterBtn" aria-label="Toggle search" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        <input 
          type="text" 
          id="pedalFilterInput" 
          placeholder="Filter gears..." 
          style="font-size: 0.875rem; padding: 6px 12px; border: 1px solid #8c8c8c; border-radius: 4px; outline-offset: 2px; width: 120px; display: none;" 
          aria-label="Filter pedals"/>

        <button id="createPedalBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M16 4v24M4 16h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add gear
        </button>
      </div>
    </header>
  `;

  $("body").prepend(navHtml);

  // Hide Add Gear button for guests
  if (userRole === "guest") {
    $("#createPedalBtn").hide();
    // Add Login button
    const loginBtnHtml = `
        <button id="loginBtn" class="bx--btn bx--btn--primary bx--btn--sm" type="button" aria-label="Create New Gear" style="display: flex; align-items: center; gap: 0.5rem;">
          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
            <path d="M26,30H14a2,2,0,0,1-2-2V25h2v3H26V4H14V7H12V4a2,2,0,0,1,2-2H26a2,2,0,0,1,2,2V28A2,2,0,0,1,26,30Z"/>
            <path d="M14.59 20.59L18.17 17 4 17 4 15 18.17 15 14.59 11.41 16 10 22 16 16 22 14.59 20.59z"/>
          </svg>
          Login
        </button>
    `;
    $("#toggleFilterBtn").after(loginBtnHtml);  // ----------------------

    // Add click handler
    $(document).on("click", "#loginBtn", function() {
      window.location.href = "login"; // redirect to login page
    });
  } else {
    // Only attach click handlers for logged-in users
    function isTokenValid() {
      const token = localStorage.getItem("authToken");
      if (!token) return false;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp && payload.exp > now;
      } catch (err) {
        console.error("Invalid JWT:", err);
        return false;
      }
    }

    function handleCreatePedalClick() {
      if (!isTokenValid()) {
        Swal.fire({
          icon: 'warning',
          title: 'Login Required',
          text: 'Please log in to create a pedal.',
          confirmButtonText: 'Login',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        }).then(() => { window.location.href = "login"; });
        return;
      }
      createNewPedal();
    }

    $(document).on('click', '#createPedalBtn', handleCreatePedalClick);
    $(document).on('click', '#createOwnPedalBtn', handleCreatePedalClick);
  }

  // Fullscreen menu
  $("body").append(window.fullscreenMenuHtml);

  $("#menuToggle").on("click", function () {
    const randomQuote = songQuotes[Math.floor(Math.random() * songQuotes.length)];
    $("#song-quote").html(`<span style='font-style:italic'>${randomQuote}</span>`);
    $("#fullscreenMenu").addClass("active");
  });
  $("#closeMenu").on("click", () => $("#fullscreenMenu").removeClass("active"));

  $("#toggleFilterBtn").on("click", function () {
    const input = $("#pedalFilterInput");
    if (input.is(":visible")) {
      input.hide().val("");
    } else {
      input.css("display", "flex").focus();
    }
  });
  $("#pedalFilterInput").on("input", function () {
    const filterValue = $(this).val().toLowerCase();
    $(".pedal-catalog").each(function () {
      const name = $(this).data("pedal-id")?.toLowerCase() || "";
      $(this).toggle(name.includes(filterValue));
    });
    updatePedalCounts();
  });

  // Apply guest mode filter visibility
  if (userRole === "guest") {
    $(".status-filter").not('[data-filter="all"]').hide();
  }
}

// Updates pedal counts including draft/private/reviewing/public-by-me
function updatePedalCounts(activeFilter = null) {
  const visiblePedals = $(".pedal-catalog:visible");
  const allPedals = $(".pedal-catalog");
  const totalVisible = visiblePedals.length;
  const totalAbsolute = allPedals.length;

  const statusCounts = { draft: 0, private: 0, reviewing: 0, publicByMe: 0 };
  let userPedalsCount = 0;
  const currentUsername = (window.currentUser?.username || "").toLowerCase();

  allPedals.each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    if (status in statusCounts) statusCounts[status]++;
    if (status === "public" && author === currentUsername) statusCounts.publicByMe++;
    if (author && author !== "admin") userPedalsCount++;
  });

  const reviewingBadge = statusCounts.reviewing > 0
    ? `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing" style="
        background:#ff0000;
        color:white;
        border-radius:50%;
        padding:1px 5px;
        font-size:0.75rem;
        font-weight:bold;
        min-width:18px;
        text-align:center;
      ">${statusCounts.reviewing}</span>`
    : `<span class="status-filter ${activeFilter === "reviewing" ? "active-filter" : ""}" data-filter="reviewing">0</span>`;

  let countsHtml =
    `${totalVisible} gear${totalVisible === 1 ? "" : "s"} available ` +
    `(All: <span class="status-filter ${activeFilter === "all" ? "active-filter" : ""}" data-filter="all">${totalAbsolute}</span>`;

  // Only show these if not a guest
  if (window.currentUser?.role !== "guest") {
    countsHtml += `, Draft: <span class="status-filter ${activeFilter === "draft" ? "active-filter" : ""}" data-filter="draft">${statusCounts.draft}</span>, 
     Private: <span class="status-filter ${activeFilter === "private" ? "active-filter" : ""}" data-filter="private">${statusCounts.private}</span>, 
     Reviewing: ${reviewingBadge}, 
     Published by me: <span class="status-filter ${activeFilter === "publicByMe" ? "active-filter" : ""}" data-filter="publicByMe">${statusCounts.publicByMe}</span>`;
    
    if (window.currentUser?.role === "admin") {
      countsHtml += `, Published by Users: <span class="status-filter ${activeFilter === "user" ? "active-filter" : ""}" data-filter="user">${userPedalsCount}</span>`;
    }
  }

  countsHtml += `)`;

  $("#pedalCount").html(countsHtml);

  $(".status-filter").off("click").on("click", function() {
    const filter = $(this).data("filter");
    filterPedalsByStatus(filter);
  });
}

// Unified filtering function
function filterPedalsByStatus(filter) {
  const currentUsername = (window.currentUser?.username || "").toLowerCase();
  $(".pedal-catalog").each(function() {
    const status = ($(this).data("published") || "").toLowerCase();
    const author = ($(this).data("author") || "").toLowerCase();
    const isMine = (status === "public" && author === currentUsername);
    const isUserCreated = author && author !== "admin";
    if (filter === "all") $(this).show();
    else if (filter === "publicByMe") $(this).toggle(isMine);
    else if (filter === "user") $(this).toggle(isUserCreated);
    else $(this).toggle(status === filter);
  });
  updatePedalCounts(filter);
}

// CSS for link look + active highlight + mobile hide counters except total
const style = document.createElement("style");
style.textContent = `
  .status-filter {
    cursor: pointer;
    text-decoration: underline;
    color: #ddd;
  }
  .status-filter.active-filter {
    font-weight: bold;
    color: #fff;
    text-decoration: none;
    border-bottom: 2px solid #fff;
  }

  /* Mobile: hide all pedal counters except total (All) */
  @media (max-width: 768px) {
    #pedalCount span.status-filter:not([data-filter="all"]) {
      display: none !important;
    }
  }
`;
document.head.appendChild(style);

// Initialize catalog loader
// function initCatalog(userRole) {
//   const resultsDiv = document.getElementById("catalog");
//   resultsDiv.innerHTML = `
//       <div class="bx--loading-overlay">
//         <div class="bx--loading" role="status">
//           <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
//             <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
//             <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
//           </svg>
//         </div>     
//       </div>`;

//   const roleParam = userRole === "guest" ? "guest" : userRole;
//   const usernameParam = window.currentUser?.username || "";

//   const token = localStorage.getItem('authToken');

//   fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${roleParam}&username=${usernameParam}`, {
//     headers: {
//         'Authorization': 'Bearer ' + token
//       }
//     }) 
//     .then(async res => {
//     if (!res.ok) {
//       const text = await res.text();
//       console.error("Server error:", text);
//       throw new Error("Network error");
//     }

//     try {
//       return await res.json();
//     } catch (e) {
//       const text = await res.text();
//       console.error("Invalid JSON response:", text);
//       throw new Error("Invalid JSON from server");
//     }
//   })
//   .then(pedals => {
//     resultsDiv.innerHTML = "";
//     $("#pedalCount").text(`${pedals.length} gears`);

//     pedals.sort((a,b) => a._id.localeCompare(b._id));
//     pedals.forEach(pedal => {
//       const $pedalDiv = renderPedal(pedal, userRole);
//       $pedalDiv.attr("data-author", pedal.author || "");
//       $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
//       $(resultsDiv).append($pedalDiv);
//     });

//     updatePedalCounts();
//     if (userRole !== "guest") setupEditPedalHandler(pedals);
//   })
//   .catch(err => {
//     console.error("Error fetching pedals:", err);
//     resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${err.message}</p>`;
//   });
   
// }
async function initCatalog(userRole) {
    const resultsDiv = document.getElementById("catalog");

    // Loader iniziale
    resultsDiv.innerHTML = `
        <div class="bx--loading-overlay">
            <div class="bx--loading" role="status">
                <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
                    <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
                    <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
                </svg>
            </div>     
        </div>`;

    let bookmark = null;
    let firstChunk = true;
    const allMetadata = []; // terrà tutti i metadati per filtri/search

    // --- funzione per caricare metadati a chunk ---
    async function loadMetadataChunk() {
        const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG_METADATA.php");
        url.searchParams.set("limit", 200);
        if (bookmark) url.searchParams.set("bookmark", bookmark);

        let res, json;
        try {
            res = await fetch(url);
            json = await res.json();
        } catch (err) {
            console.error("Error fetching metadata:", err);
            resultsDiv.innerHTML = `<p style="color:red;">Errore caricamento metadati catalogo.</p>`;
            return;
        }

        const metadata = json.docs || [];
        bookmark = json.bookmark || null;

        if (firstChunk) {
            resultsDiv.innerHTML = "";
            firstChunk = false;
        }

        metadata.forEach(pedal => {
            allMetadata.push(pedal);
            const $pedalDiv = renderPedalSkeleton(pedal, userRole);
            resultsDiv.appendChild($pedalDiv[0]);
        });

        console.log("Metadata loaded:", allMetadata.length);

        if (bookmark) {
            // piccolo delay per fluidità
            setTimeout(loadMetadataChunk, 30);
        } else {
            // finiti i metadati → setup filtri e search
            setupFilterAndSearch(allMetadata);
            loadDetailsBatch();
        }
    }

    // --- funzione per caricare i dettagli a batch ---
    async function loadDetailsBatch(batchSize = 50) {
        for (let i = 0; i < allMetadata.length; i += batchSize) {
            const ids = allMetadata.slice(i, i + batchSize).map(p => p._id);
            const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG_DETAILS.php");
            url.searchParams.set("ids", ids.join(","));

            let res, json;
            try {
                res = await fetch(url);
                json = await res.json();
            } catch (err) {
                console.error("Error fetching pedal details:", err);
                continue;
            }

            const details = json.docs || [];

            details.forEach(pedal => updatePedalDetails(pedal, userRole));

            console.log("Details loaded:", Math.min(i + batchSize, allMetadata.length));

            await new Promise(r => setTimeout(r, 50)); // piccolo delay
        }

        // Fine caricamento → contatori e edit
        $("#pedalCount").text(`${allMetadata.length} gears`);
        updatePedalCounts();
        if (userRole !== "guest") setupEditPedalHandler(allMetadata);
    }

    loadMetadataChunk();
}

/**
 * Renderizza un "pedal scheletro" basato sui metadata
 */
function renderPedalSkeleton(pedalMeta, userRole) {
    const pedalId = pedalMeta._id;
    const width  = getPedalWidth(pedalMeta.width || 80);
    const height = getPedalHeight(pedalMeta.height || 120);
    const color = pedalMeta.color || "#333";
    const fontColor = pedalMeta["font-color"] || "#fff";

    const insideColorRaw = pedalMeta["inside-color"] || "";
    let inside = "";
    let colorOnly = insideColorRaw;
    const isImage = /^https?:\/\/|^data:image\/|^images\/|\.png$|\.jpg$|\.jpeg$|\.gif$/i.test(insideColorRaw);
    if (isImage) {
        inside = "full";
    } else {
        const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
        if (match) { colorOnly = match[1]; inside = match[2] || ""; }
    }

    const baseCss = {
        border: `5px solid ${color}`,
        borderRadius: '10px',
        color: fontColor,
        width: width,
        height: height,
        marginBottom: '10px',
        display: 'inline-block',
        opacity: 0.4,
        ...(pedalMeta["inside-border"] && { boxShadow: `inset 0 0 0 3px ${pedalMeta["inside-border"]}` }),
        ...(isImage ? { backgroundImage: `url("${insideColorRaw}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOnly })
    };

    const $div = $("<div>")
        .addClass("pedal-catalog skeleton")
        .attr("data-pedal-id", pedalId)
        .attr("data-pedal-type", pedalMeta.type || "pedal")
        .attr("data-author", pedalMeta.author || "")
        .attr("data-published", (pedalMeta.published || "draft").toLowerCase())
        .css(baseCss);

    $div.html(`<div class="pedal-skeleton">Loading...</div>`);
    return $div;
}

/**
 * Aggiorna il pedal già renderizzato con i dettagli completi
 */
async function initCatalog(userRole) {
    const resultsDiv = document.getElementById("catalog");

    // Loader iniziale
    resultsDiv.innerHTML = `
        <div class="bx--loading-overlay">
            <div class="bx--loading" role="status">
                <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
                    <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
                    <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
                </svg>
            </div>     
        </div>`;

    let bookmark = null;
    let firstChunk = true;
    const allMetadata = []; // terrà tutti i metadati per filtri/search

    // --- funzione per caricare metadati a chunk ---
    async function loadMetadataChunk() {
        const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG_METADATA.php");
        url.searchParams.set("limit", 200);
        if (bookmark) url.searchParams.set("bookmark", bookmark);

        let res, json;
        try {
            res = await fetch(url);
            json = await res.json();
        } catch (err) {
            console.error("Error fetching metadata:", err);
            resultsDiv.innerHTML = `<p style="color:red;">Errore caricamento metadati catalogo.</p>`;
            return;
        }

        const metadata = json.docs || [];
        bookmark = json.bookmark || null;

        if (firstChunk) {
            resultsDiv.innerHTML = "";
            firstChunk = false;
        }

        metadata.forEach(pedal => {
            allMetadata.push(pedal);
            const $pedalDiv = renderPedalSkeleton(pedal, userRole);
            resultsDiv.appendChild($pedalDiv[0]);
        });

        console.log("Metadata loaded:", allMetadata.length);

        if (bookmark) {
            // piccolo delay per fluidità
            setTimeout(loadMetadataChunk, 30);
        } else {
            // finiti i metadati → setup filtri e search
            setupFilterAndSearch(allMetadata);
            loadDetailsBatch();
        }
    }

    // --- funzione per caricare i dettagli a batch ---
    async function loadDetailsBatch(batchSize = 50) {
        for (let i = 0; i < allMetadata.length; i += batchSize) {
            const ids = allMetadata.slice(i, i + batchSize).map(p => p._id);
            const url = new URL("https://www.cineteatrosanluigi.it/plex/GET_CATALOG_DETAILS.php");
            url.searchParams.set("ids", ids.join(","));

            let res, json;
            try {
                res = await fetch(url);
                json = await res.json();
            } catch (err) {
                console.error("Error fetching pedal details:", err);
                continue;
            }

            const details = json.docs || [];

            details.forEach(pedal => updatePedalDetails(pedal, userRole));

            console.log("Details loaded:", Math.min(i + batchSize, allMetadata.length));

            await new Promise(r => setTimeout(r, 50)); // piccolo delay
        }

        // Fine caricamento → contatori e edit
        $("#pedalCount").text(`${allMetadata.length} gears`);
        updatePedalCounts();
        if (userRole !== "guest") setupEditPedalHandler(allMetadata);
    }

    loadMetadataChunk();
}

/**
 * Renderizza un "pedal scheletro" basato sui metadata
 */
function renderPedalSkeleton(pedalMeta, userRole) {
    const pedalId = pedalMeta._id;
    const width  = getPedalWidth(pedalMeta.width || 80);
    const height = getPedalHeight(pedalMeta.height || 120);
    const color = pedalMeta.color || "#333";
    const fontColor = pedalMeta["font-color"] || "#fff";

    const insideColorRaw = pedalMeta["inside-color"] || "";
    let inside = "";
    let colorOnly = insideColorRaw;
    const isImage = /^https?:\/\/|^data:image\/|^images\/|\.png$|\.jpg$|\.jpeg$|\.gif$/i.test(insideColorRaw);
    if (isImage) {
        inside = "full";
    } else {
        const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
        if (match) { colorOnly = match[1]; inside = match[2] || ""; }
    }

    const baseCss = {
        border: `5px solid ${color}`,
        borderRadius: '10px',
        color: fontColor,
        width: width,
        height: height,
        marginBottom: '10px',
        display: 'inline-block',
        opacity: 0.4,
        ...(pedalMeta["inside-border"] && { boxShadow: `inset 0 0 0 3px ${pedalMeta["inside-border"]}` }),
        ...(isImage ? { backgroundImage: `url("${insideColorRaw}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: colorOnly })
    };

    const $div = $("<div>")
        .addClass("pedal-catalog skeleton")
        .attr("data-pedal-id", pedalId)
        .attr("data-pedal-type", pedalMeta.type || "pedal")
        .attr("data-author", pedalMeta.author || "")
        .attr("data-published", (pedalMeta.published || "draft").toLowerCase())
        .css(baseCss);

    $div.html(`<div class="pedal-skeleton">Loading...</div>`);
    return $div;
}

/**
 * Aggiorna il pedal già renderizzato con i dettagli completi
 */
function updatePedalDetails(pedal, userRole) {
    const $div = $(`.pedal-catalog[data-pedal-id="${pedal._id}"]`);
    if ($div.length) {
        $div.html(renderPedal(pedal, userRole)[0].innerHTML);
        $div.attr("data-author", pedal.author || "");
        $div.attr("data-published", (pedal.published || "draft").toLowerCase());
        $div.removeClass("skeleton").css("opacity", 1);
    }
}

/**
 * Setup filtri/search basati sui metadata
 */
function setupFilterAndSearch(metadata) {
    $("#pedalFilterInput").on("input", function() {
        const filterValue = $(this).val().toLowerCase();
        $(".pedal-catalog").each(function() {
            const id = $(this).data("pedal-id") || "";
            $(this).toggle(id.toLowerCase().includes(filterValue));
        });
    });

    $(".status-filter").off("click").on("click", function() {
        const filter = $(this).data("filter");
        $(".pedal-catalog").each(function() {
            const status = ($(this).data("published") || "").toLowerCase();
            const author = ($(this).data("author") || "").toLowerCase();
            const currentUsername = (window.currentUser?.username || "").toLowerCase();
            let show = false;

            switch(filter){
                case "all": show = true; break;
                case "draft": case "private": case "reviewing": show = status === filter; break;
                case "publicByMe": show = status === "public" && author === currentUsername; break;
                case "user": show = status === "public" && author && author !== "admin"; break;
            }
            $(this).toggle(show);
        });
        updatePedalCounts(filter);
    });
}


/**
 * Setup filtri/search basati sui metadata
 */
function setupFilterAndSearch(metadata) {
    $("#pedalFilterInput").on("input", function() {
        const filterValue = $(this).val().toLowerCase();
        $(".pedal-catalog").each(function() {
            const id = $(this).data("pedal-id") || "";
            $(this).toggle(id.toLowerCase().includes(filterValue));
        });
    });

    $(".status-filter").off("click").on("click", function() {
        const filter = $(this).data("filter");
        $(".pedal-catalog").each(function() {
            const status = ($(this).data("published") || "").toLowerCase();
            const author = ($(this).data("author") || "").toLowerCase();
            const currentUsername = (window.currentUser?.username || "").toLowerCase();
            let show = false;

            switch(filter){
                case "all": show = true; break;
                case "draft": case "private": case "reviewing": show = status === filter; break;
                case "publicByMe": show = status === "public" && author === currentUsername; break;
                case "user": show = status === "public" && author && author !== "admin"; break;
            }
            $(this).toggle(show);
        });
        updatePedalCounts(filter);
    });
}









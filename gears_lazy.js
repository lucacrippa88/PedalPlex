// ===== gear_lazy.js =====

// ===== GLOBAL STATE =====
let currentPage = 0;
let isLoading = false;
let hasMore = true;
let currentCategory = 'all';
let pedals = [];
let pedalJSON = null;
let sentinel = null;

// ===== SAVE PEDAL JSON =====
function setPedalJSON(jsonString) {
    pedalJSON = jsonString;
}

// ===== CREATE NEW PEDAL =====
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
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        background: '#2e2e2e',
        color: '#fff',
        preConfirm: () => {
            const iframe = document.getElementById('swal-builder-iframe');
            if (!iframe?.contentWindow?.getPedalValidation) {
                Swal.showValidationMessage('Builder not ready');
                return false;
            }
            const validation = iframe.contentWindow.getPedalValidation();
            if (validation.hasMissingFields) {
                Swal.showValidationMessage("Please fill all required fields!");
                return false;
            }
            return validation.pedal;
        }
    }).then(result => {
        if (!result.isConfirmed) return;

        const token = localStorage.getItem('authToken');

        fetch('https://api.pedalplex.com/CREATE_GEAR.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(result.value)
        })
        .then(r => r.json())
        .then(() => {
            resetCatalog();
        });
    });
}

// ===== RESET CATALOG (usato anche dalla search) =====
function resetCatalog() {
    currentPage = 0;
    isLoading = false;
    hasMore = true;
    pedals = [];
    $("#catalog").empty();
    sentinel?.remove();
    sentinel = null;
    setupCatalogObserver();
    loadNextCatalogPage();
}

// ===== CATEGORY FILTER =====
$(document).on("change", "#categoryFilter", function () {
    currentCategory = $(this).val();
    resetCatalog();
});

// ===== RENDER CATALOG INCREMENTAL =====
function renderCatalogIncremental(data, containerId, userRole, batchSize = 12) {
    const container = document.getElementById(containerId);
    let index = 0;

    function renderBatch() {
        const batch = data.slice(index, index + batchSize);
        const frag = document.createDocumentFragment();

        batch.forEach(pedal => {
            pedals.push(pedal);
            const $pedalDiv = renderPedal(pedal, userRole);
            $pedalDiv.attr("data-author", pedal.author || "");
            $pedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
            frag.appendChild($pedalDiv[0]);
        });

        container.appendChild(frag);
        index += batchSize;

        if (sentinel) container.appendChild(sentinel);

        if (index < data.length) {
            requestAnimationFrame(renderBatch);
        } else {
            updatePedalCountsFromServer();
            if (userRole !== "guest") setupEditPedalHandler(pedals);
        }
    }

    renderBatch();
}

// ===== LAZY LOAD =====
function loadNextCatalogPage() {
    if (isLoading || !hasMore || window.isSearching) return;
    isLoading = true;

    const token = localStorage.getItem("authToken");
    const headers = token ? { Authorization: "Bearer " + token } : {};

    const loader = $('<div class="catalog-page-loader"></div>');
    $("#catalog").append(loader);

    const url =
        'https://api.pedalplex.com/GET_CATALOG_LAZY.php' +
        '?page=' + (currentPage + 1) +
        '&limit=100' +
        '&category=' + encodeURIComponent(currentCategory);

    fetch(url, { headers })
        .then(r => r.json())
        .then(data => {
            loader.remove();

            if (!Array.isArray(data) || data.length === 0) {
                hasMore = false;
                sentinel?.remove();
                return;
            }

            renderCatalogIncremental(
                data,
                'catalog',
                window.currentUser?.role || 'guest'
            );

            currentPage++;
        })
        .catch(err => {
            loader.remove();
            console.error("Lazy load error:", err);
        })
        .finally(() => {
            isLoading = false;
        });
}

// ===== OBSERVER =====
function setupCatalogObserver() {
    if (sentinel) return;

    sentinel = document.createElement('div');
    sentinel.id = 'catalog-sentinel';
    sentinel.style.height = '1px';

    document.getElementById('catalog').appendChild(sentinel);

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (
                entry.isIntersecting &&
                !isLoading &&
                hasMore &&
                !window.isSearching
            ) {
                loadNextCatalogPage();
            }
        });
    }, { threshold: 1.0 });

    observer.observe(sentinel);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    setupCatalogObserver();
    loadNextCatalogPage();
});

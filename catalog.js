
let pedals = []; // global state
let pedalJSON = null;

// Save JSON for other scripts
function setPedalJSON(jsonString) {
  pedalJSON = jsonString;
}


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

            // Aggiorna lo stato globale dei pedali
            pedals.push(createdPedal);

            // Renderizza il nuovo pedal
            const $pedalDiv = renderPedal(createdPedal, window.currentUser.role || "user");
            $pedalDiv.attr("data-author", createdPedal.author || "");
            $pedalDiv.attr("data-published", (createdPedal.published || "draft").toLowerCase());
            $pedalDiv.find(".edit-btn").data("pedal", createdPedal);
            $(resultsDiv).append($pedalDiv);

            // ========================
            // AGGIORNA FIXED TOTALS
            // ========================
            if (!fixedTotals) fixedTotals = {
              all: 0, draft: 0, private: 0, reviewing: 0, publicByMe: 0, user: 0
            };

            const status = (createdPedal.published || "draft").toLowerCase();
            const author = (createdPedal.author || "").toLowerCase();
            const currentUsername = (window.currentUser?.username || "").toLowerCase();

            fixedTotals.all++;

            if (status in fixedTotals) fixedTotals[status]++;
            if (status === "public" && author === currentUsername) fixedTotals.publicByMe++;
            if (status === "public" && author && author !== "admin" && author !== currentUsername) fixedTotals.user++;

            // Aggiorna contatori visibili
            updatePedalCounts();

            // Setup edit handler
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


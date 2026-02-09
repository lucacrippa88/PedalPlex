
// Edit gears in catalog page
function setupEditPedalHandler(pedals) {
  $(document).on("click", ".edit-btn", function () {

    let pedal = $(this).data("pedal");
    const pedalDiv = $(this).closest(".pedal");

    if (!pedal) {
      console.error("Pedal data not found!");
      return;
    }

    const openSwal = () => {

      const isAdmin = window.currentUser && window.currentUser.role === 'admin';
      const isAuthor = window.currentUser && window.currentUser.username === pedal.author;
      const isTemplate = (pedal.published || '').toLowerCase() === 'template';

      if (!(isAdmin || isAuthor || isTemplate)) {
        Swal.fire({
          title: 'Permission denied',
          text: 'You are not allowed to edit this gear.',
          icon: 'error',
          confirmButtonText: 'OK',
          customClass: { confirmButton: 'bx--btn bx--btn--primary' }
        });
        return;
      }


      // Optional: disable certain buttons for "locked" pedals
      const isLockedStatus = ["template", "reviewing", "public"].includes((pedal.published || "").toLowerCase());
      let boolConfirmBtn = true;
      let boolDenyBtn = true;
      let boolCancelBtn = true;
      if (isLockedStatus && window.currentUser.role !== "admin") {
          boolConfirmBtn = false;
          boolDenyBtn = false;
      }

      const pedalCopy = JSON.parse(JSON.stringify(pedal));
      delete pedalCopy._rev;

      Swal.fire({
        title: `Edit ${pedal._id}`,
        html: `
          <div style="position:relative; width:100%; height:80vh;">
            <div id="builder-spinner" style="position:absolute;top:0;left:0;width:100%;height:100%;
                display:flex;align-items:center;justify-content:center;background:rgba(46,46,46,0.9);z-index:10;">
              <div class="bx--loading" style="width:40px;height:40px;">
                <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
                  <circle class="bx--loading__background" cx="0" cy="0" r="26"></circle>
                  <circle class="bx--loading__stroke" cx="0" cy="0" r="26"></circle>
                </svg>
              </div>
            </div>
            <iframe src="create.html" style="width:100%; height:100%; border:none; display:none;" id="swal-builder-iframe"></iframe>
          </div>
        `,
        width: '100%',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: boolConfirmBtn,
        showDenyButton: boolDenyBtn,
        showCancelButton: boolCancelBtn,
        confirmButtonText: 'Save',
        denyButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        footer: `<span class="modal-footer"><button id="duplicateBtn" class="bx--btn bx--btn--tertiary">Duplicate</button></span>`,
        customClass: {
          confirmButton: 'bx--btn bx--btn--primary',
          denyButton: 'bx--btn bx--btn--danger',
          cancelButton: 'bx--btn bx--btn--secondary'
        },
        background: '#2e2e2e',
        color: '#ffffff',
        didOpen: () => {
          const iframe = document.getElementById('swal-builder-iframe');
          const spinner = document.getElementById('builder-spinner');

          iframe.addEventListener('load', () => {
            const checkReady = setInterval(() => {
              if (iframe.contentWindow && typeof iframe.contentWindow.syncUIFromJSON === 'function') {
                clearInterval(checkReady);
                iframe.contentWindow.syncUIFromJSON(pedalCopy);

                const idInput = iframe.contentWindow.document.getElementById('pedal-id');
                if (idInput) idInput.disabled = true;

                spinner.style.display = 'none';
                iframe.style.display = 'block';
              }
            }, 100);
          });

          // Handle Duplicate button
          $("#duplicateBtn").on("click", () => {
            const newPedal = JSON.parse(JSON.stringify(pedal));
            delete newPedal._id;
            delete newPedal._rev;
            newPedal.published = "draft";

            Swal.close();

            setTimeout(() => {
              Swal.fire({
                title: `Duplicate of ${pedal._id}`,
                html: `<iframe src="create.html" style="width:100%; height:80vh; border:none;" id="swal-duplicate-iframe"></iframe>`,
                width: '100%',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Save duplicate',
                cancelButtonText: 'Cancel',
                customClass: {
                    confirmButton: 'bx--btn bx--btn--primary',
                    cancelButton: 'bx--btn bx--btn--secondary'
                },
                background: '#2e2e2e',
                color: '#ffffff',
                didOpen: () => {
                  const dupIframe = document.getElementById('swal-duplicate-iframe');
                  dupIframe.addEventListener('load', () => {
                    const checkReady = setInterval(() => {
                      if (dupIframe.contentWindow && typeof dupIframe.contentWindow.syncUIFromJSON === 'function') {
                        clearInterval(checkReady);
                        dupIframe.contentWindow.syncUIFromJSON(newPedal);
                      }
                    }, 100);
                  });
                },
                preConfirm: () => {
                  const dupIframe = document.getElementById('swal-duplicate-iframe');
                  if (!dupIframe || !dupIframe.contentWindow || !dupIframe.contentWindow.getPedalValidation) {
                    Swal.showValidationMessage('Builder not ready');
                    return false;
                  }
                  const validation = dupIframe.contentWindow.getPedalValidation();
                  if (validation.hasMissingFields) {
                    Swal.showValidationMessage("Please fill all required fields!");
                    return false;
                  }
                  return validation.pedal;
                }
              }).then((dupResult) => {
                if (dupResult.isConfirmed) {
                  const newPedalData = dupResult.value;
                  const token = localStorage.getItem('authToken');

                  fetch('https://api.pedalplex.com/UPDATE_CATALOG.php', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(newPedalData)
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      const createdPedal = {
                        ...newPedalData,
                        _id: data.id,
                        _rev: data.rev,
                        author: window.currentUser?.username || "",
                        canEdit: true
                      };
                      pedals.push(createdPedal);
                      const $pedalDiv = renderPedal(createdPedal, window.currentUser.role || "user");
                      $pedalDiv.attr("data-author", createdPedal.author || "");
                      $pedalDiv.attr("data-published", (createdPedal.published || "draft").toLowerCase());
                      $pedalDiv.find(".edit-btn").attr("data-pedal-id", createdPedal._id);
                      $("#catalog").append($pedalDiv);
                      updatePedalCountsFromServer();
                      setupEditPedalHandler(pedals);

                      Swal.fire({
                        title: 'Duplicated!',
                        text: 'Your gear has been copied.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        customClass: { confirmButton: 'bx--btn bx--btn--primary' }
                      });
                    } else {
                      Swal.fire({ title: 'Error', text: data.error || 'Failed to save duplicate', icon: 'error', confirmButtonText: 'OK', customClass: { confirmButton: 'bx--btn bx--btn--primary' }});
                    }
                  });
                }
              });
            }, 200);
          });
        },
        preConfirm: () => {
          const iframe = document.getElementById('swal-builder-iframe');
          if (!iframe || !iframe.contentWindow || !iframe.contentWindow.getPedalValidation) {
            Swal.showValidationMessage('Builder not ready');
            return false;
          }

          const validation = iframe.contentWindow.buildJSON ? iframe.contentWindow.buildJSON() : iframe.contentWindow.getPedalValidation();

          const errors = [];
          if (validation.cssError) errors.push(`CSS Error: ${validation.cssError}`);
          if (validation.hasMissingFields) errors.push("Please fill all required fields!");
          if (validation.duplicateFound) errors.push("Duplicate control labels detected!");
          if (!validation.ledFound) errors.push("At least one LED is required!");

          if (errors.length > 0) {
            Swal.showValidationMessage(errors.join("<br>"));
            return false;
          }

          return validation.pedal;
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const updated = result.value;
          updated._rev = pedal._rev;
          const revx = pedals.findIndex(p => p._rev === pedal._rev);
          if (revx !== -1) pedals[revx] = updated;

          Swal.showLoading();
          const token = localStorage.getItem('authToken');

          fetch('https://api.pedalplex.com/UPDATE_CATALOG.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updated)
          })
          .then(res => res.json())
          .then(data => {
            Swal.hideLoading();
            if (data.success) {
              const idx = pedals.findIndex(p => p._id === updated._id);
              if (idx !== -1) {
                pedals[idx] = {
                  ...updated,
                  _id: data.id || updated._id,
                  _rev: data.rev || updated._rev,
                  canEdit: true
                };
              }
              const $old = $(`[data-pedal-id="${updated._id}"]`);
              if ($old.length) {
                const $new = renderPedal(pedals[idx], window.currentUser.role || "user");
                $old.replaceWith($new);
              }
              updatePedalCountsFromServer();
              Swal.fire({
                title: 'Gear saved!',
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: { confirmButton: 'bx--btn bx--btn--primary' }
              });
            } else {
              Swal.fire('Error', data.error || 'Failed to save', 'error');
            }
          });
        } else if (result.isDenied) {
          Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete "${pedal._id}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            customClass: {
                confirmButton: 'bx--btn bx--btn--danger',
                cancelButton: 'bx--btn bx--btn--secondary'
            }
          }).then((deleteConfirm) => {
            if (deleteConfirm.isConfirmed) {
              Swal.showLoading();
              const token = localStorage.getItem('authToken');

              fetch('https://api.pedalplex.com/DELETE_FROM_CATALOG.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ _id: pedal._id, _rev: pedal._rev })
              })
              .then(res => res.text())
              .then(text => {
                let data;
                try { data = JSON.parse(text); } 
                catch (err) { throw new Error("Invalid JSON response from server."); }

                Swal.hideLoading();
                if (data.success) {
                  Swal.fire({
                    title: 'Deleted!',
                    text: 'The gear has been removed.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    customClass: { confirmButton: 'bx--btn bx--btn--primary' }
                  }).then(() => {
                    const idx = pedals.findIndex(p => p._id === pedal._id);
                    if (idx !== -1) pedals.splice(idx, 1);
                    $(`[data-pedal-id="${pedal._id}"]`).remove();
                    updatePedalCountsFromServer();
                  });
                } else {
                  Swal.fire({ title: 'Error', text: data.error || 'Failed to delete', icon: 'error', confirmButtonText: 'OK', customClass: { confirmButton: 'bx--btn bx--btn--primary' }});
                }
              })
              .catch(err => {
                Swal.hideLoading();
                Swal.fire('Error', err.message || 'Failed to delete', 'error');
              });
            }
          });
        }
      });
    }; // end openSwal

    // If controls are missing, fetch full pedal data before opening modal
    if (!pedal.controls || pedal.controls.length === 0) {
      const token = localStorage.getItem('authToken');

      fetch("https://api.pedalplex.com/GET_PEDALS_BY_IDS.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ ids: [pedal._id] })
      })
      .then(res => res.json())
      .then(fullPedalRes => {
        if (!fullPedalRes.docs || fullPedalRes.docs.length === 0) {
          console.warn("GET_PEDALS_BY_IDS returned empty or invalid response for pedal:", pedal._id);
          return;
        }

        pedal = fullPedalRes.docs[0];

        // Fetch canEdit
        const existingPedal = pedals.find(p => p._id === pedal._id);
        if (existingPedal && typeof existingPedal.canEdit !== 'undefined') {
          pedal.canEdit = existingPedal.canEdit;
        }

        // Div update with full data
        const $newPedalDiv = renderPedal(pedal, window.currentUser.role || "user");
        $newPedalDiv.attr("data-author", pedal.author || "");
        $newPedalDiv.attr("data-published", (pedal.published || "draft").toLowerCase());
        $newPedalDiv.find(".edit-btn").data("pedal", pedal);
        pedalDiv.replaceWith($newPedalDiv);

        // Open modal after data is loaded and div is updated
        openSwal();
      })
      .catch(err => console.error("Error loading pedal:", pedal._id, err));

      return;
    }

    // Data is already complete, just open the modal
    openSwal();
  });
}

window.setupEditPedalHandler = setupEditPedalHandler;

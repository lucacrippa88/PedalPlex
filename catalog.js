function initCatalog(userRole) {

  console.log("initCatalog user role: ", userRole)

  const resultsDiv = document.getElementById("catalog");

  // Show loading spinner
  resultsDiv.innerHTML = `
      <div class="bx--loading-overlay">
        <div class="bx--loading" role="status">
          <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
            <circle class="bx--loading__background" cx="0" cy="0" r="37.5"/>
            <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5"/>
          </svg>
        </div>     
      </div>`;

  fetch(`https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php?role=${userRole}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(pedals => {
      resultsDiv.innerHTML = ""; // Clear loader
      $("#pedalCount").text(`${pedals.length} gears`);

      // Sort pedals alphabetically by _id
      pedals.sort((a, b) => a._id - b._id);

      pedals.forEach(pedal => {
        const $pedalDiv = renderPedal(pedal, userRole);
        $(resultsDiv).append($pedalDiv);
      });

      // Setup the edit button handler
      setupEditPedalHandler(pedals);
    })
    .catch(error => {
      console.error("Error fetching pedals:", error);
      resultsDiv.innerHTML = `<p style="color:red;">Error loading pedals: ${error.message}</p>`;
    });


}




let pedalJSON = null;

function setPedalJSON(jsonString) {
    pedalJSON = jsonString;
}

// Creation of new gear pedal
function createNewPedal() {

  Swal.fire({
      title: 'Gear Builder',
      html: `<iframe src="create.html" style="width:100%; height:80vh; border:none;" id="swal-builder-iframe"></iframe>`,
      width: '90%',
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

          // Call buildJSON() via the iframe
          const validation = iframe.contentWindow.getPedalValidation(); // { pedal, cssError, hasMissingFields, duplicateFound }

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

          // Everything is fine, return the pedal object
          return validation.pedal;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newPedal = result.value;

        // Attach author info
        if (window.currentUser) {
          newPedal.author = window.currentUser.username || "unknown";
          newPedal.authorId = window.currentUser.userid || null;
        }

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
                customClass: {
                  confirmButton: 'bx--btn bx--btn--primary'
                }
              }).then(() => location.reload());
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
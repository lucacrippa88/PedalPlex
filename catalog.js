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

  fetch("https://www.cineteatrosanluigi.it/plex/GET_CATALOG.php")
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
    console.log(jsonString);
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
          // Validate via buildJSON()
          const validation = buildJSON(); // { pedal, cssError, hasMissingFields, duplicateFound }

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

        fetch('https://www.cineteatrosanluigi.it/plex/CREATE_GEAR.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
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








// function createNewPedal() {
//   const samplePedal = {
//     "_id": "",
//     "name": "",
//     "type": "pedal",
//     "width": "standard",
//     "height": "standard",
//     "logo": "",
//     "color": "#f0f0f0",
//     "font-color": "#ffffff",
//     "inside-color": "#212121",
//     "knobs-color": "#3dc6fc",
//     "knobs-border": "#424242",
//     "knobs-indicator": "#000000",
//     "controls": [{
//         "row": [{
//           "label": "Check",
//           "type": "led",
//           "colors": ["#000000", "#f70000"],
//           "value": 0
//         }]
//       },
//       {
//         "row": [{
//             "label": "E.Level",
//             "type": "knob",
//             "min": 7,
//             "max": 17,
//             "value": 12
//           },
//           {
//             "label": "Feedb",
//             "type": "knob",
//             "min": 7,
//             "max": 17,
//             "value": 12
//           },
//           {
//             "label": "Time",
//             "type": "knob",
//             "min": 7,
//             "max": 17,
//             "value": 12
//           },
//           {
//             "label": "Mode",
//             "type": "knob",
//             "span": "all",
//             "values": ["Std", "Analog", "Loop", "GLT", "Warp", "Mod", "Shim", "+Rv", "Reverse", "Warm", "Tape", "Std"],
//             "value": "Std"
//           }
//         ]
//       }
//     ]
//   };

//   Swal.fire({
//     title: 'Create New Pedal',
//     input: 'textarea',
//     inputLabel: 'Paste or edit JSON below',
//     inputValue: JSON.stringify(samplePedal, null, 2),
//     allowOutsideClick: false,
//     allowEscapeKey: false,
//     inputAttributes: {
//       'aria-label': 'Editable JSON',
//       style: 'height:400px;font-family:monospace;font-size:12px;'
//     },
//     showCancelButton: true,
//     confirmButtonText: 'Create',
//     customClass: {
//       confirmButton: 'bx--btn bx--btn--primary',
//       cancelButton: 'bx--btn bx--btn--secondary'
//     },
//     preConfirm: (jsonText) => {
//       if (!jsonText) {
//         Swal.showValidationMessage('JSON is required');
//         return false;
//       }

//       try {
//         const parsed = JSON.parse(jsonText);

//         // Check for "position: relative" in logo
//         if (parsed.logo && /position\s*:\s*relative/i.test(parsed.logo)) {
//           Swal.showValidationMessage('Error: "logo" contains forbidden "position: relative"');
//           return false;
//         }

//         // Collect ALL "label" values anywhere in the JSON
//         const labels = [];

//         function collectLabels(obj) {
//           if (Array.isArray(obj)) {
//             obj.forEach(collectLabels); // recurse into array elements
//           } else if (obj && typeof obj === 'object') {
//             for (const key in obj) {
//               if (key === 'label') {
//                 labels.push(obj[key]);
//               }
//               // recurse into every property, regardless if it's array or object
//               if (obj[key] !== null && obj[key] !== undefined) {
//                 collectLabels(obj[key]);
//               }
//             }
//           }
//         }

//         collectLabels(parsed);

//         // Detect duplicates across the ENTIRE JSON
//         const seen = new Set();
//         const duplicates = new Set();
//         labels.forEach(label => {
//           const key = String(label).trim(); // normalize whitespace
//           if (seen.has(key)) {
//             duplicates.add(key);
//           } else {
//             seen.add(key);
//           }
//         });

//         if (duplicates.size > 0) {
//           Swal.showValidationMessage(
//             `Error: Duplicate label(s) found → ${Array.from(duplicates).join(", ")}`
//           );
//           return false;
//         }

//         return parsed;

//       } catch (e) {
//         Swal.showValidationMessage('Invalid JSON format');
//         return false;
//       }
//     }
//   }).then((result) => {
//     if (result.isConfirmed) {
//       const newPedal = result.value;

//       fetch('https://www.cineteatrosanluigi.it/plex/CREATE_GEAR.php', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(newPedal)
//         })
//         .then(res => res.json())
//         .then(data => {
//           if (data.success) {
//             Swal.fire({
//               title: 'Created!',
//               icon: 'success',
//               confirmButtonText: 'OK',
//               customClass: {
//                 confirmButton: 'bx--btn bx--btn--primary'
//               }
//             }).then(() => location.reload());
//           } else {
//             Swal.fire('Error', data.error || 'Failed to create', 'error');
//           }
//         })
//         .catch(err => {
//           Swal.fire('Error', err.message || 'Failed to create', 'error');
//         });
//     }
//   });
// }
function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  const r = parseInt(result[0], 10);
  const g = parseInt(result[1], 10);
  const b = parseInt(result[2], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toLowerCase(); // force lowercase to match JSON format
}


function getValueFromRotation(angle) {
  const angleOffset = -135;
  const angleRange = 270;
  const minValue = 7;
  const maxValue = 17;

  // normalize angle within the range
  let normalizedAngle = angle - angleOffset;
  if (normalizedAngle < 0) normalizedAngle += 360; // handle negative rotation

  const ratio = normalizedAngle / angleRange;
  let value = minValue + ratio * (maxValue - minValue);

  // Clamp value within min/max and round if needed
  if (value < minValue) value = minValue;
  if (value > maxValue) value = maxValue;
  return Math.round(value);
}


function getPedalList() {
  const pedalList = [];

  $(".pedal").each(function () {
    const $pedalDiv = $(this);
    const pedalName = $pedalDiv.data("pedal-name");
    if (pedalName) {
      pedalList.push(pedalName);
    }
  });

  return pedalList;
}


function getPedalsInPreset(songPresetArray) {

  if (!songPresetArray) return [];

  const pedalNames = songPresetArray.map(p => p.name);
  return [...new Set(pedalNames)]; // Ensures uniqueness
}


  function getRotationFromValue(control, value) {
    let index = 0, range = 1, min = 0, max = 1;

    if (control.values && Array.isArray(control.values)) {
      index = control.values.indexOf(value);
      if (index === -1) index = 0;
      min = 0;
      max = control.values.length - 1;
    } else {
      min = control.min ?? 0;
      max = control.max ?? 100;
      index = value;
    }

    range = max - min;

    let angleRange = control.span === "all" ? 360 : 270;
    let angleOffset = control.span === "all" ? 0 : -135;
    const ratio = (index - min) / range;

    return angleOffset + ratio * angleRange;
  }


    function getPedalWidth(width) {
    switch (width) {
      case "xsmall": return "70px";
      case "small": return "110px";
      case "standard": return "190px";
      case "large": return "210px";
      case "larger": return "250px";
      case "xlarge": return "400px";
      case "wide": return "550px";
      case "wider": return "600px";
      default: return "190px";
    }
  }

  function getPedalHeight(height) {
    switch (height) {
      case "small": return "100px";
      case "standard": return "160px";
      case "large": return "200px";
      case "larger": return "240px";
      case "xlarge": return "265px";
      default: return "400px";
    }
  }





$(document).on('click', '#edit-btn', function () {
  const selectedPresetName = $('#preset-selector').val()?.trim();

  Swal.fire({
    title: "Edit preset details",
    input: "text",
    inputValue: selectedPresetName,
    inputPlaceholder: "Insert preset title...",
    inputAttributes: {
      autocapitalize: "off",
      spellcheck: "false",
      class: "bx--text-input"
    },
    showCancelButton: true,
    showDenyButton: true,  // This enables the deny button
    confirmButtonText: "Save preset",
    denyButtonText: "Delete",
    cancelButtonText: "Cancel",
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      denyButton: 'bx--btn bx--btn--danger',   // Style as a danger button if you want
      cancelButton: 'bx--btn bx--btn--tertiary'
    },
    didOpen: () => {
      const input = Swal.getInput();
      const confirmBtn = Swal.getConfirmButton();
      const denyBtn = Swal.getDenyButton();

      const forbiddenRegex = /[^a-zA-Z0-9\-_. ]|^[\u0000-\u001F]/;

      const showError = (msg) => {
        input.classList.add('bx--text-input--invalid');
        if (!$('#preset-input-error').length) {
          $(input).after(`<div id="preset-input-error" class="bx--form-requirement">${msg}</div>`);
        } else {
          $('#preset-input-error').text(msg);
        }
        confirmBtn.disabled = true;
        denyBtn.disabled = true;
      };

      const clearError = () => {
        input.classList.remove('bx--text-input--invalid');
        $('#preset-input-error').remove();
        confirmBtn.disabled = false;
        denyBtn.disabled = false;
      };

      $(input).on('input', function () {
        const val = input.value.trim();

        if (val === "") {
          showError("Preset name cannot be empty.");
        } else if (val.startsWith("_design")) {
          showError("Preset name cannot start with '_design'.");
        } else if (forbiddenRegex.test(val)) {
          showError("Only letters, numbers, spaces, dashes (-), underscores (_) and dots (.) are allowed.");
        } else {
          clearError();
        }
      });

      $(input).trigger('input'); // Trigger once on open
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Save new or overwrite logic
      const presetName = result.value?.trim();
      if (!presetName) {
        Swal.fire({
          icon: "error",
          title: "Preset name missing",
          text: "Please enter a valid preset name."
        });
        return;
      }

const userId = "user-0";  // or dynamic
const presetDataObject = collectPedalControlValues(presetName);

console.log(presetDataObject)

$.ajax({
  url: 'https://www.cineteatrosanluigi.it/plex/update_preset.php',
  type: 'POST',
  contentType: 'application/json',
  data: JSON.stringify({
    user_id: userId,
    preset_name: presetName,
    pedals: presetDataObject[presetName]
  }),
  success: function(response) {
    Swal.fire('Saved!', 'Preset saved successfully.', 'success');
    console.log('Update success:', response);
  },
  error: function(xhr, status, error) {
    Swal.fire('Error', 'Failed to save preset.', 'error');
    console.error('Update failed:', status, error);
    console.error("Payload:", JSON.stringify({
      user_id: userId,
      preset_name: presetName,
      pedals: presetDataObject[presetName]
    }));
    console.error("Server said:", xhr.responseText);
  }
});


    } else if (result.isDenied) {
      // DELETE action triggered here
      const presetName = $('#swal2-input').val()?.trim();
      if (!presetName) {
        Swal.fire({
          icon: "error",
          title: "Preset name missing",
          text: "Please enter a valid preset name to delete."
        });
        return;
      }
      const userId = "user-0";

      Swal.fire({
        title: `Are you sure you want to delete preset "${presetName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'bx--btn bx--btn--danger',
          cancelButton: 'bx--btn bx--btn--tertiary'
        }
      }).then((deleteConfirm) => {
        if (deleteConfirm.isConfirmed) {
          // AJAX call to delete preset
          $.ajax({
            url: 'https://www.cineteatrosanluigi.it/plex/delete_preset.php',  // create this PHP file
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
              user_id: userId,
              preset_name: presetName
            }),
            success: function(response) {
              Swal.fire('Deleted!', 'Preset deleted successfully.', 'success');
              console.log('Delete success:', response);
              // Update UI or preset list here
            },
            error: function(xhr, status, error) {
              Swal.fire('Error', 'Failed to delete preset.', 'error');
              console.error('Delete failed:', status, error);
            }
          });
        }
      });
    }
  });
});



function collectPedalControlValues(presetName = "Untitled Preset") {
  const pedals = [];

  $('[data-pedal-name]').each(function () {
    const pedalName = $(this).data('pedal-name');
    const $pedal = $(this);
    const controlsArray = [];
    let hasColoredLed = false;

    // Process knobs
    $pedal.find('.knob').each(function () {
      const label = $(this).data('control-label');
      const $valueLabel = $(this).next('.knob-value-label');
      let value;

      if ($valueLabel.length && $valueLabel.text().trim() !== '') {
        value = $valueLabel.text().trim();
      } else {
        const transform = $(this).css('transform');
        let angle = 0;

        if (transform && transform !== 'none') {
          const values = transform.match(/matrix\((.+)\)/)[1].split(', ');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        } else {
          const style = $(this).attr('style');
          const match = style && style.match(/rotate\((-?\d+)deg\)/);
          angle = match ? parseInt(match[1], 10) : 0;
        }

        value = getValueFromRotation(angle);
      }

      controlsArray.push({ [label]: isNaN(value) ? value : parseFloat(value) });
    });

    // Process dropdowns
    $pedal.find('select[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({ [label]: value });
    });

    // Process sliders
    $pedal.find('input[type="range"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({ [label]: parseFloat(value) });
    });

    // Process LEDs and color matching
    $pedal.find('.led[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const bgColor = $(this).css('background-color');
      const hexColor = rgbToHex(bgColor).toUpperCase();

      let matchedIndex = null;

      if (Array.isArray(pedalsJsonCache)) {
        const pedal = pedalsJsonCache.find(p => p.name === pedalName || p.id === pedalName);
        if (pedal && Array.isArray(pedal.controls)) {
          let control = null;

          for (const rowWrapper of pedal.controls) {
            if (Array.isArray(rowWrapper.row)) {
              control = rowWrapper.row.find(c => c.label === label && Array.isArray(c.colors));
              if (control) break;
            }
          }

          if (control) {
            const normalizedColors = control.colors.map(c => c.toUpperCase());
            matchedIndex = normalizedColors.indexOf(hexColor);
            if (matchedIndex !== -1 && hexColor !== '#000000') {
              hasColoredLed = true;
            } else {
              matchedIndex = null;
            }
          }
        }
      }

      controlsArray.push({ [label]: matchedIndex });
    });

    // Only include pedals with at least one matched non-black LED
    if (hasColoredLed) {
      pedals.push({
        name: pedalName,
        controls: controlsArray
      });
    }
  });

  // Return the object directly — exactly like your example preset structure
  return {
    [presetName]: pedals
  };
}




// Make knobs usable also on touch screen
document.querySelectorAll('.knob, .smallknob, .largeknob, .xlargeknob').forEach(knob => {
  let startAngle = 0;
  let currentRotation = 0;
  let center = { x: 0, y: 0 };

  const getAngle = (x, y) => {
    return Math.atan2(y - center.y, x - center.x) * 180 / Math.PI;
  };

  const startTouch = (e) => {
    const rect = knob.getBoundingClientRect();
    center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    const touch = e.touches[0];
    startAngle = getAngle(touch.clientX, touch.clientY) - currentRotation;
    e.preventDefault();
  };

  const moveTouch = (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const angle = getAngle(touch.clientX, touch.clientY);
      const rotation = angle - startAngle;
      currentRotation = rotation;
      knob.style.transform = `rotate(${rotation}deg)`;
      e.preventDefault();
    }
  };

  const endTouch = () => {
    // You could persist value here if needed
  };

  knob.addEventListener('touchstart', startTouch, { passive: false });
  knob.addEventListener('touchmove', moveTouch, { passive: false });
  knob.addEventListener('touchend', endTouch);
});







function renderPedalControls(pedal, $pedalDiv) {
    pedal.controls.forEach(controlRow => {
        const $row = $("<div>").addClass("row");

        if (pedal.type === "head") { $row.addClass("lowest-row"); }
        if (pedal.type === "pedal-inverted") { $row.addClass("lower-row"); }

        controlRow.row.forEach(control => {
          console.log(control);

            // Knobs (small, large, xlarge)
            if (["knob", "smallknob", "largeknob", "xlargeknob"].includes(control.type)) {
                const isSmall = control.type === "smallknob";
                const isLarge = control.type === "largeknob";
                const isXLarge = control.type === "xlargeknob";

                // Determine knob color and border based on control-specific override or pedal defaults
                const knobColor = control["knob-color"] ?? pedal["knobs-color"];
                const knobBorder = control["knob-border"] ?? pedal["knobs-border"];

                const knob = $("<div>")
                    .addClass(isSmall ? "smallknob" : "knob")
                    .addClass(isLarge ? "largeknob" : "knob")
                    .addClass(isXLarge ? "xlargeknob" : "knob")
                    .css({
                        background: knobColor,
                        border: `${control.border === "thick" ? "10px" : "2px"} solid ${knobBorder}`
                    })
                    .css("--indicator-color", pedal["knobs-indicator"])
                    .attr("data-control-label", control.label);

                const rotation = getRotationFromValue(control, control.value);
                knob.data("rotation", rotation);
                knob.css("transform", `rotate(${rotation}deg)`);

                let $valueLabel = null;
                if (control.values && Array.isArray(control.values)) {
                    $valueLabel = $("<div>").addClass("knob-value-label").text(control.value);
                }

                knob.on("mousedown", function (e) {
                    const startY = e.pageY;
                    const startValue = control.value;

                    $(document).on("mousemove.knob", function (e2) {
                        const delta = startY - e2.pageY;
                        const steps = Math.round(delta / 5);

                        if (control.values && Array.isArray(control.values)) {
                            let currentIndex = control.values.indexOf(startValue);
                            if (currentIndex === -1) currentIndex = 0;
                            let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                            control.value = control.values[newIndex];
                        } else {
                            const min = control.min ?? 0;
                            const max = control.max ?? 100;
                            let newValue = startValue + steps;
                            newValue = Math.min(Math.max(newValue, min), max);
                            control.value = newValue;
                        }

                        const newRotation = getRotationFromValue(control, control.value);
                        knob.data("rotation", newRotation);
                        knob.css("transform", `rotate(${newRotation}deg)`);
                        if ($valueLabel) {
                            $valueLabel.text(control.value);
                        }
                    });

                    $(document).on("mouseup.knob", function () {
                        $(document).off(".knob");
                    });
                });

                let $label;
                if (control.position === "under-top" && control.type === "smallknob") {
                    $label = $("<div>").css({
                        position: "absolute",
                        "margin-left": "4px",
                        top: "105px",
                        transform: "translateY(-50%)",
                        "white-space": "nowrap",
                        "font-size": "10px"
                    }).text(control.label);
                } else {
                    $label = $("<div>").addClass("label-top").text(control.label);
                }

                const $container = $("<div>").addClass("knob-container").append(knob).css({ position: "relative" });
                $container.append($label);
                if ($valueLabel) $container.append($valueLabel);
                const $knobWrapper = $("<div>").append($label, $container);

                if (control.position === "under-top" && $row.children().length > 0) {
                    const $prev = $row.children().last();
                    $prev.append($("<div>").css("margin-top", "-53px").append($label, $container));
                } else if (control.position === "higher") {
                    $knobWrapper.css("margin-top", "-10px");
                    $row.append($knobWrapper);
                } else {
                    $row.append($knobWrapper);
                }
            }

            // LEDs
            if (control.type === "led") {
                const colors = Array.isArray(control.colors) ? control.colors : ["#000000"];
                const numColors = colors.length;
                let currentIndex = typeof control.value === "number" ? control.value : 0;

                const $label = $("<div>").addClass("label-top");

                const led = $("<div>")
                    .addClass("led")
                    .attr("data-control-label", control.label)
                    .css("cursor", "pointer");

                const setColor = (index) => {
                    const color = colors[index] || "#000000";
                    led.css("background-color", color);
                    led.css("box-shadow", color !== "#000000" ? `0 0 8px 3px ${color}` : "none");
                    control.value = index; // update value in control object
                    led.data("colorIndex", index);
                };

                setColor(currentIndex);

                led.on("click", function () {
                    let index = (led.data("colorIndex") + 1) % numColors;
                    setColor(index);
                });

                const $ledContainer = $("<div>").append($label, led);

                if (control.position === "under-top" && $row.children().length > 0) {
                    const $prev = $row.children().last();
                    $prev.append($("<div>").css("margin-top", "0px").append($label, led));
                } else if (control.position === "lower") {
                    $ledContainer.css("margin-top", "25px");
                    $row.append($ledContainer);
                } else if (control.position === "right") {
                    $ledContainer.css({
                        "right": "12px",
                        position: "absolute"
                    });
                    $row.append($ledContainer);
                } else {
                    $row.append($ledContainer);
                }
            }

            // Slider
            if (control.type === "slider") {
                const $label = $("<div>").addClass("slider-label").text(control.label);
                const $slider = $("<input type='range'>")
                    .attr("min", control.min)
                    .attr("max", control.max)
                    .val(control.value)
                    .addClass("vertical")
                    .attr("data-control-label", control.label);

                $slider.on("input", function () {
                    control.value = parseInt(this.value);
                });

                const $wrapper = $("<div>").addClass("slider-container").append($slider, $label);
                $row.append($wrapper);
            }

            // LCD
            if (control.type === "lcd") {
                const $label = $("<div>").addClass("label-top");

                const $lcd = $("<input type='text'>")
                    .val(control.value)
                    .attr("data-control-label", control.label)
                    .css({
                        width: `${control.width * 6}px`,
                        height: `${control.height * 6}px`,
                        fontFamily: "monospace",
                        fontSize: "17px",
                        textAlign: "center",
                        backgroundColor: "#111",
                        color: "#fc0000",
                        border: "2px solid #333",
                        borderRadius: "4px",
                        padding: "2px",
                        position: "relative",
                        top: "15px"
                    });

                $lcd.on("input", function () {
                    control.value = $(this).val();
                });

                const $wrapper = $("<div>").addClass("lcd-wrapper").append($label, $lcd);
                $row.append($wrapper);
            }

            // Multi-select
            if (control.type === "multi") {
                const $label = $("<div>").addClass("label-top").text(control.label);
                const $select = $("<select>").attr("data-control-label", control.label);
                control.values.forEach(val => {
                    const $option = $("<option>").val(val).text(val);
                    if (val === control.value) $option.attr("selected", true);
                    $select.append($option);
                });

                const $wrapper = $("<div>").append($label, $select);

                if (control.position === "left") {
                    $wrapper.addClass("align-left");
                } else if (control.position === "right") {
                    $wrapper.addClass("align-right");
                } else if (control.position === "higher") {
                    $wrapper.addClass("align-top");
                } else if (control.position === "highest") {
                    $wrapper.addClass("align-top-est");
                }

                $row.append($wrapper);
            }

            // Switch
            if (control.type === "switch") {
                const $label = $("<div>").addClass("label-top").text(control.label);
                const $input = $("<input type='checkbox'>").prop("checked", control.value).attr("data-control-label", control.label);
                $row.append($("<div>").append($label, $input));
            }

        });

        $pedalDiv.append($row);
    });
}




function setupEditPedalHandler(pedals) {
    $(document).on("click", ".edit-btn", function () {
        const pedal = $(this).data("pedal");

        if (!pedal) {
            console.error("Pedal data not found!");
            return;
        }

        const pedalCopy = { ...pedal };
        delete pedalCopy._rev;

        const pedalJson = JSON.stringify(pedalCopy, null, 2);

        Swal.fire({
            title: `Edit ${pedal._id}`,
            input: 'textarea',
            width: 800,
            inputValue: pedalJson,
            inputAttributes: {
                'aria-label': 'Editable JSON',
                style: 'height:400px;font-family:monospace;font-size:12px;'
            },
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
            preConfirm: (inputValue) => {
                try {
                    return JSON.parse(inputValue);
                } catch (e) {
                    Swal.showValidationMessage('Invalid JSON');
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = result.value;
                updated._rev = pedal._rev;

                const revx = pedals.findIndex(p => p._rev === pedal._rev);
                if (revx !== -1) pedals[revx] = updated;

                fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_CATALOG.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updated)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: 'Gear saved!',
                            icon: 'success',
                            confirmButtonText: 'OK',
                            customClass: {
                                confirmButton: 'bx--btn bx--btn--primary'
                            }
                        }).then(() => {
                            location.reload();
                        });
                    } else {
                        Swal.fire('Error', data.error || 'Failed to save', 'error');
                    }
                })
                .catch(err => {
                    Swal.fire('Error', err.message || 'Failed to save', 'error');
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
                        fetch('https://www.cineteatrosanluigi.it/plex/DELETE_FROM_CATALOG.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                _id: pedal._id,
                                _rev: pedal._rev
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                Swal.fire('Deleted!', 'The gear has been removed.', 'success')
                                    .then(() => location.reload());
                            } else {
                                Swal.fire('Error', data.error || 'Failed to delete', 'error');
                            }
                        })
                        .catch(err => {
                            Swal.fire('Error', err.message || 'Failed to delete', 'error');
                        });
                    }
                });
            }
        });
    });
}

// Make it available globally
window.setupEditPedalHandler = setupEditPedalHandler;

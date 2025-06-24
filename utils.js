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
      case "small": return "100px";
      case "standard": return "190px";
      case "large": return "210px";
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
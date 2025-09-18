// HELPER
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

// HELPER
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


// HELPER
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



// HELPER
function getPedalsInPreset(songPresetArray) {
  if (!songPresetArray) return [];
    const pedalNames = songPresetArray.map(p => p.name);
  
    return [...new Set(pedalNames)]; // Ensures uniqueness
}


// HELPER
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

  let angleRange, angleOffset;

  switch (control.span) {
  case "all":
      angleRange = 360;
      angleOffset = 0;
      break;
  case "three-quarters":
      angleRange = 270;
      angleOffset = -135;
      break;
  case "half":
      angleRange = 180;
      angleOffset = 180;
      break;
  case "half-shift":
      angleRange = -180;
      angleOffset = 30;
      break;
  case "half-shift-inverted":
      angleRange = 180;
      angleOffset = 150;
      break;
  case "quarter":
      angleRange = -90;
      angleOffset = 30;
      break;
  case "tenToTwo":
      angleRange = 120;
      angleOffset = 300;
      break;
  default:
      angleRange = 270;
      angleOffset = -135;
  }

  const ratio = (index - min) / range;

  return angleOffset + ratio * angleRange;
}

// HELPER
function getPedalWidth(width) {
  switch (width) {
    case "xsmall": return "70px";
    case "smaller": return "90px";
    case "small": return "120px";
    case "medium": return "140px";
    case "standard": return "190px";
    case "large": return "210px"; 
    case "+large": return "230px"; 
    case "larger": return "250px";
    case "+larger": return "300px";
    case "++larger": return "350px";
    case "xlarge": return "400px";
    case "xlarger": return "450px";
    case "largest": return "500px";
    case "wide": return "550px";
    case "wider": return "600px";
    case "widest": return "700px";
    case "xwidest": return "775px";
    default: return "190px";
  }
}

// HELPER
function getPedalHeight(height) {
  switch (height) {
    case "xsmall": return "70px";
    case "smaller": return "90px";
    case "small": return "110px";
    case "medium": return "140px";
    case "standard": return "160px";
    case "large": return "190px";
    case "+large": return "210px";
    case "larger": return "240px";
    case "xlarge": return "255px";
    case "xlarger": return "265px";
    case "largest": return "350px";
    case "xlargest": return "400px";
    case "tall": return "450px";
    default: return "500px";
  }
}




// TODO: Make knobs usable also on touch screen
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






// Function to render pedal controls dynamically
function renderPedalControls(pedal, $pedalDiv) {

    pedal.controls.forEach(controlRow => {
        const $row = $("<div>").addClass("row");

        // Used to correctly display controls
        if (pedal.type === "head") { $row.addClass("lowest-row"); }
        if (pedal.type === "pedal-inverted") { $row.addClass("lower-row"); }

        controlRow.row.forEach(control => {

            // Knobs (small, large, xlarge)
            if (["knob", "smallknob", "largeknob", "xlargeknob"].includes(control.type)) {
                const isSmall = control.type === "smallknob";
                const isLarge = control.type === "largeknob";
                const isXLarge = control.type === "xlargeknob";

                // Determine knob color and border based on control-specific override or pedal defaults
                const knobColor = control["knob-color"] ?? pedal["knobs-color"];
                const knobBorder = control["knob-border"] ?? pedal["knobs-border"];
                const knobIndicator = control["knob-indicator"] ?? pedal["knobs-indicator"];
                const isThick = control.border === "thick";

                const knob = $("<div>")
                    .addClass(isSmall ? "smallknob" : "knob")
                    .addClass(isLarge ? "largeknob" : "knob")
                    .addClass(isXLarge ? "xlargeknob" : "knob")
                    .toggleClass("thick", isThick)
                    .css({
                        background: knobColor,
                        border: `${control.border === "thick" ? "10px" : "2px"} solid ${knobBorder}`
                    })
                    .css("--indicator-color", knobIndicator)
                    .attr("data-control-label", control.label);


const $tooltip = $("<div>")
  .addClass("bx--tooltip bx--tooltip--top")
  .attr("data-tooltip", "")
  .css({
    display: "none",
    position: "absolute",
    top: "38px",
    left: "50%",
    transform: "translateX(-50%)"
    // "z-index": "10"
  });

// caret (the arrow)
const $caret = $("<span>").addClass("bx--tooltip__caret");

// label (the text inside)
const $tooltipText = $("<span>").addClass("bx--tooltip__label").text(control.value);

// put them together
$tooltip.append($caret, $tooltipText);




                const rotation = getRotationFromValue(control, control.value);
                knob.data("rotation", rotation);
                knob.css("transform", `rotate(${rotation}deg)`);

                let $valueLabel = null;
                if (control.values && Array.isArray(control.values)) {
                    $valueLabel = $("<div>").addClass("knob-value-label").text(control.value);
                }

                // knob.on("mousedown", function (e) {
                //     const startY = e.pageY;
                //     const startValue = control.value;

                //     $(document).on("mousemove.knob", function (e2) {
                //         const delta = startY - e2.pageY;
                //         const steps = Math.round(delta / 5);

                //         if (control.values && Array.isArray(control.values)) {
                //             let currentIndex = control.values.indexOf(startValue);
                //             if (currentIndex === -1) currentIndex = 0;
                //             let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                //             control.value = control.values[newIndex];
                //         } else {
                //             const min = control.min ?? 0;
                //             const max = control.max ?? 100;
                //             let newValue = startValue + steps;
                //             newValue = Math.min(Math.max(newValue, min), max);
                //             control.value = newValue;
                //         }

                knob.on("mousedown", function (e) {
                  const startY = e.pageY;
                  const startValue = control.value;

                  $(document).on("mousemove.knob", function (e2) {
                      const delta = startY - e2.pageY;

                      if (control.values && Array.isArray(control.values)) {
                          // ✅ Discrete knobs: unchanged
                          const steps = Math.round(delta / 5);
                          let currentIndex = control.values.indexOf(startValue);
                          if (currentIndex === -1) currentIndex = 0;
                          let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                          control.value = control.values[newIndex];
                      } else {
                          // ✅ Numeric knobs: make positions 10× denser
                          const min = control.min ?? 0;
                          const max = control.max ?? 100;
                          const steps = (delta / 5) / 2; 
                          let newValue = startValue + steps;
                          newValue = Math.min(Math.max(newValue, min), max);
                          control.value = parseFloat(newValue.toFixed(2)); // keep decimals clean
                      }


                        const newRotation = getRotationFromValue(control, control.value);
                        knob.data("rotation", newRotation);
                        knob.css("transform", `rotate(${newRotation}deg)`);
                        if ($valueLabel) {
                            $valueLabel.text(control.value);
                        }
                        // 🔥 Show/update tooltip while dragging
                        $tooltipText.text(control.value);
                        $tooltip.show();

                    });

                    $(document).on("mouseup.knob", function () {
                        $(document).off(".knob");
                        $tooltip.hide(); // 🔥 Hide tooltip when released
                    });

                });

                let $label;
                if (control.position === "under-top" && control.type === "smallknob") {
                    $label = $("<div>").css({
                        position: "absolute",
                        "margin-left": "4px",
                        "margin-top": "45px",
                        transform: "translateY(-50%)",
                        "white-space": "nowrap",
                        "font-size": "10px"
                    }).text(control.label);
                } 
                else {
                    $label = $("<div>").addClass("label-top").text(control.label);
                }

                const $container = $("<div>").addClass("knob-container").append(knob).css({ position: "relative" }).append(knob, $tooltip);;
                $container.append($label);
                if ($valueLabel) $container.append($valueLabel);
                const $knobWrapper = $("<div>").append($label, $container);

                if (typeof control.position === "string") {
                    const pos = control.position;

                    // under-top logic
                    if (pos.includes("under-top") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append($("<div>").css("margin-top", "-53px").append($label, $container));
                        return;
                    }

                    // align-top logic
                    if (pos.includes("align-top-clearer") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append($("<div>").css("margin-top", "0px").append($label, $container));
                        return;
                    }
                    if (pos.includes("align-top-clear") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append($("<div>").css("margin-top", "-14px").append($label, $container));
                        return;
                    }
                    if (pos.includes("align-top") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append($("<div>").css("margin-top", "-23px").append($label, $container));
                        return;
                    }


                    // Vertical adjustments
                    if (pos.includes("highest")) { $knobWrapper.css("margin-top", "-25px"); }
                    else if (pos.includes("higher")) { $knobWrapper.css("margin-top", "-10px"); }
                    else if (pos.includes("high")) { $knobWrapper.css("margin-top", "-3px"); }
                    else if (pos.includes("lowest")) { $knobWrapper.css("margin-top", "45px"); }
                    else if (pos.includes("lower")) { $knobWrapper.css("margin-top", "25px"); }
                    else if (pos.includes("low")) { $knobWrapper.css("margin-top", "9px"); }

                    // Margin-right
                    const rightMatch = pos.match(/margin-right:\s*(\d+)px/);
                    if (rightMatch) { $knobWrapper.css("margin-right", rightMatch[1] + "px"); }

                    // Margin-left
                    const leftMatch = pos.match(/margin-left:\s*(\d+)px/);
                    if (leftMatch) { $knobWrapper.css("margin-left", leftMatch[1] + "px"); }

                    $row.append($knobWrapper);

                } else { $row.append($knobWrapper); }


            }

            // LEDs
            if (control.type === "led") {
                const colors = Array.isArray(control.colors) ? control.colors : ["#000000"];
                const numColors = colors.length;
                let currentIndex = typeof control.value === "number" ? control.value : 0;

                const $label = $("<div>").addClass("label-top");

                if (control.showlabel === "yes") { $label.text(control.label) }

                const led = $("<div>")
                    .addClass("led")
                    .attr("data-control-label", control.label)
                    .css("cursor", "pointer");

                const setColor = (index) => {
                    const color = colors[index] || "#000000";
                    led.css("background-color", color);
                    //led.css("box-shadow", color !== "#000000" ? `0 0 8px 3px ${color}` : "none");
                    led.css("box-shadow", color === "#000000"
                    ? "inset -2px -2px 2px rgba(255, 255, 255, 0.3), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                    : `0 0 12px 4px ${color}, 0 0 20px 6px ${color}`);
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
                } else if (control.position === "align-top" && $row.children().length > 0) {
                    const $prev = $row.children().last();
                    $prev.append($("<div>").css("margin-top", "8px").append($label, led));
                }
                else if (control.position === "xlow") { $ledContainer.css("margin-top", "50px"); $row.append($ledContainer); }
                else if (control.position === "lowest") { $ledContainer.css("margin-top", "40px"); $row.append($ledContainer); }
                else if (control.position === "lower") { $ledContainer.css("margin-top", "25px"); $row.append($ledContainer);}
                else if (control.position === "low") { $ledContainer.css("margin-top", "10px"); $row.append($ledContainer);}
                else if (control.position === "high") { $ledContainer.css("margin-top", "-15px"); $row.append($ledContainer); }
                else if (control.position === "higher") { $ledContainer.css("margin-top", "-25px"); $row.append($ledContainer); }
                else if (control.position === "highest") { $ledContainer.css("margin-top", "-30px"); $row.append($ledContainer);}
                else if (control.position === "right") { $ledContainer.css({"right": "12px", position: "absolute"}); $row.append($ledContainer); }
                
                else if (typeof control.position === "string" && control.position.startsWith("margin-right:")) {
                    // Extract the pixel value
                    // const match = control.position.match(/margin-right:\s*(\d+)px/);
                    const match = control.position.match(/margin-right:\s*(-?\d+)px/);
                    if (match) {
                        const px = match[1] + "px";
                        $ledContainer.css("margin-right", px);
                    }
                    $row.append($ledContainer);
                } else if (typeof control.position === "string" && control.position.startsWith("margin-left:")) {
                    // Extract the pixel value
                    // const match = control.position.match(/margin-left:\s*(\d+)px/);
                    const match = control.position.match(/margin-left:\s*(-?\d+)px/);
                    if (match) {
                        const px = match[1] + "px";
                        $ledContainer.css("margin-left", px);
                    }
                    $row.append($ledContainer);

                } else { $row.append($ledContainer); }
            }

            // Slider
            if (control.type === "slider") {
              const $label = $("<div>").text(control.label).addClass("slider-label");

              const $slider = $("<input type='range'>")
                .attr({
                  min: control.min,
                  max: control.max,
                  value: control.value,
                  "data-control-label": control.label
                })
                .on("input", function () { control.value = parseFloat($(this).val()); });

                let $sliderWrapper;

              if (control.orientation === "vertical") {
                $slider.addClass("vertical");
                $sliderWrapper = $("<div>")
                .addClass("slider-wrapper-vertical")
                .css({ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 -12px" }) // gestire casi qui lower -30px
                .append($label, $slider);

              } else if (control.orientation === "vertical small") {
                $slider.addClass("verticalsmall");
                $sliderWrapper = $("<div>")
                  .addClass("slider-wrapper-vertical")
                  .css({ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 -12px" })
                  .append($label, $slider);
              } else {
                $slider.addClass("horizontal");
                $sliderWrapper = $("<div>")
                  .addClass("slider-wrapper-horizontal")
                  .css({ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "10px", width: "100%" })
                  .append($label, $slider);
              }

              $row.append($sliderWrapper);
            }



            // LCD
            if (control.type === "lcd") {
                const $label = $("<div>").addClass("label-top");

                const textColor = control["text-color"] || "#fc0000"; 
                const screenColor = control["screen-color"] || "#111";

                const $lcd = $("<input type='text'>")
                    .val(control.value)
                    .attr("data-control-label", control.label)
                    .css({
                        width: `${control.width * 6}px`,
                        height: `${control.height * 6}px`,
                        fontFamily: "monospace",
                        fontSize: "17px",
                        textAlign: "center", 
                        backgroundColor: screenColor,
                        color: textColor,
                        border: "2px solid #333",
                        borderRadius: "4px",
                        padding: "2px",
                        position: "relative",
                        top: "15px"
                    });

                if (control.shape === "round") { 
                    $lcd.css("border-radius", "50%");
                    $lcd.css("font-size", "12px");
                    $lcd.css("width",`${control.width * 6}px`);
                    $lcd.css("height",`${control.width * 6}px`);
                } 

                $lcd.on("input", function () { control.value = $(this).val(); });

                const $wrapper = $("<div>").addClass("lcd-wrapper").append($label, $lcd);

                if (control.position === "higher") { $lcd.css("margin-top", "-30px"); $row.append($wrapper); }
                else if (control.position === "high") { $lcd.css("margin-top", "-15px"); $row.append($wrapper); }
                else if (control.position === "lower") { $lcd.css("margin-top", "10px"); $row.append($wrapper); } 
                else { $row.append($wrapper); }

                
            }

            // Multi-select
            if (control.type === "multi") {
                const $label = $("<div>").addClass("label-top");
                if (control.showlabel !== "no") { $label.text(control.label) }
                const $select = $("<select>").attr("data-control-label", control.label);
                control.values.forEach(val => {
                    const $option = $("<option>").val(val).text(val);
                    if (val === control.value) $option.attr("selected", true);
                    $select.append($option);
                });

                const $wrapper = $("<div>").append($label, $select);

                if (control.position === "left") { $wrapper.addClass("align-left"); } 
                else if (control.position === "right") { $wrapper.addClass("align-right"); } 
                else if (control.position === "lower") { $wrapper.addClass("align-bottom"); } 
                else if (control.position === "higher") { $wrapper.addClass("align-top"); } 
                else if (control.position === "highest") { $wrapper.addClass("align-top-est"); } 
                else if (typeof control.position === "string" && control.position.startsWith("margin-right:")) {
                    const match = control.position.match(/margin-right:\s*(\d+)px/);
                    if (match) {
                        const px = match[1] + "px";
                        $wrapper.css("margin-right", px);
                    }
                }
                else if (control.position === "align-top" && $row.children().length > 0) {
                    const $prev = $row.children().last();
                    $prev.append($("<div>").css("margin-top", "8px").append($label, $select));
                }
                
                $row.append($wrapper);
            }

        });

        $pedalDiv.append($row);
    }); 
}


// Edit gears in catalog page
function setupEditPedalHandler(pedals) {
  $(document).on("click", ".edit-btn", function () {

    const pedal = $(this).data("pedal");
    if (!pedal) {
      console.error("Pedal data not found!");
      return;
    }

    const isAdmin = window.currentUser.role === 'admin';
    const isAuthor = window.currentUser.username === pedal.author;

    const isLockedStatus = ["reviewing", "public"].includes(
      (pedal.published || "").toLowerCase()
    );

    // Decide which buttons to show
    let boolConfirmBtn = true;
    let boolDenyBtn = true;
    let boolCancelBtn = true;

    // Restriction: user is not admin, is author, and pedal is reviewing/public
    if (!isAdmin && isAuthor && isLockedStatus) {
      boolConfirmBtn = false; // remove Save
      boolDenyBtn = false;    // remove Delete
      boolCancelBtn = true;   // keep Cancel
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

          // IMPORTANT: force duplicated pedal to default to draft (do not inherit)
          newPedal.published = "draft";

          Swal.close();

          // reopen editor with duplicated pedal
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
                fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_CATALOG.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newPedalData)
                })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    // Swal.fire({
                    //   title: 'Duplicated!',
                    //   text: 'Your gear has been copied.',
                    //   icon: 'success',
                    //   confirmButtonText: 'OK',
                    //   customClass: {
                    //     confirmButton: 'bx--btn bx--btn--primary'
                    //   }
                    // })
                    // .then(() => location.reload());
                    if (data.success) {
                      const createdPedal = {
                        ...newPedalData,
                        _id: data.id,
                        _rev: data.rev
                      };

                      // Add to global array
                      pedals.push(createdPedal);

                      // Render the new pedal
                      const $pedalDiv = renderPedal(createdPedal, window.currentUser.role || "user");
                      $pedalDiv.attr("data-author", createdPedal.author || "");
                      $pedalDiv.attr("data-published", (createdPedal.published || "draft").toLowerCase());
                      $("#catalog").append($pedalDiv);

                      // Update pedal count
                      updatePedalCounts(); // <-- replaces with full counters, includes all statuses

                      // Re-bind edit handlers if needed
                      setupEditPedalHandler(pedals);

                      Swal.fire({
                        title: 'Duplicated!',
                        text: 'Your gear has been copied.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        customClass: { confirmButton: 'bx--btn bx--btn--primary' }
                      });
                    }

                  } else {
                    Swal.fire({
                      title: 'Error',
                      text: data.error || 'Failed to save duplicate',
                      icon: 'error',
                      confirmButtonText: 'OK',
                      customClass: {
                        confirmButton: 'bx--btn bx--btn--primary'
                      }
                    });
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

        // Force rebuild so errors clear when corrected
        const validation = iframe.contentWindow.buildJSON
          ? iframe.contentWindow.buildJSON()
          : iframe.contentWindow.getPedalValidation();

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

        fetch('https://www.cineteatrosanluigi.it/plex/UPDATE_CATALOG.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
        .then(res => res.json())
        .then(data => {
          Swal.hideLoading();
          // if (data.success) {
          //   Swal.fire({
          //     title: 'Gear saved!',
          //     icon: 'success',
          //     confirmButtonText: 'OK',
          //     customClass: { confirmButton: 'bx--btn bx--btn--primary' }
          //   }).then(() => location.reload());
          if (data.success) {
            // Update pedal in array
            const idx = pedals.findIndex(p => p._id === updated._id);
            if (idx !== -1) {
              pedals[idx] = {
                ...updated,
                _id: data.id || updated._id,   // backend might send `id`
                _rev: data.rev || updated._rev // backend should send `rev`
              };
            }

            // Replace the DOM element
            const $old = $(`[data-pedal-id="${updated._id}"]`);
            if ($old.length) {
              const $new = renderPedal(pedals[idx], window.currentUser.role || "user");
              $old.replaceWith($new);
            }

            // Update pedal count
            updatePedalCounts(); // <-- replaces with full counters, includes all statuses

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
                        fetch('https://www.cineteatrosanluigi.it/plex/DELETE_FROM_CATALOG.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                _id: pedal._id,
                                _rev: pedal._rev
                            })
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
                                // }).then(() => location.reload());
                                }).then(() => {
                                // Remove from array
                                const idx = pedals.findIndex(p => p._id === pedal._id);
                                if (idx !== -1) pedals.splice(idx, 1);

                                // Remove from DOM
                                $(`[data-pedal-id="${pedal._id}"]`).remove();

                                // Update pedal count
                                updatePedalCounts(); // <-- replaces with full counters, includes all statuses
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
  });
}

window.setupEditPedalHandler = setupEditPedalHandler;




  function sanitizeHtml(html) {
    if (typeof DOMPurify !== "undefined") {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['span', 'br', 'hr', 'div'],
            ALLOWED_ATTR: ['style']
        });
    } else {
        return html;
    }
  }


  function safeLogoStyle(inputStyle) {
    if (!inputStyle) return "";
    // Reject javascript or expression
    if (/expression\s*\(|javascript:/i.test(inputStyle)) { return ""; }

    // Optionally allow only certain props
    const allowedProps = ["color", "font-size", "font-weight", "font-style", "font-family", 
                          "background-color", "padding", "position", "margin", "margin-left", "margin-right", "margin-bottom", 
                          "bottom", "top", "left", "right", "letter-spacing", "word-spacing", "display", "border", "margin-top", 
                          "line-height", "transform", "height", "width", "border-radius", "box-shadow", "background-size",
                          "background-image", "text-align", "background", "rotate", "overflow", "white-space", "text-shadow"];
    const safeRules = inputStyle.split(";").filter(rule => {
      const [prop] = rule.split(":");
      return allowedProps.includes(prop.trim().toLowerCase());
    });
    return safeRules.join(";");
  }



// Render a gear in catalog and editor
function renderPedal(pedal, userRole) {
  const pedalId = pedal._id || pedal.id;
  const pedalName = pedal.name || pedal.id;
  const insideColorRaw = pedal["inside-color"] || "";
  let inside = "";
  let colorOnly = insideColorRaw;

  // Detect if inside-color is an image
  const isImage = /^https?:\/\/|^data:image\/|^images\/|\.png$|\.jpg$|\.jpeg$|\.gif$/i.test(insideColorRaw);
  if (isImage) {
    inside = "full";
  } else {
    const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
    if (match) {
      colorOnly = match[1];
      inside = match[2] || "";
    }
  }

  // Base CSS
  const baseCss = {
    border: `5px solid ${pedal["color"]}`,
    borderRadius: '10px',
    color: pedal["font-color"],
    width: getPedalWidth(pedal.width),
    height: getPedalHeight(pedal.height),
    marginBottom: '10px',
    display: 'inline-block',
    ...(pedal["inside-border"] && {
      boxShadow: `inset 0 0 0 3px ${pedal["inside-border"]}`
    }),
    ...(isImage ? {
      backgroundImage: `url("${insideColorRaw}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : {
      background: colorOnly
    })
  };

  let $pedalDiv;

  // Different rendering per pedal type
  switch (pedal.type) {
    case "pedal":
    case "expression":
    case "combo":
    case "head":
    case "pedal-inverted":
    case "round":
      $pedalDiv = $("<div>")
        .addClass("pedal-catalog")
        .css(getPedalTypeCss(pedal, baseCss, inside))
        .attr("data-pedal-name", pedalName)
        .attr("data-pedal-id", pedalId)
        .attr("data-published", (pedal.published || "draft").toLowerCase())
        .attr("data-author", pedal.author || "");
      break;
  }

  const cleanName = sanitizeHtml(pedal.name);


  // Head and inverted pedals → add name/logo
  if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
    const $nameDiv = $("<div>").addClass("head-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
    $pedalDiv.append($nameDiv);
  }

  // Render pedal controls
  renderPedalControls(pedal, $pedalDiv);

  // Add name/logo for others
  if (["pedal", "combo", "round", "expression"].includes(pedal.type)) {
    const $nameDiv = $("<div>").addClass("pedal-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
    $pedalDiv.append($nameDiv);
  } 


  // Add author label below pedal based on userRole
  if (window.currentUser && pedal.author) {
    const isAdmin = userRole === 'admin';
    const isAuthor = window.currentUser.username === pedal.author;

    if (isAdmin || isAuthor) {
      const authorText = isAdmin
        ? `by: ${pedal.author}, ${pedal.published}` // admin sees all
        : `by: ${pedal.author}, ${pedal.published}`; // regular user sees their own

      const $authorDiv = $("<div>")
        .addClass("pedal-author")
        .text(authorText);

      $pedalDiv.prepend($authorDiv);
    }
  }

  // Add edit button if admin OR current user is the author. Disable for author if status is reviewing or public
  if (window.currentUser) {
    const isAdmin = userRole === 'admin';
    const isAuthor = window.currentUser.username === pedal.author;
    // const isLockedStatus = ["reviewing", "public"].includes(
    //   (pedal.published || "").toLowerCase()
    // );

    // if (isAdmin || (isAuthor && !isLockedStatus)) {
    if (isAdmin || isAuthor) {
      const $editBtn = $("<button>")
        .addClass("edit-btn")
        .attr("title", "Edit pedal JSON")
        .data("pedal", pedal)
        .html(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16">
            <path d="M28.7 19.4l-2.1-.5a11.3 11.3 0 000-5.8l2.1-.5a1 1 0 00.7-1.2 13.4 13.4 0 00-1.7-4.2 1 1 0 00-1.4-.4l-2 1.2a11.3 11.3 0 00-5-2.9V2.3A1 1 0 0018 2h-4a1 1 0 00-1 1v2.2a11.3 11.3 0 00-5 2.9l-2-1.2a1 1 0 00-1.4.4 13.4 13.4 0 00-1.7 4.2 1 1 0 00.7 1.2l2.1.5a11.3 11.3 0 000 5.8l-2.1.5a1 1 0 00-.7 1.2 13.4 13.4 0 001.7 4.2 1 1 0 001.4.4l2-1.2a11.3 11.3 0 005 2.9v2.2a1 1 0 001 1h4a1 1 0 001-1v-2.2a11.3 11.3 0 005-2.9l2 1.2a1 1 0 001.4-.4 13.4 13.4 0 001.7-4.2 1 1 0 00-.7-1.2zM16 21a5 5 0 110-10 5 5 0 010 10z"/>
          </svg>
        `);
      $pedalDiv.append($editBtn);
    }
  }

  return $pedalDiv;
}




// HELPER: returns CSS depending on type + inside
function getPedalTypeCss(pedal, baseCss, inside) {
  switch (pedal.type) {
    case "pedal":
      return {
        ...baseCss,
        boxShadow: inside === "full" ?
          `0 4px 8px rgba(0,0,0,0.3)` + (baseCss.boxShadow ? `, ${baseCss.boxShadow}` : "") :
          `0 4px 8px rgba(0,0,0,0.3), inset 0 -36px 0 0 ${pedal["color"]}`
      };
    case "expression":
      return {
        ...baseCss,
        borderRadius: "25px",
          boxShadow: inside === "full" ?
          `0 4px 8px rgba(0,0,0,0.3)` + (baseCss.boxShadow ? `, ${baseCss.boxShadow}` : "") :
          `0 4px 8px rgba(0,0,0,0.3), inset 0 -36px 0 0 ${pedal["color"]}`
      };
    case "combo":
      return {
        ...baseCss,
        boxShadow: inside === "full" ?
          baseCss.boxShadow || "" :
          `0 4px 8px rgba(0,0,0,0.3), inset 0 -80px 0 0 ${pedal["color"]}`
      };
    case "head":
    case "pedal-inverted":
      return {
        ...baseCss,
        boxShadow: inside === "full" ?
          `0 4px 8px rgba(0,0,0,0.3)` + (baseCss.boxShadow ? `, ${baseCss.boxShadow}` : "") :
          `0 4px 8px rgba(0,0,0,0.3), inset 0 80px 0 0 ${pedal["color"]}`
      };
    case "round":
      return {
        ...baseCss,
        borderRadius: "50%",
          width: getPedalWidth(pedal.width),
          height: getPedalWidth(pedal.width),
          boxShadow: `0 4px 8px rgba(0,0,0,0.3), inset 0 0 0 3px ${pedal["inside-border"] || pedal["color"]}`
      };
  }
  return baseCss;
}






// Get all active gears controls to save the preset
function collectPedalControlValues(presetName = "Untitled Preset") {
  const pedals = [];

  $('[data-pedal-name]').each(function () {
    const pedalName = $(this).data('pedal-name');
    const pedalId = $(this).data('pedal-id');

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

      controlsArray.push({
        [label]: isNaN(value) ? value : parseFloat(value)
      });
    });

    // Process dropdowns
    $pedal.find('select[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({
        [label]: value
      });
    });

    // Process sliders
    $pedal.find('input[type="range"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val();
      controlsArray.push({
        [label]: parseFloat(value)
      });
    });

    // Process LCDs
    $pedal.find('input[type="text"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const value = $(this).val().trim();
      controlsArray.push({
        [label]: value
      });
    });

    // Process LEDs
    $pedal.find('.led[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      const bgColor = $(this).css('background-color');
      const hexColor = rgbToHex(bgColor).toLowerCase();

      let matchedIndex = null;

      if (Array.isArray(window.catalog)) {
        const pedal = window.catalog.find(p => p.name === pedalName || p.id === pedalName);
        if (pedal && Array.isArray(pedal.controls)) {
          let control = null;

          for (const rowWrapper of pedal.controls) {
            if (Array.isArray(rowWrapper.row)) {
              control = rowWrapper.row.find(c => c.label === label && Array.isArray(c.colors));
              if (control) break;
            }
          }

          if (control && Array.isArray(control.colors)) {
            const catalogColors = control.colors.map(c => c.toLowerCase());
            matchedIndex = catalogColors.indexOf(hexColor);

            // LED is on if it's not black and it matched a defined color
            if (matchedIndex !== -1 && hexColor !== '#000000') {
              hasColoredLed = true;
            }
          }
        }
      }

      controlsArray.push({
        [label]: matchedIndex
      });
    });

    // Only save pedal if at least one LED is ON
    if (hasColoredLed) {
      pedals.push({
        id: pedalId,
        name: pedalName,
        controls: controlsArray
      });
    }
  });

  return {
    [presetName]: pedals
  };
}




// Function to filter pedals with colored LEDs in preset
function filterPedalsWithColoredLeds(pedalsObj) {
  const filteredPedals = {};

  if (!pedalsObj || typeof pedalsObj !== 'object') {
    console.warn('filterPedalsWithColoredLeds: invalid pedalsObj:', pedalsObj);
    return filteredPedals;
  }

  for (const [pedalName, pedalData] of Object.entries(pedalsObj)) {
    if (!pedalData || typeof pedalData !== 'object') {
      console.warn(`Skipping pedal ${pedalName} because pedalData is invalid`, pedalData);
      continue;
    }

    const controls = pedalData.controls;

    if (!controls || (typeof controls !== 'object' && !Array.isArray(controls))) {
      console.warn(`Skipping pedal ${pedalName} because controls is invalid`, controls);
      continue;
    }

    let controlsArray;
    if (Array.isArray(controls)) {
      controlsArray = controls;
    } else {
      controlsArray = Object.entries(controls).map(([key, value]) => ({
        [key]: value
      }));
    }

    const hasColoredLed = controlsArray.some(ctrlObj => {
      const ledValue = Object.values(ctrlObj)[0];
      return typeof ledValue === 'number' && ledValue > 0;
    });

    if (hasColoredLed) {
      filteredPedals[pedalName] = pedalData;
    }
  }

  return filteredPedals;
}




// Render full pedalboard in preset page
async function renderFullPedalboard() {
  if (!resultsDiv) {
    console.error("resultsDiv not initialized yet");
    return;
  }
  const container = document.getElementById('preset');
  if (!container) {
    console.warn('No #pedalboard container found');
    return;
  }
  container.innerHTML = '';

  if (!window.pedalboard.pedals || window.pedalboard.pedals.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; margin-top: 40px;">
        <p style="font-size: 1.1em; margin-bottom: 20px;">
          Pedalboard is empty.
        </p>
        <button
          id="createBtn"
          class="bx--btn bx--btn--secondary"
          type="button"
          aria-label="Go to Pedalboard"
          style="
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 auto;
          ">
          <svg xmlns="http://www.w3.org/2000/svg" class="bx--btn__icon" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
            <path d="M18 6L16.59 7.41 23.17 14H4v2H23.17l-6.58 6.59L18 26l10-10z"/>
          </svg>
          Go to pedalboard
        </button>
      </div>
    `;

    document.getElementById('createBtn').addEventListener('click', function () {
      window.location.href = 'pedalboard';
    });

    return;
  }

  $("#preset-controls").css("display", "inline-flex");

  const rowsMap = {};
  window.pedalboard.pedals.forEach(pbPedal => {
    const rowNum = pbPedal.row || 1;
    if (!rowsMap[rowNum]) rowsMap[rowNum] = [];
    rowsMap[rowNum].push(pbPedal);
  });

  const sortedRows = Object.keys(rowsMap).map(r => parseInt(r, 10)).sort((a, b) => a - b);

  for (const rowNum of sortedRows) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.flexWrap = 'wrap';
    rowDiv.style.alignItems = 'flex-start';
    rowDiv.style.gap = '10px';
    // rowDiv.style.marginTop = '30px';


    for (const pbPedal of rowsMap[rowNum]) {
      try {
        const pedalData = window.catalogMap[pbPedal.pedal_id];
        if (!pedalData) {
          console.warn(`Pedal not found in catalog: ${pbPedal.pedal_id}`);
          continue;
        }

        const pedal = pedalData;
        const angle = pbPedal.rotation || 0;

        const insideColorRaw = pedal["inside-color"] || "";
        let inside = "";
        let colorOnly = insideColorRaw;

        // Check if inside-color is an image URL (http, https, data URI, or local images/)
        const isImage = /^https?:\/\/|^data:image\/|^images\/|\.png$|\.jpg$|\.jpeg$|\.gif$/i.test(insideColorRaw);

        if (isImage) {
          inside = "full"; // Force full mode for images
        } else {
          // Existing logic for color + optional text
          const match = insideColorRaw.match(/(#(?:[0-9a-fA-F]{3,6}))(?:\s+(.+))?/);
          if (match) {
            colorOnly = match[1];
            inside = match[2] || "";
          }
        }

        const widthValue = parseFloat(getPedalWidth(pedal.width));

        const baseCss = {
          border: `5px solid ${pedal["color"]}`, // Outer border
          borderRadius: '10px',
          color: pedal["font-color"],
          width: getPedalWidth(pedal.width),
          height: getPedalHeight(pedal.height),
          transform: `rotate(${angle}deg)`,
          marginBottom: '10px',
          display: 'inline-block',
          ...(pedal["inside-border"] && {
            boxShadow: `inset 0 0 0 3px ${pedal["inside-border"]}` // Only if inside-border exists
          }),
          ...(isImage ? {
            backgroundImage: `url("${insideColorRaw}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {
            background: colorOnly
          })
        };

        let $pedalDiv;

        if (pedal.type === "pedal") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -36px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "expression") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -36px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              borderRadius: '25px',
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "combo") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 -80px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "head" || pedal.type === "pedal-inverted") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 80px 0 0 ${pedal["color"]}`);

          $pedalDiv = $("<div>")
            .addClass("pedal-catalog")
            .css({
              ...baseCss,
              boxShadow
            })
            .attr("data-pedal-name", pedal.name)
            .attr("data-pedal-id", pedal._id);

        } else if (pedal.type === "round") {
          const boxShadow = getBoxShadow(pedal, inside, `inset 0 0 0 3px ${pedal["inside-border"] || pedal["color"]}`);

          $pedalDiv = $("<div>").addClass("pedal-catalog").css({
            ...baseCss,
            borderRadius: "50%",  // make it circular
            width: getPedalWidth(pedal.width),  // Same width and height
            height: getPedalWidth(pedal.width), // Same width and height
            boxShadow
          }).attr("data-pedal-name", pedal.name).attr("data-pedal-id", pedal._id);
        }

        const cleanName = sanitizeHtml(pedal.name);

        // Head or inverted logo
        if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
          const $nameDiv = $("<div>").addClass("head-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
          $pedalDiv.append($nameDiv);
        }

        // Render controls
        renderPedalControls(pedal, $pedalDiv);

        // Pedal logo
        if ((pedal.type === "pedal") || (pedal.type === "combo") || (pedal.type === "round") || (pedal.type === "expression")) {
          const $nameDiv = $("<div>").addClass("pedal-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
          $pedalDiv.append($nameDiv);
        }

        const widthPx = parseFloat(getPedalWidth(pedal.width));
        const heightPx = parseFloat(getPedalHeight(pedal.height));
        const hasRotation = angle !== 0;

        let wrapperStyles = {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
          boxSizing: 'content-box',
          marginBottom: '20px',
        };

        if (hasRotation) {
          const radians = angle * Math.PI / 180;
          const sin = Math.abs(Math.sin(radians));
          const cos = Math.abs(Math.cos(radians));

          const rotatedWidth = widthPx * cos + heightPx * sin;
          const rotatedHeight = widthPx * sin + heightPx * cos;

          Object.assign(wrapperStyles, {
            width: `${rotatedWidth}px`,
            height: `${rotatedHeight}px`,
            marginLeft: `${rotatedWidth * 0.2}px`,
            marginRight: `${rotatedWidth * 0.2}px`,
            ...(widthPx > heightPx ? { marginTop: '30px' } : {})
          });
        }

        const $wrapper = $("<div>")
          .css(wrapperStyles)
          .append($pedalDiv);

        rowDiv.appendChild($wrapper[0]);

      } catch (err) {
        console.error('Error fetching pedal info:', err);
      }
    }

    container.appendChild(rowDiv);
  }

  const pedalsOnBoard = [];
  $(".pedal").each(function () {
    pedalsOnBoard.push($(this).data("pedal-name"));
  });
  window.currentPedalsOnBoard = pedalsOnBoard;
}


// HELPER
function getBoxShadow(pedal, inside, insetIfNotFull) {
  const outerShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";

  // Handle full inside
  if (inside === "full") {
    return pedal["inside-border"]
      ? `${outerShadow}, inset 0 0 0 3px ${pedal["inside-border"]}`
      : outerShadow;
  }

  // Handle partial inside
  return `${outerShadow}, ${insetIfNotFull}`;
}
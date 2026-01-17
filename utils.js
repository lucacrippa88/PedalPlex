const editMode = window.isEditMode

// Function to render pedal controls dynamically
function renderPedalControls(pedal, $pedalDiv) {

    $pedalDiv.removeData("subplexInvalidated"); // resetta il flag ogni volta che il pedale viene ri-renderizzato


    if (!pedal.controls || !Array.isArray(pedal.controls)) return; // <--- metadata only protection

    const editMode = window.isEditMode; 

    pedal.controls.forEach(controlRow => {
        const $row = $("<div>").addClass("row");

        if (pedal.type === "head") { $row.addClass("lowest-row"); }
        if (pedal.type === "pedal-inverted") { $row.addClass("lower-row"); }

        controlRow.row.forEach(control => {
            // Knobs
            if (["knob", "smallknob", "largeknob", "xlargeknob"].includes(control.type)) {
                const isSmall = control.type === "smallknob";
                const isLarge = control.type === "largeknob";
                const isXLarge = control.type === "xlargeknob";

                const knobColor = control["knob-color"] ?? pedal["knobs-color"];
                const knobBorder = control["knob-border"] ?? pedal["knobs-border"];
                const knobIndicator = control["knob-indicator"] ?? pedal["knobs-indicator"];
                const labelColor = control["knob-label-color"] ?? pedal["font-color"];
                const labelBackground = control["knob-label-background"] ?? null;
                const isThick = control.border === "thick";
                const isLabelInverted = control.labelPos === "inverted";

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

                let $tooltip = null;
                let $tooltipText = null;

                if (!editMode) { // Only create tooltip if not in edit mode
                    $tooltip = $("<div>")
                        .addClass("bx--tooltip bx--tooltip--top")
                        .attr("data-tooltip", "")
                        .css({
                            display: "none",
                            position: "absolute",
                            top: "38px",
                            left: "50%",
                            transform: "translateX(-50%)"
                        });
                    const $caret = $("<span>").addClass("bx--tooltip__caret");
                    $tooltipText = $("<span>").addClass("bx--tooltip__label").text(control.value);
                    $tooltip.append($caret, $tooltipText);
                }
 
                const rotation = getRotationFromValue(control, control.value);
                knob.data("rotation", rotation);
                knob.css("transform", `rotate(${rotation}deg)`);

                let $valueLabel = null;

                if (control.values && Array.isArray(control.values)) {
                  if (control.labelPos === "inverted") { // inverted
                    if (control.border === "thick") { // thick border
                      $valueLabel = $("<div>")
                          .addClass("knob-value-label")
                          .text(control.value)
                          .css({
                              textAlign: "center",
                              marginTop: isSmall ? "-76px" : isLarge ? "-108px" : isXLarge ? "-132px" : "-89px", // margine in base al tipo
                          });
                    } else if (control.border !== "thick") { // non thick border
                      $valueLabel = $("<div>")
                          .addClass("knob-value-label")
                          .text(control.value)
                          .css({
                              textAlign: "center",
                              marginTop: isSmall ? "-67px" : isLarge ? "-93px" : isXLarge ? "-116px" : "-76px", // margine in base al tipo
                          });
                    }
                  } else { // not inveted
                    if (control.border === "thick") { // thick border
                      $valueLabel = $("<div>")
                          .addClass("knob-value-label")
                          .text(control.value)
                          .css({
                              textAlign: "center",
                              marginTop: isSmall ? "-12px" : isLarge ? "13px" : isXLarge ? "37px" : "2px", // margine in base al tipo
                          });
                    } else {
                      $valueLabel = $("<div>")
                          .addClass("knob-value-label")
                          .text(control.value)
                          .css({
                              textAlign: "center",
                              marginTop: isSmall ? "-28px" : isLarge ? "0px" : isXLarge ? "22px" : "-13px", // margine in base al tipo
                          });
                    }
                  }
                }



                // Drag handler
                function startDrag(e) {
                    e.preventDefault();
                    const startY = e.type.startsWith("touch") ? e.touches[0].pageY : e.pageY;
                    const startValue = control.value;

                    function onMove(e2) {
                        const currentY = e2.type.startsWith("touch") ? e2.touches[0].pageY : e2.pageY;
                        const delta = startY - currentY;

                        if (control.values && Array.isArray(control.values)) {
                            const steps = Math.round(delta / 5);
                            let currentIndex = control.values.indexOf(startValue);
                            if (currentIndex === -1) currentIndex = 0;
                            let newIndex = Math.min(Math.max(currentIndex + steps, 0), control.values.length - 1);
                            control.value = control.values[newIndex];
                            if (!$pedalDiv.data("subplexInvalidated")) {
                              $pedalDiv.data("subplexInvalidated", true);
                              invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                            }
                        } else {
                            const min = control.min ?? 0;
                            const max = control.max ?? 100;
                            const steps = (delta / 5) / 2;
                            let newValue = startValue + steps;
                            newValue = Math.min(Math.max(newValue, min), max);
                            control.value = parseFloat(newValue.toFixed(1));

                            if (!$pedalDiv.data("subplexInvalidated")) {
                              $pedalDiv.data("subplexInvalidated", true);
                              invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                            }
                        }

                        const newRotation = getRotationFromValue(control, control.value);
                        knob.data("rotation", newRotation);
                        knob.css("transform", `rotate(${newRotation}deg)`);
                        if ($valueLabel) $valueLabel.text(control.value);

                        if (!editMode && $tooltipText) {
                            $tooltipText.text(control.value);
                            $tooltip.show();
                        }
                    }

                    function endDrag() {
                        $(document).off("mousemove.knob touchmove.knob", onMove);
                        $(document).off("mouseup.knob touchend.knob", endDrag);
                        if (!editMode && $tooltip) $tooltip.hide();
                    }

                    $(document).on("mousemove.knob touchmove.knob", onMove);
                    $(document).on("mouseup.knob touchend.knob", endDrag);
                }

                knob.on("mousedown touchstart", startDrag);
 
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

                // 🔥 Applica colore e background in entrambi i casi
                if (labelColor) {
                    $label.css("color", labelColor);
                }
                if (labelBackground) {
                    $label.css("padding", "0px 4px");
                    $label.css("border-radius", "3px");
                    $label.css("background-color", labelBackground);
                }

                // Knob label positioning
                const $container = $("<div>")
                  .addClass("knob-container")
                  .css({ position: "relative" })
                  .append(knob);

                if (!editMode && $tooltip) {
                  $container.append($tooltip);
                }

                let $knobWrapper = $("<div>")
                  .addClass("knob-wrapper") // aggiungi classe per gestione CSS
                  .css({ display: "flex", flexDirection: "column", alignItems: "center" });

                let labelMarginTop

                // Qui controllo la posizione del label (se sopra o sotto, più il margine se sotto)
                if (control.labelPos === "inverted") {
                  // Set different margin for different knob sizes and presence of thick border
                  if (control.border === "thick") { 
                    labelMarginTop = isSmall ? "1px" : isLarge ? "28px" : isXLarge ? "52px" : "15px";
                  } else { 
                    labelMarginTop = isSmall ? "-13px" : isLarge ? "12px" : isXLarge ? "36px" : "0px";
                  }
                  $label.css("margin-top", labelMarginTop)
                  $knobWrapper.addClass("label-under"); // classe CSS per label sotto
                  $knobWrapper.append($container, $label); // label sotto il knob
                } else {
                  $knobWrapper.addClass("label-over"); // classe CSS per label sopra
                  $knobWrapper.append($label, $container); // label sopra il knob
                }

                // if (!editMode && $valueLabel) $knobWrapper.append($valueLabel);
                if ($valueLabel) $knobWrapper.append($valueLabel);
                // ---------------------

                if (typeof control.position === "string") {
                    const pos = control.position;

                    // wrapper standard (centrato)
                    function makeWrapper(marginTop) {
                        return $("<div>").css({
                            "margin-top": marginTop,
                            "display": "flex",
                            "flex-direction": "column",
                            "align-items": "center"
                        });
                    }

                    // wrapper speciale per under-top (NO align-items)
                    function makeWrapperUnderTop(marginTop) {
                        return $("<div>").css({
                            "margin-top": marginTop,
                            "display": "flex",
                            "flex-direction": "column"
                            // niente align-items:center
                        });
                    }


                    // under-top logic (NO ALIGN, come richiesto)
                    if (pos.includes("under-top") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append(makeWrapperUnderTop("-53px").append($label, $container));
                        return;
                    }

                    // align-top logic (tutti gli altri *centrati*)
                    if (pos.includes("align-top-clearest") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append(makeWrapper("15px").append($label, $container));
                        return;
                    }

                    if (pos.includes("align-top-clearer") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append(makeWrapper("0px").append($label, $container));
                        return;
                    }

                    if (pos.includes("align-top-clear") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append(makeWrapper("-14px").append($label, $container));
                        return;
                    }

                    if (pos.includes("align-top") && $row.children().length > 0) {
                        const $prev = $row.children().last();
                        $prev.append(makeWrapper("-23px").append($label, $container));
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
                    led.css("box-shadow", color === "#000000"
                      ? "inset -2px -2px 2px rgba(255, 255, 255, 0.3), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                      : `0 0 12px 4px ${color}, 0 0 20px 6px ${color}`);
                    control.value = index; // update value in control object
                    led.data("colorIndex", index);
                    if (!$pedalDiv.data("subplexInvalidated")) {
                      $pedalDiv.data("subplexInvalidated", true);
                      invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                    }
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
                    const match = control.position.match(/margin-right:\s*(-?\d+)px/);
                    if (match) {
                        const px = match[1] + "px";
                        $ledContainer.css("margin-right", px);
                    }
                    $row.append($ledContainer);
                } else if (typeof control.position === "string" && control.position.startsWith("margin-left:")) {
                    // Extract the pixel value
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
                  step: (control.step ?? 1) / 2, // 2x denser
                  "data-control-label": control.label
                })
                .on("input", function () { 
                  control.value = parseFloat($(this).val());
                  if (!$pedalDiv.data("subplexInvalidated")) {
                    $pedalDiv.data("subplexInvalidated", true);
                    invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                  }
                  if (!editMode && $tooltipText) {
                    $tooltipText.text(control.value);
                    $tooltip.show();
                  }
                });

              let $tooltip = null;
              let $tooltipText = null;

              // Only show tooltip if not in edit mode
              if (!editMode) {
                $tooltip = $("<div>")
                  .addClass("bx--tooltip bx--tooltip--bottom") // caret on bottom
                  .css({
                    display: "none",
                    position: "absolute",
                    bottom: "-45px", // below slider
                    left: "50%",
                    transform: "translateX(-50%)"
                  });

                const $caret = $("<span>").addClass("bx--tooltip__caret");
                $tooltipText = $("<span>").addClass("bx--tooltip__label").text(control.value);
                $tooltip.append($caret, $tooltipText);
              }

              let $sliderWrapper;
              if (control.orientation === "vertical") {
                $slider.addClass("vertical");
                $sliderWrapper = $("<div>")
                  .addClass("slider-wrapper-vertical")
                  .css({ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 -12px", position: "relative" })
                  .append($label, $slider);
              } else if (control.orientation === "vertical small") {
                $slider.addClass("verticalsmall");
                $sliderWrapper = $("<div>")
                  .addClass("slider-wrapper-vertical")
                  .css({ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 -12px", position: "relative" })
                  .append($label, $slider);
              } else {
                $slider.addClass("horizontal");
                $sliderWrapper = $("<div>")
                  .addClass("slider-wrapper-horizontal")
                  .css({ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: "10px", width: "100%", position: "relative" })
                  .append($label, $slider);
              }

              // Attach tooltip if not in edit mode
              if (!editMode && $tooltip) {
                $sliderWrapper.append($tooltip);
                $slider.on("mousedown touchstart", () => $tooltip.show());
                $(document).on("mouseup touchend", () => $tooltip.hide());
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
                        width: `${control.width * 6}px`, height: `${control.height * 6}px`,
                        fontFamily: "monospace", fontSize: "17px", textAlign: "center", 
                        backgroundColor: screenColor, color: textColor,
                        border: "2px solid #333", borderRadius: "4px", padding: "2px", position: "relative", top: "15px"
                    });

                if (control.shape === "round") { 
                    $lcd.css("border-radius", "50%");
                    $lcd.css("font-size", "12px");
                    $lcd.css("width",`${control.width * 6}px`);
                    $lcd.css("height",`${control.width * 6}px`);
                } 

                $lcd.on("input", function () { 
                  control.value = $(this).val(); 
                  if (!$pedalDiv.data("subplexInvalidated")) {
                    $pedalDiv.data("subplexInvalidated", true);
                    invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                  }
                });

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
                else if (control.position === "higher+") { $wrapper.addClass("align-top-er"); } 
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

                $select.on("change", function () {
                  control.value = $(this).val();
                  if (!$pedalDiv.data("subplexInvalidated")) {
                    $pedalDiv.data("subplexInvalidated", true);
                    invalidateSubplexForPedal($pedalDiv); // mark SubPlex as changed
                  }
                });

            }

        });

        $pedalDiv.append($row);

        // Adjust gap if only 3 smallknobs and no other controls
        const $allSmallKnobs = $row.find(".smallknob");
        const $allControls = $row.find("> div"); // direct children of the row

        if ($allSmallKnobs.length === 3 && $allControls.length === 3) {
          $row.css("gap", "0px");
        }
        
    }); 
}















// HELPER: render a gear in catalog and editor
function renderPedal(pedal, userRole, pedalboardPage = false) {
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
    if (match) { colorOnly = match[1]; inside = match[2] || ""; }
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
    } : { background: colorOnly })
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

  // const cleanName = sanitizeHtml(pedal.name);
  const cleanName = sanitizePedalHTML(pedal.name);



  // Head and inverted pedals → add name/logo
  if ((pedal.type === "head") || (pedal.type === "pedal-inverted")) {
    const $nameDiv = $("<div>").addClass("head-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
    $pedalDiv.append($nameDiv);
  }

  // if (pedal.subplex) {
  //   applySubplexStateToPedal($pedalDiv, pedal.subplex);
  // }

  // Render pedal controls
  renderPedalControls(pedal, $pedalDiv);

  // Aggancia invalidazione SubPlex ai controlli
  $pedalDiv.find('.knob, select, .led, input[type="range"], input[type="text"]')
    .on('change input click', function() {
        onPedalControlChange($pedalDiv);
    });




  // Add name/logo for others
  if (["pedal", "combo", "round", "expression"].includes(pedal.type)) {
    const $nameDiv = $("<div>").addClass("pedal-name").html(cleanName).attr("style", safeLogoStyle(pedal.logo) || "");
    $pedalDiv.append($nameDiv);
  } 


  // =======================================================
  // AUTHOR + VERIFIED + PUBLISHED (FIX DEFINITIVO)
  // =======================================================
  if (pedalboardPage === false && pedal.author && pedal.authorId) {

    const ADMIN_AUTHOR_ID = 'user_admin';
    const isAdminUser = userRole === 'admin';
    const authorIsAdmin = pedal.authorId === ADMIN_AUTHOR_ID;

    // BADGE VERIFIED → sempre visibile se esiste
    let $verifiedBadge = null;
    if (pedal.verified == "true") {
      $verifiedBadge = $(`
        <span class="verified-badge">
          <svg viewBox="0 0 24 24" class="verified-icon">
            <path d="M12 1.5 L3 6 V12 C3 17 7 21 12 22.5 C17 21 21 17 21 12 V6 L12 1.5 Z"></path>
            <text x="12" y="15" text-anchor="middle" font-size="10" fill="white" font-weight="bold">V</text>
          </svg>
        </span>
      `);
    }

    // DECIDE SE MOSTRARE L'AUTORE
    let showAuthor = false;

    if (isAdminUser) {
      showAuthor = true;
    } else if (!authorIsAdmin) {
      showAuthor = true;
    }

    // CREA IL CONTAINER SOLO SE SERVE
    if ($verifiedBadge || showAuthor) {

      const $authorDiv = $("<div>").addClass("pedal-author");

      // Badge prima del testo
      if ($verifiedBadge) {
        $authorDiv.append($verifiedBadge);
      }

      // Testo autore (+ published solo per admin)
      if (showAuthor) {
        let authorText = `By: ${pedal.author}`;

        const published = (pedal.published || '').toLowerCase();
        const showPublishedStatuses = ['private', 'draft', 'reviewing', 'template'];

        if (showPublishedStatuses.indexOf(published) !== -1) {
          authorText += `, ${published}`;
        }

        const $authorText = $("<span>").text(authorText);
        $authorDiv.append($authorText);
      }

      $pedalDiv.prepend($authorDiv);
    }
  }


  // Add edit button if admin OR current user is the author OR is a template
  if (window.currentUser) {
    const isAdmin = userRole === 'admin';
    const isAuthor = window.currentUser.username === pedal.author;
    const isTemplate = (pedal.published || '').toLowerCase() === 'template';

    // Show these only if not in pedalboard page
    if (pedalboardPage == false) {
      if (isAdmin || isAuthor || isTemplate) {
        const $editBtn = $("<button>")
          .addClass("edit-btn showDesktop")
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
  }

// ==================== SHARE ICON ====================
if (window.location.pathname.endsWith('/gears')) {

  const basePath = getBasePath();

  const $shareIcon = $(`
    <div class="pedal-share-icon" title="Share pedal">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
        <path d="M23,20a5,5,0,0,0-3.89,1.89L11.8,17.32a4.46,4.46,0,0,0,0-2.64l7.31-4.57A5,5,0,1,0,18,7a4.79,4.79,0,0,0,.2,1.32l-7.31,4.57a5,5,0,1,0,0,6.22l7.31,4.57A4.79,4.79,0,0,0,18,25a5,5,0,1,0,5-5ZM23,4a3,3,0,1,1-3,3A3,3,0,0,1,23,4ZM7,19a3,3,0,1,1,3-3A3,3,0,0,1,7,19Zm16,9a3,3,0,1,1,3-3A3,3,0,0,1,23,28Z"></path>  
      </svg>
    </div>
  `);

  $pedalDiv.append($shareIcon);

  $pedalDiv.css('position', 'relative');
  $shareIcon.css({
    position: 'absolute',
    bottom: '-22px',
    right: '0',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.2s ease'
  });

  $pedalDiv.hover(
    function() { $shareIcon.css('opacity', 1); },
    function() { $shareIcon.css('opacity', 0); }
  );

  $shareIcon.on('click', (e) => {
    e.stopPropagation();

    const url = `${window.location.origin}${basePath}/view-gear?id=${encodeURIComponent(pedalId)}`;

    // Costruisci HTML dinamicamente in base alla pagina
    let buttonsHTML = `<button id="copyLink" class="bx--btn bx--btn--secondary">
                          Copy Link
                          <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"
                               fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"
                               class="bx--btn__icon">
                            <path d="M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z"></path>
                            <path d="M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z"></path>
                          </svg>
                        </button>`;

    // Se siamo nella pagina principale del catalogo (/gears senza query), aggiungi il bottone Open Gear
    if (!window.location.search.includes('id=')) {
      buttonsHTML += `<button id="openPedal" class="bx--btn bx--btn--tertiary">
                        Open Gear
                        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"
                             fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"
                             class="bx--btn__icon">
                          <path d="M18 6L16.57 7.393 24.15 15 4 15 4 17 24.15 17 16.57 24.573 18 26 28 16 18 6z"></path>
                        </svg>
                      </button>`;
    }

    Swal.fire({
      title: 'Share this Gear',
      showConfirmButton: false,
      showCloseButton: false,
      allowOutsideClick: true,
      position: 'top-end',
      width: 'auto',
      html: `<div style="padding-bottom:22px; display:flex; gap:10px; justify-content:center;">
               ${buttonsHTML}
             </div>`,
      didOpen: () => {
        const copyBtn = Swal.getPopup().querySelector('#copyLink');
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(url); // copia silenziosa
        });

        const openBtn = Swal.getPopup().querySelector('#openPedal');
        if (openBtn) {
          openBtn.addEventListener('click', () => {
            window.open(url, '_blank');
          });
        }
      }
    });

  });
}
// ==================== /SHARE ICON ====================

  return $pedalDiv;
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

    // --- Knobs ---
    $pedal.find('.knob').each(function () {
      const label = $(this).data('control-label');
      //const $valueLabel = $(this).parent().find('.knob-value-label'); // buggato
      //const $valueLabel = $(this).closest('.knob-wrapper').find('.knob-value-label'); // test
      const $valueLabel = $(this).closest('.knob-wrapper').children('.knob-value-label'); // test (migliore)
      
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
          angle = Math.atan2(b, a) * (180 / Math.PI);
        } else {
          const style = $(this).attr('style');
          const match = style && style.match(/rotate\((-?\d+)deg\)/);
          angle = match ? parseInt(match[1], 10) : 0;
        }
        value = getValueFromRotation(angle);
      }
      controlsArray.push({ [label]: isNaN(value) ? value : parseFloat(value) }); // buggato

    });

    // --- Dropdowns ---
    $pedal.find('select[data-control-label]').each(function () {
      const label = $(this).data('control-label');
      controlsArray.push({ [label]: $(this).val() });
    });

    // --- Sliders ---
    $pedal.find('input[type="range"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      controlsArray.push({ [label]: parseFloat($(this).val()) });
    });

    // --- LCDs ---
    $pedal.find('input[type="text"][data-control-label]').each(function () {
      const label = $(this).data('control-label');
      controlsArray.push({ [label]: $(this).val().trim() });
    });

    // --- LEDs ---
    $pedal.find('.led[data-control-label]').each(function () {
      const label = $(this).data('control-label'); // case-sensitive
      const bgColor = ($(this).css('background-color') || '').trim();
      const hexColor = normalizeHex(bgColor); // DOM color convertito in HEX

      let matchedIndex = 0;
      let catalogColorUsed = '#000000';
      let foundControl = null;

      if (Array.isArray(window.catalog)) {

        const pedalData =
          window.catalog.find(p => p._id === pedalId) ||
          window.catalog.find(p => p.id === pedalId) ||
          window.catalog.find(p => p.name === pedalName);

        if (pedalData && Array.isArray(pedalData.controls)) {
          outerLoop:
          for (const rowWrapper of pedalData.controls) {
            if (!Array.isArray(rowWrapper.row)) continue;

            for (const control of rowWrapper.row) {
              if (control.label === label && Array.isArray(control.colors)) {
                foundControl = control;
                const catalogColors = control.colors.map(c => normalizeHex(c));

                let foundIndex = catalogColors.indexOf(hexColor);

                if (foundIndex === -1) {
                  const targetRgb = hexToRgb(hexColor);
                  if (targetRgb) {
                    let bestIdx = -1;
                    let bestDist = Infinity;
                    for (let i = 0; i < catalogColors.length; i++) {
                      const cRgb = hexToRgb(catalogColors[i]);
                      if (!cRgb) continue;
                      const d = colorDistanceSq(targetRgb, cRgb);
                      if (d < bestDist) {
                        bestDist = d;
                        bestIdx = i;
                      }
                    }
                    if (bestDist < 2500) foundIndex = bestIdx;
                  }
                }

                if (foundIndex !== -1) {
                  matchedIndex = foundIndex;
                  catalogColorUsed = catalogColors[foundIndex];
                  break outerLoop;
                }
              }
            }
          }
        }
      }

      if (hexColor !== '#000000') hasColoredLed = true;
      controlsArray.push({ [label]: matchedIndex });
    });


    // Save pedal in preset only if at least a LED is turned on
    // if (hasColoredLed) {
    //   pedals.push({ id: pedalId, name: pedalName, controls: controlsArray });
    // }
    if (hasColoredLed) {
      const pedalObj = { id: pedalId, name: pedalName, controls: controlsArray };

      // --- SUBPLEX ---
      const appliedSubplexData = $pedal.data('applied-subplex'); // oggetto JSON già salvato sul div
      if (appliedSubplexData) {
        // Salva solo i campi rilevanti
        pedalObj.subplex = {
          subplexId: appliedSubplexData.id || appliedSubplexData._id || appliedSubplexData.subplexId,
          presetName: appliedSubplexData.presetName || appliedSubplexData.name,
          published: appliedSubplexData.published,
          source: appliedSubplexData.source,
          description: appliedSubplexData.description,
          style: appliedSubplexData.style || [],
          authorId: appliedSubplexData.authorId || appliedSubplexData.user_id,
          version: appliedSubplexData.version || 1
        };
      }

      pedals.push(pedalObj);
    }

  });

  return { [presetName]: pedals };
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
async function renderFullPedalboard(pedalboardOverride = null) {

  // 🔒 TEST / SINGLE PEDAL MODE
  if (window.__SINGLE_PEDAL_MODE__ && !pedalboardOverride) {
    return Promise.resolve();
  }

  // 🔹 Override pedalboard (test / single pedal mode)
  if (pedalboardOverride && pedalboardOverride.pedals) {
    window.pedalboard = pedalboardOverride;
  }


  return new Promise((resolve) => {  

     try {
      if (!resultsDiv) {
        console.error("resultsDiv not initialized yet");
        return resolve(); 
      }

      const container = document.getElementById('preset');
      if (!container) {
        console.warn('No #pedalboard container found');
        return resolve(); 
      }
      container.innerHTML = '';

      // Guest mode
      if (!window.pedalboard || !window.pedalboard.pedals || window.pedalboard.pedals.length === 0) {
        const storedPedalboard = localStorage.getItem('lastPedalboard');
        if (storedPedalboard) {
          try {
            window.pedalboard = JSON.parse(storedPedalboard);
            console.log('Loaded Rig from localStorage for guest');
          } catch (e) {
            console.error('Failed to parse localStorage Rig', e);
            container.innerHTML = `<p style="text-align:center;margin-top:40px;">No Rids found.</p>`;
            return resolve();
          }
        } else {
          container.innerHTML = `
            <div style="text-align: center; margin-top: 40px;">
              <p style="font-size: 1.1em; margin-bottom: 20px;">Rig is empty.</p>
              <button id="createBtn" class="bx--btn bx--btn--secondary" type="button">
                Go to Rigs
              </button>
            </div>
          `;
          document.getElementById('createBtn').addEventListener('click', () => {
            window.location.href = 'rigs';
          });
          return resolve();
        }
      }

      // Mostra controlli
      $("#preset-controls").css("display", "flex");

  // Organize pedals by row
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


    for (const pbPedal of rowsMap[rowNum]) {
      try {
        // const pedalData = window.catalogMap[pbPedal.pedal_id];
        const id = String(pbPedal.pedal_id || "").trim();
        const pedalData = window.catalogMap[id] || window.catalogMap[id.normalize()];

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

        // const cleanName = sanitizeHtml(pedal.name);
        const cleanName = sanitizePedalHTML(pedal.name);

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
          .addClass("pedal-wrapper") // serve per hover mouse menu catalog preset
          .css(wrapperStyles).append($pedalDiv);

        $wrapper.css("position", "relative");


        // ============== AI DROPDOWN PRESET ===============
        // if (window.currentUser && window.currentUser.role === "admin") {
        const isLoggedIn = !!window.currentUser;
        if (isLoggedIn) {

          const $presetContainer = $(`
            <div class="preset-container">

              <!-- SUBPLEX INFO -->
              <div class="applied-preset-info" style="display:none">
                <div class="applied-preset-title-row">
                  <span class="applied-preset-name"></span>
                  <span class="applied-preset-info-icon"></span>
                </div>
                <div class="applied-preset-tags"></div>
              </div>


              <button disabled style="display:none" class="new-subplex-btn bx--btn bx--btn--tertiary bx--btn--sm bx--btn--icon-only">
                <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true" class="bx--btn__icon">
                  <path d="M17 15L17 8 15 8 15 15 8 15 8 17 15 17 15 24 17 24 17 17 24 17 24 15z"></path>
                </svg>
              </button>

              <svg class="preset-icon"
                focusable="false"
                preserveAspectRatio="xMidYMid meet"
                fill="currentColor"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H22V8H4zM4 12H22V14H4zM4 18H16V20H4zM21 18L28 23 21 28 21 18z"></path>
              </svg>

              <div class="preset-dropdown-wrapper">
                <ul class="preset-dropdown"></ul>
              </div>
            </div>
          `);

          // AI icon
          // <path d="M19 21v-2h1v-7h-1v-2h4v2h-1v7h1v2h-4zM15.5005 21h2l-3.5005-11h-3l-3.4966 11h1.9988l.6018-2h4.7781l.6184 2zM10.7058 17l1.6284-5.4111.2559-.0024 1.6736 5.4136h-3.5579z"></path>
          // <path d="M32,32H0V0h32v32ZM2,30h28V2H2v28Z"></path>
          // 3 dots icon
          // <circle cx="8" cy="16" r="2"></circle><circle cx="16" cy="16" r="2"></circle><circle cx="24" cy="16" r="2"></circle>


          $wrapper.append($presetContainer);


          // === SUBPLEX EMPTY STATE (New SubPlex button) ===
          const $newBtn = $presetContainer.find(".new-subplex-btn");
          const hasApplied = $pedalDiv.attr("data-applied-preset");

          if (!hasApplied) { $newBtn.show(); } else { $newBtn.hide(); }

          $newBtn.on("click", function (e) {
            e.stopPropagation();

            // TODO: apri modale o redirect
            console.log("Create new SubPlex for pedal:", pedal._id);

            // esempio futuro:
            // openNewSubPlexModal({ pedalId: pedal._id });
          });



          const $dropdownWrapper = $presetContainer.find(".preset-dropdown-wrapper");
          const $ul = $presetContainer.find(".preset-dropdown");

          // ✨ Glow
          const glowEl = $dropdownWrapper[0];
          let stopGlow = null;
          if (glowEl) stopGlow = startGlow(glowEl);

          // Toggle dropdown
          $presetContainer.find(".preset-icon").on("click", function (e) {
            e.stopPropagation();

            const isOpen = $dropdownWrapper.hasClass("is-open");

            $(".preset-dropdown-wrapper").removeClass("is-open");

            if (!isOpen) {
              $dropdownWrapper.addClass("is-open");

              // ✅ FETCH + render SOLO QUI, SOLO AL CLICK
              buildPresetDropdown($ul, pedal._id);
            }
          });


        } else {
          // Guest mode: show locked preset container
          const $presetContainer = $(`
            <div class="preset-container preset-locked">
              <svg class="preset-icon disabled"
                focusable="false"
                preserveAspectRatio="xMidYMid meet"
                fill="currentColor"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H22V8H4zM4 12H22V14H4zM4 18H16V20H4zM21 18L28 23 21 28 21 18z"></path>
              </svg>

              <div class="preset-locked-label">
                Login to see all SubPlexes
              </div>
            </div>
          `);

          $wrapper.append($presetContainer);
        }

        // ================================================


        rowDiv.appendChild($wrapper[0]);

      } catch (err) {
        console.error('Error fetching pedal info:', err);
      }
    }

    container.appendChild(rowDiv);
  }

  // Save current pedals on board
  const pedalsOnBoard = [];
  $(".pedal").each(function () {
    pedalsOnBoard.push($(this).data("pedal-name"));
  });
  window.currentPedalsOnBoard = pedalsOnBoard;

      setTimeout(() => {
        resolve();
      }, 100);

    } catch (err) {
      resolve();
    }
  }); // end Promise
}



function renderPresetList($ul, pedalId, presets) {
  $ul.empty();

  if (!presets.length) {
    $ul.append("<li class='empty'>No SubPlexes found</li>");
    return;
  }

  presets.forEach(preset => {
    const $li = $("<li>").addClass("preset-item");

    const description = preset.description || "No description available";
    const $titleRow = $("<div>").addClass("preset-title-row");

    // const $name = $("<span>").addClass("preset-name").text(preset.presetName || preset._id);

    const $name = $("<span>").addClass("preset-name");

    // AI icon (solo se published === "ai")
    if (preset.source === "ai") {
      $name.append(`
        <svg class="ai-preset-icon"
          focusable="false"
          preserveAspectRatio="xMidYMid meet"
          fill="currentColor"
          width="14"
          height="14"
          viewBox="0 0 32 32"
          aria-hidden="true">
          <path d="M19 21v-2h1v-7h-1v-2h4v2h-1v7h1v2h-4zM15.5005 21h2l-3.5005-11h-3l-3.4966 11h1.9988l.6018-2h4.7781l.6184 2zM10.7058 17l1.6284-5.4111.2559-.0024 1.6736 5.4136h-3.5579z"></path>
          <path d="M32,32H0V0h32v32ZM2,30h28V2H2v28Z"></path>
        </svg>
      `);
    }

    // Nome preset
    $name.append(
      document.createTextNode(" " + (preset.presetName || preset._id))
    );


    // ℹ icon with tooltip event
    const $info = $("<span>").addClass("preset-info").html(' <svg focusable="false" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="12" height="12" viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M17 22L17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22zM16 8a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 8z"></path><path d="M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z"></path><title>Information</title></svg>');
    $info.on("mouseenter", (e) => {
      const $tooltip = $(`<div class="preset-tooltip-popup">${description}</div>`);
      $("body").append($tooltip);

      const offset = $info.offset();
      $tooltip.css({
        position: "absolute",
        top: offset.top - $tooltip.outerHeight() - 5,
        left: offset.left,
        zIndex: 2000,
        maxWidth: "250px",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: "4px",
        fontSize: "0.85rem",
        pointerEvents: "none"
      });

      $info.data("tooltipEl", $tooltip);
    });

    $info.on("mouseleave", () => {
      const $tooltip = $info.data("tooltipEl");
      if ($tooltip) $tooltip.remove();
    });

    $titleRow.append($name, $info);
    $li.append($titleRow);

    // Style tags
    if (Array.isArray(preset.style)) {
      preset.style.forEach(style => {
        const color = STYLE_TAG_MAP[style] || "gray";
        $li.append(`
          <button class="bx--tag bx--tag--${color}">
            <span class="bx--tag__label">${style}</span>
          </button>
        `);
      });
    }

    // Click handler
    $li.on("click", function (e) {
      e.stopPropagation();
      applyCatalogPresetToSinglePedal(pedalId, preset);
      $(".preset-dropdown-wrapper").removeClass("is-open");
    });

    $ul.append($li);
  });
}








window.presetCatalogCache = window.presetCatalogCache || {};


// HELPER FUNCTIONS AI PRESET DROPDOWN =======
$(document).on("click", function () {
  $(".preset-dropdown-wrapper").removeClass("is-open");
});




// Build Preset from AI Catalog
async function buildPresetDropdown($ul, pedalId) {

  // 1️⃣ Cache hit → nessuna fetch
  if (window.presetCatalogCache[pedalId]) {
    renderPresetList($ul, pedalId, window.presetCatalogCache[pedalId]);
    return;
  }

  // 2️⃣ Stato loading (una sola volta)
  $ul
    .empty()
    .append("<li class='loading'>Loading SubPlexes</li>");

  const token = localStorage.getItem("authToken");
  if (!token) {
    $ul.html("<li class='error'>Login to see all SubPlexes</li>");
    return;
  }

  try {
    const res = await fetch(
      "https://api.pedalplex.com/GET_PRESETS_BY_PEDAL.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ pedalId })
      }
    );

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    const presets = Array.isArray(data.presets) ? data.presets : [];

    // 3️⃣ Salva in cache
    window.presetCatalogCache[pedalId] = presets;

    renderPresetList($ul, pedalId, presets);

  } catch (err) {
    console.error("Preset dropdown error:", err);
    $ul.html("<li class='error'>Error loading SubPlexes</li>");
  }
}







function applyCatalogPresetToSinglePedal(pedalId, preset) {
  // Trova il pedale nel DOM
  const $pedalDiv = $(`.pedal-catalog[data-pedal-id="${pedalId}"]`);
  if (!$pedalDiv.length) {
    console.warn("Pedal not found on board:", pedalId);
    return;
  }

  // ⛔️ PREVENT DOUBLE APPLY OF SAME PRESET
  const applied = $pedalDiv.attr("data-applied-preset");
  if (applied) {
    try {
      const parsed = JSON.parse(applied);
      if (parsed.id === preset._id) {
        return; // già applicato → esci
      }
    } catch (e) {}
  }


  // Recupera il pedale di default dal catalogo
  // const defaultPedal = window.catalog.find(
  //   p => p._id === pedalId || p.name === pedalId
  // );
  // if (!defaultPedal) {
  //   console.warn("Pedal not found in catalog:", pedalId);
  //   return;
  // }
  const defaultPedal =
    window.catalogMap?.[pedalId] ||
    window.catalogMap?.[String(pedalId).trim()];

  if (!defaultPedal) {
    console.warn("Pedal not found in catalogMap:", pedalId);
    return;
  }


  // Deep clone del pedale di catalogo
  const pedalClone = JSON.parse(JSON.stringify(defaultPedal));

  // Applica i controls del preset
  if (preset.controls) {
    pedalClone.controls.forEach(row => {
      row.row.forEach(ctrl => {
        const label = ctrl.label;
        if (preset.controls.hasOwnProperty(label)) {
          ctrl.value = preset.controls[label];
        }
      });
    });
  }

  // Rimuove i controlli attuali
  $pedalDiv.find('.row').remove();

  // Ri-render dei controlli
  renderPedalControls(pedalClone, $pedalDiv);

  // Aggiorna il nome (se serve)
  const $existingName = $pedalDiv.find('.pedal-name, .head-name').first();
  let nameClass = 'pedal-name';
  let $referenceNode = null;

  if ($existingName.length) {
    nameClass = $existingName.hasClass('head-name') ? 'head-name' : 'pedal-name';
    $referenceNode = $existingName.next();
    $existingName.remove();
  }

  const $nameDiv = $("<div>")
    .addClass(nameClass)
    .html(pedalClone.name)
    .attr("style", pedalClone.logo || "");

  if ($referenceNode && $referenceNode.length) {
    $nameDiv.insertBefore($referenceNode);
  } else {
    $pedalDiv.prepend($nameDiv);
  }


  // Aggiorna UI (se presente)
  if (typeof updateSavePresetButtonState === 'function') {
    updateSavePresetButtonState();
  }

  // Reset invalidazione
  $pedalDiv.removeData("subplexInvalidated");

  // Stato SubPlex applicato sul div
  const appliedSubplex = {
    id: preset._id,
    presetName: preset.presetName || preset.name || preset._id,
    published: preset.published,
    source: preset.source,
    description: preset.description || '',
    style: preset.style || [],
    authorId: preset.authorId || preset.user_id || '',
    version: preset.version || 1
  };

  $pedalDiv.data('applied-subplex', appliedSubplex);
  $pedalDiv.attr("data-applied-preset", JSON.stringify({
    id: appliedSubplex.id,
    name: appliedSubplex.presetName,
    style: appliedSubplex.style,
    published: appliedSubplex.published
  }));

  // ✅ Aggiorna globale
  window.currentSubPlex = window.currentSubPlex || {};
  window.currentSubPlex[pedalId] = appliedSubplex;


  renderAppliedPresetInfo($pedalDiv, appliedSubplex);

}


// END HELPER FUNCTIONS AI PRESET DROPDOWN =======





// Render applied SubPlex info box
function renderAppliedPresetInfo($pedalDiv, subplex) {


  const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || subplex.id || "SubPlex";

  
  if (!subplex || (!subplex.presetName && !subplex.name && !subplex.preset_name && !subplex.id)) {
    console.log("No valid SubPlex found, skipping render.");
    return;
  }

  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  const $infoBox = $wrapper.find(".applied-preset-info");
  if (!$infoBox.length) return;

  // const presetName = subplex.presetName || subplex.name || subplex.preset_name || subplex._id || "SubPlex";
  const description = subplex.description || "No description available";

  // Nome + icona AI
  const $nameEl = $infoBox.find(".applied-preset-name");
  $nameEl.empty();
  if (subplex.source === "ai") {
    $nameEl.append(`
      <svg class="ai-preset-icon" focusable="false" preserveAspectRatio="xMidYMid meet"
        fill="currentColor" width="14" height="14" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19 21v-2h1v-7h-1v-2h4v2h-1v7h1v2h-4zM15.5005 21h2l-3.5005-11h-3l-3.4966 11h1.9988l.6018-2h4.7781l.6184 2zM10.7058 17l1.6284-5.4111.2559-.0024 1.6736 5.4136h-3.5579z"></path>
        <path d="M32,32H0V0h32v32ZM2,30h28V2H2v28Z"></path>
      </svg>
    `);
  }
  $nameEl.append(document.createTextNode(" " + presetName));

  // Icona info + tooltip
  const $iconWrapper = $infoBox.find(".applied-preset-info-icon");
  $iconWrapper.empty().append(`
    <svg focusable="false" preserveAspectRatio="xMidYMid meet"
      fill="currentColor" width="12" height="12"
      viewBox="0 0 32 32" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 22L17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22zM16 8a1.5 1.5 0 101.5 1.5A1.5 1.5 0 0016 8z"></path>
      <path d="M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z"></path>
    </svg>
  `);

  $iconWrapper.off("mouseenter mouseleave")
    .on("mouseenter", function () {
      // const $tooltip = $(`<div class="preset-tooltip-popup">${description}</div>`);
      // Safe description (no HTML injection)
      const safeDescription = decodeHTMLEntities(description);
      const $tooltip = $(`<div class="preset-tooltip-popup"></div>`).text(safeDescription);

      $("body").append($tooltip);
      const offset = $iconWrapper.offset();
      $tooltip.css({
        position: "absolute",
        top: offset.top - $tooltip.outerHeight() - 6,
        left: offset.left,
        zIndex: 2000,
        maxWidth: "250px",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "6px 8px",
        borderRadius: "4px",
        fontSize: "0.85rem",
        pointerEvents: "none"
      });
      $iconWrapper.data("tooltipEl", $tooltip);
    })
    .on("mouseleave", function () {
      const $tooltip = $iconWrapper.data("tooltipEl");
      if ($tooltip) $tooltip.remove();
    });

  // Tags
  const $tagsBox = $infoBox.find(".applied-preset-tags");
  if ($tagsBox.length) {
    $tagsBox.empty();
    const styles = subplex.style || [];
    styles.forEach(style => {
      const color = STYLE_TAG_MAP[style] || "gray";
      $tagsBox.append(`<span class="bx--tag bx--tag--${color} bx--tag--sm">${style}</span>`);
    });
  }

  $infoBox.show();
  $wrapper.find(".new-subplex-btn").hide();
}


// Invalida SubPlex e aggiorna UI
function invalidateSubplexForPedal($pedalDiv) {
  if (!$pedalDiv) return;

  const applied = $pedalDiv.data("applied-subplex");
  if (!applied) return;

  // Rimuove stato
  $pedalDiv.removeData('applied-subplex');
  $pedalDiv.removeAttr("data-applied-preset");
  $pedalDiv.data("subplexInvalidated", true);

  // Aggiorna UI
  const $wrapper = $pedalDiv.closest(".pedal-wrapper");
  $wrapper.find(".applied-preset-info").hide();
  $wrapper.find(".new-subplex-btn").show();
  $wrapper.find(".preset-dropdown-wrapper").removeClass("is-open");
}


// Controlla se i valori dei controlli differiscono dal SubPlex applicato
function onPedalControlChange($pedalDiv) {
  const subplex = $pedalDiv.data('applied-subplex');
  if (!subplex) return; // niente SubPlex → nulla da fare

  let changed = false;

  if (Array.isArray(subplex.controls)) {
    subplex.controls.forEach(ctrl => {
      const $control = $pedalDiv.find(`[data-control-label="${ctrl.label}"]`);
      if (!$control.length) return;

      let currentValue;
      switch (ctrl.type) {
        case "knob":
        case "smallknob":
        case "largeknob":
        case "xlargeknob":
          currentValue = parseFloat($control.closest(".knob-wrapper").find(".knob-value-label").text());
          break;
        case "slider":
        case "lcd":
        case "multi":
          currentValue = $control.val();
          break;
        case "led":
          currentValue = $control.data("colorIndex");
          break;
      }

      if (currentValue != ctrl.value) changed = true;
    });
  }

  if (changed && !$pedalDiv.data("subplexInvalidated")) {
    invalidateSubplexForPedal($pedalDiv);
  }
}


// Al momento del render dal DB
function setupSubplexInvalidationOnDBLoad($pedalDiv) {
  if (!$pedalDiv) return;

  const invalidate = () => invalidateSubplexForPedal($pedalDiv);

  // rimuovi eventuali listener duplicati
  $pedalDiv
    .find('input, select, textarea')
    .off('.subplexInvalidate')
    .on('input.subplexInvalidate change.subplexInvalidate', invalidate);

  // knob / custom controls
  $pedalDiv
    .find('[data-control-label]')
    .off('.subplexInvalidate')
    .on('mousedown.subplexInvalidate click.subplexInvalidate', invalidate);
}
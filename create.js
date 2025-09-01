// let lastValidation = null;


// // Builder logic
// function buildJSON() {

//     if (isSyncing) return; // Skip rebuild during JSON sync

//         const pedal = {
//             _id: $("#pedal-id").val(),
//             name: $("#pedal-name").val(),
//             logo: $("#pedal-logo").val(),
//             type: $("#pedal-type").val(),
//             width: $("#pedal-width").val(),
//             height: $("#pedal-height").val(),
//             color: $("#pedal-color").val(),
//             "font-color": $("#font-color").val(),
//             "knobs-color": $("#knobs-color").val(),
//             "knobs-border": $("#knobs-border").val(),
//             "knobs-indicator": $("#knobs-indicator").val(),
//             controls: []
//         };

//         // --- inside-color logic ---
//         const insideType = $("#inside-type-select").val();
//         if (insideType === "color") {
//             pedal["inside-color"] = $("#pedal-inside-color").val() + ($("#pedal-inside-full-check").is(":checked") ? " full" : "");
//         } else {
//             pedal["inside-color"] = $("#pedal-inside-image").val(); // Save full URL
//         }


//         let cssError = "";

//         // --- Validate CSS for logo ---
//         const invalidCssProps = { position: "relative" }; // forbidden properties
//         const logoVal = $("#pedal-logo").val();
//         const el = document.createElement("div");
//         el.style.cssText = logoVal;

//         for (const prop in invalidCssProps) {
//             if (el.style[prop] === invalidCssProps[prop]) {
//                 cssError += `Logo CSS cannot include "${prop}:${invalidCssProps[prop]}". `;
//             }
//         }

//         // --- Validate CSS for name ---
//         const nameVal = $("#pedal-name").val();
//         const nameEl = document.createElement("div");
//         nameEl.style.cssText = nameVal;
//         for (const prop in invalidCssProps) {
//             if (nameEl.style[prop] === invalidCssProps[prop]) {
//                 cssError += `Name CSS cannot include "${prop}:${invalidCssProps[prop]}". `;
//             }
//         }


//         // Add inside-border only if "Full" is checked
//         if ($("#pedal-inside-border-check").is(":checked")) {
//             pedal["inside-border"] = $("#pedal-inside-border").val();
//         } else {
//             delete pedal["inside-border"];
//         }

//         // --- helper for position ---
//         function getPosition($control) {
//             const posVal = $control.find(".ctrl-position").val();
//             const $posInput = $control.find(".ctrl-position-value");

//             if (posVal === "margin-left" || posVal === "margin-right") {
//                 const px = parseInt($posInput.val(), 10) || 0;
//                 return `${posVal}:${px}px`;
//             } else if (posVal && posVal.trim() !== "") {
//                 return posVal;
//             }
//             return undefined;
//         }

//         // --- loop over rows/controls ---
//         const allLabels = {};
//         let duplicateFound = false;

//         // First, remove any previous highlighting
//         $("#controls .control").css("border", "").css("background-color", "");

//         $("#controls .row").each(function () {
//             const rowObj = { row: [] };
//             $(this).find(".controls-row .control").each(function () {
//                 const type = $(this).data("type");
//                 const ctrl = {
//                     label: $(this).find(".ctrl-label").val(),
//                     type: type
//                 };

//                 const label = ctrl.label?.trim();
//                 if (label) {
//                     if (allLabels[label]) {
//                         allLabels[label].push($(this));
//                         duplicateFound = true;
//                     } else {
//                         allLabels[label] = [$(this)];
//                     }
//                 }

//                 if (type.includes("knob")) {
//                     const knobType = $(this).find(".ctrl-knob-type").val();
//                     if (knobType === "discrete") {
//                         const valuesText = $(this).find(".ctrl-values-list").val().trim();
//                         const valuesArray = valuesText.split(",").map(v => v.trim());
//                         ctrl.values = valuesArray;
//                         ctrl.value = $(this).find(".ctrl-value-select").val() || valuesArray[0];
//                     } else {
//                         ctrl.min = parseInt($(this).find(".ctrl-min").val());
//                         ctrl.max = parseInt($(this).find(".ctrl-max").val());
//                         ctrl.value = parseInt($(this).find(".ctrl-value").val());
//                     }
//                     const spanVal = $(this).find(".ctrl-span").val();
//                     if (spanVal) ctrl.span = spanVal;
//                     if ($(this).find(".ctrl-knob-color-enable").is(":checked")) {
//                         ctrl["knob-color"] = $(this).find(".ctrl-knob-color").val();
//                     }
//                     if ($(this).find(".ctrl-knob-border-enable").is(":checked")) {
//                         ctrl["knob-border"] = $(this).find(".ctrl-knob-border").val();
//                     }
//                     if ($(this).find(".ctrl-knob-indicator-enable").is(":checked")) {
//                         ctrl["knob-indicator"] = $(this).find(".ctrl-knob-indicator").val();
//                     }
//                     if ($(this).find(".ctrl-knob-thick").is(":checked")) {
//                         ctrl.border = "thick";
//                     }
//                     const sizeVal = $(this).find(".ctrl-size").val();
//                     ctrl.type = sizeVal === "regular" ? "knob" : sizeVal;
//                     const pos = getPosition($(this));
//                     if (pos) ctrl.position = pos;

//                 } else if (type === "led") {
//                     // Collect all colors dynamically from .ctrl-color inputs
//                     ctrl.colors = $(this).find(".ctrl-color").map(function() {
//                         return $(this).val();
//                     }).get();

//                     // Selected index from the dropdown
//                     ctrl.value = parseInt($(this).find(".ctrl-value").val()) || 0;

//                     // Show label yes/no
//                     ctrl.showlabel = $(this).find(".ctrl-showlabel").is(":checked") ? "yes" : "no";

//                     // Position
//                     const pos = getPosition($(this));
//                     if (pos) ctrl.position = pos;

//                 } else if (type === "slider") {
//                     ctrl.orientation = $(this).find(".ctrl-orientation").val();
//                     ctrl.value = parseInt($(this).find(".ctrl-value").val());
//                     const pos = getPosition($(this));
//                     if (pos) ctrl.position = pos;

//                 } else if (type === "lcd") {
//                     ctrl.value = $(this).find(".ctrl-text").val();
//                     ctrl.shape = $(this).find(".ctrl-round").is(":checked") ? "round" : "";
//                     ctrl.width = parseFloat($(this).find(".ctrl-width").val());
//                     ctrl.height = parseFloat($(this).find(".ctrl-height").val());
//                     ctrl["screen-color"] = $(this).find(".ctrl-screen1").val();
//                     ctrl["text-color"] = $(this).find(".ctrl-screen2").val();
//                     const pos = getPosition($(this));
//                     if (pos) ctrl.position = pos;

//                 } else if (type === "multi") {
//                     ctrl.values = $(this).find(".ctrl-values").val().split(",");
//                     ctrl.value = $(this).find(".ctrl-value").val();
//                     ctrl.showlabel = $(this).find(".ctrl-showlabel").is(":checked") ? "yes" : "no";
//                     const pos = getPosition($(this));
//                     if (pos) ctrl.position = pos;
//                 }

//                 rowObj.row.push(ctrl);
//             });
//             pedal.controls.push(rowObj);
//         });

//         // Highlight duplicates
//         if (duplicateFound) {
//             $("#json-error").text("Error: Duplicate control labels detected!");
//             Object.values(allLabels).forEach(controlsArray => {
//                 if (controlsArray.length > 1) {
//                     controlsArray.forEach($ctrl => {
//                         $ctrl.css("border", "2px solid red");
//                     });
//                 }
//             });
//         } else {
//             $("#json-error").text("");
//         }

//         $("#json-error").text(cssError); // show all errors in the UI

//         const jsonString = JSON.stringify(pedal, null, 2); // use pedal, not data

//         // Populate json viewer (to be removed later)
//         $("#json-output").val(JSON.stringify(pedal, null, 2));

//         const $pedalDiv = $("#pedal-box");
//         $pedalDiv.empty().append(renderPedal(pedal));

//         highlightRequiredFields(); // Highlight missing required fields


//         // Update parent
//         if (window.parent && typeof window.parent.setPedalJSON === 'function') {
//             window.parent.setPedalJSON(jsonString);
//         }


//         return {
//             pedal,          // the actual pedal object
//             cssError: cssError.trim(), // string, empty if none
//             hasMissingFields: !highlightRequiredFields(), // true if something missing
//             duplicateFound   // true if duplicate labels exist
//         };


// }







let lastValidation = null;

// Builder logic
function buildJSON() {
    if (isSyncing) return lastValidation; // Skip rebuild during JSON sync

    // --- Base pedal object ---
    const pedal = {
        _id: $("#pedal-id").val(),
        name: $("#pedal-name").val(),
        logo: $("#pedal-logo").val(),
        type: $("#pedal-type").val(),
        width: $("#pedal-width").val(),
        height: $("#pedal-height").val(),
        color: $("#pedal-color").val(),
        "font-color": $("#font-color").val(),
        "knobs-color": $("#knobs-color").val(),
        "knobs-border": $("#knobs-border").val(),
        "knobs-indicator": $("#knobs-indicator").val(),
        controls: []
    };

    // --- Inside color logic ---
    const insideType = $("#inside-type-select").val();
    if (insideType === "color") {
        pedal["inside-color"] = $("#pedal-inside-color").val() + ($("#pedal-inside-full-check").is(":checked") ? " full" : "");
    } else {
        pedal["inside-color"] = $("#pedal-inside-image").val(); // URL
    }

    // --- CSS validation ---
    let cssError = "";
    const invalidCssProps = { position: "relative" };

    const logoEl = document.createElement("div");
    logoEl.style.cssText = $("#pedal-logo").val();
    for (const prop in invalidCssProps) {
        if (logoEl.style[prop] === invalidCssProps[prop]) {
            cssError += `Logo CSS cannot include "${prop}:${invalidCssProps[prop]}". `;
        }
    }

    const nameEl = document.createElement("div");
    nameEl.style.cssText = $("#pedal-name").val();
    for (const prop in invalidCssProps) {
        if (nameEl.style[prop] === invalidCssProps[prop]) {
            cssError += `Name CSS cannot include "${prop}:${invalidCssProps[prop]}". `;
        }
    }

    // --- Inside border ---
    if ($("#pedal-inside-border-check").is(":checked")) {
        pedal["inside-border"] = $("#pedal-inside-border").val();
    } else {
        delete pedal["inside-border"];
    }

    // --- Helper: get position ---
    function getPosition($ctrl) {
        const posVal = $ctrl.find(".ctrl-position").val();
        const $posInput = $ctrl.find(".ctrl-position-value");
        if (posVal === "margin-left" || posVal === "margin-right") {
            const px = parseInt($posInput.val(), 10) || 0;
            return `${posVal}:${px}px`;
        } else if (posVal && posVal.trim() !== "") {
            return posVal;
        }
        return undefined;
    }

    // --- Controls processing ---
    const allLabels = {};
    let duplicateFound = false;

    $("#controls .control").css("border", "").css("background-color", ""); // reset highlights

    $("#controls .row").each(function () {
        const rowObj = { row: [] };
        $(this).find(".controls-row .control").each(function () {
            const type = $(this).data("type");
            const ctrl = { label: $(this).find(".ctrl-label").val(), type };

            const label = ctrl.label?.trim();
            if (label) {
                if (allLabels[label]) {
                    allLabels[label].push($(this));
                    duplicateFound = true;
                } else {
                    allLabels[label] = [$(this)];
                }
            }

            // --- Knobs, LEDs, Sliders, LCDs, Multi ---
            if (type.includes("knob")) {
                const knobType = $(this).find(".ctrl-knob-type").val();
                if (knobType === "discrete") {
                    const valuesArray = $(this).find(".ctrl-values-list").val().trim().split(",").map(v => v.trim());
                    ctrl.values = valuesArray;
                    ctrl.value = $(this).find(".ctrl-value-select").val() || valuesArray[0];
                } else {
                    ctrl.min = parseInt($(this).find(".ctrl-min").val());
                    ctrl.max = parseInt($(this).find(".ctrl-max").val());
                    ctrl.value = parseInt($(this).find(".ctrl-value").val());
                }
                const spanVal = $(this).find(".ctrl-span").val();
                if (spanVal) ctrl.span = spanVal;
                if ($(this).find(".ctrl-knob-color-enable").is(":checked")) ctrl["knob-color"] = $(this).find(".ctrl-knob-color").val();
                if ($(this).find(".ctrl-knob-border-enable").is(":checked")) ctrl["knob-border"] = $(this).find(".ctrl-knob-border").val();
                if ($(this).find(".ctrl-knob-indicator-enable").is(":checked")) ctrl["knob-indicator"] = $(this).find(".ctrl-knob-indicator").val();
                if ($(this).find(".ctrl-knob-thick").is(":checked")) ctrl.border = "thick";
                const sizeVal = $(this).find(".ctrl-size").val();
                ctrl.type = sizeVal === "regular" ? "knob" : sizeVal;
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "led") {
                ctrl.colors = $(this).find(".ctrl-color").map((_, el) => $(el).val()).get();
                ctrl.value = parseInt($(this).find(".ctrl-value").val()) || 0;
                ctrl.showlabel = $(this).find(".ctrl-showlabel").is(":checked") ? "yes" : "no";
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "slider") {
                ctrl.orientation = $(this).find(".ctrl-orientation").val();
                ctrl.value = parseInt($(this).find(".ctrl-value").val());
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "lcd") {
                ctrl.value = $(this).find(".ctrl-text").val();
                ctrl.shape = $(this).find(".ctrl-round").is(":checked") ? "round" : "";
                ctrl.width = parseFloat($(this).find(".ctrl-width").val());
                ctrl.height = parseFloat($(this).find(".ctrl-height").val());
                ctrl["screen-color"] = $(this).find(".ctrl-screen1").val();
                ctrl["text-color"] = $(this).find(".ctrl-screen2").val();
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "multi") {
                ctrl.values = $(this).find(".ctrl-values").val().split(",");
                ctrl.value = $(this).find(".ctrl-value").val();
                ctrl.showlabel = $(this).find(".ctrl-showlabel").is(":checked") ? "yes" : "no";
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            }

            rowObj.row.push(ctrl);
        });
        pedal.controls.push(rowObj);
    });

    // --- Highlight duplicates ---
    if (duplicateFound) {
        $("#json-error").text("Error: Duplicate control labels detected!");
        Object.values(allLabels).forEach(arr => {
            if (arr.length > 1) arr.forEach($ctrl => $ctrl.css("border", "2px solid red"));
        });
    }

    // --- Populate JSON output ---
    const jsonString = JSON.stringify(pedal, null, 2);
    $("#json-output").val(jsonString);
    const $pedalDiv = $("#pedal-box");
    $pedalDiv.empty().append(renderPedal(pedal));

    const hasMissingFields = !highlightRequiredFields();

    // --- Update parent ---
    if (window.parent && typeof window.parent.setPedalJSON === "function") {
        window.parent.setPedalJSON(jsonString);
    }

    // --- Store validation object ---
    lastValidation = { pedal, cssError: cssError.trim(), hasMissingFields, duplicateFound };

    return lastValidation;
}

// --- Expose getter to parent ---
window.getPedalValidation = function() {
    return lastValidation || buildJSON();
};










function highlightRequiredFields() {
    // Clear previous highlights
    $("#pedal-id, #controls .ctrl-label, #controls .ctrl-values-list").css("border", "");

    let hasError = false;

    // Check Pedal ID
    const pedalId = $("#pedal-id").val().trim();
    if (!pedalId) {
        $("#pedal-id").css("border", "2px solid red");
        hasError = true;
    }

    // Check all control labels
    $("#controls .ctrl-label").each(function() {
        const labelVal = $(this).val().trim();
        if (!labelVal) {
            $(this).css("border", "2px solid red");
            hasError = true;
        }
    });

    // Check values for Multi controls or discrete knobs
    $("#controls .control").each(function() {
        const type = $(this).data("type");

        if (type === "multi") {
            const values = $(this).find(".ctrl-values").val().trim();
            if (!values) {
                $(this).find(".ctrl-values").css("border", "2px solid red");
                hasError = true;
            }
        } else if (type.includes("knob") && $(this).find(".ctrl-knob-type").val() === "discrete") {
            const values = $(this).find(".ctrl-values-list").val().trim();
            if (!values) {
                $(this).find(".ctrl-values-list").css("border", "2px solid red");
                hasError = true;
            }
        }
    });

    return !hasError; // true if all required fields are filled
}





function syncUIFromJSON(pedal) {

    isSyncing = true; // Disable buildJSON()

    // --- Helper: restore position (dropdown + numeric px) ---
    function applyPosition($ctrl, ctrl) {
        if (ctrl.position) {
            if (ctrl.position.startsWith("margin-left:") || ctrl.position.startsWith("margin-right:")) {
                const [side, pxVal] = ctrl.position.split(":");
                $ctrl.find(".ctrl-position").val(side);
                $ctrl.find(".ctrl-position-value")
                    .val(parseInt(pxVal)) // strip "px"
                    .show();
            } else {
                $ctrl.find(".ctrl-position").val(ctrl.position);
                $ctrl.find(".ctrl-position-value").val("").hide();
            }
        } else {
            $ctrl.find(".ctrl-position").val("").hide();
        }
    }

    // --- Basic pedal info ---
    $("#pedal-id").val(pedal._id || "");
    $("#pedal-name").val(pedal.name || "");
    $("#pedal-logo").val(pedal.logo || "");
    $("#pedal-type").val(pedal.type || "pedal");
    $("#pedal-width").val(pedal.width || "standard");
    $("#pedal-height").val(pedal.height || "standard");
    $("#pedal-color").val(pedal.color || "#264985");
    $("#font-color").val(pedal["font-color"] || "#ffffff");
    $("#knobs-color").val(pedal["knobs-color"] || "#191919");
    $("#knobs-border").val(pedal["knobs-border"] || "#424242");
    $("#knobs-indicator").val(pedal["knobs-indicator"] || "#ffffff");


if (pedal["inside-color"]) {
    const insideVal = pedal["inside-color"].trim();
    const isImage = /^(https?:\/\/|data:image\/|images\/)/i.test(insideVal);

    if (isImage) {
        $("#inside-type-select").val("image");
        $("#inside-color-label").hide();
        $("#pedal-inside-full-check-label").hide();
        $("#inside-image-label").show();
        $("#pedal-inside-image").val(insideVal);
    } else {
        $("#inside-type-select").val("color");
        $("#inside-color-label").show();
        $("#pedal-inside-full-check-label").show();
        $("#inside-image-label").hide();
        $("#pedal-inside-color").val(insideVal.replace(" full", ""));
        $("#pedal-inside-full-check").prop("checked", insideVal.includes("full"));
    }
}



    // --- Inside border ---
    if (pedal["inside-border"]) {
        $("#pedal-inside-border-check").prop("checked", true);
        $("#pedal-inside-border").val(pedal["inside-border"]);
    } else {
        $("#pedal-inside-border-check").prop("checked", false);
    }

    // --- Clear & rebuild controls ---
    $("#controls").empty();
    if (Array.isArray(pedal.controls)) {
        pedal.controls.forEach(rowObj => {
            $("#add-row").trigger("click"); // add empty row
            const $lastRow = $("#controls .row").last();
            const $controlsRow = $lastRow.find(".controls-row");

            rowObj.row.forEach(ctrl => {
                // --- Pick template ---
                let templateId;
                switch (ctrl.type) {
                    case "knob":
                    case "smallknob":
                    case "largeknob":
                    case "xlargeknob":
                        templateId = "#knob-template";
                        break;
                    case "led":
                        templateId = "#led-template";
                        break;
                    case "slider":
                        templateId = "#slider-template";
                        break;
                    case "lcd":
                        templateId = "#lcd-template";
                        break;
                    case "multi":
                        templateId = "#multi-template";
                        break;
                }
                if (!templateId) return;

                const $ctrl = $($(templateId).html());
                $ctrl.find(".ctrl-label").val(ctrl.label || "");

                // --- KNOB ---
                if (ctrl.type.includes("knob")) {
                    $ctrl.find(".ctrl-size").val(ctrl.type);

                    if (Array.isArray(ctrl.values) && ctrl.values.length > 0) {
                        // DISCRETE
                        $ctrl.find(".ctrl-knob-type").val("discrete").trigger("change");
                        $ctrl.find(".ctrl-values-list").val(ctrl.values.join(","));
                        const $select = $ctrl.find(".ctrl-value-select");
                        $select.empty();
                        ctrl.values.forEach(v => $select.append(`<option>${v}</option>`));
                        $select.val(ctrl.value || ctrl.values[0]);
                        $ctrl.find(".ctrl-span").val(ctrl.span || "");
                    } else {
                        // NUMERIC
                        $ctrl.find(".ctrl-knob-type").val("numeric").trigger("change");
                        $ctrl.find(".ctrl-min").val(ctrl.min ?? "");
                        $ctrl.find(".ctrl-max").val(ctrl.max ?? "");
                        $ctrl.find(".ctrl-value").val(ctrl.value ?? "");
                        $ctrl.find(".ctrl-values-list").val("");
                        $ctrl.find(".ctrl-value-select").empty();
                        $ctrl.find(".ctrl-span").val(ctrl.span || "");
                    }

                    if (ctrl["knob-color"]) {
                        $ctrl.find(".ctrl-knob-color-enable").prop("checked", true);
                        $ctrl.find(".ctrl-knob-color").prop("disabled", false).val(ctrl["knob-color"]);
                    }
                    if (ctrl["knob-border"]) {
                        $ctrl.find(".ctrl-knob-border-enable").prop("checked", true);
                        $ctrl.find(".ctrl-knob-border").prop("disabled", false).val(ctrl["knob-border"]);
                    }
                    if (ctrl["knob-indicator"]) {
                        $ctrl.find(".ctrl-knob-indicator-enable").prop("checked", true);
                        $ctrl.find(".ctrl-knob-indicator").prop("disabled", false).val(ctrl["knob-indicator"]);
                    }
                    if (ctrl.border === "thick") {
                        $ctrl.find(".ctrl-knob-thick").prop("checked", true);
                    }

                    applyPosition($ctrl, ctrl);

                // --- LED ---
                } else if (ctrl.type === "led") {
                    $ctrl.find(".ctrl-color0").val(ctrl.colors?.[0] || "#000000");
                    $ctrl.find(".ctrl-color1").val(ctrl.colors?.[1] || "#ff0000");
                    $ctrl.find(".ctrl-value").val(ctrl.value);
                    $ctrl.find(".ctrl-showlabel").prop("checked", ctrl.showlabel === "yes");

                    applyPosition($ctrl, ctrl);

                // --- SLIDER ---
                } else if (ctrl.type === "slider") {
                    $ctrl.find(".ctrl-orientation").val(ctrl.orientation || "vertical");
                    $ctrl.find(".ctrl-min").val(ctrl.min);
                    $ctrl.find(".ctrl-max").val(ctrl.max);
                    $ctrl.find(".ctrl-value").val(ctrl.value);

                    applyPosition($ctrl, ctrl);

                // --- LCD ---
                } else if (ctrl.type === "lcd") {
                    $ctrl.find(".ctrl-text").val(ctrl.value || "LCD");
                    $ctrl.find(".ctrl-round").prop("checked", ctrl.shape === "round");
                    $ctrl.find(".ctrl-width").val(ctrl.width || "");
                    $ctrl.find(".ctrl-height").val(ctrl.height || "");
                    $ctrl.find(".ctrl-screen1").val(ctrl["screen-color"] || "#111111");
                    $ctrl.find(".ctrl-screen2").val(ctrl["text-color"] || "#ff0000");

                    applyPosition($ctrl, ctrl);

                // --- MULTI ---
                } else if (ctrl.type === "multi") {
                    $ctrl.find(".ctrl-values").val(ctrl.values?.join(",") || "");
                    $ctrl.find(".ctrl-value").val(ctrl.value);
                    $ctrl.find(".ctrl-showlabel").prop("checked", ctrl.showlabel === "yes");

                    applyPosition($ctrl, ctrl);
                }

                $controlsRow.append($ctrl);
            });
        });
    }

    isSyncing = false; // Re-enable buildJSON
    buildJSON(); // Rebuild once

    // Re-render pedal
    $("#pedal-box").empty().append(renderPedal(pedal));
}
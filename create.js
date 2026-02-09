let lastValidation = null;


function normalizeStyleAttributeQuotes(value) {
    if (typeof value !== "string") return value;

    return value.replace(
        /style='([^']*)'/gi,
        'style="$1"'
    );
}




// Builder logic
function buildJSON() {
    if (isSyncing) return lastValidation; // Skip rebuild during JSON sync

    const rawLogo = $("#pedal-logo").val();
    const rawName = $("#pedal-name").val();

    // --- Base pedal object ---
    const pedal = {
        _id: $("#pedal-id").val(),
        name: normalizeStyleAttributeQuotes(rawName),
        logo: normalizeStyleAttributeQuotes(rawLogo),
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

    // --- SAFETY: _id / _rev normalization (required for template duplicate) ---
    if (!pedal._id && pedal._rev) {
        delete pedal._rev;
    }


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
                if ($(this).find(".ctrl-knob-label-color-enable").is(":checked")) ctrl["knob-label-color"] = $(this).find(".ctrl-knob-label-color").val();
                if ($(this).find(".ctrl-knob-label-background-enable").is(":checked")) ctrl["knob-label-background"] = $(this).find(".ctrl-knob-label-background").val();
                if ($(this).find(".ctrl-knob-label-inverted").is(":checked")) ctrl.labelPos = "inverted";
                const sizeVal = $(this).find(".ctrl-size").val();
                ctrl.type = sizeVal === "regular" ? "knob" : sizeVal;
                // const pos = getPosition($(this));
                // if (pos) ctrl.position = pos;
                const pos = getKnobPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "led") {
                ctrl.colors = $(this).find(".ctrl-color").map((_, el) => $(el).val()).get();
                ctrl.value = parseInt($(this).find(".ctrl-value").val()) || 0;
                ctrl.showlabel = $(this).find(".ctrl-showlabel").is(":checked") ? "yes" : "no";
                const pos = getPosition($(this));
                if (pos) ctrl.position = pos;
            } else if (type === "slider") {
                ctrl.orientation = $(this).find(".ctrl-orientation").val();
                ctrl.min = parseInt($(this).find(".ctrl-min").val());
                ctrl.max = parseInt($(this).find(".ctrl-max").val())
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

    // --- Metadata (author, authorId, published) ---

    // Author (read-only, comes from hidden field)
    const authorVal = $("#pedal-author").val();
    if (authorVal && authorVal.trim() !== "") {
        pedal.author = authorVal;
        pedal.authorId = $("#pedal-author-id").val() || "";
    } else if (window.currentUser) {
        // only for new pedal
        pedal.author = window.currentUser.username;
        pedal.authorId = window.currentUser.userid;
    } else {
        pedal.author = "unknown";
        pedal.authorId = "";
    }


    // Published: editable via custom select (defaults to draft if not set)
    const selectedText = $("#pedal-published-button").text().trim().toLowerCase();
    const validStatuses = ["draft", "private", "reviewing", "template", "public"];
    pedal.published = validStatuses.includes(selectedText) ? selectedText : "draft";




    // Rebuild JSON whenever publication status changes
    $(function() {
        $("#pedal-published").on("change", function() {
            buildJSON();
        });
    });

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

    // --- Error handling ---
    $("#json-error").text(""); // clear any old error text

    if (cssError.trim()) {
        $("#json-error").append(cssError + " ");
    }

    if (duplicateFound) {
        $("#json-error").append("Error: Duplicate control labels detected!");
        Object.values(allLabels).forEach(arr => {
            if (arr.length > 1) arr.forEach($ctrl => $ctrl.css("border", "2px solid red"));
        });
    }

    if (hasMissingFields) {
        $("#json-error").append(" Error: Required fields are missing! ");
    }


    // --- At least one LED validation ---
    let ledFound = false;
    pedal.controls.forEach(row => {
        row.row.forEach(ctrl => {
            if (ctrl.type === "led") ledFound = true;
        });
    });

    if (!ledFound) {
        $("#json-error").append("Error: At least one LED is required! ");
        cssError += "Error: At least one LED is required!";
    }


    // --- Store validation object ---
    lastValidation = { 
        pedal, 
        cssError: cssError.trim(), 
        hasMissingFields, 
        duplicateFound, 
        ledFound 
    };

    return lastValidation;
}

// --- Expose getter to parent ---
window.getPedalValidation = function() {
    return lastValidation || buildJSON();
};






// --- Helper: get knob position (keyword + margin) ---
function getKnobPosition($ctrl) {
    const keyword = $ctrl.find(".ctrl-position-keyword").val().trim();
    const margin = $ctrl.find(".ctrl-position-margin").val();
    const px = parseInt($ctrl.find(".ctrl-position-margin-value").val(), 10) || 0;

    let pos = keyword || "";
    if (margin && px > 0) {
        pos += (pos ? " " : "") + `${margin}:${px}px`;
    } else if (margin && !keyword) {
        pos = `${margin}:${px}px`;
    }
    return pos || undefined;
}








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



// Put this once in create.html (initialization area)
(function initLedHelpers() {
  if (window.__ledHelpersInit) return;
  window.__ledHelpersInit = true;

  // Update the numeric options in the .ctrl-value select based on color inputs
  function updateLedValueSelect($ctrl) {
    const $select = $ctrl.find(".ctrl-value");
    $select.empty();
    $ctrl.find(".led-colors-container .ctrl-color").each(function(i) {
      $select.append($(`<option value="${i}">${i}</option>`));
    });
    const prev = parseInt($select.data("prev"), 10);
    const maxIdx = $ctrl.find(".ctrl-color").length - 1;
    const newVal = (!isNaN(prev) && prev <= maxIdx) ? prev : 0;
    $select.val(newVal);
    $select.data("prev", newVal);
  }

  // Expose for syncUIFromJSON to call
  window.updateLedValueSelect = updateLedValueSelect;

  // Delegated: add a new color input (pressing + Color)
  $(document).on("click", ".add-led-color", function(e) {
    const $ctrl = $(this).closest(".control");
    const nextIndex = $ctrl.find(".led-colors-container .ctrl-color").length;
    const $label = $(`<label>Color ${nextIndex} </label>`);
    const $inp = $(`<input type="color" class="ctrl-color">`).val("#ffffff");
    $label.append($inp);
    $ctrl.find(".led-colors-container").append($label);
    updateLedValueSelect($ctrl);
    buildJSON(); // reflect change immediately
  });

  // Delegated: when a color input changes, refresh the select and JSON
  $(document).on("input", ".led-colors-container .ctrl-color", function() {
    const $ctrl = $(this).closest(".control");
    updateLedValueSelect($ctrl);
    buildJSON();
  });

  // Keep track of previous selection for ctrl-value so restoring works
  $(document).on("change", ".ctrl-value", function() {
    $(this).data("prev", $(this).val());
  });
})();






// keep at bottom of create.js
function updateInsideUI() {
    const type = $("#inside-type-select").val();
    const isFull = $("#pedal-inside-full-check").is(":checked");

    if (type === "color") {
        $("#pedal-inside-full-check, #pedal-inside-full-check-label").show();
        if (isFull) {
            $("#pedal-inside-border, #pedal-inside-border-check, #pedal-inside-border-label").show();
        } else {
            $("#pedal-inside-border, #pedal-inside-border-check, #pedal-inside-border-label").hide();
        }
    } else {
        $("#pedal-inside-full-check, #pedal-inside-full-check-label").hide();
        $("#pedal-inside-border, #pedal-inside-border-check, #pedal-inside-border-label").show();
    }
}

// expose to global scope so syncUIFromJSON can see it
window.updateInsideUI = updateInsideUI;




// Attach global handlers ONCE
$(document).on("change", "#inside-type-select", updateInsideUI);
$(document).on("change", "#pedal-inside-full-check", updateInsideUI);





function syncUIFromJSON(pedal) {

    isSyncing = true; // Disable buildJSON()

    // --- Helper: restore position (dropdown + numeric px) ---
    function applyPosition($ctrl, ctrl) {
        const $keyword = $ctrl.find(".ctrl-position-keyword");
        const $margin = $ctrl.find(".ctrl-position-margin");
        const $marginValue = $ctrl.find(".ctrl-position-margin-value");
        const $dropdown = $ctrl.find(".ctrl-position");
        const $posInput = $ctrl.find(".ctrl-position-value");

        if (ctrl.position) {
            if ($keyword.length) { // knobs
                const parts = ctrl.position.trim().split(" ");

                // Case 1: keyword + margin
                if (parts.length > 1) {
                    $keyword.val(parts[0] || "");
                    if (parts[1].startsWith("margin-")) {
                        const [side, px] = parts[1].split(":");
                        $margin.val(side);
                        $marginValue.val(parseInt(px) || 0).show();
                    } else {
                        $margin.val("");
                        $marginValue.val("").hide();
                    }

                // Case 2: margin-only
                } else if (parts[0].startsWith("margin-")) {
                    $keyword.val(""); // no keyword
                    const [side, px] = parts[0].split(":");
                    $margin.val(side);
                    $marginValue.val(parseInt(px) || 0).show();

                // Case 3: keyword-only
                } else {
                    $keyword.val(parts[0] || "");
                    $margin.val("");
                    $marginValue.val("").hide();
                }

            } 
            else if ($dropdown.length) { // other controls
                if (ctrl.position.startsWith("margin-left:") || ctrl.position.startsWith("margin-right:")) {
                    const [side, pxVal] = ctrl.position.split(":");
                    $dropdown.val(side);
                    $posInput.val(parseInt(pxVal) || 0).show();
                } else {
                    $dropdown.val(ctrl.position);
                    $posInput.val("").hide();
                }
            }
        } else {
            if ($keyword.length) {
                $keyword.val("");
                $margin.val("");
                $marginValue.val("").hide();
            }
            if ($dropdown.length) {
                $dropdown.val("");
                $posInput.val("").hide();
            }
        }
    }

    // --- Basic pedal info ---
    $("#pedal-id").val(pedal._id || "");
    $("#pedal-name").val(pedal.name || "");
    $("#pedal-logo").val(pedal.logo || "");
    $("#pedal-type").val(pedal.type || "pedal");
    $("#pedal-width").val(pedal.width !== undefined ? pedal.width : "standard");
    $("#pedal-height").val(pedal.height !== undefined ? pedal.height : "standard");
    $("#pedal-color").val(pedal.color || "#264985");
    $("#font-color").val(pedal["font-color"] || "#ffffff");
    $("#knobs-color").val(pedal["knobs-color"] || "#191919");
    $("#knobs-border").val(pedal["knobs-border"] || "#424242");
    $("#knobs-indicator").val(pedal["knobs-indicator"] || "#ffffff");


    // --- Inside color/image setup ---
    if (pedal["inside-color"]) {
        const insideVal = pedal["inside-color"].trim();
        const isImage = /^(https?:\/\/|data:image\/|images\/)/i.test(insideVal);

        if (isImage) {
            $("#inside-type-select").val("image");
            $("#inside-color-label").hide();
            $("#inside-image-label").show();
            $("#pedal-inside-image").val(insideVal);
            updateInsideUI();
        } else {
            $("#inside-type-select").val("color");
            $("#inside-color-label").show();
            $("#inside-image-label").hide();
            $("#pedal-inside-color").val(insideVal.replace(" full", ""));
            $("#pedal-inside-full-check").prop("checked", insideVal.includes("full"));
            updateInsideUI();
        }
    } else {
        // default if missing
        $("#inside-type-select").val("color");
        $("#inside-color-label").show();
        $("#inside-image-label").hide();
        $("#pedal-inside-color").val("");
        $("#pedal-inside-full-check").prop("checked", false);
    }

    // Restore inside-border from DB
    if (pedal["inside-border"]) {
        $("#pedal-inside-border").val(pedal["inside-border"]);
        $("#pedal-inside-border-check").prop("checked", true);
    } else {
        $("#pedal-inside-border").val("");
        $("#pedal-inside-border-check").prop("checked", false);
    }



    // Initial call to set visibility
    updateInsideUI();


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

                    // Append to DOM first so change handlers work
                    $controlsRow.append($ctrl);

                    if (Array.isArray(ctrl.values) && ctrl.values.length > 0) {
                        // DISCRETE
                        $ctrl.find(".ctrl-knob-type").val("discrete");

                        // populate values dropdown and show it
                        const $select = $ctrl.find(".ctrl-value-select");
                        $select.empty().show();
                        ctrl.values.forEach(v => $select.append(`<option>${v}</option>`));
                        $select.val(ctrl.value || ctrl.values[0]);

                        $ctrl.find(".ctrl-values-list")
                            .val(ctrl.values.join(","))
                            .show(); // show values list

                        $ctrl.find(".ctrl-span").val(ctrl.span || "");

                        // hide numeric fields
                        $ctrl.find(".ctrl-min, .ctrl-max, .ctrl-value").hide();

                        // trigger change to apply any extra UI logic
                        $ctrl.find(".ctrl-knob-type").trigger("change");
                    } else {
                        // NUMERIC
                        $ctrl.find(".ctrl-knob-type").val("numeric").trigger("change");
                        $ctrl.find(".ctrl-min").val(ctrl.min ?? "").show();
                        $ctrl.find(".ctrl-max").val(ctrl.max ?? "").show();
                        $ctrl.find(".ctrl-value").val(ctrl.value ?? "").show();
                        $ctrl.find(".ctrl-values-list").val("").hide();
                        $ctrl.find(".ctrl-value-select").empty().hide();
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
                    if (ctrl["knob-label-color"]) {
                        $ctrl.find(".ctrl-knob-label-color-enable").prop("checked", true);
                        $ctrl.find(".ctrl-knob-label-color").prop("disabled", false).val(ctrl["knob-label-color"]);
                    }
                    if (ctrl["knob-label-background"]) {
                        $ctrl.find(".ctrl-knob-label-background-enable").prop("checked", true);
                        $ctrl.find(".ctrl-knob-label-background").prop("disabled", false).val(ctrl["knob-label-background"]);
                    }
                    if (ctrl.labelPos === "inverted") {
                        $ctrl.find(".ctrl-knob-label-inverted").prop("checked", true);
                    }

                    applyPosition($ctrl, ctrl);

                // --- LED ---
                } else if (ctrl.type === "led") {
                    // Ensure colors array (fallback to default two)
                    const colors = Array.isArray(ctrl.colors) && ctrl.colors.length > 0
                    ? ctrl.colors
                    : ["#000000", "#ff0000"];

                    // Fill led-colors-container dynamically
                    const $container = $ctrl.find(".led-colors-container");
                    $container.empty();
                    colors.forEach((color, idx) => {
                    const $label = $(`<label>Color ${idx} </label>`);
                    const $input = $(`<input type="color" class="ctrl-color">`).val(color);
                    $label.append($input);
                    $container.append($label);
                    });

                    // showlabel
                    $ctrl.find(".ctrl-showlabel").prop("checked", ctrl.showlabel === "yes");

                    // Populate/refresh the numeric dropdown with indices and preserve selection
                    if (typeof window.updateLedValueSelect === "function") {
                    window.updateLedValueSelect($ctrl);
                    const v = parseInt(ctrl.value, 10);
                    if (!isNaN(v)) {
                        $ctrl.find(".ctrl-value").data("prev", v).val(v);
                    }
                    }

                    applyPosition($ctrl, ctrl);


                // --- SLIDER ---
                } else if (ctrl.type === "slider") {
                    $ctrl.find(".ctrl-orientation").val(ctrl.orientation || "vertical");
                    $ctrl.find(".ctrl-min").val(ctrl.min ?? -15);
                    $ctrl.find(".ctrl-max").val(ctrl.max ?? 15);
                    $ctrl.find(".ctrl-value").val(ctrl.value ?? 0);

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
                    $ctrl.find(".ctrl-showlabel").prop("checked", ctrl.showlabel !== "no");

                    applyPosition($ctrl, ctrl);
                }

                $controlsRow.append($ctrl);
            });
        });
    }

    // Author (read-only)
    if ($("#pedal-author").length) {
        $("#pedal-author").val(pedal.author || "unknown");
    }
    if ($("#pedal-author-id").length) {
        $("#pedal-author-id").val(pedal.authorId || "");
    }

// --- Published (custom dropdown) ---
if ($("#pedal-published-button").length) {
    const validStatuses = ["draft", "private", "reviewing", "template", "public"];
    const status = validStatuses.includes(pedal.published) ? pedal.published : "draft";

    // Set the button text to reflect the current status
    $("#pedal-published-button").text(status.charAt(0).toUpperCase() + status.slice(1));

    // Remove li elements entirely for regular users if status is reviewing or public
    const userRole = parent?.window?.currentUser?.role || "user";
    if (userRole !== "admin" && (status === "reviewing" || status === "template" || status === "public")) {
        $("#pedal-published-options li").remove();
        $("#request-publication").remove(); // also hide the Ask Publication button
    }

    // Optional: rebuild JSON when user selects a new status
    $("#pedal-published-options li").off("click.syncPublished").on("click.syncPublished", function() {
        const selectedText = $(this).text().trim().toLowerCase();
        if (validStatuses.includes(selectedText)) {
            $("#pedal-published-button").text($(this).text().trim()); // update display
            buildJSON(); // rebuild JSON with new status
        }
    });
}


    // Re-render pedal
    $("#pedal-box").empty();
    const $pedalDiv = renderPedal(pedal);
    $("#pedal-box").append($pedalDiv);

    // Attach all control logic (knobs, sliders, tooltips, etc.)
    renderPedalControls(pedal, $pedalDiv);

    // Delay re-enabling buildJSON to prevent width/height reset on click
    setTimeout(() => {
        isSyncing = false;
        buildJSON(); // rebuild once
    }, 0);

}





// Add once during initialization
$(document).on("change", ".ctrl-knob-type", function() {
    const $ctrl = $(this).closest(".control");
    const type = $(this).val();

    if (type === "discrete") {
        $ctrl.find(".ctrl-min, .ctrl-max, .ctrl-value").hide();
        $ctrl.find(".ctrl-values-list, .ctrl-value-select").show();
    } else if (type === "numeric") {
        $ctrl.find(".ctrl-min, .ctrl-max, .ctrl-value").show();
        $ctrl.find(".ctrl-values-list, .ctrl-value-select").hide();
    }
});




$(document).on("change", "#inside-type-select", updateInsideUI);
$(document).on("change", "#pedal-inside-full-check", updateInsideUI);


// Normalize quotes in logo and name fields on input
$(document).on("input", "#pedal-logo, #pedal-name", function () {
    const normalized = normalizeStyleAttributeQuotes(this.value);
    if (this.value !== normalized) {
        this.value = normalized;
    }
});
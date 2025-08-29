const widths = ["xsmall","smaller","small","medium","standard","large","+large","larger","xlarge","xlarger","largest","wide","wider","widest","xwidest"];
const heights = ["xsmall","smaller","small","medium","standard","large","+large","larger","xlarge","xlarger","largest"];

function buildJSON() {
  let pedal = {
    _id: $("#pedal-name").val(),
    name: $("#pedal-name").val(),
    type: "pedal",
    width: $("#pedal-width").val(),
    height: $("#pedal-height").val(),
    color: $("#pedal-color").val(),
    controls: []
  };

  $("#controls .row").each(function(){
    let row = { row: [] };
    $(this).find(".control").each(function(){
      let type = $(this).data("type");
      let ctrl = { label: $(this).find(".ctrl-label").val(), type };

      if (type === "knob") {
        ctrl.type = $(this).find(".ctrl-size").val();
        ctrl.position = $(this).find(".ctrl-position").val();
        ctrl.arc = $(this).find(".ctrl-arc").val();
        ctrl.min = parseInt($(this).find(".ctrl-min").val());
        ctrl.max = parseInt($(this).find(".ctrl-max").val());
        ctrl.value = parseInt($(this).find(".ctrl-value").val());
      }
      if (type === "led") {
        ctrl.position = $(this).find(".ctrl-position").val();
        ctrl.colors = [$(this).find(".ctrl-color0").val(), $(this).find(".ctrl-color1").val()];
        ctrl.value = parseInt($(this).find(".ctrl-value").val());
      }
      if (type === "slider") {
        ctrl.orientation = $(this).find(".ctrl-orientation").val();
        ctrl.min = parseInt($(this).find(".ctrl-min").val());
        ctrl.max = parseInt($(this).find(".ctrl-max").val());
        ctrl.value = parseInt($(this).find(".ctrl-value").val());
      }
      if (type === "lcd") {
        ctrl.position = $(this).find(".ctrl-position").val();
        if ($(this).find(".ctrl-round").is(":checked")) ctrl.shape = "round";
        ctrl.text = $(this).find(".ctrl-text").val();
      }
      if (type === "multi") {
        ctrl.position = $(this).find(".ctrl-position").val();
        ctrl.values = $(this).find(".ctrl-values").val().split(",");
        ctrl.value = $(this).find(".ctrl-value").val();
      }

      row.row.push(ctrl);
    });
    pedal.controls.push(row);
  });

  $("#json-output").text(JSON.stringify(pedal, null, 2));
  renderPreview(pedal);
}

function renderPreview(pedal) {
  $("#pedal-box").css("background", pedal.color).empty();
  pedal.controls.forEach((row, rIndex) => {
    row.row.forEach((ctrl, cIndex) => {
      let el = $("<div class='ctrl-preview'></div>");
      if (ctrl.type.includes("knob")) {
        el.css({width:"40px",height:"40px",borderRadius:"50%",background:"#ccc",margin:"5px",display:"inline-block"});
      } else if (ctrl.type === "led") {
        el.css({width:"15px",height:"15px",borderRadius:"50%",background:ctrl.colors[ctrl.value]||"#000",margin:"5px",display:"inline-block"});
      } else if (ctrl.type === "slider") {
        el.css({width: ctrl.orientation.includes("vertical") ? "10px":"40px",height: ctrl.orientation.includes("vertical") ? "40px":"10px",background:"#666",margin:"5px"});
      } else if (ctrl.type === "lcd") {
        el.text(ctrl.text).css({padding:"5px",background:"#000",color:"#0f0",borderRadius: ctrl.shape==="round"?"50%":"4px",margin:"5px"});
      } else if (ctrl.type === "multi") {
        el.text(ctrl.value).css({padding:"5px",background:"#ddd",margin:"5px",border:"1px solid #333"});
      }
      $("#pedal-box").append(el);
    });
  });
}

$(function(){
  widths.forEach(w => $("#pedal-width").append(`<option>${w}</option>`));
  heights.forEach(h => $("#pedal-height").append(`<option>${h}</option>`));
  $("#pedal-width").val("standard");
  $("#pedal-height").val("standard");

  $("#add-row").on("click", function(){
    const row = $('<div class="row"><h3>Control Row</h3>'+
      '<button class="add-knob">+ Knob</button>'+
      '<button class="add-led">+ LED</button>'+
      '<button class="add-slider">+ Slider</button>'+
      '<button class="add-lcd">+ LCD</button>'+
      '<button class="add-multi">+ Multi</button>'+
      '</div>');
    $("#controls").append(row);
  });

  $("#controls").on("click", ".add-knob", function(){ $(this).parent().append($("#knob-template").html()); buildJSON(); });
  $("#controls").on("click", ".add-led", function(){ $(this).parent().append($("#led-template").html()); buildJSON(); });
  $("#controls").on("click", ".add-slider", function(){ $(this).parent().append($("#slider-template").html()); buildJSON(); });
  $("#controls").on("click", ".add-lcd", function(){ $(this).parent().append($("#lcd-template").html()); buildJSON(); });
  $("#controls").on("click", ".add-multi", function(){ $(this).parent().append($("#multi-template").html()); buildJSON(); });

  $("#controls").on("change input", "input, select", buildJSON);
  $("#editor input, #editor select").on("change input", buildJSON);
  buildJSON();
});

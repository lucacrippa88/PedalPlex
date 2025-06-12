$(document).ready(function () {
  // Load presets.json and populate dropdown
  $.getJSON("https://lucacrippa88.github.io/PedalPlex/presets.json", function (data) {
    const $dropdown = $("#presetDropdown");

    Object.keys(data).forEach(songName => {
      const $option = $("<option>").val(songName).text(songName);
      $dropdown.append($option);
    });
  });
});

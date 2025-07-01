function createNewPedal() {
  const samplePedal = {
    "_id": "",
    "name": "",
    "type": "pedal",
    "width": "standard",
    "height": "standard",
    "logo": "",
    "color": "#f0f0f0",
    "font-color": "#ffffff",
    "inside-color": "#212121",
    "knobs-color": "#3dc6fc",
    "knobs-border": "#424242",
    "knobs-indicator": "#000000",
    "controls": [
      {
        "row": [
          {
            "label": "Check",
            "type": "led",
            "colors": ["#000000", "#f70000"],
            "value": 0
          }
        ]
      },
      {
        "row": [
          {"label": "E.Level", "type": "knob", "min": 7, "max": 17, "value": 12},
          {"label": "Feedb", "type": "knob", "min": 7, "max": 17, "value": 12},
          {"label": "Time", "type": "knob", "min": 7, "max": 17, "value": 12},
          {
            "label": "Mode",
            "type": "knob",
            "span": "all",
            "values": ["Std","Analog","Loop","GLT","Warp","Mod","Shim","+Rv","Reverse","Warm","Tape","Std"],
            "value": "Std"
          }
        ]
      }
    ]
  };

  Swal.fire({
    title: 'Create New Pedal',
    input: 'textarea',
    inputLabel: 'Paste or edit JSON below',
    inputValue: JSON.stringify(samplePedal, null, 2), // pretty print sample JSON
    inputAttributes: {
      'aria-label': 'Editable JSON',
      style: 'height:400px;font-family:monospace;font-size:12px;'
    },
    showCancelButton: true,
    confirmButtonText: 'Create',
    customClass: {
      confirmButton: 'bx--btn bx--btn--primary',
      cancelButton: 'bx--btn bx--btn--secondary'
    },
    preConfirm: (jsonText) => {
      if (!jsonText) {
        Swal.showValidationMessage('JSON is required');
        return false;
      }
      try {
        return JSON.parse(jsonText);
      } catch (e) {
        Swal.showValidationMessage('Invalid JSON format');
        return false;
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const newPedal = result.value;

      fetch('https://www.cineteatrosanluigi.it/plex/CREATE_GEAR.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPedal)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          Swal.fire('Created!', '', 'success').then(() => location.reload());
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

function getBasePath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // se sei su gears → base = /PedalPlex
  // se sei su /gears → base = ""
  return parts.length > 1 ? '/' + parts[0] : '';
}


// TAG MAP STYLE
const STYLE_TAG_MAP = {
  altern: "cyan",
  indie: "cyan",
  grunge: "cool-gray",
  "lo-fi": "cool-gray",
  blues: "blue",
  rock: "red",
  stoner: "red",
  funk: "green",
  raggaeton: "green",
  ambient: "magenta",
  chill: "magenta",
  metal: "black",
  surf: "teal",
  jazz: "gray",
  pop: "warm-gray",
  beat: "warm-gray",
  punk: "orange",
  wave: "orange",
  prog: "purple",
  psych: "purple",
  folk: "yellow",
  country: "yellow"
};




// HELPER
function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  const r = parseInt(result[0], 10);
  const g = parseInt(result[1], 10);
  const b = parseInt(result[2], 10);
  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return '#' + hex.padStart(6, '0').toLowerCase(); // always 6 digits
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
  // return Math.round(value);
  return Math.round(value * 10) / 10; // round to 1 decimal place
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
    case "all": angleRange = 360; angleOffset = 0; break;
    case "three-quarters": angleRange = 270; angleOffset = -135; break;
    case "half": angleRange = 180; angleOffset = 180; break;
    case "half-shift": angleRange = -180; angleOffset = 30; break;
    case "half-shift-inverted": angleRange = 180; angleOffset = 150; break;
    case "quarter": angleRange = -90; angleOffset = 30; break;
    case "tenToTwo": angleRange = 120; angleOffset = 300; break;
    case "twelveToSix": angleRange = 180; angleOffset = 0; break;
    case "elevenToSeven": angleRange = -120; angleOffset = 330; break;
    case "elevenToNineteen": angleRange = 240; angleOffset = -30; break; // testing
    case "oneToFive": angleRange = 120; angleOffset = 30; break;
    case "oneToElevenClock": angleRange = 300; angleOffset = 30; break;
    default: angleRange = 270; angleOffset = -135;
  }

  const ratio = (index - min) / range;

  return angleOffset + ratio * angleRange;
}

// HELPER
function getPedalWidth(width) {
  switch (width) {
    case "xsmall": return "70px"; case "smaller": return "90px"; case "small": return "120px"; case "medium": return "140px";
    case "standard": return "190px"; case "large": return "210px"; case "+large": return "230px"; case "larger": return "250px";
    case "+larger": return "300px"; case "++larger": return "350px";case "xlarge": return "400px"; case "xlarger": return "450px";
    case "largest": return "500px"; case "wide": return "550px"; case "wider": return "600px"; case "widest": return "700px"; 
    case "xwidest": return "775px"; default: return "190px";
  }
}

// HELPER
function getPedalHeight(height) {
  switch (height) {
    case "xsmall": return "70px"; case "smaller": return "90px"; case "small": return "110px"; case "medium": return "140px";
    case "standard": return "160px"; case "large": return "190px"; case "+large": return "210px"; case "larger": return "240px";
    case "xlarge": return "255px"; case "xlarger": return "265px"; case "largest": return "350px"; case "xlargest": return "400px";
    case "tall": return "450px"; default: return "500px";
  }
}


// HELPER
function safeLogoStyle(inputStyle) {
  if (!inputStyle) return "";
  // Reject javascript or expression
  if (/expression\s*\(|javascript:/i.test(inputStyle)) { return ""; }

  // Optionally allow only certain props
  const allowedProps = ["color", "font-size", "font-weight", "font-style", "font-family", "vertical-align",
                        "background-color", "padding", "position", "margin", "margin-left", "margin-right", "margin-bottom", 
                        "bottom", "top", "left", "right", "letter-spacing", "word-spacing", "display", "border", "margin-top", 
                        "line-height", "transform", "height", "width", "border-radius", "box-shadow", "background-size",
                        "background-image", "text-align", "background", "rotate", "overflow", "white-space", "text-shadow", 
                        "text-decoration", "text-decoration-style", "text-decoration-line", "text-decoration-color", "outline", "outline-offset"];
  const safeRules = inputStyle.split(";").filter(rule => {
    const [prop] = rule.split(":");
    return allowedProps.includes(prop.trim().toLowerCase());
  });
  return safeRules.join(";");
}




/**
 * sanitizePedalHTML
 * - Only allows span, style, br, hr, div
 * - Keeps class and style attributes (inline CSS)
 * - Removes any JS events, scripts, or malicious URLs
 */
function sanitizePedalHTML(input) {
    if (!input) return '';

    const temp = document.createElement('div');
    temp.innerHTML = input;

    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return;

        if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();
            const allowedTags = ['span','style','br','hr','div'];

            if (!allowedTags.includes(tag)) {
                const frag = document.createDocumentFragment();
                while (node.firstChild) frag.appendChild(node.firstChild);
                node.parentNode.replaceChild(frag, node);
                return;
            }

            // sanitize attributes
            [...node.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();

                // keep class, clean unsafe chars
                if (name === 'class') {
                    node.className = node.className.replace(/[^a-zA-Z0-9 _-]/g,'');
                } 
                // keep style but remove dangerous patterns
                else if (name === 'style') {
                    let safeStyle = node.style.cssText
                        .replace(/expression\s*\(/gi,'')
                        .replace(/javascript\s*:/gi,'')
                        .replace(/url\s*\(\s*data\s*:/gi,'')
                        .replace(/behavior\s*:/gi,''); // block old IE expressions
                    node.style.cssText = safeStyle;
                } 
                // remove all other attributes including on*
                else {
                    node.removeAttribute(attr.name);
                }
            });
        }

        // recursively clean children
        Array.from(node.childNodes).forEach(child => cleanNode(child));
    }

    Array.from(temp.childNodes).forEach(child => cleanNode(child));
    return temp.innerHTML;
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



// HELPER
function normalizeHex(color) {
  if (!color) return '#000000';
  color = color.trim().toLowerCase();
  if (color.startsWith('rgb')) color = rgbToHex(color);
  color = color.replace(/[^#0-9a-f]/g, '');
  if (color.length === 4)
    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  if (!/^#[0-9a-f]{6}$/.test(color)) return '#000000';
  return color;
}

// HELPER
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const [r, g, b] = clean.split('').map(x => parseInt(x + x, 16));
    return { r, g, b };
  } else if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

// HELPER
function colorDistanceSq(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
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



// Start glow effect on element
function startGlow(el) {
  let angle = 65;
  const speed = 0.6;
  let rafId;

  function tick() {
    angle = (angle + speed) % 360;
    el.style.setProperty("--gradient-angle", angle + "deg");
    rafId = requestAnimationFrame(tick);
  }

  tick();

  return () => cancelAnimationFrame(rafId);
}




// HELPER
function decodeHTMLEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}





// ======================================================================
// SESSION TIMEOUT WARNING (JWT-based)
// ======================================================================

// --- Configurazione ---
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minuti
let sessionWarningShown = false;
let countdownInterval;

// --- Legge & decodifica JWT dal localStorage ---
(function initSessionExpiration() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log("Nessun token presente → nessun controllo sessione");
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp) {
            // exp è in secondi → converti in millisecondi
            window.sessionExpires = payload.exp * 1000;
            console.log("Session expires at:", new Date(window.sessionExpires));
        } else {
            console.warn("Il JWT non contiene exp → impossibile calcolare la scadenza");
        }
    } catch (e) {
        console.error("Errore nel decodificare il JWT:", e);
    }
})();

// --- Funzione di controllo sessione ---
function checkSessionTime() {
    if (!window.sessionExpires) return; // guest → nessun controllo
    const now = Date.now();
    const remaining = window.sessionExpires - now;

    if (remaining <= SESSION_WARNING_THRESHOLD && !sessionWarningShown) {
        sessionWarningShown = true;
        showSessionWarningModal(remaining);
    }

    if (remaining <= 0) {
        window.location.href = 'login';
    }
}


// --- Funzione per mostrare il modal con countdown ---
function showSessionWarningModal(initialRemaining) {
    let remaining = Math.floor(initialRemaining / 1000); // secondi

    Swal.fire({
        title: 'Session is expiring',
        html: `Your session wil expire in <strong id="swal-countdown">${formatTime(remaining)}</strong>.<br>Do you want to login again?`,
        icon: 'warning',
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText: 'Login',
        cancelButtonText: 'Continue as Guest',
        customClass: {
            confirmButton: 'bx--btn bx--btn--primary',
            cancelButton: 'bx--btn bx--btn--secondary'
        },
        didOpen: () => {
            const countdownEl = Swal.getHtmlContainer().querySelector('#swal-countdown');

            countdownInterval = setInterval(() => {
                remaining -= 1;

                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    Swal.close();
                    window.location.href = 'login';
                } else {
                    countdownEl.textContent = formatTime(remaining);
                }
            }, 1000);
        },
        willClose: () => {
            clearInterval(countdownInterval);
        }
    }).then((result) => {

    if (result.isConfirmed) {
        // login
        window.location.href = 'login';
        return;
    }

    // ❗ Guest, click fuori, ESC → NON deve più ripresentarsi
    localStorage.removeItem('authToken');
    window.sessionExpires = null;
    sessionWarningShown = true;

    console.log("Sessione gestita come guest o popup chiuso: nessun nuovo prompt.");
});

}

// --- Helper: formatta i secondi in mm:ss ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- Check periodico ogni 30 secondi ---
setInterval(checkSessionTime, 30000);


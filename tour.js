// ============================================================
// PedalPlex Guided Tour
// ============================================================
// Persists progress in localStorage across page navigations.
// Keys: pp_tour_active ('true'|'false'), pp_tour_step (number)
// ============================================================

(function () {
  'use strict';

  // ----------------------------------------------------------
  // Step definitions
  // Each step: { page, target, title, text, position, waitFor }
  //   page     : 'rigs' | 'plexes'  — which page this step lives on
  //   target   : CSS selector of the element to highlight (null = center modal)
  //   title    : heading text
  //   text     : body HTML
  //   position : 'bottom' | 'top' | 'left' | 'right' | 'center'
  //   waitFor  : optional selector that must exist before showing the step
  // ----------------------------------------------------------
  const TOUR_STEPS = [
    {
      page: 'rigs',
      target: '#createBtn',
      waitFor: '#createBtn',
      title: 'Step 1 — Create a Rig',
      text: 'Start by clicking <strong>Create a Rig</strong> to set up your first pedalboard. A Rig is the physical collection of pedals on your board.',
      position: 'bottom',
    },
    {
      page: 'rigs',
      target: '#pedalAddDropdownContainer',
      waitFor: '#pedalboard-controls',
      title: 'Step 2 — Add Pedals',
      text: 'Use the <strong>pedal search</strong> at the top to find effects and add them to your Rig. Each pedal is pulled from the Gears catalog.',
      position: 'bottom',
    },
    {
      page: 'rigs',
      target: '#pedalboard',
      waitFor: '#pedalboard',
      title: 'Step 3 — Reorder Pedals',
      text: '<strong>Drag & drop</strong> pedals to arrange the signal chain order. Your sound flows left to right across the board.',
      position: 'top',
    },
    {
      page: 'rigs',
      target: '#viewPreset',
      waitFor: '#viewPreset',
      title: 'Step 4 — Go to Plexes',
      text: 'When your Rig looks good, click <strong>Go to Plexes</strong> to start creating presets for it.',
      position: 'bottom',
    },
    {
      page: 'plexes',
      target: '#renamePresetBtn',
      waitFor: '#preset-controls',
      title: 'Step 5 — Create a Plex',
      text: 'Click the <strong>edit / add preset</strong> button to create a new Plex. A Plex stores all the knob and switch settings for a specific sound.',
      position: 'bottom',
    },
    {
      page: 'plexes',
      target: '#preset',
      waitFor: '#preset',
      title: 'Step 6 — Set Controls & Subplexes',
      text: 'Adjust the <strong>knobs and switches</strong> on each pedal to dial in your tone. Use <strong>Subplexes</strong> to group sections and add notes.',
      position: 'top',
    },
    {
      page: 'plexes',
      target: '#renamePresetBtn',
      waitFor: '#preset-controls',
      title: 'Step 7 — Save the Plex',
      text: 'All done! Click <strong>Save</strong> (or the edit button) to save your Plex. You can recall it any time from the Plexes page.',
      position: 'bottom',
      isLast: true,
    },
  ];

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  function currentPage() {
    const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
    return path; // 'rigs' | 'plexes' | etc.
  }

  function saveState(step) {
    localStorage.setItem('pp_tour_active', 'true');
    localStorage.setItem('pp_tour_step', String(step));
  }

  function clearState() {
    localStorage.removeItem('pp_tour_active');
    localStorage.removeItem('pp_tour_step');
  }

  function getSavedStep() {
    return parseInt(localStorage.getItem('pp_tour_step') || '0', 10);
  }

  function markSeen() {
    localStorage.setItem('pp_tour_seen', 'true');
  }

  function hasBeenSeen() {
    return localStorage.getItem('pp_tour_seen') === 'true';
  }

  // ----------------------------------------------------------
  // DOM injection
  // ----------------------------------------------------------
  function injectDOM() {
    if (document.getElementById('pp-tour-popup')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'pp-tour-backdrop';
    document.body.appendChild(backdrop);

    const popup = document.createElement('div');
    popup.id = 'pp-tour-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.innerHTML = `
      <div class="pp-tour-header">
        <span class="pp-tour-step-counter" id="pp-tour-counter"></span>
        <button class="pp-tour-close" id="pp-tour-close" aria-label="Close tour" title="Exit tour">
          <svg focusable="false" viewBox="0 0 32 32" fill="currentColor" width="16" height="16">
            <path d="M24 9.41L22.59 8 16 14.59 9.41 8 8 9.41 14.59 16 8 22.59 9.41 24 16 17.41 22.59 24 24 22.59 17.41 16 24 9.41z"/>
          </svg>
        </button>
      </div>
      <div class="pp-tour-body">
        <h4 class="pp-tour-title" id="pp-tour-title"></h4>
        <p class="pp-tour-text" id="pp-tour-text"></p>
      </div>
      <div class="pp-tour-footer">
        <button class="bx--btn bx--btn--secondary bx--btn--sm pp-tour-prev" id="pp-tour-prev">Back</button>
        <button class="bx--btn bx--btn--primary bx--btn--sm pp-tour-next" id="pp-tour-next">Next</button>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('pp-tour-close').addEventListener('click', stopTour);
    document.getElementById('pp-tour-prev').addEventListener('click', prevStep);
    document.getElementById('pp-tour-next').addEventListener('click', nextStep);
  }

  // ----------------------------------------------------------
  // Highlight target element
  // ----------------------------------------------------------
  let _highlighted = null;

  function highlightElement(selector) {
    clearHighlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('pp-tour-highlight');
    _highlighted = el;
  }

  function clearHighlight() {
    if (_highlighted) {
      _highlighted.classList.remove('pp-tour-highlight');
      _highlighted = null;
    }
    // safety sweep
    document.querySelectorAll('.pp-tour-highlight').forEach(function (el) {
      el.classList.remove('pp-tour-highlight');
    });
  }

  // ----------------------------------------------------------
  // Position popup near target
  // ----------------------------------------------------------
  function positionPopup(step) {
    const popup = document.getElementById('pp-tour-popup');
    if (!popup) return;

    // Reset inline positioning
    popup.style.top = '';
    popup.style.left = '';
    popup.style.bottom = '';
    popup.style.right = '';
    popup.style.transform = '';

    const target = step.target ? document.querySelector(step.target) : null;

    if (!target || step.position === 'center') {
      // Center of viewport
      popup.style.top = '50%';
      popup.style.left = '50%';
      popup.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = target.getBoundingClientRect();
    const popupW = popup.offsetWidth || 320;
    const popupH = popup.offsetHeight || 160;
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    if (step.position === 'bottom') {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - popupW / 2;
    } else if (step.position === 'top') {
      top = rect.top - popupH - margin;
      left = rect.left + rect.width / 2 - popupW / 2;
    } else if (step.position === 'right') {
      top = rect.top + rect.height / 2 - popupH / 2;
      left = rect.right + margin;
    } else if (step.position === 'left') {
      top = rect.top + rect.height / 2 - popupH / 2;
      left = rect.left - popupW - margin;
    } else {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - popupW / 2;
    }

    // Clamp within viewport
    left = Math.max(margin, Math.min(left, vw - popupW - margin));
    top  = Math.max(margin + 64, Math.min(top, vh - popupH - margin)); // 64 = header height

    popup.style.top  = top + 'px';
    popup.style.left = left + 'px';
  }

  // ----------------------------------------------------------
  // Render a step
  // ----------------------------------------------------------
  function renderStep(index) {
    const step = TOUR_STEPS[index];
    const popup  = document.getElementById('pp-tour-popup');
    const counter = document.getElementById('pp-tour-counter');
    const title  = document.getElementById('pp-tour-title');
    const text   = document.getElementById('pp-tour-text');
    const prev   = document.getElementById('pp-tour-prev');
    const next   = document.getElementById('pp-tour-next');
    if (!popup) return;

    counter.textContent = (index + 1) + ' / ' + TOUR_STEPS.length;
    title.textContent   = step.title;
    text.innerHTML      = step.text;
    prev.style.display  = index === 0 ? 'none' : '';
    next.textContent    = step.isLast ? 'Finish' : 'Next';

    highlightElement(step.target);

    // Scroll target into view
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    popup.style.display = 'block';
    document.getElementById('pp-tour-backdrop').style.display = 'block';

    // Position after a tick so offsetWidth is known
    setTimeout(function () { positionPopup(step); }, 20);
  }

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------
  var _currentStep = 0;

  function showStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    const step = TOUR_STEPS[index];

    // If this step belongs to a different page, navigate there
    if (step.page !== currentPage()) {
      saveState(index);
      window.location.href = '/' + step.page;
      return;
    }

    _currentStep = index;
    saveState(index);

    // If the target element isn't in the DOM yet, wait for it
    if (step.waitFor) {
      waitForElement(step.waitFor, function () { renderStep(index); });
    } else {
      renderStep(index);
    }
  }

  function nextStep() {
    const step = TOUR_STEPS[_currentStep];
    if (step.isLast) {
      stopTour();
      return;
    }
    showStep(_currentStep + 1);
  }

  function prevStep() {
    if (_currentStep > 0) showStep(_currentStep - 1);
  }

  // ----------------------------------------------------------
  // Wait for element helper (polls until visible)
  // ----------------------------------------------------------
  function waitForElement(selector, callback, maxMs) {
    maxMs = maxMs || 5000;
    const start = Date.now();
    (function poll() {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        callback();
      } else if (Date.now() - start < maxMs) {
        setTimeout(poll, 150);
      } else {
        // Element never appeared, show anyway
        callback();
      }
    })();
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------
  window.startTour = function (fromStep) {
    fromStep = (fromStep !== undefined) ? fromStep : 0;
    injectDOM();
    showStep(fromStep);
  };

  window.stopTour = function () {
    clearHighlight();
    clearState();
    markSeen();
    const popup    = document.getElementById('pp-tour-popup');
    const backdrop = document.getElementById('pp-tour-backdrop');
    if (popup)    popup.style.display    = 'none';
    if (backdrop) backdrop.style.display = 'none';
  };

  // ----------------------------------------------------------
  // Auto-resume on page load, or first-time auto-start
  // ----------------------------------------------------------
  function autoResume() {
    // Case 1: tour in progress — resume from saved step
    if (localStorage.getItem('pp_tour_active') === 'true') {
      const step = getSavedStep();
      if (step >= 0 && step < TOUR_STEPS.length && TOUR_STEPS[step].page === currentPage()) {
        injectDOM();
        showStep(step);
      }
      return;
    }

    // Case 2: first time ever on rigs page — start automatically
    if (!hasBeenSeen() && currentPage() === 'rigs') {
      injectDOM();
      showStep(0);
    }
  }

  // Run after DOM + page-specific JS has had a chance to render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(autoResume, 600);
    });
  } else {
    setTimeout(autoResume, 600);
  }

})();

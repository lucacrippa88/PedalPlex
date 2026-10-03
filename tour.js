// ============================================================
// PedalPlex Guided Tour
// ============================================================
// Persists progress in localStorage across page navigations.
//
// localStorage keys used:
//   pp_tour_active     : 'true' while a tour session is in progress
//   pp_tour_step       : current step index (number, as string)
//   pp_tour_completed  : 'true' once the user finishes the full tour
//   pp_tour_nudge_dismissed : 'true' once the nudge is explicitly dismissed
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
      title: 'Step 1 — Build a Rig',
      text: 'Start by clicking <strong>Create a Rig</strong> to set up your virtual collection of pedals and amplifiers.',
      position: 'bottom',
    },
    {
      page: 'rigs',
      target: '#addGearsTrigger',
      waitFor: '#addGearsTrigger',
      title: 'Step 2 — Add Pedals',
      text: 'Use the <strong>search area</strong> at the top to find Gears and add them to your Rig, and arrange them by clicking or drag&drop.',
      position: 'bottom',
    },
    {
      page: 'rigs',
      target: '#saveBtn',
      waitFor: '#saveBtn',
      title: 'Step 3 — Save your Rig',
      text: 'Happy with the setup? Click <strong>Save Rig</strong> to preserve your Rig so you can come back to it any time.',
      position: 'bottom',
    },
    {
      page: 'rigs',
      target: '#viewPreset',
      waitFor: '#viewPreset',
      title: 'Step 4 — Go to Plexes',
      text: 'Click <strong>Go to Plexes</strong> to start creating and saving presets for the selected Rig.',
      position: 'bottom',
    },
    {
      page: 'plexes',
      target: '#createPstBtn',
      waitFor: '#createPstBtn',
      title: 'Step 5 — Create a Plex',
      text: 'Click the <strong>New Tone</strong> button to create a new Plex. A Plex stores all the knob and switch settings for a specific tone.',
      position: 'bottom',
    },
    {
      page: 'plexes',
      target: '#preset',
      waitFor: '#preset',
      title: 'Step 6 — Set Controls & SubPlexes',
      text: 'Adjust the <strong>knobs and switches</strong> on each pedal to dial in your tone. Use <strong>+</strong> icon to document your configuration at Gear level, or check the list to get inspiration.',
      position: 'top',
    },
    {
      page: 'plexes',
      target: '#savePstBtn',
      waitFor: '#savePstBtn',
      title: 'Step 7 — Save your Plex',
      text: 'All done! Click <strong>Lock Tone</strong> to save your Plex. You can recall it any time from the Plexes dropdown.',
      position: 'bottom',
      isLast: true,
    },
  ];

  // Index of the first plexes step (used for the "has rig, no plexes" nudge path)
  const FIRST_PLEXES_STEP = TOUR_STEPS.findIndex(function (s) { return s.page === 'plexes'; });

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  function currentPage() {
    const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index';
    return path; // 'rigs' | 'plexes' | 'index' | etc.
  }

  function saveState(step) {
    localStorage.setItem('pp_tour_active', 'true');
    localStorage.setItem('pp_tour_step', String(step));
    localStorage.removeItem('pp_tour_paused');
  }

  function clearState() {
    localStorage.removeItem('pp_tour_active');
    localStorage.removeItem('pp_tour_step');
    localStorage.removeItem('pp_tour_paused');
  }

  function setPaused() {
    // Keep pp_tour_active + pp_tour_step intact so we can resume
    localStorage.setItem('pp_tour_paused', 'true');
  }

  function isPaused() {
    return localStorage.getItem('pp_tour_paused') === 'true';
  }

  function getSavedStep() {
    return parseInt(localStorage.getItem('pp_tour_step') || '0', 10);
  }

  function markCompleted() {
    localStorage.setItem('pp_tour_completed', 'true');
  }

  function hasCompleted() {
    return localStorage.getItem('pp_tour_completed') === 'true';
  }

  function markNudgeDismissed() {
    localStorage.setItem('pp_tour_nudge_dismissed', 'true');
  }

  function isNudgeDismissed() {
    return localStorage.getItem('pp_tour_nudge_dismissed') === 'true';
  }

  // ----------------------------------------------------------
  // User progress detection helpers (sync, from localStorage)
  // ----------------------------------------------------------

  /** Returns true if the user has at least one rig with at least one pedal. */
  function hasRigWithPedals() {
    // Guest boards
    try {
      const raw = localStorage.getItem('guestPedalboard');
      if (raw) {
        const boards = JSON.parse(raw);
        if (Array.isArray(boards) && boards.some(function (b) {
          return Array.isArray(b.pedals) && b.pedals.length > 0;
        })) return true;
      }
    } catch (e) { /* ignore */ }

    // Logged-in boards already loaded into window
    if (Array.isArray(window.allPedalboards) && window.allPedalboards.some(function (b) {
      return Array.isArray(b.pedals) && b.pedals.length > 0;
    })) return true;

    return false;
  }

  /** Returns true if the user has at least one saved plex. */
  function hasPlexes() {
    // Guest plexes
    try {
      const raw = localStorage.getItem('guestPlexes');
      if (raw) {
        const plexes = JSON.parse(raw);
        if (Array.isArray(plexes) && plexes.length > 0) return true;
      }
    } catch (e) { /* ignore */ }

    // Logged-in presets already loaded into window
    if (Array.isArray(window.presets) && window.presets.length > 0) return true;
    if (window.presetMap && Object.keys(window.presetMap).length > 0) return true;

    return false;
  }

  // ----------------------------------------------------------
  // Nudge scenario resolution
  //
  // Returns one of:
  //   null                    — no nudge needed
  //   { fromStep: 0, ... }    — show nudge starting from step 0
  //   { fromStep: FIRST_PLEXES_STEP, title, text }
  //                           — show nudge starting from plexes step
  // ----------------------------------------------------------
  function resolveNudgeScenario() {
    // If a tour is actively in progress, no nudge
    if (localStorage.getItem('pp_tour_active') === 'true') return null;

    // If nudge was explicitly dismissed this session or permanently, no nudge
    if (isNudgeDismissed()) return null;

    const completed = hasCompleted();
    const hasRig    = hasRigWithPedals();
    const hasPlex   = hasPlexes();

    if (!completed) {
      // Tour never finished (never started OR dismissed early) → always show full-tour nudge
      return {
        fromStep: 0,
        title: 'New to PedalPlex?',
        text: 'Take the quick tour — it takes less than a minute.',
        ctaLabel: 'Start tour',
        ctaPage: '/rigs',
      };
    }

    // Tour was completed:
    if (!hasRig) {
      // Completed but still hasn't built a rig → nudge from start
      return {
        fromStep: 0,
        title: 'Ready to build your first Rig?',
        text: 'Create a Rig and add your pedals to get started.',
        ctaLabel: 'Start',
        ctaPage: '/rigs',
      };
    }

    if (!hasPlex) {
      // Has a rig but no plex saved → nudge from plexes step
      return {
        fromStep: FIRST_PLEXES_STEP,
        title: 'You have a Rig — now save a Plex!',
        text: 'Dial in your tone and lock it in as a Plex to recall it any time.',
        ctaLabel: 'Show me how',
        ctaPage: '/plexes',
      };
    }

    // Completed tour, has rig and plexes → nothing to nudge
    return null;
  }

  // ----------------------------------------------------------
  // DOM injection (tour popup)
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
        <button class="bx--btn bx--btn--ghost bx--btn--sm pp-tour-pause" id="pp-tour-pause" title="Pause tour and interact freely">Pause</button>
        <button class="bx--btn bx--btn--primary bx--btn--sm pp-tour-next" id="pp-tour-next">Next</button>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('pp-tour-close').addEventListener('click', stopTour);
    document.getElementById('pp-tour-pause').addEventListener('click', pauseTour);
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

    popup.style.top = '';
    popup.style.left = '';
    popup.style.bottom = '';
    popup.style.right = '';
    popup.style.transform = '';

    const target = step.target ? document.querySelector(step.target) : null;

    if (!target || step.position === 'center') {
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

    left = Math.max(margin, Math.min(left, vw - popupW - margin));
    top  = Math.max(margin + 64, Math.min(top, vh - popupH - margin));

    popup.style.top  = top + 'px';
    popup.style.left = left + 'px';
  }

  // ----------------------------------------------------------
  // Render a step
  // ----------------------------------------------------------
  function renderStep(index) {
    const step = TOUR_STEPS[index];
    const popup   = document.getElementById('pp-tour-popup');
    const counter = document.getElementById('pp-tour-counter');
    const title   = document.getElementById('pp-tour-title');
    const text    = document.getElementById('pp-tour-text');
    const prev    = document.getElementById('pp-tour-prev');
    const next    = document.getElementById('pp-tour-next');
    if (!popup) return;

    counter.textContent = (index + 1) + ' / ' + TOUR_STEPS.length;
    title.textContent   = step.title;
    text.innerHTML      = step.text;
    prev.style.display  = index === 0 ? 'none' : '';
    next.textContent    = step.isLast ? 'Finish' : 'Next';

    highlightElement(step.target);

    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    popup.style.display = 'block';
    document.getElementById('pp-tour-backdrop').style.display = 'block';

    setTimeout(function () { positionPopup(step); }, 20);
  }

  // ----------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------
  var _currentStep = 0;

  function showStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) return;
    const step = TOUR_STEPS[index];

    if (step.page !== currentPage()) {
      saveState(index);
      window.location.href = '/' + step.page;
      return;
    }

    _currentStep = index;
    saveState(index);

    if (step.waitFor) {
      waitForElement(step.waitFor, function () { renderStep(index); });
    } else {
      renderStep(index);
    }
  }

  function nextStep() {
    const step = TOUR_STEPS[_currentStep];
    if (step.isLast) {
      finishTour();
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
    // ✕ button: pause the tour (keep state) and show the resume pill.
    // The tour is only truly finished when the user clicks "Finish" on the last step,
    // which calls nextStep() → isLast → stopTour is NOT called; markCompleted() is
    // called via finishTour() instead.
    pauseTour();
  };

  function finishTour() {
    clearHighlight();
    clearState();
    markCompleted();
    const popup    = document.getElementById('pp-tour-popup');
    const backdrop = document.getElementById('pp-tour-backdrop');
    if (popup)    popup.style.display    = 'none';
    if (backdrop) backdrop.style.display = 'none';
    removeResumePill();
  }

  // ----------------------------------------------------------
  // Pause / Resume
  // ----------------------------------------------------------

  function pauseTour() {
    clearHighlight();
    setPaused();
    const popup    = document.getElementById('pp-tour-popup');
    const backdrop = document.getElementById('pp-tour-backdrop');
    if (popup)    popup.style.display    = 'none';
    if (backdrop) backdrop.style.display = 'none';
    showResumePill();
  }

  function resumeTour() {
    removeResumePill();
    const step = getSavedStep();
    // Clear the paused flag before showing — saveState inside showStep will do it,
    // but we clear here for safety so autoResume doesn't show the pill again.
    localStorage.removeItem('pp_tour_paused');
    injectDOM();
    showStep(step);
  }

  // ----------------------------------------------------------
  // Resume pill — small persistent indicator shown while paused
  // ----------------------------------------------------------

  function showResumePill() {
    if (document.getElementById('pp-tour-resume-pill')) return;
    const step  = getSavedStep();
    const total = TOUR_STEPS.length;

    const pill = document.createElement('button');
    pill.id = 'pp-tour-resume-pill';
    pill.setAttribute('aria-label', 'Resume guided tour');
    pill.innerHTML = `
      <svg focusable="false" viewBox="0 0 32 32" fill="currentColor" width="14" height="14" aria-hidden="true" style="flex-shrink:0;">
        <path d="M7 28L25 16 7 4 7 28z"/>
      </svg>
      <span>Resume tour <span class="pp-tour-resume-step">${step + 1}/${total}</span></span>
    `;
    document.body.appendChild(pill);

    pill.addEventListener('click', function () {
      // If the saved step is on a different page, navigate there
      const targetPage = TOUR_STEPS[getSavedStep()]?.page;
      if (targetPage && targetPage !== currentPage()) {
        // Already paused state is kept; navigating will trigger autoResume on the other page
        window.location.href = '/' + targetPage;
      } else {
        resumeTour();
      }
    });

    // Animate in
    setTimeout(function () { pill.classList.add('pp-tour-resume-pill--visible'); }, 50);
  }

  function removeResumePill() {
    const pill = document.getElementById('pp-tour-resume-pill');
    if (pill) pill.remove();
  }

  // ----------------------------------------------------------
  // Nudge popup (shown on index, rigs, plexes)
  // ----------------------------------------------------------
  function showNudge(scenario) {
    if (document.getElementById('pp-tour-nudge')) return;

    const nudge = document.createElement('div');
    nudge.id = 'pp-tour-nudge';
    nudge.setAttribute('role', 'complementary');
    nudge.setAttribute('aria-label', 'Take the guided tour');
    nudge.innerHTML = `
      <button class="pp-tour-nudge-close" id="pp-tour-nudge-close" aria-label="Dismiss">
        <svg focusable="false" viewBox="0 0 32 32" fill="currentColor" width="14" height="14">
          <path d="M24 9.41L22.59 8 16 14.59 9.41 8 8 9.41 14.59 16 8 22.59 9.41 24 16 17.41 22.59 24 24 22.59 17.41 16 24 9.41z"/>
        </svg>
      </button>
      <div class="pp-tour-nudge-icon" aria-hidden="true">
        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20" height="20" viewBox="0 0 32 32">
          <path d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2zm0 26a12 12 0 1 1 12-12 12 12 0 0 1-12 12z"/>
          <path d="M16 11a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 16 11zM15 17h2v8h-2z"/>
        </svg>
      </div>
      <div class="pp-tour-nudge-body">
        <p class="pp-tour-nudge-title">${scenario.title}</p>
        <p class="pp-tour-nudge-text">${scenario.text}</p>
      </div>
      <button class="bx--btn bx--btn--primary bx--btn--sm pp-tour-nudge-cta" id="pp-tour-nudge-cta">
        ${scenario.ctaLabel}
      </button>
    `;
    document.body.appendChild(nudge);

    // Dismiss permanently
    document.getElementById('pp-tour-nudge-close').addEventListener('click', function () {
      nudge.classList.add('pp-tour-nudge--hidden');
      markNudgeDismissed();
      setTimeout(function () { nudge.remove(); }, 300);
    });

    // Start tour
    document.getElementById('pp-tour-nudge-cta').addEventListener('click', function () {
      nudge.remove();
      if (scenario.fromStep === 0) {
        saveState(0);
        window.location.href = '/rigs';
      } else {
        // Already on the right page or navigate there
        saveState(scenario.fromStep);
        if (currentPage() === 'plexes') {
          injectDOM();
          showStep(scenario.fromStep);
        } else {
          window.location.href = scenario.ctaPage;
        }
      }
    });

    // Slide in after a short delay
    setTimeout(function () { nudge.classList.add('pp-tour-nudge--visible'); }, 800);
  }

  // ----------------------------------------------------------
  // Auto-resume on page load / first-time auto-start
  // ----------------------------------------------------------
  function autoResume() {
    const page = currentPage();

    // Case 1a: tour is paused — show the resume pill (on any page)
    if (localStorage.getItem('pp_tour_active') === 'true' && isPaused()) {
      showResumePill();
      return;
    }

    // Case 1b: tour actively in progress — resume from saved step on the matching page
    if (localStorage.getItem('pp_tour_active') === 'true') {
      const step = getSavedStep();
      if (step >= 0 && step < TOUR_STEPS.length && TOUR_STEPS[step].page === page) {
        injectDOM();
        showStep(step);
      }
      return;
    }

    // Case 2: first-time visitor on /rigs (no completed tour, no nudge dismissed) — start tour immediately
    if (!hasCompleted() && !isNudgeDismissed() && page === 'rigs') {
      injectDOM();
      showStep(0);
      return;
    }

    // Case 3: first-time visitor on /plexes — start from the right step based on rig state
    if (!hasCompleted() && !isNudgeDismissed() && page === 'plexes') {
      if (hasRigWithPedals()) {
        injectDOM();
        showStep(FIRST_PLEXES_STEP);
      } else {
        // No rig yet — send them to the beginning on /rigs
        saveState(0);
        window.location.href = '/rigs';
      }
      return;
    }

    // Case 4: index / rigs / plexes — show contextual nudge if warranted
    if (page === 'index' || page === 'rigs' || page === 'plexes') {
      const scenario = resolveNudgeScenario();
      if (scenario) showNudge(scenario);
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

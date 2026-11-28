// ===============================
// onboarding.js
// Checklist "Build your Rig. Save your Tones." condivisa da rigs.html e presets.html.
//
// Step:
//   1. Aggiungere gear al Rig                  (calcolato dal Rig, pagina rigs)
//   2. Modificare i controlli dei gear         (rilevato in pagina presets via PPUnsaved.isDirty)
//   3. Salvare il Preset                       (PPOnboarding.complete(), chiamato dal salvataggio)
//
// Stato persistito in localStorage. Il banner compare solo se l'utente ha visto
// un Rig vuoto ("active") e scompare definitivamente al salvataggio del Preset ("done").
// ===============================
(function () {
  const KEYS = {
    active: 'pp_onboarding_active',
    step1:  'pp_onboarding_step1',
    step2:  'pp_onboarding_step2',
    done:   'pp_onboarding_done'
  };
  const BODY_CLASS = 'pp-onboarding-active';

  const read  = (k) => { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
  const write = (k, v) => { try { v ? localStorage.setItem(k, '1') : localStorage.removeItem(k); } catch (e) {} };

  const STEPS = [
    'Add the pedals and amps you actually use in an empty slot below',
    'Dial in your sound by adjusting the controls of your gears',
    'Save your tone and keep your settings safe'
  ];

  const CHECK_SVG = '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="12" height="12" viewBox="0 0 32 32" aria-hidden="true"><path d="M13 24L4 15 5.414 13.586 13 21.171 26.586 7.586 28 9 13 24z"/></svg>';
  const ARROW_SVG = '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M18 6L16.57 7.393 24.15 15 4 15 4 17 24.15 17 16.57 24.573 18 26 28 16 18 6z"/></svg>';
  const SAVE_SVG  = '<svg focusable="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true"><path d="M12 20.414L7.293 15.707 6 17l6 6 14-14-1.293-1.293z"/></svg>';

  let currentPage = null;

  // Gli step sono sequenziali: uno step non può risultare fatto se il precedente non lo è
  function completedFlags() {
    const s1 = read(KEYS.step1);
    const s2 = s1 && read(KEYS.step2);
    const s3 = s2 && read(KEYS.done);
    return [s1, s2, s3];
  }

  // Versione breve del testo, mostrata via CSS su mobile (<= 768px)
  const STEPS_SHORT = [
    'Add your pedals and amps',
    'Adjust your gears\u2019 controls',
    'Save your tone'
  ];

  function fill(el) {
    const flags = completedFlags();
    const count = flags.filter(Boolean).length;
    const firstOpen = flags.indexOf(false);
    // CTA verso i Preset: affiancata allo step 2, solo in pagina Rigs e a step 1 completato
    // (scompare da sola perché in pagina Presets la checklist non la renderizza)
    const showCta = currentPage === 'rigs' && flags[0] && !flags[2];
    const cta = showCta
      ? '<a href="presets" class="pp-onboarding__cta bx--btn bx--btn--primary bx--btn--sm">' +
          'Go to Presets' + ARROW_SVG + '</a>'
      : '';
    // Bottone Save affiancato allo step 3, solo in pagina Presets e a step 2 completato (replica #savePstBtn della navbar)
    const saveCta = (currentPage === 'presets' && flags[1] && !flags[2])
      ? '<button type="button" class="pp-onboarding__cta pp-onboarding__save bx--btn bx--btn--primary bx--btn--sm">' +
          SAVE_SVG + 'Save</button>'
      : '';

    const items = STEPS.map(function (text, i) {
      const cls = flags[i] ? ' pp-onboarding__step--done' : (i === firstOpen ? ' pp-onboarding__step--current' : '');
      return '<li class="pp-onboarding__step' + cls + '">' +
               '<span class="pp-onboarding__bullet">' + (flags[i] ? CHECK_SVG : (i + 1)) + '</span>' +
               '<span class="pp-onboarding__text">' +
                 '<span class="pp-ob-long">' + text + '</span>' +
                 '<span class="pp-ob-short">' + STEPS_SHORT[i] + '</span>' +
               '</span>' +
               (i === 1 ? cta : '') +
               (i === 2 ? saveCta : '') +
             '</li>';
    }).join('');

    el.innerHTML =
      '<div class="pp-onboarding__head">' +
        '<h3 class="pp-onboarding__title">Build your Rig. Save your Tones.</h3>' +
        '<span class="pp-onboarding__counter" aria-live="polite">' +
          '<span class="pp-ob-long">Step ' + count + ' of 3 completed</span>' +
          '<span class="pp-ob-short">' + count + '/3 done</span>' +
        '</span>' +
      '</div>' +
      '<ol class="pp-onboarding__steps">' + items + '</ol>';
  }

  function create() {
    const el = document.createElement('div');
    el.className = 'pp-onboarding';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Getting started');
    fill(el);
    return el;
  }

  // Il bottone Save della guida inoltra il click al bottone Save della navbar
  // (desktop o mobile: i handler sono collegati ad entrambi, che sia visibile o no)
  document.addEventListener('click', function (e) {
    const btn = e.target.closest && e.target.closest('.pp-onboarding__save');
    if (!btn) return;
    const target = document.getElementById('savePstBtn') || document.getElementById('savePstBtnMobile');
    if (target && !target.disabled) target.click();
  });

  function update() {
    document.querySelectorAll('.pp-onboarding').forEach(fill);
  }

  function remove() {
    document.querySelectorAll('.pp-onboarding').forEach(function (el) { el.remove(); });
    document.body.classList.remove(BODY_CLASS);
  }

  function isVisible() {
    return !read(KEYS.done) && read(KEYS.active);
  }

  // Inserisce (o rimuove) la checklist in `container`.
  // opts.gearCount: numero di gear nel Rig (solo pagina rigs, determina lo step 1 e l'attivazione)
  function mount(container, page, opts) {
    currentPage = page;
    if (!container || read(KEYS.done)) { remove(); return null; }

    if (page === 'rigs' && opts && typeof opts.gearCount === 'number') {
      write(KEYS.step1, opts.gearCount > 0);
      if (opts.gearCount === 0) {
        write(KEYS.active, true);
        write(KEYS.step2, false); // Rig svuotato: si riparte dallo step 1
      }
    }

    if (!isVisible()) { remove(); return null; }

    container.querySelectorAll('.pp-onboarding').forEach(function (el) { el.remove(); });
    const el = create();
    container.appendChild(el);
    document.body.classList.add(BODY_CLASS);
    suppressTourNudge();
    return el;
  }

  // Il toast "New to PedalPlex?" (js/tour.js) parte prima che il Rig sia caricato, quindi può
  // essere già comparso quando la checklist si monta: lo rimuoviamo e non lo contiamo come "mostrato",
  // così potrà essere riproposto a onboarding concluso.
  function suppressTourNudge() {
    ['pp-tour-nudge', 'pp-preset-nudge'].forEach(function (id) {
      const n = document.getElementById(id);
      if (!n) return;
      n.remove();
      if (id === 'pp-tour-nudge') {
        try {
          sessionStorage.removeItem('pp_tour_nudge_shown');
          const c = parseInt(localStorage.getItem('pp_tour_nudge_count') || '0', 10);
          if (c > 0) localStorage.setItem('pp_tour_nudge_count', String(c - 1));
        } catch (e) {}
      }
    });
  }

  function complete() {
    write(KEYS.done, true);
    remove();
  }

  // --- Step 2: l'utente ha modificato i controlli di almeno un gear ---
  function watchControls() {
    let timer = null;
    function check() {
      if (read(KEYS.step2) || read(KEYS.done)) return;
      if (window.PPUnsaved && window.PPUnsaved.isDirty()) {
        write(KEYS.step2, true);
        update();
      }
    }
    ['mouseup', 'touchend', 'change', 'input', 'click'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        if (read(KEYS.step2) || !isVisible()) return;
        clearTimeout(timer);
        timer = setTimeout(check, 60); // lascia finire gli handler dei controlli
      }, true);
    });
  }

  // Pagina presets: monta nello slot dedicato
  function initPresetsPage() {
    if (window.isPreviewMode) return;
    const slot = document.getElementById('ppOnboardingSlot');
    if (!slot) return;
    if (mount(slot, 'presets')) watchControls();
  }

  // true mentre la checklist è (o sta per essere) visibile: il tour/toast non devono comparire
  function isPending() { return isVisible(); }
  function isDone() { return read(KEYS.done); }

  window.PPOnboarding = { mount: mount, complete: complete, update: update, isPending: isPending, isDone: isDone };

  if (/(^|\/)(presets|plexes)(\.html)?$/.test(window.location.pathname)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPresetsPage);
    } else {
      initPresetsPage();
    }
  }
})();

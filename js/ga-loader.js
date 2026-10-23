// Google Analytics loader condiviso da tutte le pagine.
// GA parte se l'utente ha accettato i cookie, oppure se il backend
// (GA_FORCE_LOAD in backend/config.php, via GET_GA_CONFIG.php) forza il caricamento.
(function () {
  function loadGA() {
    if (window.gtagLoaded) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-BX9P5WN5HH';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-BX9P5WN5HH');
    window.gtagLoaded = true;
  }
  window.pedalplexLoadGA = loadGA;

  if (localStorage.getItem('pedalplex_cookie_consent') === 'accept') {
    loadGA();
    return;
  }

  fetch('https://api.pedalplex.com/GET_GA_CONFIG.php', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (c) { if (c && c.force_ga) loadGA(); })
    .catch(function () {});
})();

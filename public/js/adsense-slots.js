(function () {
  var CLIENT = 'ca-pub-5577845770177327';
  var SCRIPT_SRC =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
  var DESKTOP = window.matchMedia('(min-width: 768px)');

  function slotKey(ins) {
    var host = ins.closest('[data-ad-slot]');
    return host ? host.getAttribute('data-ad-slot') : null;
  }

  function slotAllowed(key) {
    if (key === 'game-below-fold') return !DESKTOP.matches;
    if (key === 'rail-left' || key === 'rail-right') return DESKTOP.matches;
    return true;
  }

  function isVisible(ins) {
    if (!ins || ins.getAttribute('data-adsense-init') === 'true') return false;
    if (!slotAllowed(slotKey(ins))) return false;

    var node = ins;
    while (node && node !== document.body) {
      var style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      node = node.parentElement;
    }

    return ins.getBoundingClientRect().width > 0;
  }

  function slots() {
    return Array.prototype.slice.call(
      document.querySelectorAll('.ad-slot-inner .adsbygoogle, .ad-slot__inner .adsbygoogle')
    );
  }

  function pushVisible() {
    if (!window.adsbygoogle) return;
    slots().forEach(function (ins) {
      if (!isVisible(ins)) return;
      ins.setAttribute('data-adsense-init', 'true');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  function loadScript(done) {
    var existing = document.querySelector('script[src*="adsbygoogle.js"]');
    if (existing) {
      if (window.adsbygoogle) done();
      else existing.addEventListener('load', done, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = SCRIPT_SRC;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', done, { once: true });

    var anchor = document.querySelector('.ad-slot-inner, .ad-slot__inner');
    (anchor || document.body).appendChild(script);
  }

  function init() {
    if (!slots().length) return;
    loadScript(function () {
      requestAnimationFrame(pushVisible);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(pushVisible, 200);
  });
})();

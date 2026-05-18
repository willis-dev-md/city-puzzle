(function () {
  var CLIENT = 'ca-pub-5577845770177327';
  var SCRIPT_SRC =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CLIENT;
  var DESKTOP = window.matchMedia('(min-width: 768px)');

  var SLOT_CONFIG = {
    'rail-left': {
      style: 'display:inline-block;width:300px;height:600px',
      responsive: false,
    },
    'rail-right': {
      style: 'display:inline-block;width:300px;height:600px',
      responsive: false,
    },
    'game-below-fold': {
      style: 'display:block',
      responsive: true,
    },
    'welcome-below-fold': {
      style: 'display:block',
      responsive: true,
    },
  };

  function slotHost(key) {
    var el = document.querySelector('[data-ad-slot="' + key + '"]');
    if (!el) return null;
    if (el.classList.contains('ad-slot-inner') || el.classList.contains('ad-slot__inner')) {
      return el;
    }
    return el.querySelector('.ad-slot-inner, .ad-slot__inner') || el;
  }

  function activeSlotKeys() {
    if (document.querySelector('[data-ad-slot="welcome-below-fold"]')) {
      return ['welcome-below-fold'];
    }
    if (DESKTOP.matches) return ['rail-left', 'rail-right'];
    return ['game-below-fold'];
  }

  function createIns(config) {
    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = config.style;
    ins.setAttribute('data-ad-client', CLIENT);
    if (config.responsive) {
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
    }
    return ins;
  }

  function mountSlot(key) {
    var host = slotHost(key);
    var config = SLOT_CONFIG[key];
    if (!host || !config || host.getAttribute('data-adsense-mounted') === 'true') return false;
    if (host.getBoundingClientRect().width <= 0) return false;

    host.appendChild(createIns(config));
    host.setAttribute('data-adsense-mounted', 'true');

    if (window.adsbygoogle) {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
    return true;
  }

  function mountActiveSlots() {
    activeSlotKeys().forEach(mountSlot);
  }

  function loadScript(done) {
    if (window.adsbygoogle) {
      done();
      return;
    }

    var existing = document.querySelector('script[src*="adsbygoogle.js"]');
    if (existing) {
      existing.addEventListener('load', done, { once: true });
      return;
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = SCRIPT_SRC;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', done, { once: true });
    document.body.appendChild(script);
  }

  function init(retry) {
    if (!document.querySelector('[data-ad-slot]')) return;

    loadScript(function () {
      requestAnimationFrame(function () {
        mountActiveSlots();

        var keys = activeSlotKeys();
        var pending = keys.some(function (key) {
          var host = slotHost(key);
          return host && host.getAttribute('data-adsense-mounted') !== 'true';
        });

        if (pending && retry < 8) {
          setTimeout(function () {
            init(retry + 1);
          }, 250);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(0);
    });
  } else {
    init(0);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.adsbygoogle) mountActiveSlots();
    }, 200);
  });
})();

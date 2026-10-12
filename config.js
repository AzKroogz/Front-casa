window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
(function (document) {
  'use strict';
  if (!document || document.getElementById('casa-pwa-manifest')) return;

  function addMeta(name, content) {
    var meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }

  var manifest = document.createElement('link');
  manifest.id = 'casa-pwa-manifest';
  manifest.rel = 'manifest';
  manifest.href = './manifest.webmanifest';
  document.head.appendChild(manifest);

  var appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = './icons/icon-180.png';
  document.head.appendChild(appleIcon);

  addMeta('mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  addMeta('apple-mobile-web-app-title', 'Casa');

  var loader = document.createElement('script');
  loader.src = './pwa.js';
  loader.defer = true;
  document.head.appendChild(loader);
}(document));

(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () {
      /* La app sigue funcionando como web normal si el registro falla. */
    });
  });
}());

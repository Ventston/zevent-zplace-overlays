import { appendOurUI, keepOurselfInDOM } from './panel';
import { refreshKnownOverlays, reloadWantedOverlaysInDOM } from './overlay';
import { checkVersion } from './version.js';
import { injectStyles } from './style.js';
import { initSymbols } from './symbols.js';
import { config } from './store.js';
import { initMisc } from './misc.js';
import { track, trackDailyOverlays } from './analytics.js';
import { refreshMessages } from './messages.js';

(function () {
    if (!Array.isArray(config.wantedOverlays)) {
        config.wantedOverlays = [];
    }

    initMisc();

    //one pageview per script boot: unique users, and version breakdown via the URL
    track();

    //init all
    refreshKnownOverlays().then(trackDailyOverlays);
    //append ui
    injectStyles();
    appendOurUI();

    refreshMessages();

    initSymbols();

    setInterval(keepOurselfInDOM, 1000);
    setInterval(refreshKnownOverlays, 1000 * 60); //every minute
    setInterval(refreshMessages, 1000 * 30);
    setInterval(checkVersion, 1000 * 60 * 5); //every 5 minutes
    checkVersion();

    let showAll = true;
    document.addEventListener('keypress', function (event) {
        const target = event.target;
        if (target instanceof Element && target.closest('input, textarea, [contenteditable]')) {
            return;
        }
        if (event.code === 'KeyH') {
            showAll = !showAll;
            const ourOverlays = document.querySelectorAll('.zevent-place-overlay-img');
            ourOverlays.forEach(function (e) {
                e.hidden = !showAll;
            });
            const btnShowHide = document.querySelectorAll('.zpo-btn-show-hide');
            btnShowHide.forEach(function (btn) {
                btn.setAttribute('data-shown', showAll);
            });
        }
    });

    //when canvas is ready, reload wanted overlays in DOM
    const canvasObserver = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const canvas = document.querySelector('#place-canvas');
                if (canvas) {
                    reloadWantedOverlaysInDOM();
                    observer.disconnect(); //stop observing
                    break;
                }
            }
        }
    });
    canvasObserver.observe(document.body, { childList: true, subtree: true });
})();

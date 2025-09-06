import { appendOurUI, keepOurselfInDOM } from './panel';
import { refreshKnownOverlays, reloadWantedOverlaysInDOM } from './overlay';
import { checkVersion } from './version.js';
import { injectStyles } from './style.js';
import { initSymbols } from './symbols.js';
import { config } from './store.js';
import { initMisc } from './misc.js';

(function () {
    if (!Array.isArray(config.wantedOverlays)) {
        GM_setValue('selectedOverlays', []);
        config.wantedOverlays = [];
    }

    initMisc();

    //init all
    refreshKnownOverlays();
    //append ui
    injectStyles();
    appendOurUI();

    initSymbols();

    setInterval(keepOurselfInDOM, 1000);
    setInterval(checkVersion, 1000 * 60 * 5); //every 5 minutes
    checkVersion();

    let showAll = true;
    document.addEventListener('keypress', function (event) {
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

import { config } from './store';
import { fetchKnownOverlays } from './data-fetch';
import { idSanityCheck, textSanityFilter, urlSanityCheck, zpoLog } from './utils';
import { getOriginalCanvas, getOverlayParent } from './selectors';
import { appendUIWantedOverlay, refreshDisplayTime, reloadUIKnownOverlays, reloadUIWantedOverlays } from './panel';

export const refreshKnownOverlays = async () => {
    const newOverlays = await fetchKnownOverlays();
    if (newOverlays) {
        config.knownOverlays = newOverlays.map(overlay => {
            return {
                id: idSanityCheck(overlay.id) || 'custom-' + config.lastCustomId++,
                overlay_url: urlSanityCheck(overlay.overlay_url),
                overlay_colorblind_url: urlSanityCheck(overlay.overlay_colorblind_url),
                community_name: textSanityFilter(overlay.community_name) || '(invalid)',
                community_twitch: urlSanityCheck(overlay.community_twitch),
                community_discord: urlSanityCheck(overlay.community_discord),
                thread_url: urlSanityCheck(overlay.thread_url),
                description: textSanityFilter(overlay.description),
            };
        });
        config.wantedOverlays = config.wantedOverlays.reduce((acc, overlay) => {
            const exists = config.knownOverlays.find(o => o.id === overlay.id);
            if (exists) {
                acc.push(exists);
            } else if(overlay.id.startsWith('custom-')) {
                acc.push(overlay);
            }
            return acc;
        }, []);
        reloadUIKnownOverlays();
        reloadUIWantedOverlays();
        reloadWantedOverlaysInDOM();
    }
    refreshDisplayTime(document.querySelector('#zevent-place-overlay-known-ts'));
};

/**
 * Load an overlay by adding it to wantedOverlays and displaying it
 * @param {Overlay} overlay
 */
export function addWantedOverlay(overlay) {
    if (!config.wantedOverlays.find(o => o.id === overlay.id)) {
        config.wantedOverlays.push(overlay);
        GM_setValue('selectedOverlays', config.wantedOverlays);
    }
    appendOverlayToDOM(overlay);
    appendUIWantedOverlay(overlay);
}

function fitOverlayOnCanvas(image) {
    zpoLog('fitOverlayOnCanvas()');
    const origCanvas = getOriginalCanvas();

    const nw = image.naturalWidth;
    const nh = image.naturalHeight;
    if (!nw || !nh) {
        zpoLog('fitOverlayOnCanvas() WARNING: no nw or nh: ' + nw + ',' + nh);
        return;
    }
    if (nw % 300 || nh % 300) {
        // Check if divisible by 7 (new format with symbols)
        if (nw % 7 === 0 && nh % 7 === 0) {
            zpoLog('fitOverlayOnCanvas() nw,nh (div by 7): ' + nw + ',' + nh);
            image.width = nw / 7;
            image.height = nh / 7;
        } else {
            zpoLog(
                'fitOverlayOnCanvas() WARNING: adding image size that is not multiple of 300 or 7, badly exported overlay'
            );
            image.width = origCanvas.width;
            image.height = origCanvas.height;
        }
    } else {
        zpoLog('fitOverlayOnCanvas() nw,nh (div by 3): ' + nw + ',' + nh);
        image.width = nw / 3;
        image.height = nh / 3;
    }
    zpoLog('fitOverlayOnCanvas() width,height: ' + image.width + ',' + image.height);
}

export function removeWantedOverlay(overlayId) {
    config.wantedOverlays = config.wantedOverlays.filter(o => o.id !== overlayId);
    removeOverlayFromDOM(overlayId);
    const availNode = document.getElementById('avail-node-' + overlayId);
    if (availNode) {
        availNode.hidden = false;
    }
    const wantedNode = document.getElementById('wanted-node-' + overlayId);
    if (wantedNode) {
        wantedNode.remove();
    }
}

function appendOverlayToDOM(overlay) {
    if (!overlay || (!overlay.overlay_url && !overlay.overlay_colorblind_url)) return;

    let url = overlay.overlay_url;
    if (config.enableSymbols && overlay.overlay_colorblind_url) {
        url = overlay.overlay_colorblind_url || overlay.overlay_url;
    }

    zpoLog('appendOverlayInDOM() url: ' + url);

    const image = document.createElement('img');
    if (url.split('/').pop().includes('?')) {
        url = url + '&t=' + Math.random();
    } else {
        url = url + '?t=' + Math.random();
    }
    image.className = 'zevent-place-overlay-img';
    image.id = 'zpo-overlay-' + overlay.id;
    // Add ?ts= and a timestamp to skip browser cache, overlays will be hosted at various places, with various Expires: headers
    image.src = url;
    image.style = 'background: none; position: absolute; left: 0px; top: 0px;';
    image.onload = function (event) {
        fitOverlayOnCanvas(event.target);
    };
    image.onerror = function () {
        zpoLog('appendOverlayInDOM() image.onerror for url: ' + url);
        removeWantedOverlay(overlay.id);
        alert(
            "Impossible de charger l'overlay " + overlay.community_name + ", veuillez vérifier l'URL: " + url
        );
    };
    const parent = getOverlayParent();
    if (parent) {
        parent.appendChild(image);
    }
}

function removeOverlayFromDOM(overlayId) {
    const img = document.getElementById('zpo-overlay-' + overlayId);
    if (img) {
        img.remove();
    }
}

export function reloadWantedOverlaysInDOM() {
    zpoLog('reloadWantedOverlaysInDOM()');
    // First, remove all existing overlays from DOM
    const existingImgs = document.querySelectorAll('.zevent-place-overlay-img');
    existingImgs.forEach(img => img.remove());
    // Then, add all wanted overlays to DOM
    config.wantedOverlays.forEach(overlay => {
        appendOverlayToDOM(overlay);
    });
}

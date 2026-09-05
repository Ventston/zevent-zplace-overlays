import { config } from './store';
import { fetchKnownOverlays } from './data-fetch';
import { defaultsToAdd, groupToRemove, isRemovable, linkedToAdd, newlyLinkedToAdd } from './links';
import { overlayProps, track } from './analytics';
import { zpoLog } from './utils';
import { overlayGeometry } from './geometry';
import { overlayKeysFromQuery, searchWithoutOverlays } from './query';
import { getOriginalCanvas, getOverlayParent } from './selectors';
import {
    appendUIWantedOverlay,
    refreshDisplayTime,
    refreshUIKnownOverlaysVisibility,
    reloadUIKnownOverlays,
    reloadUIWantedOverlays,
} from './panel';
import { gmFetchImageDataUrl } from './http.js';

export const refreshKnownOverlays = async (force = false) => {
    const newOverlays = await fetchKnownOverlays(force);
    if (newOverlays) {
        const freshlyLinked = newlyLinkedToAdd(newOverlays, config.wantedOverlays);
        config.knownOverlays = newOverlays;
        config.wantedOverlays = config.wantedOverlays.reduce((acc, overlay) => {
            const exists = config.knownOverlays.find(o => o.id === overlay.id);
            if (exists) {
                acc.push(exists);
            } else if (overlay.id.startsWith('custom-')) {
                acc.push(overlay);
            }
            return acc;
        }, []);
        for (const overlay of freshlyLinked) {
            zpoLog('refreshKnownOverlays() newly linked: ' + overlay.id);
            addWantedOverlay(overlay, false);
        }
        applyDefaultOverlays();
        reloadUIKnownOverlays();
        reloadUIWantedOverlays();
        reloadWantedOverlaysInDOM();
    }
    refreshDisplayTime(document.querySelector('#zevent-place-overlay-known-ts'));
};

/**
 * Load an overlay by adding it to wantedOverlays and displaying it
 * @param {Overlay} overlay
 * @param {boolean} [withLinked] - also add the overlays linked to this one.
 *   false when adding a linked overlay: links are followed one hop only.
 */
export function addWantedOverlay(overlay, withLinked = true) {
    if (!config.wantedOverlays.find(o => o.id === overlay.id)) {
        config.wantedOverlays = [...config.wantedOverlays, overlay];
        track('overlay-add', overlayProps(overlay));
    }
    appendOverlayToDOM(overlay);
    appendUIWantedOverlay(overlay);
    refreshUIKnownOverlaysVisibility();

    if (!withLinked) return;
    const linked = linkedToAdd(overlay, config.knownOverlays, config.wantedOverlays);
    for (const other of linked) {
        zpoLog('addWantedOverlay() linked: ' + other.id);
        addWantedOverlay(other, false);
    }
    if (linked.length) reloadUIWantedOverlays();
}

export function applyDefaultOverlays() {
    for (const overlay of defaultsToAdd(config.knownOverlays, config.wantedOverlays)) {
        zpoLog('applyDefaultOverlays() ' + overlay.id);
        addWantedOverlay(overlay);
    }
}

export function applyQueryOverlays() {
    const keys = overlayKeysFromQuery(location.search);
    if (!keys.length) return;

    let missing = false;
    for (const key of keys) {
        const overlay = config.knownOverlays.find(o => o.slug === key || o.id === key);
        if (!overlay) {
            zpoLog('applyQueryOverlays() unknown overlay: ' + key);
            missing = true;
            continue;
        }
        if (config.wantedOverlays.find(o => o.id === overlay.id)) {
            zpoLog('applyQueryOverlays() already active: ' + key);
            continue;
        }
        zpoLog('applyQueryOverlays() ' + key);
        addWantedOverlay(overlay);
    }

    if (!missing) {
        history.replaceState(null, '', location.pathname + searchWithoutOverlays(location.search) + location.hash);
    }
}

function fitOverlayOnCanvas(image) {
    zpoLog('fitOverlayOnCanvas()');
    const origCanvas = getOriginalCanvas();
    if (!origCanvas) {
        zpoLog('fitOverlayOnCanvas() WARNING: no canvas (maintenance?)');
        return;
    }

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

export function applyOverlayVisibility(overlayId) {
    const hidden = config.hiddenOverlays.includes(overlayId);
    const image = document.getElementById('zpo-overlay-' + overlayId);
    if (image) image.hidden = hidden;
    const btn = document.getElementById('show-hide-' + overlayId);
    if (btn) btn.setAttribute('data-shown', (!hidden).toString());
}

export function setOverlayHidden(overlayId, hidden) {
    config.hiddenOverlays = hidden
        ? [...new Set([...config.hiddenOverlays, overlayId])]
        : config.hiddenOverlays.filter(id => id !== overlayId);
    applyOverlayVisibility(overlayId);
}

export function setAllOverlaysHidden(hidden) {
    config.hiddenOverlays = hidden ? config.wantedOverlays.map(o => o.id) : [];
    for (const overlay of config.wantedOverlays) applyOverlayVisibility(overlay.id);
}

export function removeWantedOverlay(overlayId) {
    const overlay = config.wantedOverlays.find(o => o.id === overlayId);
    if (!isRemovable(overlay, config.knownOverlays)) {
        zpoLog('removeWantedOverlay() denied, overlay is pinned by the organizers: ' + overlayId);
        return;
    }
    for (const member of groupToRemove(overlay, config.wantedOverlays)) {
        if (member.id !== overlayId) zpoLog('removeWantedOverlay() group member: ' + member.id);
        dropOverlay(member.id);
    }
    if (!overlay) dropOverlay(overlayId);
}

function dropOverlay(overlayId) {
    config.wantedOverlays = config.wantedOverlays.filter(o => o.id !== overlayId);
    config.hiddenOverlays = config.hiddenOverlays.filter(id => id !== overlayId);
    removeOverlayFromDOM(overlayId);
    refreshUIKnownOverlaysVisibility();
    const wantedNode = document.getElementById('wanted-node-' + overlayId);
    if (wantedNode) {
        wantedNode.remove();
    }
}

function appendOverlayToDOM(overlay) {
    if (!overlay || (!overlay.overlay_url && !overlay.overlay_colorblind_url)) return;

    const parent = getOverlayParent();
    if (!parent) {
        zpoLog('appendOverlayInDOM() no canvas, skipping: ' + overlay.id);
        return;
    }

    let url = overlay.overlay_url;
    if (config.enableSymbols && overlay.overlay_colorblind_url) {
        url = overlay.overlay_colorblind_url;
    }

    zpoLog('appendOverlayInDOM() url: ' + url);

    const image = document.createElement('img');
    const cacheKey = overlay.updated_at ? encodeURIComponent(overlay.updated_at) : 'x';
    const src = url + (url.includes('?') ? '&t=' : '?t=') + cacheKey;
    image.className = 'zevent-place-overlay-img';
    image.id = 'zpo-overlay-' + overlay.id;
    image.style = 'background: none; position: absolute; left: 0px; top: 0px;z-index: 1000; pointer-events: none;';
    image.hidden = config.hiddenOverlays.includes(overlay.id);

    const geometry = overlayGeometry(overlay);
    if (geometry) {
        image.style.left = geometry.left;
        image.style.top = geometry.top;
        if (geometry.width) {
            image.width = geometry.width;
            image.height = geometry.height;
        }
        // else: positioned custom overlay → keep the image at its natural (1:1) size
    } else {
        image.onload = function (event) {
            fitOverlayOnCanvas(event.target);
        };
    }
    const onImageFailure = reason => {
        zpoLog('appendOverlayInDOM() image failure (' + reason + ') for url: ' + url);
        if (overlay.id.startsWith('custom-')) {
            removeWantedOverlay(overlay.id);
            alert("Impossible de charger l'overlay " + overlay.community_name + ", veuillez vérifier l'URL: " + url);
        }
    };
    image.onerror = () => onImageFailure('onerror');
    parent.appendChild(image);
    gmFetchImageDataUrl(src)
        .then(dataUrl => {
            if (image.isConnected) image.src = dataUrl;
        })
        .catch(error => onImageFailure(error));
}

function removeOverlayFromDOM(overlayId) {
    const img = document.getElementById('zpo-overlay-' + overlayId);
    if (img) {
        img.remove();
    }
}

export function reloadWantedOverlaysInDOM() {
    zpoLog('reloadWantedOverlaysInDOM()');
    const existingImgs = document.querySelectorAll('.zevent-place-overlay-img');
    existingImgs.forEach(img => img.remove());
    config.wantedOverlays.forEach(overlay => {
        appendOverlayToDOM(overlay);
    });
}

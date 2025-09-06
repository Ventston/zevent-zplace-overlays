import { inviteDiscordURL, scriptUpdateURL, version } from './constants';
import { urlSanityCheck, zpoLog } from './utils';
import { addWantedOverlay, refreshKnownOverlays, reloadWantedOverlaysInDOM, removeWantedOverlay } from './overlay';
import { config } from './store';
import { getPanelParent } from './selectors';
import { changeEnabledSymbols } from './symbols.js';
import { renderTemplate } from './ui.js';
import { checkVersion } from './version.js';

export function appendOurUI() {
    zpoLog('appendOurUI()');
    const origUI = getPanelParent();
    const ourUI = document.createElement('div');
    ourUI.id = 'zevent-place-overlay-ui';

    // Use template system
    ourUI.innerHTML = renderTemplate('main-ui', {
        scriptUpdateURL,
        inviteDiscordURL,
    });
    const btnToggle = ourUI.querySelector('#zevent-place-overlay-ui-toggle');
    if (btnToggle) {
        btnToggle.onclick = e => {
            const body = ourUI.querySelector('#zevent-place-overlay-ui-body');
            if (body) {
                const isExpanded = body.getAttribute('aria-expanded') === 'true';
                body.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                btnToggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
            }
        };
    }

    const btnAdd = ourUI.querySelector('#btn-custom-add');
    if (btnAdd) btnAdd.onclick = eventAddCustomOverlay;

    const btnAskRefreshWantedOverlays = ourUI.querySelector('#btn-refresh-wanted');
    if (btnAskRefreshWantedOverlays) btnAskRefreshWantedOverlays.onclick = reloadWantedOverlaysInDOM;

    const btnAskRefreshKnownOverlays = ourUI.querySelector('#btn-refresh-known');
    if (btnAskRefreshKnownOverlays) btnAskRefreshKnownOverlays.onclick = refreshKnownOverlays;

    const versionSpan = ourUI.querySelector('#zevent-place-overlay-ui-version');
    if (versionSpan) {
        versionSpan.innerHTML = 'v' + version;
    }

    const searchInput = ourUI.querySelector('#zevent-place-overlay-search');
    if (searchInput) {
        searchInput.oninput = searchOverlays;
    }

    const enableSymbolsCheckbox = ourUI.querySelector('#enableSymbolsCheckbox');
    if (enableSymbolsCheckbox) {
        enableSymbolsCheckbox.checked = config.enableSymbols;
        enableSymbolsCheckbox.onchange = e => {
            changeEnabledSymbols(e.target.checked);
        };
    }

    origUI.appendChild(ourUI);

    reloadUIWantedOverlays();
    reloadUIKnownOverlays();
    checkVersion();
}

function eventAddCustomOverlay() {
    zpoLog('eventAddCustomOverlay()');
    const nodeInput = document.querySelector('#zevent-place-overlay-ui-input-url');
    const url = nodeInput.value;

    const checkedUrl = urlSanityCheck(url);
    if (!checkedUrl) {
        alert('URL invalide');
        return;
    }
    const id = config.lastCustomId++;
    addWantedOverlay({
        id: 'custom-' + id,
        overlay_url: checkedUrl,
        community_name: 'Custom ' + id,
        description: 'Ajouté manuellement',
    });
}

function searchOverlays(e) {
    const search = e.target.value.toLowerCase();
    zpoLog('searchOverlays :' + search);
    config.knownOverlays.forEach(function (overlay) {
        const isHidden = !(
            overlay.community_name.toLowerCase().includes(search) || overlay.description.toLowerCase().includes(search)
        );
        document.querySelector('#avail-node-' + overlay.id).hidden = isHidden;
    });
}

export function appendUIWantedOverlay(overlay) {
    zpoLog('appendUIWantedOverlays()');
    const ulWantedOverlays = document.querySelector('#zevent-place-overlay-ui-list-wanted-overlays');
    if (!ulWantedOverlays) return;

    const tr = document.createElement('div');
    tr.id = 'wanted-node-' + overlay.id;
    tr.className = 'zpo-overlay-line';

    // Use template system
    tr.innerHTML = renderTemplate('wanted-overlay', {
        overlayId: overlay.id,
        overlayUrl: config.enableSymbols ? (overlay.overlay_colorblind_url ?? overlay.overlay_url) : overlay.overlay_url,
        threadUrl: overlay.thread_url,
        title: overlay.community_name,
    });
    const btnDel = tr.querySelector('#btn-del-' + overlay.id);
    if (btnDel)
        btnDel.onclick = () => {
            removeWantedOverlay(overlay.id);
        };

    const showHideBtn = tr.querySelector('.zpo-btn-show-hide');
    if (showHideBtn) {
        showHideBtn.onclick = () => {
            const ourOverlay = document.querySelector('#zpo-overlay-' + overlay.id);
            if (ourOverlay) {
                const isHidden = ourOverlay.hidden;
                ourOverlay.hidden = !isHidden;
                showHideBtn.setAttribute('data-shown', isHidden.toString());
            }
        };
    }

    ulWantedOverlays.appendChild(tr);
}

export function reloadUIWantedOverlays() {
    if (!config.wantedOverlays) {
        zpoLog('reloadUIWantedOverlays() for undefined wantedOverlays');
        return;
    }
    zpoLog('reloadUIWantedOverlays() for ' + config.wantedOverlays.length + ' wantedOverlays');
    // Refresh the list in DOM
    const ulWantedOverlays = document.querySelector('#zevent-place-overlay-ui-list-wanted-overlays');
    if (!ulWantedOverlays) return;
    ulWantedOverlays.innerHTML = '';
    for (const overlay of config.wantedOverlays) {
        appendUIWantedOverlay(overlay);
    }
}

function appendUIKnownOverlay(ulKnownOverlays, overlay) {
    // Don't concat json data directly in innerHTML (prevent some injection attacks)
    zpoLog('appendUIKnownOverlays()');
    const tr = document.createElement('div');
    tr.id = 'avail-node-' + overlay.id;
    tr.className = 'zpo-overlay-line';

    // Use template system
    tr.innerHTML = renderTemplate('known-overlay', {
        overlayId: overlay.id,
        threadUrl: overlay.thread_url,
        description: overlay.description,
        title: overlay.community_name,
    });
    const btnAdd = tr.querySelector('#btn-add-' + overlay.id);
    if (btnAdd)
        btnAdd.onclick = () => {
            addWantedOverlay(overlay);
            tr.hidden = true;
        };

    if (typeof overlay.description === 'string') {
        const btnDescription = tr.querySelector('#btn-description-' + overlay.id);
        if (btnDescription)
            btnDescription.onclick = () => {
                const descNode = document.querySelector('#desc-node-' + overlay.id);
                if (descNode) {
                    const isExpanded = descNode.getAttribute('aria-expanded') === 'true';
                    descNode.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                }
            };
    }

    ulKnownOverlays.appendChild(tr);

    ulKnownOverlays.insertAdjacentHTML(
        'beforeend',
        renderTemplate('overlay-description', {
            description: overlay.description,
            overlayId: overlay.id,
        })
    );

    if (config.wantedOverlays.find(o => o.id === overlay.id)) {
        tr.hidden = true;
    }
}

export function reloadUIKnownOverlays() {
    if (!config.knownOverlays) {
        zpoLog('reloadUIKnownOverlays() for undefined knownOverlays');
        return;
    }
    zpoLog('reloadUIKnownOverlays() for ' + config.knownOverlays.length + ' knownOverlays');
    // Refresh the list in DOM
    const ulKnownOverlays = document.querySelector('#zevent-place-overlay-ui-list-known-overlays');
    if (!ulKnownOverlays) return;
    ulKnownOverlays.innerHTML = '';
    for (const overlay of config.knownOverlays) {
        appendUIKnownOverlay(ulKnownOverlays, overlay);
    }
}

export function keepOurselfInDOM() {
    const origCanvas = document.querySelector('#place-canvas');
    if (!origCanvas) zpoLog('keepOurselfInDOM() origCanvas: ' + origCanvas);

    let ourOverlays = document.querySelectorAll('.zevent-place-overlay-img');
    if (origCanvas && !ourOverlays.length) {
        // Special skip case skip : if there is no wantedOverlay and no currently displayed overlay
        if (!(config.wantedOverlays && config.wantedOverlays.length === 0 && ourOverlays.length === 0)) {
            zpoLog('keepOurselfInDOM() origCanvas: ' + !!origCanvas + ', ourOverlays: ' + ourOverlays.length);
            // reloadOverlays(origCanvas, ourOverlays);
            reloadWantedOverlaysInDOM();
            reloadUIWantedOverlays();
        }
    }

    const origUI = document.querySelector('#root');
    if (!origUI) zpoLog('keepOurselfInDOM() origUI: ' + origUI);
    const ourUI = document.querySelector('#zevent-place-overlay-ui');
    if (origUI && !ourUI) {
        zpoLog('keepOurselfInDOM() origUI: ' + !!origUI + ', ourUI: ' + !!ourUI);
        appendOurUI(origUI);
        reloadUIKnownOverlays(); // With local data (see knownOverlays at bottom of this script)
    }
}

export function refreshDisplayTime(domNode) {
    if (domNode) {
        const now = new Date();
        domNode.innerHTML = 'màj.' + now.getHours() + 'h' + String(now.getMinutes()).padStart(2, '0');
    }
}

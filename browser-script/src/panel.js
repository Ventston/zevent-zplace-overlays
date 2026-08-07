import { inviteDiscordURL, scriptUpdateURL, version } from './constants';
import { coordSanityCheck, urlSanityCheck, zpoLog } from './utils';
import { addWantedOverlay, refreshKnownOverlays, reloadWantedOverlaysInDOM, removeWantedOverlay } from './overlay';
import { config } from './store';
import { isRemovable, linkedNames } from './links.js';
import { getPanelParent } from './selectors';
import { changeEnabledSymbols } from './symbols.js';
import { renderTemplate } from './ui.js';
import { checkVersion } from './version.js';
import { renderMessages } from './messages.js';

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
    ourUI.insertAdjacentHTML('beforeend', renderTemplate('settings'));

    const btnToggle = ourUI.querySelector('#zevent-place-overlay-ui-toggle');
    const body = ourUI.querySelector('#zevent-place-overlay-ui-body');
    if (btnToggle && body) {
        btnToggle.onclick = () => setExpanded(btnToggle, body, body.getAttribute('aria-expanded') !== 'true');
    }

    const btnSettings = ourUI.querySelector('#btn-settings');
    const settings = ourUI.querySelector('#zpo-settings-panel');
    if (btnSettings && settings) {
        btnSettings.onclick = () =>
            setExpanded(btnSettings, settings, settings.getAttribute('aria-expanded') !== 'true');

        const btnCloseSettings = ourUI.querySelector('#btn-settings-close');
        if (btnCloseSettings) btnCloseSettings.onclick = () => setExpanded(btnSettings, settings, false);
    }

    const btnAdd = ourUI.querySelector('#btn-custom-add');
    if (btnAdd) btnAdd.onclick = eventAddCustomOverlay;

    const btnAskRefreshWantedOverlays = ourUI.querySelector('#btn-refresh-wanted');
    if (btnAskRefreshWantedOverlays) btnAskRefreshWantedOverlays.onclick = reloadWantedOverlaysInDOM;

    const btnAskRefreshKnownOverlays = ourUI.querySelector('#btn-refresh-known');
    if (btnAskRefreshKnownOverlays) btnAskRefreshKnownOverlays.onclick = () => refreshKnownOverlays(true);

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

    const enableAnalyticsCheckbox = ourUI.querySelector('#enableAnalyticsCheckbox');
    if (enableAnalyticsCheckbox) {
        enableAnalyticsCheckbox.checked = config.enableAnalytics;
        enableAnalyticsCheckbox.onchange = e => {
            config.enableAnalytics = e.target.checked;
        };
    }

    const customAdd = [ourUI.querySelector('#zpo-custom-add'), ourUI.querySelector('#zpo-custom-add-sep')];
    const showCustomInputCheckbox = ourUI.querySelector('#showCustomInputCheckbox');
    if (showCustomInputCheckbox) {
        const applyCustomAdd = shown => customAdd.forEach(node => node && (node.hidden = !shown));
        showCustomInputCheckbox.checked = config.showCustomInput;
        applyCustomAdd(config.showCustomInput);
        showCustomInputCheckbox.onchange = e => {
            config.showCustomInput = e.target.checked;
            applyCustomAdd(e.target.checked);
        };
    }

    origUI.appendChild(ourUI);

    reloadUIWantedOverlays();
    reloadUIKnownOverlays();
    renderMessages();
    checkVersion();
}

function setExpanded(btn, target, expanded) {
    target.setAttribute('aria-expanded', String(expanded));
    btn.setAttribute('aria-expanded', String(expanded));
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

    const x = coordSanityCheck(document.querySelector('#zevent-place-overlay-ui-input-x').value);
    const y = coordSanityCheck(document.querySelector('#zevent-place-overlay-ui-input-y').value);
    if (x === false || y === false) {
        alert('Position invalide : X et Y doivent être des entiers positifs');
        return;
    }
    if ((x === null) !== (y === null)) {
        alert('Position incomplète : renseignez X et Y, ou laissez les deux vides');
        return;
    }

    const id = Date.now().toString(36);
    const overlay = {
        id: 'custom-' + id,
        overlay_url: checkedUrl,
        community_name: 'Custom ' + id,
        description: 'Ajouté manuellement',
    };
    if (x !== null) {
        overlay.x = x;
        overlay.y = y;
    }
    addWantedOverlay(overlay);
}

function searchOverlays(e) {
    const search = e.target.value.toLowerCase();
    zpoLog('searchOverlays :' + search);
    config.knownOverlays.forEach(function (overlay) {
        const node = document.getElementById('avail-node-' + overlay.id);
        if (!node) return;
        node.hidden = !(
            overlay.community_name.toLowerCase().includes(search) || overlay.description.toLowerCase().includes(search)
        );
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
        linkedTo: linkedNames(overlay, config.wantedOverlays).join(', '),
        removable: isRemovable(overlay, config.knownOverlays),
        pinned: !isRemovable(overlay, config.knownOverlays),
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

    const ourOverlays = document.querySelectorAll('.zevent-place-overlay-img');
    if (origCanvas && !ourOverlays.length && config.wantedOverlays.length > 0) {
        zpoLog('keepOurselfInDOM() overlays lost, re-injecting');
        reloadWantedOverlaysInDOM();
        reloadUIWantedOverlays();
    }

    const origUI = document.querySelector('#root');
    if (!origUI) zpoLog('keepOurselfInDOM() origUI: ' + origUI);
    const ourUI = document.querySelector('#zevent-place-overlay-ui');
    if (origUI && !ourUI) {
        zpoLog('keepOurselfInDOM() UI lost, re-injecting');
        appendOurUI();
        reloadUIKnownOverlays();
    }
}

export function refreshDisplayTime(domNode) {
    if (domNode) {
        const now = new Date();
        domNode.innerHTML = 'màj.' + now.getHours() + 'h' + String(now.getMinutes()).padStart(2, '0');
    }
}

import { analyticsUrl, analyticsWebsiteId, version } from './constants';
import { config } from './store';
import { zpoLog } from './utils';

/**
 * Builds the Umami collect payload. Pure, tested in test/analytics.test.js.
 *
 * `url` carries the script version so the Umami "Pages" report reads as a version breakdown,
 * and `hostname` separates prod (place.zevent.fr) from the mock instance.
 *
 * @param {string} [name] - custom event name; omit it and Umami records a pageview instead
 * @param {Record<string, string|number|boolean>} [data] - custom event properties
 */
export const buildPayload = (name, data) => ({
    type: 'event',
    payload: {
        website: analyticsWebsiteId,
        hostname: location.hostname,
        url: '/' + version,
        screen: screen.width + 'x' + screen.height,
        language: navigator.language,
        ...(name && { name }),
        ...(data && { data }),
    },
});

const trackingEnabled = () => Boolean(analyticsWebsiteId) && config.enableAnalytics;

/**
 * Event properties identifying an overlay. The name is what makes the Umami report readable,
 * the id stays alongside it because names change server-side and would fragment the ranking.
 * Custom overlays carry one-off ids AND names, so they are grouped under a single value.
 * @param {Overlay} overlay
 */
export const overlayProps = overlay =>
    overlay.id.startsWith('custom-')
        ? { overlay: 'custom' }
        : { overlay: overlay.community_name || overlay.id, id: overlay.id };

/**
 * Fire-and-forget event. No-op when tracking is unconfigured or the user opted out.
 * @param {string} [name]
 * @param {Record<string, string|number|boolean>} [data]
 */
export const track = (name, data) => {
    if (!trackingEnabled()) return;
    fetch(analyticsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(name, data)),
        keepalive: true,
    }).catch(error => zpoLog('track() Exception: ' + error));
};

/**
 * Reports the overlays actually in use, once per day per browser.
 *
 * `overlay-add` only fires the day an overlay is picked, and wantedOverlays is persisted, so it
 * ranks discovery, not usage. This gives daily active users per overlay instead, and the daily
 * guard keeps page reloads from inflating heavy users.
 *
 * Call it once refreshKnownOverlays() has resolved: wantedOverlays is reconciled with the server
 * by then, so names are current and overlays deleted server-side are already dropped.
 */
export const trackDailyOverlays = () => {
    if (!trackingEnabled()) return;
    const today = new Date().toISOString().slice(0, 10);
    if (GM_getValue('analyticsLastDaily', '') === today) return;
    GM_setValue('analyticsLastDaily', today);
    for (const overlay of config.wantedOverlays) {
        track('overlay-active', overlayProps(overlay));
    }
};

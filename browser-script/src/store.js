/**
 * @typedef {Object} Overlay
 * @property {string} id - Unique identifier for the overlay
 * @property {string} [overlay_url] - URL of the overlay image
 * @property {string} [overlay_colorblind_url] - URL of the overlay image for colorblind users
 * @property {string} [community_name] - Name of the community associated with the overlay
 * @property {string} [community_twitch] - Twitch URL of the community
 * @property {string} [community_discord] - Discord URL of the community
 * @property {string} [thread_url] - URL of the discussion thread for the overlay
 * @property {string} [description] - Description of the overlay
 * @property {number} [x] - Position (place pixels) — optional on a custom overlay
 * @property {number} [y]
 * @property {number} [width] - Size (place pixels) — server overlays only, deduced from the image otherwise
 * @property {number} [height]
 */

/** Config properties that survive a reload, mapped to their GM storage key. */
const persistedKeys = {
    wantedOverlays: 'selectedOverlays',
    enableSymbols: 'enableSymbols',
    enableAnalytics: 'enableAnalytics',
    showCustomInput: 'showCustomInput',
};

/**
 * Global config. GM persistence goes through the proxy: always REASSIGN
 * (`config.wantedOverlays = [...]`), never mutate (`push`), otherwise nothing is saved.
 * @type {{knownOverlays: Overlay[], wantedOverlays: Overlay[], enableSymbols: boolean, enableAnalytics: boolean, showCustomInput: boolean}}
 */
export const config = new Proxy(
    {
        knownOverlays: [],
        wantedOverlays: GM_getValue('selectedOverlays', []),
        enableSymbols: GM_getValue('enableSymbols', false),
        enableAnalytics: GM_getValue('enableAnalytics', true),
        showCustomInput: GM_getValue('showCustomInput', false),
    },
    {
        set(target, property, value) {
            target[property] = value;
            const key = persistedKeys[property];
            if (key) GM_setValue(key, value);

            return true;
        },
    }
);

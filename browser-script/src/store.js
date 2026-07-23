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
 * @property {number} [x] - Coordinates and size (place pixels) — absent for a custom overlay
 * @property {number} [y]
 * @property {number} [width]
 * @property {number} [height]
 */

/**
 * Global config. GM persistence goes through the proxy: always REASSIGN
 * (`config.wantedOverlays = [...]`), never mutate (`push`), otherwise nothing is saved.
 * @type {{knownOverlays: Overlay[], wantedOverlays: Overlay[], enableSymbols: boolean}}
 */
export const config = new Proxy(
    {
        knownOverlays: [],
        wantedOverlays: GM_getValue('selectedOverlays', []),
        enableSymbols: GM_getValue('enableSymbols', false),
    },
    {
        set(target, property, value) {
            target[property] = value;
            if (property === 'wantedOverlays') {
                GM_setValue('selectedOverlays', value);
            } else if (property === 'enableSymbols') {
                GM_setValue('enableSymbols', value);
            }

            return true;
        },
    }
);

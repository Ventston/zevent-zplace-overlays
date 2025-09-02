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
 */

/**
 * @typedef {Object} Config
 * @property {Overlay[]} knownOverlays - List of all known overlays
 * @property {Overlay[]} wantedOverlays - List of overlays that the user wants to display
 * @property {number} lastCustomId - Counter for generating unique IDs for custom overlays
 * @property {boolean} enableSymbols - Flag to enable or disable symbol overlays
 */

/**
 * Global configuration object for managing overlays.
 * @type {Config}
 */
export const config = new Proxy(
    {
        knownOverlays: [],
        wantedOverlays: GM_getValue('selectedOverlays', []),
        lastCustomId: 0,
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

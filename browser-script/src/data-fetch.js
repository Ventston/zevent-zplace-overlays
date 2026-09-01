import { idSanityCheck, urlSanityCheck, zpoLog } from './utils';
import { overlaysJsonUrl, serverBase } from './constants';
import { gmFetchJson } from './http.js';

/**
 * Maps the server public format (PublicOverlay array) to the internal format.
 * Pure, tested in test/data-fetch.test.js.
 * @returns {Overlay[]|false}
 */
export const mapPublicOverlays = data => {
    if (!Array.isArray(data)) return false;
    const mapped = [];
    for (const item of data) {
        const id = idSanityCheck(item.id);
        if (id === false) continue;
        if (![item.x, item.y, item.width, item.height].every(Number.isInteger)) continue;
        if (item.width <= 0 || item.height <= 0) continue;
        if (typeof item.imageUrl !== 'string') continue;
        mapped.push({
            id,
            slug: idSanityCheck(item.slug) || id,
            community_name: typeof item.name === 'string' ? item.name : id,
            description: typeof item.description === 'string' ? item.description : '',
            community_twitch: urlSanityCheck(item.twitchUrl),
            community_discord: urlSanityCheck(item.discordUrl),
            thread_url: urlSanityCheck(item.threadUrl),
            overlay_url: serverBase + item.imageUrl,
            overlay_colorblind_url: item.colorblindImageUrl ? serverBase + item.colorblindImageUrl : null,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            linked_ids: Array.isArray(item.linkedIds) ? item.linkedIds.map(idSanityCheck).filter(Boolean) : [],
            is_default: item.isDefault === true,
            updated_at: typeof item.updatedAt === 'string' ? item.updatedAt : null,
        });
    }
    return mapped;
};

/**
 * @param {boolean} force - true: hard refresh (bypasses all caches, manual button).
 *   false (default, auto poll): cache-friendly request → 304 while overlays.json is unchanged.
 */
export const fetchKnownOverlays = async (force = false) => {
    try {
        const url = force ? overlaysJsonUrl + '?ts=' + Date.now() : overlaysJsonUrl;
        const res = await gmFetchJson(url, { force });
        zpoLog('fetchKnownOverlays() status: ' + res.status);
        if (res.status === 304) return false;
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = mapPublicOverlays(await res.json());
        if (!data) zpoLog('fetchKnownOverlays() invalid data, knownOverlays unchanged');
        return data;
    } catch (error) {
        zpoLog('fetchKnownOverlays() Exception: ' + error);
        return false;
    }
};

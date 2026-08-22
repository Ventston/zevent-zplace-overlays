import { idSanityCheck } from './utils';

const paramName = 'overlay';

/**
 * Overlays asked through the URL: `?overlay=slug`, repeatable and comma-separated
 * (`?overlay=a,b` and `?overlay=a&overlay=b` are equivalent). A key is a slug or an id —
 * both go through the same sanity check, and both are resolved against knownOverlays.
 * Pure, tested in test/query.test.js.
 * @param {string} search - location.search
 * @returns {string[]} sanitized keys, without duplicates
 */
export const overlayKeysFromQuery = search => {
    const ids = new URLSearchParams(search)
        .getAll(paramName)
        .flatMap(value => value.split(','))
        .map(value => value.trim())
        .filter(Boolean)
        .map(idSanityCheck)
        .filter(Boolean);
    return [...new Set(ids)];
};

/**
 * The same query string without the `overlay` params, ready for history.replaceState().
 * @param {string} search - location.search
 * @returns {string} '' when nothing is left, '?...' otherwise
 */
export const searchWithoutOverlays = search => {
    const params = new URLSearchParams(search);
    params.delete(paramName);
    const rest = params.toString();
    return rest ? '?' + rest : '';
};

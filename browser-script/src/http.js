import { zpoLog } from './utils.js';

const gmRequest = options =>
    new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            timeout: 5000,
            ...options,
            onload: resolve,
            onerror: () => reject(new Error('network error')),
            ontimeout: () => reject(new Error('timeout')),
            onabort: () => reject(new Error('aborted')),
        });
    });

const isOk = status => status >= 200 && status < 300;

/**
 * Remote JSON read, shaped like a Response for the callers.
 * @param {string} url
 * @param {{force?: boolean, timeout?: number}} [options] - force: bypass the browser cache
 * @returns {Promise<{ok: boolean, status: number, json: () => any}>}
 */
export const gmFetchJson = async (url, { force = false, timeout = 5000 } = {}) => {
    const res = await gmRequest({
        url,
        timeout,
        headers: force ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } : undefined,
    });
    return {
        ok: isOk(res.status),
        status: res.status,
        json: () => JSON.parse(res.responseText),
    };
};

/** Fire-and-forget send, the caller does not depend on the response. */
export const gmPostJson = (url, body) =>
    gmRequest({
        method: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify(body),
    });

const imageMime = responseHeaders => {
    const match = /^content-type:\s*(image\/[\w.+-]+)/im.exec(responseHeaders || '');
    return match ? match[1] : 'image/png';
};

const toBase64 = buffer => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    // Chunked: String.fromCharCode over a whole large image blows the call stack.
    for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
};

/**
 * Reads an image through the extension and returns it as a `data:` URL: the only cross-origin
 * image source the page CSP accepts (`blob:` is not allowed either).
 * @param {string} url
 * @returns {Promise<string>}
 */
export const gmFetchImageDataUrl = async url => {
    const res = await gmRequest({ url, timeout: 15000, responseType: 'arraybuffer' });
    if (!isOk(res.status)) throw new Error('HTTP ' + res.status);
    if (!res.response || res.response.byteLength === 0) throw new Error('empty image');
    zpoLog('gmFetchImageDataUrl() ' + res.response.byteLength + ' bytes for ' + url);
    return 'data:' + imageMime(res.responseHeaders) + ';base64,' + toBase64(res.response);
};

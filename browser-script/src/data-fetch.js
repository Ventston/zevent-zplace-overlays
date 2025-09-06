import { idSanityCheck, urlSanityCheck, zpoLog } from './utils';
import { overlayJSON1, overlayJSON2 } from './constants';

export const fetchKnownOverlays = async () => {
    const getData = async url => {
        try {
            const res = await fetch(url + '?ts=' + Math.random(), { signal: AbortSignal.timeout(1000) });
            zpoLog(`fetchKnownOverlays() ${url} status: ` + res.status);
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const text = await res.text();
            const data = processJsonResponse(text);
            if (!data) {
                zpoLog(`fetchKnownOverlays() ${url} data is false, not updating knownOverlays`);
                return data;
            }
            zpoLog(`fetchKnownOverlays() ${url} data is valid, updating knownOverlays`);
            return data;
        } catch (error) {
            zpoLog(`fetchKnownOverlays() ${url} Exception`);
            return false;
        }
    };

    try {
        const data = await getData(overlayJSON1);
        if (data) {
            return data;
        } else {
            //try backup
            return await getData(overlayJSON2);
        }
    } catch (error) {
        //try backup
        return await getData(overlayJSON2);
    }
};

function jsonSanityCheck(data) {
    zpoLog('jsonSanityCheck(data)');
    const checkedData = [];
    if (typeof data !== 'object') return false;

    const dataIds = Object.keys(data);
    dataIds.forEach(function (id) {
        const checkedId = idSanityCheck(id);
        if (checkedId === false) return;
        const item = data[id];
        checkedData.push({
            id: checkedId,
            community_name: item.community_name,
            community_twitch: urlSanityCheck(item.community_twitch),
            community_discord: urlSanityCheck(item.community_discord),
            thread_url: urlSanityCheck(item.thread_url),
            overlay_url: urlSanityCheck(item.overlay_url),
            overlay_colorblind_url: urlSanityCheck(item.overlay_colorblind_url),
            description: item.description,
        });
    });
    return checkedData;
}

function processJsonResponse(responseText) {
    zpoLog('processJsonResponse()');
    let data, checkedData;
    try {
        data = JSON.parse(responseText);
        checkedData = jsonSanityCheck(data);
    } catch (error) {
        zpoLog('processJsonResponse() Exception');
        console.error(error);
        return false;
    }
    if (!checkedData) {
        zpoLog('processJsonResponse() checkedData is false');
        return false;
    }

    return checkedData;
}

export const isNewerVersion = (remote, local) => {
    const parse = v => {
        const [main, pre] = v.split('-');
        return { nums: main.split('.').map(Number), pre };
    };
    const r = parse(remote);
    const l = parse(local);
    for (let i = 0; i < Math.max(r.nums.length, l.nums.length); i++) {
        const diff = (r.nums[i] || 0) - (l.nums[i] || 0);
        if (diff) return diff > 0;
    }

    if (r.pre && !l.pre) return false;
    if (!r.pre && l.pre) return true;
    if (r.pre && l.pre) return r.pre > l.pre;
    return false;
};

export const zpoLog = msg => {
    const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(ts + ' [zevent-place-overlay] ' + msg);
};

export const idSanityCheck = id => {
    if (typeof id !== 'string') return false;
    const trimmedId = id.replaceAll(/\s/g, '');
    if (!trimmedId.match(/^[A-Za-z0-9-]+$/)) {
        zpoLog('idSanityCheck(id) invalid : ' + id);
        return false;
    }
    return trimmedId;
};

/**
 * Place coordinate typed by the user.
 * @returns {number|null|false} the integer, null when the field is empty, false when invalid
 */
export const coordSanityCheck = value => {
    const trimmed = String(value ?? '').replaceAll(/\s/g, '');
    if (!trimmed) return null;
    const coord = Number(trimmed);
    if (!Number.isInteger(coord) || coord < 0) {
        zpoLog('coordSanityCheck(value) invalid : ' + value);
        return false;
    }
    return coord;
};

export const urlSanityCheck = url => {
    if (!url) return null;
    if (typeof url !== 'string') return '#nonstring';
    let trimmedURL = url.substring(0, 260).replaceAll(/\s/g, '');
    if (trimmedURL.includes('imgur.com') && !trimmedURL.includes('.png')) {
        const imgurId = trimmedURL.split('/').pop();
        trimmedURL = 'https://i.imgur.com/' + imgurId + '.png';
    }
    if (
        !trimmedURL.match(
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
        )
    ) {
        zpoLog('urlSanityCheck(url) invalid : ' + url);
        return '#invalid';
    }
    return trimmedURL;
};

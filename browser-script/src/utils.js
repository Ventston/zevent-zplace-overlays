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
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
        )
    ) {
        zpoLog('urlSanityCheck(url) invalid : ' + url);
        return '#invalid';
    }
    return trimmedURL;
};

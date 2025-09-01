import { zpoLog } from './utils.js';
import { version, versionJsonUrl } from './constants.js';

export const checkVersion = async () => {
    const versionState = (a, b) => {
        let x = a.split('.').map(e => parseInt(e));
        let y = b.split('.').map(e => parseInt(e));
        let z = '';

        for (let i = 0; i < x.length; i++) {
            if (x[i] === y[i]) z += 'e';
            else {
                if (x[i] > y[i]) z += 'm';
                else z += 'l';
            }
        }
        if (!z.match(/[l|m]/g)) return 0;
        else if (z.split('e').join('')[0] === 'm') return 1;
        return -1;
    };

    try {
        const response = await fetch(versionJsonUrl + '?t=' + Date.now());
        if (!response.ok) return zpoLog("Couldn't get version.json");
        const { version: newVersion } = await response.json();

        const needUpdate = versionState(newVersion, version) === 1;
        const newVersionElement = document.getElementById('newUpdate');
        if (!newVersionElement) return;
        if (needUpdate) {
            newVersionElement.innerHTML = 'Nouvelle version disponible !';
            newVersionElement.style.display = 'block';
        } else {
            newVersionElement.innerHTML = '';
            newVersionElement.style.display = 'none';
        }
    } catch (err) {
        zpoLog("Couldn't get version:", err);
    }
};

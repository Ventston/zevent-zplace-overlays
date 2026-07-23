import { isNewerVersion, zpoLog } from './utils.js';
import { scriptUpdateURL, version, versionJsonUrl } from './constants.js';
import { renderTemplate } from './ui.js';

export const checkVersion = async () => {
    try {
        const response = await fetch(versionJsonUrl + '?t=' + Date.now());
        if (!response.ok) return zpoLog("Couldn't get version.json");
        const { version: newVersion } = await response.json();

        const newVersionElement = document.getElementById('newUpdate');
        if (!newVersionElement) return;
        if (isNewerVersion(newVersion, version)) {
            newVersionElement.innerHTML = renderTemplate('update', { scriptUpdateURL });
            newVersionElement.style.display = 'block';
        } else {
            newVersionElement.innerHTML = '';
            newVersionElement.style.display = 'none';
        }
    } catch (err) {
        zpoLog("Couldn't get version: " + err);
    }
};

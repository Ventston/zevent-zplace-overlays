import { isNewerVersion, zpoLog } from './utils.js';
import { scriptUpdateURL, version, versionJsonUrl } from './constants.js';
import { renderTemplate, syncBannerHeight } from './ui.js';
import { gmFetchJson } from './http.js';

export const checkVersion = async () => {
    try {
        const response = await gmFetchJson(versionJsonUrl + '?t=' + Date.now(), { force: true });
        if (!response.ok) return zpoLog("Couldn't get version.json");
        const { version: newVersion } = await response.json();

        const newVersionElement = document.getElementById('newUpdate');
        if (!newVersionElement) return;
        if (isNewerVersion(newVersion, version)) {
            newVersionElement.innerHTML = renderTemplate('update', { scriptUpdateURL, newVersion });
            newVersionElement.style.display = 'block';
        } else {
            newVersionElement.innerHTML = '';
            newVersionElement.style.display = 'none';
        }
        syncBannerHeight();
    } catch (err) {
        zpoLog("Couldn't get version: " + err);
    }
};

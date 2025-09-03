//after npm version, update other files where the version is mentioned: version.json & src/meta.js
import fs from 'fs';
import path from 'path';

const versionUpdate = () => {
    const packageJsonPath = path.join('package.json');
    let packageVersion = '0.0.0';
    if (fs.existsSync(packageJsonPath)) {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
        try {
            const packageJson = JSON.parse(packageJsonContent);
            packageVersion = packageJson.version || '0.0.0';
        } catch (err) {
            console.error("Impossible de lire la version dans package.json, version 0.0.0 utilisée");
        }
    } else {
        console.error("package.json introuvable");
        return;
    }

    const versionJsonPath = path.join( 'version.json');
    let versionJson = { version: '0.0.0' };
    if (fs.existsSync(versionJsonPath)) {
        const versionJsonContent = fs.readFileSync(versionJsonPath, 'utf8');
        try {
            versionJson = JSON.parse(versionJsonContent);
        } catch (err) {
            console.error("Impossible de parser version.json, version 0.0.0 utilisée");
        }
    }
    if (versionJson.version !== packageVersion) {
        versionJson.version = packageVersion;
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 4));
        console.log(`version.json mis à jour à la version ${packageVersion}`);
    } else {
        console.log('version.json est déjà à jour');
    }

    const metaFilePath = 'src/meta.js';
    if (fs.existsSync(metaFilePath)) {
        let metaFile = fs.readFileSync(metaFilePath, 'utf8');
        const newMetaFile = metaFile.replace(/@version(\s+)[0-9]+\.[0-9]+\.[0-9]+/, `@version$1${packageVersion}`);
        if (metaFile !== newMetaFile) {
            fs.writeFileSync(metaFilePath, newMetaFile);
            console.log(`src/meta.js mis à jour à la version ${packageVersion}`);
        } else {
            console.log('src/meta.js est déjà à jour');
        }
    } else {
        console.error("src/meta.js introuvable");
    }
};

versionUpdate();

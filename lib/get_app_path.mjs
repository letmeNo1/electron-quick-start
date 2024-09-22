import fs from 'fs';
import path from 'path';

const startMenuPath = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs';

function getShortcuts(dir) {
    let results = [];
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getShortcuts(filePath));
        } else if (path.extname(file) === '.lnk') {
            results.push({ name: path.basename(file, '.lnk'), path: filePath });
        }
    });

    return results;
}

export function getAppPath() {
    const shortcuts = getShortcuts(startMenuPath);
    let app_path = [
        "ms-settings:bluetooth",
        "ms-settings:network",
        "ms-settings:privacy",
        "ms-settings:windowsupdate",
        "ms-settings:display",
        "ms-settings:notifications",
        "ms-settings:power",
        "ms-settings:storagesense",
        "ms-settings:appsfeatures",
        "ms-settings:time-language",
        "ms-settings:easeofaccess",
        "ms-settings:about"
    ] 
    shortcuts.forEach((shortcut, index) => {
        // console.log(shortcut.name);
        app_path.push(shortcut.path)
    });
    return app_path;    
}


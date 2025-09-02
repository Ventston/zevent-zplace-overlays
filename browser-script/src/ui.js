import panel from 'inline:./template/panel.html';
import knownOverlay from 'inline:./template/knownOverlay.html';
import wantedOverlay from 'inline:./template/wantedOverlay.html';
import threadLink from 'inline:./template/threadLink.html';
import overlayDescription from 'inline:./template/overlayDescription.html';
import update from 'inline:./template/update.html';
import { zpoLog } from './utils.js';

//make function to replace values in html
export const replaceValuesInHtml = (html, values) => {
    for (const key in values) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, values[key] || '');
    }

    // Handle conditional blocks - remove blocks where the condition variable is empty/undefined
    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, conditionKey, content) => {
        const conditionValue = values[conditionKey];
        return conditionValue && conditionValue !== '' && conditionValue !== null && conditionValue !== undefined
            ? content
            : '';
    });

    return html;
};

// Template variables - inline HTML templates
const templates = {
    'main-ui': panel,
    'wanted-overlay': wantedOverlay,
    'known-overlay': knownOverlay,
    'thread-link': threadLink,
    'overlay-description': overlayDescription,
    'update': update
};

// Function to render template with values (now synchronous)
export const renderTemplate = (templateName, values = {}) => {
    const template = templates[templateName];
    if (!template) {
        zpoLog(`Error - Template ${templateName} not found`);
        return '';
    }
    return replaceValuesInHtml(template, values);
};

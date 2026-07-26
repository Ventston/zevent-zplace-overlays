import { config } from './store.js';
import { idSanityCheck, urlSanityCheck, zpoLog } from './utils.js';
import { messagesJsonUrl } from './constants.js';
import { renderTemplate, syncBannerHeight } from './ui.js';

const LEVELS = ['info', 'warning', 'critical'];
const MAX_CONTENT = 500;

const timestamp = value => {
    if (typeof value !== 'string') return null;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
};

/**
 * Maps the server public format (PublicMessage array) to the internal format.
 * Pure, tested in test/messages.test.js.
 * @returns {Message[]|false}
 */
export const mapPublicMessages = data => {
    if (!Array.isArray(data)) return false;
    const mapped = [];
    for (const item of data) {
        const id = idSanityCheck(item.id);
        if (id === false) continue;
        if (typeof item.content !== 'string' || !item.content.trim()) continue;
        const url = urlSanityCheck(item.linkUrl);
        const label = typeof item.linkLabel === 'string' ? item.linkLabel.trim() : '';
        const withLink = url !== null && !url.startsWith('#') && label !== '';
        mapped.push({
            id,
            key: id + ':' + (typeof item.updatedAt === 'string' ? item.updatedAt : ''),
            level: LEVELS.includes(item.level) ? item.level : 'info',
            content: item.content.trim().slice(0, MAX_CONTENT),
            link_url: withLink ? url : null,
            link_label: withLink ? label : null,
            dismissible: item.dismissible !== false,
            starts_at: timestamp(item.startsAt),
            ends_at: timestamp(item.endsAt),
        });
    }
    return mapped;
};

/**
 * Messages to display right now: inside their publication window and not dismissed.
 * Pure, tested in test/messages.test.js.
 * @param {Message[]} messages
 * @param {number} now - epoch ms
 * @param {string[]} dismissed - already dismissed keys
 * @returns {Message[]}
 */
export const visibleMessages = (messages, now, dismissed) =>
    messages.filter(
        m =>
            (m.starts_at === null || m.starts_at <= now) &&
            (m.ends_at === null || m.ends_at > now) &&
            !(m.dismissible && dismissed.includes(m.key))
    );

export const fetchMessages = async () => {
    try {
        const res = await fetch(messagesJsonUrl, { signal: AbortSignal.timeout(5000) });
        zpoLog('fetchMessages() status: ' + res.status);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = mapPublicMessages(await res.json());
        if (!data) zpoLog('fetchMessages() invalid data, knownMessages unchanged');
        return data;
    } catch (error) {
        zpoLog('fetchMessages() Exception: ' + error);
        return false;
    }
};

export const renderMessages = () => {
    const container = document.querySelector('#zpo-messages');
    if (!container) return;
    const visible = visibleMessages(config.knownMessages, Date.now(), config.dismissedMessages);
    zpoLog('renderMessages() ' + visible.length + '/' + config.knownMessages.length + ' message(s)');

    container.innerHTML = visible
        .map(m =>
            renderTemplate('message', {
                key: m.key,
                level: m.level,
                content: m.content,
                linkUrl: m.link_url,
                linkLabel: m.link_label,
                dismissible: m.dismissible ? 'yes' : '',
            })
        )
        .join('');

    container.querySelectorAll('[data-zpo-dismiss]').forEach(btn => {
        btn.onclick = () => dismissMessage(btn.dataset.zpoDismiss);
    });
    syncBannerHeight();
};

const dismissMessage = key => {
    zpoLog('dismissMessage() ' + key);
    if (!config.dismissedMessages.includes(key)) {
        config.dismissedMessages = [...config.dismissedMessages, key];
    }
    renderMessages();
};

export const refreshMessages = async () => {
    const messages = await fetchMessages();
    if (messages) {
        config.knownMessages = messages;
        const keys = messages.map(m => m.key);
        const kept = config.dismissedMessages.filter(k => keys.includes(k));
        if (kept.length !== config.dismissedMessages.length) {
            config.dismissedMessages = kept;
        }
    }
    renderMessages();
};

import { describe, expect, it, vi } from 'vitest';

globalThis.GM_info = { script: { version: '4.2.0', updateURL: 'https://example.test/u.js' } };

const attributes = {};
vi.stubGlobal('document', {
    documentElement: {
        setAttribute: (name, value) => {
            attributes[name] = value;
        },
    },
});

const { announcePresence } = await import('../src/presence.js');
const { presenceAttribute } = await import('../src/constants.js');

describe('announcePresence', () => {
    it('exposes the script version on <html> for the site share page', () => {
        announcePresence();
        expect(attributes).toEqual({ [presenceAttribute]: '4.2.0' });
        expect(presenceAttribute).toBe('data-zpo-version');
    });
});

import { describe, expect, it } from 'vitest';

// constants.js reads GM_info on import, store.js reads GM_getValue: stub both before the dynamic import
globalThis.GM_info = { script: { version: '0.0.0', updateURL: 'https://example.test/u.js' } };
globalThis.GM_getValue = (_key, fallback) => fallback;
globalThis.GM_setValue = () => {};
const { mapPublicMessages, visibleMessages } = await import('../src/messages.js');
const { renderTemplate } = await import('../src/ui.js');

const valid = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    level: 'warning',
    content: 'Maintenance à 21h',
    linkLabel: 'Détails',
    linkUrl: 'https://discord.gg/abc',
    dismissible: true,
    startsAt: '2026-07-26T18:00:00.000Z',
    endsAt: '2026-07-26T22:00:00.000Z',
    updatedAt: '2026-07-26T12:00:00.000Z',
};

describe('mapPublicMessages', () => {
    it('mappe le format public vers le format interne', () => {
        const [m] = mapPublicMessages([valid]);
        expect(m).toEqual({
            id: valid.id,
            key: valid.id + ':' + valid.updatedAt,
            level: 'warning',
            content: 'Maintenance à 21h',
            link_url: 'https://discord.gg/abc',
            link_label: 'Détails',
            dismissible: true,
            starts_at: Date.parse(valid.startsAt),
            ends_at: Date.parse(valid.endsAt),
        });
    });

    it('accepte un message sans fenêtre ni lien', () => {
        const [m] = mapPublicMessages([{ ...valid, linkLabel: null, linkUrl: null, startsAt: null, endsAt: null }]);
        expect(m).toMatchObject({ link_url: null, link_label: null, starts_at: null, ends_at: null });
    });

    it('refuse un corps non-tableau', () => {
        expect(mapPublicMessages({ foo: {} })).toBe(false);
    });

    it('ignore les entrées invalides (id, contenu)', () => {
        const bad = [
            { ...valid, id: 'pas/bon' },
            { ...valid, id: 42 },
            { ...valid, content: '   ' },
            { ...valid, content: null },
        ];
        expect(mapPublicMessages(bad)).toEqual([]);
    });

    it('retombe sur info pour un niveau inconnu', () => {
        expect(mapPublicMessages([{ ...valid, level: 'panic' }])[0].level).toBe('info');
    });

    it.each([
        ['javascript:alert(1)', 'URL javascript:'],
        ['pas-une-url', 'URL non parsable'],
        [42, 'URL non-string'],
    ])('neutralise le lien : %s', url => {
        const [m] = mapPublicMessages([{ ...valid, linkUrl: url }]);
        expect(m.link_url).toBeNull();
        expect(m.link_label).toBeNull();
    });

    it('neutralise un lien sans libellé', () => {
        const [m] = mapPublicMessages([{ ...valid, linkLabel: '  ' }]);
        expect(m.link_url).toBeNull();
    });

    it('tronque un contenu trop long et ignore une date invalide', () => {
        const [m] = mapPublicMessages([{ ...valid, content: 'x'.repeat(600), startsAt: 'demain', endsAt: 12 }]);
        expect(m.content).toHaveLength(500);
        expect(m.starts_at).toBeNull();
        expect(m.ends_at).toBeNull();
    });
});

describe('visibleMessages', () => {
    const now = Date.parse('2026-07-26T20:00:00.000Z');
    const msg = (over = {}) => ({
        id: 'a',
        key: 'a:1',
        level: 'info',
        content: 'x',
        link_url: null,
        link_label: null,
        dismissible: true,
        starts_at: null,
        ends_at: null,
        ...over,
    });

    it('affiche un message sans fenêtre et non masqué', () => {
        expect(visibleMessages([msg()], now, [])).toHaveLength(1);
    });

    it('cache un message pas encore commencé ou déjà terminé', () => {
        const scheduled = msg({ key: 'b:1', starts_at: now + 1000 });
        const expired = msg({ key: 'c:1', ends_at: now });
        expect(visibleMessages([scheduled, expired], now, [])).toEqual([]);
    });

    it('affiche un message dans sa fenêtre', () => {
        const current = msg({ starts_at: now - 1000, ends_at: now + 1000 });
        expect(visibleMessages([current], now, [])).toHaveLength(1);
    });

    it('cache un message masqué par sa clé', () => {
        expect(visibleMessages([msg()], now, ['a:1'])).toEqual([]);
    });

    it('garde un message non masquable même si la clé est mémorisée', () => {
        expect(visibleMessages([msg({ dismissible: false })], now, ['a:1'])).toHaveLength(1);
    });

    it("réaffiche un message réécrit : la clé mémorisée porte l'ancienne date", () => {
        expect(visibleMessages([msg({ key: 'a:2' })], now, ['a:1'])).toHaveLength(1);
    });
});

describe('template message', () => {
    const render = (values = {}) =>
        renderTemplate('message', {
            key: 'a:1',
            level: 'info',
            content: 'Coucou',
            linkUrl: null,
            linkLabel: null,
            dismissible: 'yes',
            ...values,
        });

    it('échappe le contenu et le libellé venus du serveur', () => {
        const html = render({
            content: '<img src=x onerror=alert(1)>',
            linkUrl: 'https://example.com',
            linkLabel: '"><script>alert(1)</script>',
        });
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;img src=x');
    });

    it("omet le lien quand il n'y en a pas", () => {
        expect(render()).not.toContain('zpo-message-link');
        expect(render({ linkUrl: 'https://example.com', linkLabel: 'Détails' })).toContain('zpo-message-link');
    });

    it('omet le bouton de fermeture pour un message non masquable', () => {
        expect(render({ dismissible: '' })).not.toContain('data-zpo-dismiss');
        expect(render()).toContain('data-zpo-dismiss="a:1"');
    });
});

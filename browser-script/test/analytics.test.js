import { beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.GM_info = { script: { version: '4.0.0', updateURL: 'https://example.test/u.js' } };
const gmStore = {};
globalThis.GM_getValue = (key, fallback) => (key in gmStore ? gmStore[key] : fallback);
globalThis.GM_setValue = (key, value) => {
    gmStore[key] = value;
};

const gmRequestMock = vi.fn(() => undefined);
vi.stubGlobal('GM_xmlhttpRequest', gmRequestMock);
vi.stubGlobal('location', { hostname: 'place.zevent.fr' });
vi.stubGlobal('screen', { width: 1920, height: 1080 });
vi.stubGlobal('navigator', { language: 'fr-FR' });

const { buildPayload, overlayProps, trackDailyOverlays } = await import('../src/analytics.js');
const { analyticsWebsiteId } = await import('../src/constants.js');
const { config } = await import('../src/store.js');

const sentEvents = () => gmRequestMock.mock.calls.map(([options]) => JSON.parse(options.data).payload);

describe('buildPayload', () => {
    it('sans nom, produit un pageview portant la version dans l’URL', () => {
        expect(buildPayload()).toEqual({
            type: 'event',
            payload: {
                website: analyticsWebsiteId,
                hostname: 'place.zevent.fr',
                url: '/4.0.0',
                screen: '1920x1080',
                language: 'fr-FR',
            },
        });
    });

    it('omet name et data quand ils ne sont pas fournis', () => {
        const { payload } = buildPayload();
        expect('name' in payload).toBe(false);
        expect('data' in payload).toBe(false);
    });

    it('avec un nom, produit un event custom avec ses propriétés', () => {
        const { payload } = buildPayload('overlay-add', { overlay: 'ma-commu' });
        expect(payload.name).toBe('overlay-add');
        expect(payload.data).toEqual({ overlay: 'ma-commu' });
    });
});

describe('overlayProps', () => {
    it('envoie le nom lisible et conserve l’id stable', () => {
        expect(overlayProps({ id: 'uuid-1', community_name: 'Commu A' })).toEqual({
            overlay: 'Commu A',
            id: 'uuid-1',
        });
    });

    it('regroupe les overlays custom, dont les ids et noms sont uniques', () => {
        expect(overlayProps({ id: 'custom-mfa2b', community_name: 'Custom mfa2b' })).toEqual({ overlay: 'custom' });
    });

    it('retombe sur l’id quand le nom manque', () => {
        expect(overlayProps({ id: 'uuid-1', community_name: '' }).overlay).toBe('uuid-1');
    });
});

describe('trackDailyOverlays', () => {
    beforeEach(() => {
        delete gmStore.analyticsLastDaily;
        gmRequestMock.mockClear();
        config.wantedOverlays = [
            { id: 'uuid-1', community_name: 'Commu A' },
            { id: 'uuid-2', community_name: 'Commu B' },
        ];
    });

    it('émet un event overlay-active par overlay actif', () => {
        trackDailyOverlays();
        expect(sentEvents().map(p => p.name)).toEqual(['overlay-active', 'overlay-active']);
        expect(sentEvents().map(p => p.data.overlay)).toEqual(['Commu A', 'Commu B']);
    });

    it('ne réémet rien le même jour, pour que les rechargements ne gonflent pas le classement', () => {
        trackDailyOverlays();
        trackDailyOverlays();
        expect(gmRequestMock).toHaveBeenCalledTimes(2);
    });

    it('réémet le lendemain', () => {
        trackDailyOverlays();
        gmStore.analyticsLastDaily = '2020-01-01';
        trackDailyOverlays();
        expect(gmRequestMock).toHaveBeenCalledTimes(4);
    });

    it('ne consomme pas la garde quotidienne quand l’utilisateur a refusé le suivi', () => {
        config.enableAnalytics = false;
        trackDailyOverlays();
        config.enableAnalytics = true;

        expect(gmRequestMock).not.toHaveBeenCalled();
        trackDailyOverlays();
        expect(gmRequestMock).toHaveBeenCalledTimes(2);
    });
});

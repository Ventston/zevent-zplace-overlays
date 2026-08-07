import { describe, expect, it } from 'vitest';

// constants.js lit GM_info à l'import : stub avant l'import dynamique
globalThis.GM_info = { script: { version: '0.0.0', updateURL: 'https://example.test/u.js' } };
const { mapPublicOverlays } = await import('../src/data-fetch.js');
const { serverBase } = await import('../src/constants.js');

const valid = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    name: 'Ma commu',
    description: 'desc',
    x: 100,
    y: 250,
    width: 40,
    height: 30,
    imageUrl: '/overlays/123e4567-e89b-42d3-a456-426614174000.png',
    colorblindImageUrl: '/overlays/123e4567-e89b-42d3-a456-426614174000-cb.png',
    twitchUrl: 'https://twitch.tv/foo',
    discordUrl: null,
    threadUrl: null,
    updatedAt: '2026-07-08T00:00:00.000Z',
};

describe('mapPublicOverlays', () => {
    it('mappe le format public vers le format interne avec URLs absolues', () => {
        const [o] = mapPublicOverlays([valid]);
        expect(o).toEqual({
            id: valid.id,
            community_name: 'Ma commu',
            description: 'desc',
            community_twitch: 'https://twitch.tv/foo',
            community_discord: null,
            thread_url: null,
            overlay_url: serverBase + valid.imageUrl,
            overlay_colorblind_url: serverBase + valid.colorblindImageUrl,
            x: 100,
            y: 250,
            width: 40,
            height: 30,
            linked_ids: [],
            is_default: false,
            updated_at: valid.updatedAt,
        });
    });

    it('mappe les liaisons et le drapeau « par défaut »', () => {
        const other = '223e4567-e89b-42d3-a456-426614174111';
        const [o] = mapPublicOverlays([{ ...valid, linkedIds: [other], isDefault: true }]);
        expect(o.linked_ids).toEqual([other]);
        expect(o.is_default).toBe(true);
    });

    it('écarte les identifiants de liaison invalides, tolère un champ absent', () => {
        const [o] = mapPublicOverlays([{ ...valid, linkedIds: ['pas/bon', 42] }]);
        expect(o.linked_ids).toEqual([]);
        const [legacy] = mapPublicOverlays([{ ...valid, linkedIds: undefined, isDefault: undefined }]);
        expect(legacy.linked_ids).toEqual([]);
        expect(legacy.is_default).toBe(false);
    });

    it('garde null pour colorblindImageUrl absent', () => {
        const [o] = mapPublicOverlays([{ ...valid, colorblindImageUrl: null }]);
        expect(o.overlay_colorblind_url).toBeNull();
    });

    it('refuse un corps non-tableau', () => {
        expect(mapPublicOverlays({ foo: {} })).toBe(false);
    });

    it('ignore les entrées invalides (id, dimensions, imageUrl)', () => {
        const bad = [
            { ...valid, id: 'péas/bon' },
            { ...valid, width: 0 },
            { ...valid, height: -3 },
            { ...valid, x: 1.5 },
            { ...valid, imageUrl: 42 },
        ];
        expect(mapPublicOverlays(bad)).toEqual([]);
    });

    it('force description en string', () => {
        const [o] = mapPublicOverlays([{ ...valid, description: null }]);
        expect(o.description).toBe('');
    });
});

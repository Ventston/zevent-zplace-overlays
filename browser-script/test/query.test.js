import { describe, expect, it } from 'vitest';
import { overlayKeysFromQuery, searchWithoutOverlays } from '../src/query.js';

describe('overlayKeysFromQuery', () => {
    it('lit une clé unique (slug ou id)', () => {
        expect(overlayKeysFromQuery('?overlay=les-lezarts')).toEqual(['les-lezarts']);
    });

    it('accepte le param répété et les listes séparées par des virgules', () => {
        expect(overlayKeysFromQuery('?overlay=a&overlay=b')).toEqual(['a', 'b']);
        expect(overlayKeysFromQuery('?overlay=a,b')).toEqual(['a', 'b']);
        expect(overlayKeysFromQuery('?overlay=a, b&overlay=c')).toEqual(['a', 'b', 'c']);
    });

    it('dédoublonne', () => {
        expect(overlayKeysFromQuery('?overlay=a&overlay=a,a')).toEqual(['a']);
    });

    it('ignore les clés invalides et les valeurs vides', () => {
        expect(overlayKeysFromQuery('?overlay=')).toEqual([]);
        expect(overlayKeysFromQuery('?overlay=a,,b')).toEqual(['a', 'b']);
        expect(overlayKeysFromQuery('?overlay=<script>')).toEqual([]);
        expect(overlayKeysFromQuery('?overlay=ok&overlay=pas%20ok!')).toEqual(['ok']);
    });

    it('ignore les autres params', () => {
        expect(overlayKeysFromQuery('')).toEqual([]);
        expect(overlayKeysFromQuery('?x=1&y=2')).toEqual([]);
        expect(overlayKeysFromQuery('?x=1&overlay=test')).toEqual(['test']);
    });
});

describe('searchWithoutOverlays', () => {
    it('retire le param overlay', () => {
        expect(searchWithoutOverlays('?overlay=test')).toBe('');
        expect(searchWithoutOverlays('?overlay=a&overlay=b')).toBe('');
    });

    it('conserve les autres params', () => {
        expect(searchWithoutOverlays('?x=1&overlay=test&y=2')).toBe('?x=1&y=2');
    });

    it('laisse une query sans overlay intacte', () => {
        expect(searchWithoutOverlays('')).toBe('');
        expect(searchWithoutOverlays('?x=1')).toBe('?x=1');
    });
});

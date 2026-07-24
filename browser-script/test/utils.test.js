import { describe, expect, it } from 'vitest';
import { coordSanityCheck, isNewerVersion } from '../src/utils.js';

describe('isNewerVersion', () => {
    it('détecte une version plus récente', () => {
        expect(isNewerVersion('4.0.1', '4.0.0')).toBe(true);
        expect(isNewerVersion('4.1.0', '4.0.9')).toBe(true);
        expect(isNewerVersion('5.0.0', '4.9.9')).toBe(true);
        expect(isNewerVersion('4.0.0.1', '4.0.0')).toBe(true);
    });

    it('retourne false pour une version égale ou plus ancienne', () => {
        expect(isNewerVersion('4.0.0', '4.0.0')).toBe(false);
        expect(isNewerVersion('3.9.9', '4.0.0')).toBe(false);
        expect(isNewerVersion('4.0.0', '4.0.0.1')).toBe(false);
    });
});

describe('coordSanityCheck', () => {
    it('accepte un entier positif', () => {
        expect(coordSanityCheck('0')).toBe(0);
        expect(coordSanityCheck('250')).toBe(250);
        expect(coordSanityCheck(' 42 ')).toBe(42);
    });

    it('retourne null pour un champ vide', () => {
        expect(coordSanityCheck('')).toBeNull();
        expect(coordSanityCheck('   ')).toBeNull();
        expect(coordSanityCheck(undefined)).toBeNull();
    });

    it('retourne false pour une saisie invalide', () => {
        expect(coordSanityCheck('-1')).toBe(false);
        expect(coordSanityCheck('12.5')).toBe(false);
        expect(coordSanityCheck('abc')).toBe(false);
    });
});

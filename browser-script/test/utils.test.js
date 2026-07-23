import { describe, expect, it } from 'vitest';
import { isNewerVersion } from '../src/utils.js';

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

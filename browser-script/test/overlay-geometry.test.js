import { describe, expect, it } from 'vitest';
import { overlayGeometry } from '../src/geometry.js';

describe('overlayGeometry', () => {
    it('retourne la géométrie CSS pour un overlay serveur', () => {
        expect(overlayGeometry({ x: 100, y: 250, width: 40, height: 30 })).toEqual({
            left: '100px',
            top: '250px',
            width: 40,
            height: 30,
        });
    });

    it('retourne la position seule pour un overlay custom sans dimensions', () => {
        expect(overlayGeometry({ id: 'custom-0', x: 12, y: 34 })).toEqual({
            left: '12px',
            top: '34px',
            width: null,
            height: null,
        });
        expect(overlayGeometry({ x: 1, y: 2, width: 0, height: 5 })).toEqual({
            left: '1px',
            top: '2px',
            width: null,
            height: null,
        });
    });

    it('retourne null pour un overlay sans position', () => {
        expect(overlayGeometry({ id: 'custom-0', overlay_url: 'https://x.test/a.png' })).toBeNull();
        expect(overlayGeometry({ x: 10, width: 4, height: 4 })).toBeNull();
    });
});

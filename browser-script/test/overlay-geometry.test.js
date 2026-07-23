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

    it('retourne null pour un overlay custom sans dimensions', () => {
        expect(overlayGeometry({ id: 'custom-0', overlay_url: 'https://x.test/a.png' })).toBeNull();
        expect(overlayGeometry({ x: 1, y: 2, width: 0, height: 5 })).toBeNull();
    });
});

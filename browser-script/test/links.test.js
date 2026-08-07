import { describe, expect, it } from 'vitest';
import { defaultsToAdd, groupToRemove, isRemovable, linkedNames, linkedToAdd, newlyLinkedToAdd } from '../src/links.js';

const overlay = (id, props = {}) => ({ id, community_name: id.toUpperCase(), linked_ids: [], ...props });

describe('linkedToAdd', () => {
    it('ajoute les overlays liés encore absents', () => {
        const a = overlay('a', { linked_ids: ['b', 'c'] });
        const known = [a, overlay('b'), overlay('c')];
        expect(linkedToAdd(a, known, [a]).map(o => o.id)).toEqual(['b', 'c']);
    });

    it('ignore ceux déjà activés', () => {
        const a = overlay('a', { linked_ids: ['b', 'c'] });
        const known = [a, overlay('b'), overlay('c')];
        expect(linkedToAdd(a, known, [a, overlay('b')]).map(o => o.id)).toEqual(['c']);
    });

    it('ignore un id inconnu du serveur et l’auto-référence', () => {
        const a = overlay('a', { linked_ids: ['disparu', 'a'] });
        expect(linkedToAdd(a, [a], [a])).toEqual([]);
    });

    it('active le groupe entier tel que le serveur l’a résolu', () => {
        // a—b et b—c : le serveur publie le groupe complet des deux côtés
        const a = overlay('a', { linked_ids: ['b', 'c'] });
        const known = [a, overlay('b', { linked_ids: ['a', 'c'] }), overlay('c', { linked_ids: ['a', 'b'] })];
        expect(linkedToAdd(a, known, [a]).map(o => o.id)).toEqual(['b', 'c']);
    });

    it('tolère un overlay sans liaisons (script à jour, données anciennes)', () => {
        const a = overlay('a');
        delete a.linked_ids;
        expect(linkedToAdd(a, [a], [a])).toEqual([]);
    });
});

describe('newlyLinkedToAdd', () => {
    it('active un overlay lié à un overlay déjà actif depuis la dernière synchro', () => {
        const wanted = [overlay('a')];
        const known = [overlay('a', { linked_ids: ['b'] }), overlay('b')];
        expect(newlyLinkedToAdd(known, wanted).map(o => o.id)).toEqual(['b']);
    });

    it('ne réactive pas une liaison déjà connue, donc écartée par l’utilisateur', () => {
        const wanted = [overlay('a', { linked_ids: ['b'] })];
        const known = [overlay('a', { linked_ids: ['b'] }), overlay('b')];
        expect(newlyLinkedToAdd(known, wanted)).toEqual([]);
    });

    it('ignore une liaison vers un overlay déjà activé', () => {
        const wanted = [overlay('a'), overlay('b')];
        const known = [overlay('a', { linked_ids: ['b'] }), overlay('b')];
        expect(newlyLinkedToAdd(known, wanted)).toEqual([]);
    });

    it('fait entrer tout le groupe quand un overlay actif le rejoint', () => {
        const wanted = [overlay('a')];
        const known = [
            overlay('a', { linked_ids: ['b', 'c'] }),
            overlay('b', { linked_ids: ['a', 'c'] }),
            overlay('c', { linked_ids: ['a', 'b'] }),
        ];
        expect(newlyLinkedToAdd(known, wanted).map(o => o.id)).toEqual(['b', 'c']);
    });

    it('ne remonte pas deux fois le même overlay lié à deux overlays actifs', () => {
        const wanted = [overlay('a'), overlay('b')];
        const known = [
            overlay('a', { linked_ids: ['c'] }),
            overlay('b', { linked_ids: ['c'] }),
            overlay('c', { linked_ids: ['a', 'b'] }),
        ];
        expect(newlyLinkedToAdd(known, wanted).map(o => o.id)).toEqual(['c']);
    });

    it('laisse tranquilles les overlays custom et ceux disparus du serveur', () => {
        const wanted = [{ id: 'custom-1', community_name: 'Custom' }, overlay('supprimé')];
        expect(newlyLinkedToAdd([overlay('a', { linked_ids: ['b'] })], wanted)).toEqual([]);
    });
});

describe('defaultsToAdd', () => {
    const known = [overlay('a', { is_default: true }), overlay('b')];

    it('ajoute les overlays marqués par défaut', () => {
        expect(defaultsToAdd(known, []).map(o => o.id)).toEqual(['a']);
    });

    it('n’ajoute pas deux fois un overlay déjà activé', () => {
        expect(defaultsToAdd(known, [overlay('a', { is_default: true })])).toEqual([]);
    });
});

describe('isRemovable', () => {
    it('retient un overlay par défaut', () => {
        expect(isRemovable(overlay('a', { is_default: true }))).toBe(false);
    });

    it('retient tout le groupe d’un overlay par défaut', () => {
        const known = [overlay('a', { linked_ids: ['d'] }), overlay('d', { is_default: true, linked_ids: ['a'] })];
        expect(isRemovable(known[0], known)).toBe(false);
    });

    it('laisse retirer un groupe ordinaire', () => {
        const known = [overlay('a', { linked_ids: ['b'] }), overlay('b', { linked_ids: ['a'] })];
        expect(isRemovable(known[0], known)).toBe(true);
    });

    it('laisse retirer un overlay ordinaire ou custom', () => {
        expect(isRemovable(overlay('a'))).toBe(true);
        expect(isRemovable({ id: 'custom-1' })).toBe(true);
    });

    it('ne bloque pas un overlay déjà absent de la liste', () => {
        expect(isRemovable(undefined)).toBe(true);
    });
});

describe('groupToRemove', () => {
    it('emporte les membres du groupe qui sont activés', () => {
        const a = overlay('a', { linked_ids: ['b', 'c'] });
        const wanted = [a, overlay('b'), overlay('autre')];
        expect(groupToRemove(a, wanted).map(o => o.id)).toEqual(['a', 'b']);
    });

    it('se limite à lui-même sans liaison', () => {
        const a = overlay('a');
        expect(groupToRemove(a, [a, overlay('b')]).map(o => o.id)).toEqual(['a']);
    });
});

describe('linkedNames', () => {
    it('nomme les overlays activés auxquels celui-ci est lié', () => {
        const a = overlay('a', { linked_ids: ['b', 'c'] });
        expect(linkedNames(a, [a, overlay('b')])).toEqual(['B']);
    });

    it('ne nomme rien quand aucun overlay lié n’est activé', () => {
        expect(linkedNames(overlay('a', { linked_ids: ['b'] }), [])).toEqual([]);
    });
});

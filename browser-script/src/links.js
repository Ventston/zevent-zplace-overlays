const isWanted = (wanted, id) => wanted.some(o => o.id === id);

export const linkedToAdd = (overlay, known, wanted) =>
    (overlay.linked_ids ?? [])
        .filter(id => id !== overlay.id && !isWanted(wanted, id))
        .map(id => known.find(o => o.id === id))
        .filter(Boolean);

export const newlyLinkedToAdd = (known, wanted) => {
    const toAdd = [];
    for (const active of wanted) {
        const fresh = known.find(o => o.id === active.id);
        if (!fresh) continue;
        const before = active.linked_ids ?? [];
        for (const id of fresh.linked_ids ?? []) {
            if (before.includes(id) || isWanted(wanted, id) || isWanted(toAdd, id)) continue;
            const overlay = known.find(o => o.id === id);
            if (overlay) toAdd.push(overlay);
        }
    }
    return toAdd;
};

export const defaultsToAdd = (known, wanted) => known.filter(o => o.is_default && !isWanted(wanted, o.id));

export const isRemovable = (overlay, known = []) => {
    if (!overlay) return true;
    if (overlay.is_default) return false;
    return !(overlay.linked_ids ?? []).some(id => known.find(o => o.id === id)?.is_default);
};

export const groupToRemove = (overlay, wanted) =>
    wanted.filter(o => o.id === overlay?.id || (overlay?.linked_ids ?? []).includes(o.id));

export const linkedNames = (overlay, wanted) =>
    (overlay.linked_ids ?? [])
        .map(id => wanted.find(o => o.id === id))
        .filter(Boolean)
        .map(o => o.community_name);

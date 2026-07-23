/**
 * CSS geometry of a server overlay (absolute place coordinates).
 * @returns {{left: string, top: string, width: number, height: number}|null}
 *          null for a custom overlay without dimensions → fitOverlayOnCanvas.
 */
export const overlayGeometry = overlay => {
    const { x, y, width, height } = overlay;
    if (![x, y, width, height].every(Number.isInteger)) return null;
    if (width <= 0 || height <= 0) return null;
    return { left: x + 'px', top: y + 'px', width, height };
};

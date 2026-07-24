/**
 * CSS geometry of an overlay (absolute place coordinates).
 * @returns {{left: string, top: string, width: number|null, height: number|null}|null}
 *          null for an overlay without position → placed at 0,0.
 *          width/height are null when only the position is known (custom overlay):
 *          the size then comes from the image itself → fitOverlayOnCanvas.
 */
export const overlayGeometry = overlay => {
    const { x, y, width, height } = overlay;
    if (![x, y].every(Number.isInteger)) return null;
    const sized = [width, height].every(Number.isInteger) && width > 0 && height > 0;
    return { left: x + 'px', top: y + 'px', width: sized ? width : null, height: sized ? height : null };
};

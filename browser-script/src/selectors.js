export const getOriginalCanvas = () => {
    return document.querySelector('#place-canvas');
};

export const getOverlayParent = () => {
    const canvas = getOriginalCanvas();
    return canvas.parentElement;
};

export const getPanelParent = () => {
    return document.querySelector('#root');
};

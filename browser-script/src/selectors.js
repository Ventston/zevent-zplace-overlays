export const getOriginalCanvas = () => {
    return document.querySelector('#place-canvas');
};

export const getOverlayParent = () => {
    return getOriginalCanvas()?.parentElement ?? null;
};

export const getPanelParent = () => {
    return document.querySelector('#root');
};

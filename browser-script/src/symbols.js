import { zpoLog } from './utils.js';
import { config } from './store.js';
import { symbolsUrl } from './constants.js';

let SYMBOL_H = 5;
let SYMBOL_W = 5;
let colors = [];

let symbols = new Uint32Array([]);
let paletteObserver = null;

const getSymbols = async () => {
    //symbolsUrl
    try {
        const response = await fetch(symbolsUrl);
        if (!response.ok) return zpoLog("Couldn't get symbols" + response.statusText);
        const data = await response.json();
        const loadedSymbols = data.symbols;
        zpoLog('getSymbols() loadedSymbols: ' + Object.keys(loadedSymbols).length);
        symbols = new Uint32Array(loadedSymbols);
        const { height, width } = data;
        if (height) SYMBOL_H = height;
        if (width) SYMBOL_W = width;
    } catch (error) {
        zpoLog("Couldn't get symbols: " + error);
        symbols = new Uint32Array([
            0x04abaa4, 0x0489224, 0x0e8922e, 0x0a8d6aa, 0x0e8feae, 0x1fabb75, 0x0efffee, 0x0eeeeee, 0x1fafebf,
            0x1fd82bf, 0x1f212bf, 0x0eddeea, 0x0afbbea, 0x094ee52, 0x0eafa88, 0x0477fea, 0x0edd76e, 0x1bda95c,
            0x0367cd8, 0x0e8d62e, 0x1bdef7f, 0x146f46f, 0x1577dd5, 0x0e756b5, 0x04739c4, 0x0add5c4, 0x0ad936a,
            0x067f308, 0x04fbbee, 0x1bd837b, 0x11701d1, 0x1e601e6, 0x1260126, 0x0f7bf14, 0x1fee34c, 0x15a82b5,
            0x0db01b6, 0x077bd9e, 0x074c65c, 0x15756ae, 0x1b23ab5, 0x08c1062, 0x1cf18e3, 0x0477dd5, 0x11729d1,
            0x1999a79, 0x1759577, 0x04f837b, 0x0e247ff, 0x1123891, 0x1b8923b, 0x0476dc4, 0x1466cc5, 0x071d71c,
            0x15f29f5, 0x1baa94e, 0x11f9231, 0x14d0754, 0x1bac6bb, 0x0427c84, 0x15fd48e, 0x19a28b3, 0x04ffdc4,
            0x0e8814a,
        ]);
        zpoLog('getSymbols() using fallback symbols');
    }
};

const createCanvasForSymbol = (symbolValue, size) => {
    //create canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');

    // Clear with transparency
    ctx.clearRect(0, 0, size, size);

    const scale = Math.floor(size / SYMBOL_W);
    const offsetX = Math.floor((size - SYMBOL_W * scale) / 2);
    const offsetY = Math.floor((size - SYMBOL_H * scale) / 2);

    // Draw white outline first (slightly larger)
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < SYMBOL_H; y++) {
        for (let x = 0; x < SYMBOL_W; x++) {
            const bitIndex = y * SYMBOL_W + x;
            const bit = (symbolValue >>> bitIndex) & 1;

            if (bit) {
                ctx.fillRect(offsetX + x * scale - 1, offsetY + y * scale - 1, scale + 2, scale + 2);
            }
        }
    }

    // Draw black symbol on top
    ctx.fillStyle = '#000000';
    for (let y = 0; y < SYMBOL_H; y++) {
        for (let x = 0; x < SYMBOL_W; x++) {
            const bitIndex = y * SYMBOL_W + x;
            const bit = (symbolValue >>> bitIndex) & 1;

            if (bit) {
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    }
    return canvas;
};

const injectSymbols = () => {
    //palette className: color-picker
    const palette = document.querySelector('.color-picker');
    if (!palette) return zpoLog('injectSymbols() palette not found');
    //for each color class
    const colors = palette.querySelectorAll('.color');
    if (!colors) return zpoLog('injectSymbols() colors not found');
    colors.forEach((colorDiv, index) => {
        //remove previous symbol if any
        const prevSymbol = colorDiv.querySelector('.zevent-place-overlay-symbol');
        if (prevSymbol) prevSymbol.remove();
        //add symbol if any
        //color value is in child span data-color attribute
        const span = colorDiv.querySelector('span');
        const colorValue = parseInt(span.getAttribute('data-color'));
        const symbolValue = symbols[colorValue];
        if (symbolValue) {
            //create canvas
            const canvas = createCanvasForSymbol(symbolValue, 18);
            //add to colorDiv
            canvas.className = 'zevent-place-overlay-symbol';
            //if clicked trigger span click
            canvas.addEventListener('click', e => {
                e.stopPropagation();
                span.click();
            });

            colorDiv.appendChild(canvas);
        }
    });
};

const injectSymbolToSelectedColor = () => {
    //color-button
    const colorButton = document.querySelector('.color-button');
    if (!colorButton) return zpoLog('injectSymbolToSelectedColor() colorButton not found');
    //get color from background-color style
    const bgColor = colorButton.style.backgroundColor;
    if (!bgColor) return zpoLog('injectSymbolToSelectedColor() bgColor not found');
    //convert rgb to hex
    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return zpoLog('injectSymbolToSelectedColor() rgb not found');
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);
    const hex = ((r << 16) | (g << 8) | b).toString(16);
    const colorValue = parseInt(hex, 16);
    const colorIndex = colors.findIndex(
        color => color.colorCode.toLowerCase() === ('#' + hex.padStart(6, '0')).toLowerCase()
    );
    if (colorIndex === -1) return zpoLog('injectSymbolToSelectedColor() colorIndex not found for color ' + colorValue);
    const symbolValue = symbols[colorIndex];
    if (!symbolValue) return zpoLog('injectSymbolToSelectedColor() symbolValue not found for color ' + colorValue);
    //remove previous symbol if any
    const prevSymbol = colorButton.querySelector('.zevent-place-overlay-symbol');
    if (prevSymbol) prevSymbol.remove();
    const canvas = createCanvasForSymbol(symbolValue, 24);
    canvas.className = 'zevent-place-overlay-symbol';
    //if clicked trigger colorButton click
    canvas.addEventListener('click', e => {
        e.stopPropagation();
        colorButton.click();
    });
    colorButton.appendChild(canvas);
};

const addPaletteObserver = () => {
    paletteObserver = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'aria-expanded') {
                    const target = mutation.target;
                    if (target.getAttribute('aria-expanded') === 'true') {
                        injectSymbols();
                    }
                } else if (mutation.attributeName === 'style') {
                    injectSymbolToSelectedColor();
                }
            }
        }
    });
    const colorButton = document.querySelector('.color-button');
    if (colorButton) {
        paletteObserver.observe(colorButton, { attributes: true });
    } else {
        zpoLog('observer() colorButton not found');
        setTimeout(addPaletteObserver, 1000);
    }
};

const getColors = async () => {
    const response = await fetch('https://place-api.zevent.fr/graphql', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0',
            Accept: '*/*',
            'Accept-Language': 'fr-FR,en-US;q=0.7,en;q=0.3',
            'content-type': 'application/json',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
        },
        referrer: 'https://place.zevent.fr/',
        body: '{"operationName":"getAvailableColors","variables":{},"query":"query getAvailableColors {\\n  getAvailableColors {\\n    colorCode\\n    name\\n    __typename\\n  }\\n}"}',
        method: 'POST',
    });
    if (!response.ok) return zpoLog("Couldn't get colors" + response.statusText);
    const data = await response.json();
    const loadedColors = data.getAvailableColors;
    if (!loadedColors || loadedColors?.length === 0) {
        zpoLog('getColors() loadedColors is empty, using fallback colors');
        colors = [
            { colorCode: '#000000' },
            { colorCode: '#333434' },
            { colorCode: '#D4D7D9' },
            { colorCode: '#FFFFFF' },
            { colorCode: '#6D302F' },
            { colorCode: '#9C451A' },
            { colorCode: '#6D001A' },
            { colorCode: '#BE0027' },
            { colorCode: '#FF2651' },
            { colorCode: '#FF2D00' },
            { colorCode: '#FFA800' },
            { colorCode: '#FFB446' },
            { colorCode: '#FFD623' },
            { colorCode: '#FFF8B8' },
            { colorCode: '#7EED38' },
            { colorCode: '#00CC4E' },
            { colorCode: '#00A344' },
            { colorCode: '#598D5A' },
            { colorCode: '#004B6F' },
            { colorCode: '#009EAA' },
            { colorCode: '#00CCC0' },
            { colorCode: '#33E9F4' },
            { colorCode: '#5EB3FF' },
            { colorCode: '#245AEA' },
            { colorCode: '#313AC1' },
            { colorCode: '#1832A4' },
            { colorCode: '#511E9F' },
            { colorCode: '#6A5CFF' },
            { colorCode: '#33E9F4' },
            { colorCode: '#B44AC0' },
            { colorCode: '#FF63AA' },
            { colorCode: '#E4ABFF' },
        ];
    } else {
        colors = loadedColors;
    }
};

export const changeEnabledSymbols = async enabled => {
    config.enableSymbols = enabled;
    GM_setValue('enableSymbols', enabled);
    if (enabled) {
        zpoLog('Symbols enabled');
        await Promise.all([getSymbols(), getColors()]);

        addPaletteObserver();
        injectSymbolToSelectedColor();
    } else {
        zpoLog('Symbols disabled');
        if (paletteObserver) {
            paletteObserver.disconnect();
            paletteObserver = null;
        }
        //remove all symbols from DOM
        const ourOverlays = document.querySelectorAll('.zevent-place-overlay-symbol');
        ourOverlays.forEach(function (e) {
            e.remove();
        });
    }
};

export const initSymbols = async () => {
    if (config.enableSymbols) {
        await Promise.all([getSymbols(), getColors()]);

        const initSelectedColor = () => {
            const colorButton = document.querySelector('.color-button');
            if (colorButton && colorButton.style.backgroundColor) {
                injectSymbolToSelectedColor();
                addPaletteObserver();
            } else {
                setTimeout(initSelectedColor, 1000);
            }
        };
        initSelectedColor();
    }
};

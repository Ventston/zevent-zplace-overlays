import { config } from './store';
import { zpoLog } from './utils';

const MARGIN = 8;
const MIN_OPEN_HEIGHT = 320;

function clamp(panel, x, y) {
    const { width, height } = panel.getBoundingClientRect();
    const body = panel.querySelector('#zevent-place-overlay-ui-body');
    const bound = body?.getAttribute('aria-expanded') === 'true' ? MIN_OPEN_HEIGHT : height;
    const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - bound - MARGIN);
    return {
        x: Math.round(Math.min(Math.max(x, MARGIN), maxX)),
        y: Math.round(Math.min(Math.max(y, MARGIN), maxY)),
    };
}

function place(panel, x, y) {
    const position = clamp(panel, x, y);
    panel.style.left = position.x + 'px';
    panel.style.top = position.y + 'px';
    panel.style.setProperty('--zpo-top', position.y + 'px');
    return position;
}

function applyPosition(panel = document.querySelector('#zevent-place-overlay-ui')) {
    if (!panel) return;
    if (!config.panelPosition) {
        panel.style.left = '';
        panel.style.top = '';
        panel.style.removeProperty('--zpo-top');
        return;
    }
    place(panel, config.panelPosition.x, config.panelPosition.y);
}

export function clampPanelIntoView(panel) {
    const rect = panel.getBoundingClientRect();
    const { x, y } = clamp(panel, rect.left, rect.top);
    if (x === Math.round(rect.left) && y === Math.round(rect.top)) return;
    config.panelPosition = place(panel, x, y);
}

export function resetPanelPosition() {
    zpoLog('resetPanelPosition()');
    config.panelPosition = null;
    applyPosition();
}

export function makePanelDraggable(panel, handle) {
    applyPosition(panel);

    handle.onpointerdown = event => {
        if (event.button !== 0 || event.target.closest('button, a')) return;
        event.preventDefault();

        const rect = panel.getBoundingClientRect();
        const grabX = event.clientX - rect.left;
        const grabY = event.clientY - rect.top;
        let position = { x: rect.left, y: rect.top };

        panel.classList.add('zpo-dragging');
        handle.setPointerCapture(event.pointerId);

        const onMove = e => {
            position = place(panel, e.clientX - grabX, e.clientY - grabY);
        };
        const onEnd = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onEnd);
            handle.removeEventListener('pointercancel', onEnd);
            panel.classList.remove('zpo-dragging');
            config.panelPosition = position;
            zpoLog('panel moved to ' + position.x + ',' + position.y);
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
    };
}

window.addEventListener('resize', () => applyPosition());

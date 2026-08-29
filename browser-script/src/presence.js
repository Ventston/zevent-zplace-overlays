import { presenceAttribute, version } from './constants.js';

export const announcePresence = () => {
    document.documentElement.setAttribute(presenceAttribute, version);
};

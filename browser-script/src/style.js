import css from 'css:./template/styles.css';

export const injectStyles = () => {
    GM_addStyle(css);
};

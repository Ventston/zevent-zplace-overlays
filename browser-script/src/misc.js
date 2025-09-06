const listenSpaceEvent = ()=>{
    document.addEventListener('keyup', function(e) {
        if (e.code === 'Space' && e.target === document.body) {
            const buttons = document.querySelectorAll('.buttons');
            if (!buttons.length) {
                return;
            }

            const colorButton = document.querySelector('.color-button');
            if (!colorButton) {
                return;
            }
            const bgColor = colorButton.style.backgroundColor;
            if (bgColor !== 'rgb(0, 0, 0)') {
                return;
            }

            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();

            if (!buttons[0].children.length) {
                return;
            }
            buttons[0].children[0].click();
            return false;
        }
    }, true);
};

export const initMisc = () => {
    listenSpaceEvent();
}

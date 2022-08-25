// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @version      1
// @description  try to take over the world! Adaptations by ludolpif for ZEvent/place. Press H to hide/show again the overlay.
// @author       MinusKube
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// ==/UserScript==

// Script I (ludolpif) used as base : https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
'use strict';

const observer = new MutationObserver(function (mutations, mutationInstance) {
    function loadOverlay(canvas, left, top, width, height, src) {
        const parentDiv = canvas.parentElement;
        const image = document.createElement("img");
        image.width = width;
        image.height = height;
        image.src = src;
        image.style = "background: none; position: absolute; left: " + left + "px; top: " + top + "px;";
        console.log("zevent-place-overlay: appending " + src);
        parentDiv.appendChild(image);
        document.addEventListener('keypress', function(event) {
            if (event.code == 'KeyH') {
                image.hidden = !image.hidden;
            }
        });
        // Fix for firefox ESR 91 ('pixellated' needs >=93)
        parentDiv.style.setProperty('image-rendering', 'crisp-edges');
    }
    let addedCanvas = null;
    //console.log(mutations);
    for (const mutation of mutations) {
        // Check if the canvas has been added during this mutation
        for (const addedNode of mutation.addedNodes) {
            if (!(addedNode instanceof Element)) {
                continue;
            }
            const canvases = addedNode.getElementsByTagName('canvas');
            if (canvases.length > 0) {
                addedCanvas = canvases[0];
                break;
            }
        }
    }
    if (addedCanvas) {
        // Final user : find overlays URL on streamer's discord and use them here (and remove the demo-overlay.png line)
        // 1000x1000 is initial zevent-place size, you will need to augment when overlays will be resized
        loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay.png");
        //loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://s8.gifyu.com/images/Overlay-from-someguy-that-is-cool.png");
        //loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://s8.gifyu.com/images/Overlay-someother-cool-streamer.png");
        //...
        // If you have refresh/cache problems, use a number that change every seconds at the end of URL (after a "?"):
        //loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://.../something.png?"+Date.now());
    }
});

observer.observe(document, {
    childList: true,
    subtree:   true,
    characterDataOldValue : true
});
console.log("zevent-place-overlay: started observing document mutations");

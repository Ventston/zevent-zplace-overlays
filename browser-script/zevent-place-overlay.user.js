// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  try to take over the world! Adaptations by ludolpif for ZEvent/place. Press H to hide/show again the overlay.
// @author       MinusKube & ludolpif (questions or help: ludolpif#4419 on discord)
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// @downloadURL  https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// ==/UserScript==

// Script I (ludolpif) used as base : https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
// Original and this code licence : MIT
// Copyright 2021-2022 MinusKube & ludolpif
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
        if (navigator.userAgent.replace(/^Mozilla.* rv:(\d+).*$/, '$1') < 93) {
            parentDiv.style.setProperty('image-rendering', 'crisp-edges');
        }
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
        /*
         * FR: Utilisateurs du script: trouvez une ou des URL d'overlay (calques) sur les serveurs Discord des Streamers,
         *      et utilisez les ci-dessous (et supprimez la ligne avec demo-overlay.png).
         * Pour activer un nouveau calque (overlay) :
         *  0) S'assurer que vous lisez ça depuis un onglet de l'extension TamperMonkey dans votre navigateur
         *    (sinon vous avez manqué des étapes de la documentation sous README.md: https://github.com/ludolpif/overlay-zevent-place ) 
         *  1) Utilisez une ligne //loadOveray(...); laissée en exemple
         *  2) SÉCURITÉ: ne tentez pas de charger autre chose qu'une image .png
         *  3) Remplacez l'URL d'exemple par l'URL trouvée sur le Discord de votre Streamer
         *  4) Enlevez le double-slash // avant loadOverlay(...); pour activer cette ligne de code
         *  5) Sauvez le script (Ctrl+S)
         *  6) Fermez cet onglet (editeur Tampermonkey)
         *  7) Allez sur l'onglet de https://place.zevent.fr et rafraichissez avec Ctrl+R
         * Remarques :
         * - Les calques (overlays) ne s'affichent qu'après l'authentification sur le site https://place.zevent.fr
         * - Les nombres 1000,1000 sont adéquats pour la taille initiale de zevent-place. Ça augmentera pendant l'évènement.
         *    À changer quand la personne qui produit le calque (overlay) aura publié un premier calque à la nouvelle taille.
         * - Ne touchez pas et préservez les point-virugles en fin de lignes de code, le script tombe en panne sinon.

         */
        loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay.png");
        //loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://raw.githubusercontent.com/someone/someproject/main/some-name.png");
        //loadOverlay(addedCanvas, 0, 0, 1000, 1000, "https://s8.gifyu.com/images/Overlay-someother-cool-streamer.png");

        /*
         * EN: Script users: find overlays URL on Streamer's discord servers
         *      and use them just above (and remove the line with demo-overlay.png).
         * To enable a new overlay :
         *  0) Make sure you read this from a web browser's tab, from the TamperMonkey extension
         *    (if not, you have missed steps in the documentation below README.md: https://github.com/ludolpif/overlay-zevent-place )
         *  1) Use an line of code left as example like //loadOveray(...);
         *  2) SECURITY: don't try to load anything but a .png file
         *  3) Replace the example URL by the URL found on your Streamer's Discord
         *  4) Remove the double-slash // before loadOverlay(...); to enable this line of code
         *  5) Save the script (Ctrl+S)
         *  6) Close this tab (Tampermonkey editor)
         *  7) Go on https://place.zevent.fr browser tab and refresh the page with Ctrl+R
         * Remarks :
         * - Overlays will display only after successful authentication on https://place.zevent.fr website
         * - Numbers 1000,1000 are fiine for the initial size of zevent-place. It will grow during the event.
         * - Don't mess up any semi-colon (;) at end of code lines, it will break the script.
         */
    }
});

observer.observe(document, {
    childList: true,
    subtree:   true,
    characterDataOldValue : true
});
console.log("zevent-place-overlay: started observing document mutations");

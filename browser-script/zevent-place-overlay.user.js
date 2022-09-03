// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      1.6.1
// @description  Please organize with other participants on Discord: https://discord.gg/sXe5aVW2jV ; Press H to hide/show again the overlay.
// @author       MinusKube & ludolpif (questions or bugs: ludolpif#4419 on Discord)
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// @downloadURL  https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// @updateURL    https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// ==/UserScript==

// Script I (ludolpif) used as base : https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
// Original and this code licence : MIT
// Copyright 2021-2022 MinusKube & ludolpif
(function() {
    'use strict';
    console.log("zevent-place-overlay: started");
    // Global variables for our script
    const overlayJSON = "https://timeforzevent.fr/overlay.json";
    let intervalID = setInterval(keepOurselfInDOM, 2000);
    let refreshOverlays = true;
    let wantedOverlayURLs = [];
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
     * - Ne touchez pas / préservez les point-virgules en fin de ligne de code, le script tombe en panne sinon.
     */
    loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay.png" );
    loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay2.png" );
    //loadOverlay("https://s8.gifyu.com/images/Overlay-someother-cool-streamer.png" );
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
     * - Don't mess up any semi-colon (;) at end of code lines, it will break the script.
     */
    function loadOverlay(url) {
        // TODO don't push multiple times the same URL
        wantedOverlayURLs.unshift(url); // <img> will be appended in wantedOverlayURLs order
        refreshOverlays = true;
    }
    function reloadOverlays(origCanvas, ourOverlays) {
        const parentDiv = origCanvas.parentElement;
        // CSS fix for firefox ESR 91 ('pixellated' needs >=93)
        if (navigator.userAgent.replace(/^Mozilla.* rv:(\d+).*$/, '$1') < 93) {
            parentDiv.style.setProperty('image-rendering', 'crisp-edges');
        }
        // Remove all our <img>
        // TODO remove all addEventListener before deleting <img> ?
        if ( !ourOverlays ) ourOverlays = [];
        if ( !Array.isArray(ourOverlays) ) ourOverlays = [ ourOverlays ];
        ourOverlays.forEach(function (e) { e.remove() });
        // Insert them again
        let left=0, top=0, width=500, height=500; //TODO detect size
        wantedOverlayURLs.forEach(function (url) { appendOverlayInDOM(origCanvas, parentDiv, left, top, width, height, url) });
        refreshOverlays = false;
    }
    function appendOverlayInDOM(origCanvas, parentDiv, left, top, width, height, url) {
        const image = document.createElement("img");
        image.className = "zevent-place-overlay-img";
        image.width = width; image.height = height; image.src = url;
        image.style = "background: none; position: absolute; left: " + left + "px; top: " + top + "px;";
        console.log("zevent-place-overlay: loadOverlay(), inserting img: " + url + " at " + left + ", " + top + " size " + width + ", " + height);
        parentDiv.appendChild(image);
        document.addEventListener('keypress', function(event) {
            if (event.code == 'KeyH') {
                image.hidden = !image.hidden;
            }
        });
    }
    function appendOurUI(origUI) {
        const ourUI = document.createElement("div");
        ourUI.id = "zevent-place-overlay-ui";
        ourUI.className = "user";
        ourUI.style = `
	        display: inline-flex; height: 40px; align-items: center; padding: 0 16px; border-radius: 999px;
			background: #1f1f1f; position: fixed; top: 16px; left: 16px; z-index: 999;`
        ourUI.innerHTML = "Overlays (soon)";
        origUI.appendChild(ourUI);
    }
    function keepOurselfInDOM() {
        let origCanvas = document.querySelector('#place-canvas');
        if ( !origCanvas ) console.log("zevent-place-overlay: keepOurselfInDOM() origOanvas: " + origCanvas);

        let ourOverlays = document.querySelector('.zevent-place-overlay-img');
        if ( origCanvas && (!ourOverlays || refreshOverlays ) ) {
            console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + !!origCanvas + ", ourOverlays: " + !!ourOverlays + ", refreshOverlays:" + refreshOverlays );
            reloadOverlays(origCanvas, ourOverlays);
        }
        let origUI = document.querySelector('.place');
        if ( !origUI ) console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + origCanvas);
        let ourUI = document.querySelector('#zevent-place-overlay-ui');
        if ( origUI && !ourUI ) {
            console.log("zevent-place-overlay: keepOurselfInDOM() origUI: " + !!origUI + ", ourUI: " + !!ourUI);
            appendOurUI(origUI);
            fetchKnownOverlays1();
            fetchKnownOverlays2();
        }
    }
    function reloadUIKnownOverlays() {
        //TODO stub
        console.log("DEBUG reloadUIKnownOverlays()", knownOverlays);
    }
    function fetchKnownOverlays1() {
        //TODO stub use fetch API
    }
    function fetchKnownOverlays2() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var data = JSON.parse(this.responseText);
                //TODO sanity checks
                knownOverlays = data;
                reloadUIKnownOverlays();
            }
        };
        xmlhttp.open("GET", overlayJSON, true);
        xmlhttp.send();
    }

    /* Following JSON is from URL you can found in global const overlayJSON
     * It is embed here in case of problems during getting it at runtime.
     * Use the bot commands on Discord mentionned in @description to publicly register an overlay in this json
     */
    let knownOverlays = {
        "89af8563-6ed2-4669-84be-2a83406bc128" : {"admin":"ludolpif", "url": "https://github.com/ludolpif/overlay-zevent-place/blob/main/examples/demo-overlay.png", "lastmodified": "2022-01-01T01:01:01", "title": "test"},
        "17d494c3-fee2-4b0a-9d8f-f66b6de175b4" : {"admin":"ludolpif", "url": "https://github.com/ludolpif/overlay-zevent-place/blob/main/examples/demo-overlay2.png", "lastmodified": "2022-01-01T01:01:01", "title": "test2"},
        "4ec23db8-49ad-4b1d-803d-20be63ccab71" : {"admin":"minuskube", "url": "https://s8.gifyu.com/images/Overlay-ZPlace-2.071936ce620f59ca0.png", "lastmodified": "2022-01-01T01:01:01", "title":"test3"}
    };

})();

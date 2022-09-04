// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      1.6.7
// @description  Please organize with other participants on Discord: https://discord.gg/sXe5aVW2jV ; Press H to hide/show again the overlay.
// @author       ludolpif, ventston
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// @downloadURL  https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// @updateURL    https://github.com/ludolpif/overlay-zevent-place/raw/main/browser-script/zevent-place-overlay.user.js
// ==/UserScript==
/*
 * Script used as base, form MinusKube: https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
 * Original and this code licence: MIT
 * Copyright 2021-2022 ludolpif, ventston
 * Thanks to : grewa for help on CSS
 */
(function() {
    'use strict';
    const version = "1.6.7";
    console.log("zevent-place-overlay: version " + version);
    // Global constants and variables for our script
    const overlayJSON = "https://timeforzevent.fr/overlay.json";
    const thread_logo_url = "https://cdn.discordapp.com/attachments/1013061504599334915/1016050954191245322/logo2.png";
    const twitchLogoSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M21 3v11.74l-4.696 4.695h-3.913l-2.437 2.348H6.913v-2.348H3V6.13L4.227 3H21zm-1.565 1.565H6.13v11.74h3.13v2.347l2.349-2.348h4.695l3.13-3.13V4.565zm-3.13 3.13v4.696h-1.566V7.696h1.565zm-3.914 0v4.696h-1.565V7.696h1.565z"></path></svg>'
    const discordLogoSVG= '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 71 80"><path fill="#5865f2" d="M60.1045 13.8978C55.5792 11.8214 50.7265 10.2916 45.6527 9.41542C45.5603 9.39851 45.468 9.44077 45.4204 9.52529C44.7963 10.6353 44.105 12.0834 43.6209 13.2216C38.1637 12.4046 32.7345 12.4046 27.3892 13.2216C26.905 12.0581 26.1886 10.6353 25.5617 9.52529C25.5141 9.44359 25.4218 9.40133 25.3294 9.41542C20.2584 10.2888 15.4057 11.8186 10.8776 13.8978C10.8384 13.9147 10.8048 13.9429 10.7825 13.9795C1.57795 27.7309 -0.943561 41.1443 0.293408 54.3914C0.299005 54.4562 0.335386 54.5182 0.385761 54.5576C6.45866 59.0174 12.3413 61.7249 18.1147 63.5195C18.2071 63.5477 18.305 63.5139 18.3638 63.4378C19.7295 61.5728 20.9469 59.6063 21.9907 57.5383C22.0523 57.4172 21.9935 57.2735 21.8676 57.2256C19.9366 56.4931 18.0979 55.6 16.3292 54.5858C16.1893 54.5041 16.1781 54.304 16.3068 54.2082C16.679 53.9293 17.0513 53.6391 17.4067 53.3461C17.471 53.2926 17.5606 53.2813 17.6362 53.3151C29.2558 58.6202 41.8354 58.6202 53.3179 53.3151C53.3935 53.2785 53.4831 53.2898 53.5502 53.3433C53.9057 53.6363 54.2779 53.9293 54.6529 54.2082C54.7816 54.304 54.7732 54.5041 54.6333 54.5858C52.8646 55.6197 51.0259 56.4931 49.0921 57.2228C48.9662 57.2707 48.9102 57.4172 48.9718 57.5383C50.038 59.6034 51.2554 61.5699 52.5959 63.435C52.6519 63.5139 52.7526 63.5477 52.845 63.5195C58.6464 61.7249 64.529 59.0174 70.6019 54.5576C70.6551 54.5182 70.6887 54.459 70.6943 54.3942C72.1747 39.0791 68.2147 25.7757 60.1968 13.9823C60.1772 13.9429 60.1437 13.9147 60.1045 13.8978ZM23.7259 46.3253C20.2276 46.3253 17.3451 43.1136 17.3451 39.1693C17.3451 35.225 20.1717 32.0133 23.7259 32.0133C27.308 32.0133 30.1626 35.2532 30.1066 39.1693C30.1066 43.1136 27.28 46.3253 23.7259 46.3253ZM47.3178 46.3253C43.8196 46.3253 40.9371 43.1136 40.9371 39.1693C40.9371 35.225 43.7636 32.0133 47.3178 32.0133C50.9 32.0133 53.7545 35.2532 53.6986 39.1693C53.6986 43.1136 50.9 46.3253 47.3178 46.3253Z"/></svg>';
    let refreshOverlays = true;
    let wantedOverlayURLs = [];
    // Run the script with delay, MutationObservable fail in some config (race condition between this script and the original app)
    let intervalID1 = setTimeout (keepOurselfInDOM, 200);
    let intervalID2 = setInterval(keepOurselfInDOM, 2000);
    /*
     * FR: Utilisateurs du script: vous pouvez éditer les lignes loadOverlay() ci-après pour mémoriser dans votre navigateur
     *      vos choix d'overlay sans utiliser le menu "Overlays" proposé par ce script sur https://place.zevent.fr/
     * Pour ce faire :
     *  0) S'assurer que vous lisez ça depuis un onglet de l'extension TamperMonkey dans votre navigateur
     *    (sinon vous avez manqué des étapes de la documentation sous README.md: https://github.com/ludolpif/overlay-zevent-place )
     *  1) Utilisez une ligne //loadOveray(...); laissée en exemple
     *  2) SÉCURITÉ: ne tentez pas de charger autre chose qu'une image .png
     *  3) Remplacez l'URL d'exemple par l'URL de l'overlay de voter choix
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
    //loadOverlay("https://somewebsite.com/someoverlay.png" );
    /*
     * EN: Script users: you can edit loadOverlay(...) lines above to memorize in your browser
     *      your overlay choices without using the "Overlays" menu from this script on https://place.zevent.fr/
     * To do that:
     *  0) Make sure you read this from a web browser's tab, from the TamperMonkey extension
     *    (if not, you have missed steps in the documentation below README.md: https://github.com/ludolpif/overlay-zevent-place )
     *  1) Use an line of code left as example like //loadOveray(...);
     *  2) SECURITY: don't try to load anything but a .png file
     *  3) Replace the example URL by the URL the the overlay of your choice
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
    function reloadUIKnownOverlays() {
        const knownOverlaysIds = Object.keys(knownOverlays);
        console.log("zevent-place-overlay: reloadUIKnownOverlays() for " + knownOverlaysIds.length + " overlays");
        let ulKnownOverlays = document.querySelector('#zevent-place-overlay-ui-list-known-overlays');

        ulKnownOverlays.innerHTML = "";
        knownOverlaysIds.forEach(function (id) { appendUIKnownOverlays(ulKnownOverlays, knownOverlays[id]); });
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
        ourUI.style = `
	        padding: 0 8px; border-radius: 20px; background: #1f1f1f;
			position: fixed; top: 16px; left: 16px; z-index: 999;`
        ourUI.innerHTML = `
            <div id="zevent-place-overlay-ui-head" style="display: flex; align-items: center; height: 40px;">
		    	<button
                    onClick="const n = document.querySelector('#zevent-place-overlay-ui-body'); if ( n.hidden ) { n.hidden=false; n.style.height='calc(100vh - 72px)'; n.style.width='20rem'; } else { n.hidden=true; n.style.height='0'; n.style.width='0'; }"
                    style="width:40px; height:40px; display:flex; border-radius:40px; border:none; background-color:#050505; justify-content:center; align-items:center; cursor:pointer"
                    >
		    	    <svg height="24px" viewBox="0 0 32 32">
			            <path fill="white" d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/>
			        </svg>
			    </button>
        	    Overlays
                <span id="zevent-place-overlay-ui-version" style="color:gray; font-size:70%; padding-left:1em;"></span>
            </div>
            <div id="zevent-place-overlay-ui-body" hidden style="display: flex; flex-flow: row wrap; flex-direction: column; height: 0vh; transition: all 0.2s ease 0s;">
                <div id="zevent-place-overlay-ui-overlaylist" style="flex: 1; overflow-x:hidden; overflow-y: auto;">
                    <br />
                    Actif&nbsp;
                    <table id="zevent-place-overlay-ui-list-wanted-overlays"></table>
                    <br />
                    <hr />
                    <br />
                    <label for="zevent-place-overlay-ui-input-url">Ajout via URL</label>
                    <input id="zevent-place-overlay-ui-input-url" name="zevent-place-overlay-ui-input-url" type="text" size=30 value="https://somewebsite.com/someoverlay.png"></input>
                    <button
                        onClick="const n = document.querySelector('#zevent-place-overlay-ui-input-url'); loadOverlay(n.value);"
                    >OK</button>
                    <table id="zevent-place-overlay-ui-list-wanted-overlays"></table>
                    <br />
                    <hr />
                    <br />
                    Disponible&nbsp;
                    <table id="zevent-place-overlay-ui-list-known-overlays"></table>
                </div>
            </div>
        `;
        origUI.appendChild(ourUI);

        const versionSpan = document.querySelector('#zevent-place-overlay-ui-version');
        if ( versionSpan) { versionSpan.innerHTML = 'v' + version };
    }
    function appendUIKnownOverlays(ulKnownOverlays, data) {
        const tr = document.createElement("tr");
        tr.style = "padding: 5px";
        tr.innerHTML= '<td></td>' //'<td><label class="switch"><input type="checkbox"><span class="slider round"></span></label></td>'
            + '<td class="community_name" style="justify-content:center; align-items:center;">' + data.community_name + '</td>'
            + '<td class="community_twitch"><a  href="' + data.community_twitch + '">' + twitchLogoSVG + '</a></td>' // '<img class="twitch_logo"  src="' + twitch_logo_url + '"/></a></td>'
            + '<td class="community_discord"><a href="' + data.community_discord+ '">' + discordLogoSVG+ '</a></td>'
            + '<td class="thread_url"><a href="' + data.thread_url + '"><img height="24px" src="' + thread_logo_url + '" alt="Fil Discord Commu ZEvent/Place"/></a></td>'
            + `<td class="description" style="justify-content:center; align-items:center;">
                   <button onClick="const n = this.parentElement.querySelector('.description'); console.log('DEBUG', n); n.hidden = !! n.hidden;"
                       style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505;  cursor:pointer"
                       >?</button>`
            + '<div class="description" hidden>' + data.description + '</div></td>';
        ulKnownOverlays.appendChild(tr);
    }
    function appendOurCSS(origHead) {
        const style = document.createElement("style");
        style.id = 'zevent-place-overlay-css';
        style.innerHTML = `
            // CSS for the sliders
            /* The switch - the box around the slider */
            .switch {
              position: relative;
              display: inline-block;
              width: 30px;
              height: 17px;
            }

            /* Hide default HTML checkbox */
            .switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }

            /* The slider */
            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: #ccc;
              -webkit-transition: .4s;
              transition: .4s;
            }

            .slider:before {
              position: absolute;
              content: "";
              height: 13px;
              width: 13px;
              left: 2px;
              bottom: 2px;
              background-color: white;
              -webkit-transition: .4s;
              transition: .4s;
            }

            input:checked + .slider {
              background-color: #2196F3;
            }

            input:focus + .slider {
              box-shadow: 0 0 1px #2196F3;
            }

            input:checked + .slider:before {
              -webkit-transform: translateX(13px);
              -ms-transform: translateX(13px);
              transform: translateX(13px);
            }

            /* Rounded sliders */
            .slider.round {
              border-radius: 17px;
            }

            .slider.round:before {
              border-radius: 50%;
            }

            tr { text-align:center }
            `;
        origHead.appendChild(style);
    }
    function keepOurselfInDOM() {
        let origHead = document.querySelector('head');
        if ( !origHead ) console.log("zevent-place-overlay: keepOurselfInDOM() origHead: " + !!origHead);
        let ourCSS = document.querySelector('#zevent-place-overlay-css');
        if ( origHead && !ourCSS ) {
            console.log("zevent-place-overlay: keepOurselfInDOM() origHead: " + !!origHead + ", ourCSS: " + !!ourCSS);
            appendOurCSS(origHead);
        }
        let origCanvas = document.querySelector('#place-canvas');
        if ( !origCanvas ) console.log("zevent-place-overlay: keepOurselfInDOM() origCanvas: " + origCanvas);

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
            fetchKnownOverlays();
        }
    }
    function fetchKnownOverlays() {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            console.log("zevent-place-overlay: fetchKnownOverlays() xmlhttp state: " + this.readyState + " status: " + this.status);
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
    let knownOverlays = {};

})();

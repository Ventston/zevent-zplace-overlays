// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      1.6.18
// @description  Please organize with other participants on Discord: https://discord.gg/sXe5aVW2jV ; Press H to hide/show again the overlay.
// @author       ludolpif, ventston
// @match        https://place.zevent.fr/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/browser-script/zevent-place-overlay.user.js
// @updateURL    https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/browser-script/zevent-place-overlay.user.js
// ==/UserScript==
/*
 * Script used as base, form MinusKube: https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
 * Original and this code licence: MIT
 * Copyright 2021-2022 ludolpif, ventston
 * Thanks to : grewa, BunlanG|Baron for help on CSS
 */
(function() {
    'use strict';
    const version = "1.6.18";
    const scriptUpdateURL = "https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/browser-script/zevent-place-overlay.user.js"
    // Global constants and variables for our script
    const overlayJSON1 = "https://timeforzevent.fr/overlay.json"; // TODO define other URL
    const overlayJSON2 = "https://timeforzevent.fr/overlay.json"; // Need CORS header (Access-Control-Allow-Origin: https://place.zevent.fr)
    const inviteDiscordURL = "https://discord.gg/sXe5aVW2jV";
    let refreshOverlays = true;
    let safeModeDisableUI = false;
    let safeModeDisableGetJSON = false;
    let wantedOverlays = {}; // Same format as knownOverlays : the format of overlay.json
    let refreshKnownOverlaysState = 0; // state 0: idle, 1: asked, 2: in progress (main url), 3: in progress (bkp url), 4: cooldown (rate limiting)
    let lastCustomId = 0;
    function zpoLog(msg) {
        const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit'});
        console.log(ts + " zevent-place-overlay: " + msg);
    }
    zpoLog("version " + version);
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
     * Mode sans échec :
     * - Si vous avez un bug avec l'UI, mettez vos URL dans des lignes loadOverlay(...);
     *     et enlevez le // devant la ligne //safeModeDisableUI...
     */
    //safeModeDisableGetJSON = true;
    //safeModeDisableUI = true;
    //loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay.png" );
    //loadOverlay("https://raw.githubusercontent.com/ludolpif/overlay-zevent-place/main/examples/demo-overlay2.png" );
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
     * Safe mode :
     * - If you have a bug with the UI, put your URLs in some loadOverlay(...); lines
     *     and remove the double-slash // before //safeModeDisableUI... line
     */
    function loadOverlay(url, title, id) {
        zpoLog("loadOverlay(" + url + ", " + title + ", " + id + ")");
        if (typeof url !== "string") {
            zpoLog("loadOverlay() url is not string");
            return;
        }
        if (typeof title !== "string" || !title) {
            title = url.replace(/^.*\/([^%?<>&]+)$/, '$1');
        }
        if (typeof id !== "string" || !id) {
            id = "custom-" + lastCustomId++;
        }
        // TODO detect image size
        wantedOverlays[id] = { id:id, url: url, title:title,left: 0, top:0, width:500, height:500 };
        refreshOverlays = true;
    }
    function reloadOverlays(origCanvas, ourOverlays) {
        zpoLog("reloadOverlays()");
        const parentDiv = origCanvas.parentElement;
        // CSS fix for firefox ESR 91 ('pixellated' needs >=93)
        if (navigator.userAgent.replace(/^Mozilla.* rv:(\d+).*$/, '$1') < 93) {
            parentDiv.style.setProperty('image-rendering', 'crisp-edges');
        }
        // Remove all our <img>
        // TODO remove all addEventListener before deleting <img> ?
        if ( !ourOverlays ) ourOverlays = [];
        ourOverlays.forEach(function (e) { e.remove() });
        // Insert them again
        const wantedOverlaysIds = Object.keys(wantedOverlays);
        wantedOverlaysIds.forEach(function (id) {
            const data = wantedOverlays[id];
            appendOverlayInDOM(origCanvas, parentDiv, data.left, data.top, data.width, data.height, data.url);
        });
        // Refresh displayed time
        const spanTs = document.querySelector('#zevent-place-overlay-wanted-ts');
        if ( spanTs ) spanTs.innerHTML = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'});
        // Mark job done for keepOurselfInDOM
        refreshOverlays = false;
    }
    function reloadUIWantedOverlays() {
        if (!wantedOverlays) {
            zpoLog("reloadUIWantedOverlays() for undefined wantedOverlays");
            return;
        }
        const wantedOverlaysIds = Object.keys(wantedOverlays);
        zpoLog("reloadUIWantedOverlays() for " + wantedOverlaysIds.length + " wantedOverlays");
        // Refresh the list in DOM
        const ulWantedOverlays = document.querySelector('#zevent-place-overlay-ui-list-wanted-overlays');
        if (!ulWantedOverlays) return;
        ulWantedOverlays.innerHTML = "";
        wantedOverlaysIds.forEach(function (id) { appendUIWantedOverlays(ulWantedOverlays, id, wantedOverlays[id]); });
    }
    function reloadUIKnownOverlays() {
        if (!knownOverlays) {
            zpoLog("reloadUIKnownOverlays() for undefined knownOverlays");
            return;
        }
        const knownOverlaysIds = Object.keys(knownOverlays);
        zpoLog("reloadUIKnownOverlays() for " + knownOverlaysIds.length + " knownOverlays");
        // Refresh the list in DOM
        const ulKnownOverlays = document.querySelector('#zevent-place-overlay-ui-list-known-overlays');
        if (!ulKnownOverlays) return;
        ulKnownOverlays.innerHTML = "";
        knownOverlaysIds.forEach(function (id) { appendUIKnownOverlays(ulKnownOverlays, id, knownOverlays[id]); });
    }
    function appendOverlayInDOM(origCanvas, parentDiv, left, top, width, height, url) {
        const image = document.createElement("img");
        image.className = "zevent-place-overlay-img";
        image.width = width; image.height = height; image.src = url;
        image.style = "background: none; position: absolute; left: " + left + "px; top: " + top + "px;";
        zpoLog("loadOverlay(), inserting img: " + url + " at " + left + ", " + top + " size " + width + ", " + height);
        parentDiv.appendChild(image);
        document.addEventListener('keypress', function(event) {
            if (event.code == 'KeyH') {
                image.hidden = !image.hidden;
            }
        });
    }
    function appendOurUI(origUI) {
        zpoLog("appendOurUI()");
        const ourUI = document.createElement("div");
        ourUI.id = "zevent-place-overlay-ui";
        ourUI.style = `
            padding: 0 8px; border-radius: 20px; background: #1f1f1f;
            position: fixed; top: 16px; left: 16px; z-index: 999;`
        ourUI.innerHTML = `
            <div id="zevent-place-overlay-ui-head" style="display: flex; align-items: center; height: 40px;">
                <button
                    onClick="const n = document.querySelector('#zevent-place-overlay-ui-body'); if ( n.hidden ) { n.hidden=false; n.style.height='calc(100vh - 72px)'; } else { n.hidden=true; n.style.height='0'; }"
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
                    <label for="zevent-place-overlay-ui-input-url">Ajout via URL</label><br />
                    <input id="zevent-place-overlay-ui-input-url" name="zevent-place-overlay-ui-input-url" type="text" size="48" style="width: 270px" value="https://somesite.com/someoverlay.png"></input>
                    <button id="btn-custom-add">OK</button>
                    <br /><hr />
                    Overlays actifs
                    <span id="zevent-place-overlay-wanted-ts" style="color:gray; font-size:70%; padding-left:1em;"></span>
                    <button id="btn-refresh-wanted"
                       style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505;cursor:pointer"
                    >↺</button>
                    <table id="zevent-place-overlay-ui-list-wanted-overlays"></table>
                    <br /><hr />
                    Overlays disponibles
                    <span id="zevent-place-overlay-known-ts" style="color:gray; font-size:70%; padding-left:1em;"></span>
                    <button id="btn-refresh-known"
                       style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505;cursor:pointer"
                    >↺</button>
                    </br>
                    <a href="`+inviteDiscordURL+`" alt="Discord Invite" target="_blank" style="text-decoration: underline; color: #8ab4f8">Discord Commu ZEvent/Place</a><br/>
                    <table id="zevent-place-overlay-ui-list-known-overlays"></table>
                </div>
            </div>
        `;
        let btnAdd = ourUI.querySelector('#btn-custom-add');
        if (btnAdd) btnAdd.onclick = eventAddCustomOverlay;

        let btnAskRefreshWantedOverlays = ourUI.querySelector('#btn-refresh-wanted');
        if (btnAskRefreshWantedOverlays) btnAskRefreshWantedOverlays.onclick = eventAskRefreshWantedOverlays;

        let btnAskRefreshKnownOverlays = ourUI.querySelector('#btn-refresh-known');
        if (btnAskRefreshKnownOverlays) btnAskRefreshKnownOverlays.onclick = eventAskRefreshKnownOverlays;

        const versionSpan = ourUI.querySelector('#zevent-place-overlay-ui-version');
        if (versionSpan) { versionSpan.innerHTML = 'v' + version };

        const nodeUIHead = ourUI.querySelector('#zevent-place-overlay-ui-head');
        if (nodeUIHead) {
            const aScriptUpdate = document.createElement("a");
            aScriptUpdate.href = scriptUpdateURL;
            aScriptUpdate.target = "_blank";
            aScriptUpdate.alt = "Aperçu";
            aScriptUpdate.innerHTML = '<button style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505; cursor:pointer">↺</button>';
            nodeUIHead.appendChild(aScriptUpdate);
        }
        origUI.appendChild(ourUI);
        // wantedOverlayURLs may have already values if set with loadOverlay() in script, so display them
        reloadUIWantedOverlays();
    }
    function appendUIWantedOverlays(ulWantedOverlays, id, data) {
        zpoLog("appendUIWantedOverlays()");
        const tr = document.createElement("tr");
        tr.id = 'wanted-node-'+id;
        tr.style = "padding: 5px";
        tr.innerHTML= `
            <td class="action_del" style="justify-content:center; align-items:center;">
                <button id="btn-del-`+id+`"
                    style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505;cursor:pointer"
                    >-</button>
            </td>
            <td class="title"    style="padding: 5px; justify-content:center; align-items:center; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></td>
            <td class="preview_btn"       style="padding: 2px; justify-content:center; align-items:center;"></td>
        `;
        let btnDel = tr.querySelector('#btn-del-'+id);
        if (btnDel) btnDel.onclick = eventDelOverlay;

        if ( typeof data.title === "string" ) {
            const nodeTitle = document.createTextNode(data.title);
            tr.querySelector('.title').appendChild(nodeTitle);
        }
        if ( typeof data.url === "string" ) {
            const aPreview = document.createElement("a");
            aPreview.href = data.url;
            aPreview.target="_blank";
            aPreview.alt = "Aperçu";
            aPreview.innerHTML = '<button style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505; cursor:pointer">👁</button>';
            tr.querySelector('.preview_btn').appendChild(aPreview);
        }
        ulWantedOverlays.appendChild(tr);
    }
    function appendUIKnownOverlays(ulKnownOverlays, id, data) {
        // Don't concat json data directly in innerHTML (prevent some injection attacks)
        zpoLog("appendUIKnownOverlays()");
        const btnDescriptionClick = "eventToggleKnownOverlayDescription('" + id + "')";
        const tr = document.createElement("tr");
        tr.id = 'avail-node-'+id;
        tr.style = "padding: 5px";
        tr.innerHTML= `
            <td class="action_add" style="justify-content:center; align-items:center;">
                <button id="btn-add-`+id+`"
                    style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505;cursor:pointer"
                    >+</button>
            </td>
            <td class="community_name"    style="padding: 5px; justify-content:center; align-items:center; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></td>
            <td class="community_twitch"  style="padding: 2px; justify-content:center; align-items:center;"></td>
            <td class="community_discord" style="padding: 2px; justify-content:center; align-items:center;"></td>
            <td class="thread_url"        style="padding: 2px; justify-content:center; align-items:center;"></td>
            <td class="description_btn"   style="padding: 2px 16px 2px 2px; justify-content:center; align-items:center;">
                   <button id="btn-description-`+id+`"
                       style="width:24px; height:24px; border-radius:12px; border:none; color: #fff; background-color:#050505; cursor:pointer"
                       >?</button>
            </td>`;
        let btnAdd = tr.querySelector('#btn-add-'+id);
        if (btnAdd) btnAdd.onclick = eventAddKnownOverlay;

        let btnDescription = tr.querySelector('#btn-description-'+id);
        if (btnDescription) btnDescription.onclick = eventToggleKnownOverlayDescription;

        if ( typeof data.community_name === "string" ) {
            const nodeCommunityName = document.createTextNode(data.community_name);
            tr.querySelector('.community_name').appendChild(nodeCommunityName);
        }
        if ( typeof data.community_twitch === "string" ) {
            const aTwitch = document.createElement("a");
            aTwitch.href = data.community_twitch;
            aTwitch.target="_blank";
            aTwitch.alt = "Twitch";
            aTwitch.innerHTML = twitchLogoSVG;
            tr.querySelector('.community_twitch').appendChild(aTwitch);
        }
        if ( typeof data.community_discord === "string" ) {
            const aDiscord= document.createElement("a");
            aDiscord.href = data.community_discord;
            aDiscord.target="_blank";
            aDiscord.alt = "Discord";
            aDiscord.innerHTML = discordLogoSVG;
            tr.querySelector('.community_discord').appendChild(aDiscord);
        }
        const aThread = document.createElement("a");
        aThread.href = data.thread_url;
        aThread.target="_blank";
        aThread.alt = "Fil";
        aThread.innerHTML = '<img height="24px" src="' + threadLogoB64 + '" alt="Fil Discord Commu ZEvent/Place"/></a></td>';
        tr.querySelector('.thread_url').appendChild(aThread);

        ulKnownOverlays.appendChild(tr);

        const tr2 = document.createElement("tr");
        tr2.id = 'desc-node-'+id;
        tr2.style = "padding: 5px; height: 0px";
        tr2.hidden = true;
        const td2 = document.createElement("td");
        td2.colSpan = "6";
        td2.style = "padding: 16px;";
        tr2.appendChild(td2);
        if ( typeof data.community_discord === "string" ) {
            const nodeDescription = document.createTextNode(data.description);
            td2.appendChild(nodeDescription);
        }
        ulKnownOverlays.appendChild(tr2);
    }
    function eventAddKnownOverlay(event) {
        zpoLog("eventAddKnownOverlay(event)");
        let btnId = event.target.id;
        let id = btnId.replace(/^btn-add-/, '');
        const availNode = document.querySelector('#avail-node-' + id);
        if (availNode) { availNode.style.height = "0px" };
        const data = knownOverlays[id];
        loadOverlay(data.overlay_url, data.community_name, id);
    }
    function eventAddCustomOverlay(event) {
        zpoLog("eventAddCustomOverlay(event)");
        const nodeInput = document.querySelector('#zevent-place-overlay-ui-input-url');
        const url = nodeInput.value;
        loadOverlay(url);
    }
    function eventDelOverlay(event) {
        zpoLog("eventDelOverlay(event)");
        let btnId = event.target.id;
        let id = btnId.replace(/^btn-del-/, '');
        delete wantedOverlays[id];
        refreshOverlays = true;
    }
    function eventToggleKnownOverlayDescription(event) {
        zpoLog("eventToggleKnownOverlayDescription(event)");
        let btnId = event.target.id;
        let id = btnId.replace(/^btn-description-/, '');
        const descriptionNode = document.querySelector('#desc-node-' + id);
        if (descriptionNode) {
            if ( descriptionNode.hidden ) {
                descriptionNode.style.height = '';
            } else {
                descriptionNode.style.height = '0px';
            }
            descriptionNode.hidden = !descriptionNode.hidden;
        }
    }
    function eventAskRefreshKnownOverlays(event) {
        if ( !safeModeDisableGetJSON && refreshKnownOverlaysState == 0) {
            zpoLog("eventAskRefreshKnownOverlays() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
            refreshKnownOverlaysState = 1;
            zpoLog("eventAskRefreshKnownOverlays() refreshKnownOverlaysState after:" + refreshKnownOverlaysState);
        }
    }
    function eventAskRefreshWantedOverlays(event) {
        // TODO stub eventAskRefreshWantedOverlays()
        zpoLog("eventAskRefreshWantedOverlays() STUB");
    }
    function appendOurCSS(origHead) {
        zpoLog("appendOurCSS()");
        const style = document.createElement("style");
        style.id = 'zevent-place-overlay-css';
        style.innerHTML = `/* nothing for now */`;
        origHead.appendChild(style);
    }
    function keepOurselfInDOM() {
        let origCanvas = document.querySelector('#place-canvas');
        if ( !origCanvas ) zpoLog("keepOurselfInDOM() origCanvas: " + origCanvas);

        let ourOverlays = document.querySelectorAll('.zevent-place-overlay-img');
        if ( origCanvas && (!ourOverlays.length || refreshOverlays ) ) {
            // Special skip case skip : if there is no wantedOverlay and no currently displayed overlay
            if ( !(wantedOverlays && Object.keys(wantedOverlays)==0 && ourOverlays.length == 0) ) {
                zpoLog("keepOurselfInDOM() origCanvas: " + !!origCanvas + ", ourOverlays: " + ourOverlays.length + ", refreshOverlays:" + refreshOverlays );
                reloadOverlays(origCanvas, ourOverlays);
                reloadUIWantedOverlays();
            }
        }
        if ( !safeModeDisableUI ) {
            /* Nothing for now
            let origHead = document.querySelector('head');
            if ( !origHead ) zpoLog("keepOurselfInDOM() origHead: " + !!origHead);
            let ourCSS = document.querySelector('#zevent-place-overlay-css');
            if ( origHead && !ourCSS ) {
                zpoLog("keepOurselfInDOM() origHead: " + !!origHead + ", ourCSS: " + !!ourCSS);
                appendOurCSS(origHead);
            }*/
            let origUI = document.querySelector('.place');
            if ( !origUI )zpoLog("keepOurselfInDOM() origUI: " + origUI);
            let ourUI = document.querySelector('#zevent-place-overlay-ui');
            if ( origUI && (!ourUI || ( refreshKnownOverlaysState == 1 ) ) ) {
                zpoLog("keepOurselfInDOM() origUI: " + !!origUI + ", ourUI: " + !!ourUI);
                appendOurUI(origUI);
                if ( safeModeDisableGetJSON ) {
                    reloadUIKnownOverlays(); // With local data (see knownOverlays at bottom of this script)
                } else {
                    zpoLog("keepOurselfInDOM() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
                    refreshKnownOverlaysState = 2;
                    zpoLog("keepOurselfInDOM() refreshKnownOverlaysState after:" + refreshKnownOverlaysState);
                    fetchKnownOverlays(); // Will call reloadUIKnownOverlays() when data is ready
                }
            }
        }
    }
    function fetchKnownOverlays() {
        // Try to load json from main url
        let xmlhttp1 = new XMLHttpRequest();
        let xmlhttp2 = new XMLHttpRequest();
        // Set a differed try from backup url
        setTimeout(function () {
            // If job already done while waiting this backup request to start, don't do anything
             zpoLog("fetchKnownOverlays() anon() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
            if ( refreshKnownOverlaysState != 2 ) {
                zpoLog("fetchKnownOverlays() finishRefreshKnownOverlaysState not in progress, skipping backup request");
                return;
            }
            refreshKnownOverlaysState = 3;
            zpoLog("fetchKnownOverlays() anon() refreshKnownOverlaysState after:" + refreshKnownOverlaysState);

            xmlhttp2.onreadystatechange = function() {
                zpoLog("fetchKnownOverlays() xmlhttp2 state: " + this.readyState + " status: " + this.status);
                if (this.readyState == 4 && this.status == 200 && processJsonResponse(this.responseText)) {
                    finishRefreshKnownOverlays(xmlhttp1);
                }
            };
            try {
                xmlhttp2.open("GET", overlayJSON2, true);
                xmlhttp2.send();
            } catch (error) {
                zpoLog("fetchKnownOverlays() xmlhttp2 Exception");
                console.error(error);
            }
        }, 5000);
        // Start the request from the main url
        xmlhttp1.onreadystatechange = function() {
            zpoLog("fetchKnownOverlays() xmlhttp1 state: " + this.readyState + " status: " + this.status);
            if (this.readyState == 4 && this.status == 200 && processJsonResponse(this.responseText)) {
                finishRefreshKnownOverlays(xmlhttp2);
            }
        };
        try {
            xmlhttp1.open("GET", overlayJSON1, true);
            xmlhttp1.send();
        } catch (error) {
            zpoLog("fetchKnownOverlays() xmlhttp1 Exception");
            console.error(error);
        }
    }
    function processJsonResponse(responseText) {
        zpoLog("processJsonResponse()");
        let data, checkedData;
        try {
            data = JSON.parse(responseText);
            checkedData = jsonSanityCheck(data);
        } catch (error) {
            zpoLog("processJsonResponse() Exception");
            console.error(error);
            return false;
        }
        if (!checkedData ) {
            zpoLog("processJsonResponse() checkedData is false");
            return false;
        }
        // If we are here, the data is safety checked and non-empty
        // Take the new data into account
        knownOverlays = checkedData;
        reloadUIKnownOverlays();
        // Refresh displayed time
        const spanTs = document.querySelector('#zevent-place-overlay-known-ts');
        if ( spanTs ) spanTs.innerHTML = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'});
        return true;
    }
    function jsonSanityCheck(data) {
        zpoLog("jsonSanityCheck(data)");
        let checkedData = {};
        if ( typeof data !== "object") return false;

        const dataIds = Object.keys(data);
        dataIds.forEach(function (id) {
            if ( typeof id !== "string" ) return;
            if ( !id.match(/^[0-9a-z-]+$/) ) return;
            const item = data[id];
            checkedData[id] = {
                id: id,
                community_name: textSanityFilter(item.community_name),
                community_twitch: urlSanityCheck(item.community_twitch),
                community_discord: urlSanityCheck(item.community_discord),
                thread_url: urlSanityCheck(item.thread_url),
                overlay_url: urlSanityCheck(item.overlay_url),
                description: textSanityFilter(item.description),
            }
        });
        return checkedData;
    }
    function urlSanityCheck(url) {
        if ( typeof url !== "string" ) return '#nonstring';
        let trimmedURL = url.replaceAll(/\s/g, '');
        if ( !trimmedURL.match(/^https?:\/\/[A-Za-z0-9\/_.-]+$/) ) {
            zpoLog("urlSanityCheck(url) invalid : " + url);
            return '#invalid';
        }
        return trimmedURL;
    }
    function textSanityFilter(text) {
        if ( typeof text !== "string" ) return '(invalid)';
        return text.replaceAll(/[^A-Za-z0-9çéèàêùûôÇÉÈÊÀùÛÔ ,;.:*!()?+-]/g, '');
    }
    function finishRefreshKnownOverlays(xmlhttpToCancel) {
        // We have successfully got and process the JSON, abort the other xmlhttp if it was running
        if (xmlhttpToCancel) { xmlhttpToCancel.abort() }
        // Keep track that we have finished
        zpoLog("fetchKnownOverlays() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
        refreshKnownOverlaysState = 4;
        zpoLog("fetchKnownOverlays() refreshKnownOverlaysState after:" + refreshKnownOverlaysState);
        setTimeout(function () {
            if ( refreshKnownOverlaysState == 4 ) {
                zpoLog("finishRefreshKnownOverlays() anon() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
                refreshKnownOverlaysState = 0;
                zpoLog("finishRefreshKnownOverlays() anon() refreshKnownOverlaysState before:" + refreshKnownOverlaysState);
            }
        }, 5000);
    }

    // Following embed data to not depend or generate trafic to external webservers
    const threadLogoB64 = "data:image/png;base64, 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";
    const twitchLogoSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24"><path fill="#ffffff" d="M21 3v11.74l-4.696 4.695h-3.913l-2.437 2.348H6.913v-2.348H3V6.13L4.227 3H21zm-1.565 1.565H6.13v11.74h3.13v2.347l2.349-2.348h4.695l3.13-3.13V4.565zm-3.13 3.13v4.696h-1.566V7.696h1.565zm-3.914 0v4.696h-1.565V7.696h1.565z"></path></svg>'
    const discordLogoSVG= '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 71 80"><path fill="#5865f2" d="M60.1045 13.8978C55.5792 11.8214 50.7265 10.2916 45.6527 9.41542C45.5603 9.39851 45.468 9.44077 45.4204 9.52529C44.7963 10.6353 44.105 12.0834 43.6209 13.2216C38.1637 12.4046 32.7345 12.4046 27.3892 13.2216C26.905 12.0581 26.1886 10.6353 25.5617 9.52529C25.5141 9.44359 25.4218 9.40133 25.3294 9.41542C20.2584 10.2888 15.4057 11.8186 10.8776 13.8978C10.8384 13.9147 10.8048 13.9429 10.7825 13.9795C1.57795 27.7309 -0.943561 41.1443 0.293408 54.3914C0.299005 54.4562 0.335386 54.5182 0.385761 54.5576C6.45866 59.0174 12.3413 61.7249 18.1147 63.5195C18.2071 63.5477 18.305 63.5139 18.3638 63.4378C19.7295 61.5728 20.9469 59.6063 21.9907 57.5383C22.0523 57.4172 21.9935 57.2735 21.8676 57.2256C19.9366 56.4931 18.0979 55.6 16.3292 54.5858C16.1893 54.5041 16.1781 54.304 16.3068 54.2082C16.679 53.9293 17.0513 53.6391 17.4067 53.3461C17.471 53.2926 17.5606 53.2813 17.6362 53.3151C29.2558 58.6202 41.8354 58.6202 53.3179 53.3151C53.3935 53.2785 53.4831 53.2898 53.5502 53.3433C53.9057 53.6363 54.2779 53.9293 54.6529 54.2082C54.7816 54.304 54.7732 54.5041 54.6333 54.5858C52.8646 55.6197 51.0259 56.4931 49.0921 57.2228C48.9662 57.2707 48.9102 57.4172 48.9718 57.5383C50.038 59.6034 51.2554 61.5699 52.5959 63.435C52.6519 63.5139 52.7526 63.5477 52.845 63.5195C58.6464 61.7249 64.529 59.0174 70.6019 54.5576C70.6551 54.5182 70.6887 54.459 70.6943 54.3942C72.1747 39.0791 68.2147 25.7757 60.1968 13.9823C60.1772 13.9429 60.1437 13.9147 60.1045 13.8978ZM23.7259 46.3253C20.2276 46.3253 17.3451 43.1136 17.3451 39.1693C17.3451 35.225 20.1717 32.0133 23.7259 32.0133C27.308 32.0133 30.1626 35.2532 30.1066 39.1693C30.1066 43.1136 27.28 46.3253 23.7259 46.3253ZM47.3178 46.3253C43.8196 46.3253 40.9371 43.1136 40.9371 39.1693C40.9371 35.225 43.7636 32.0133 47.3178 32.0133C50.9 32.0133 53.7545 35.2532 53.6986 39.1693C53.6986 43.1136 50.9 46.3253 47.3178 46.3253Z"/></svg>';
    /*
     * Following JSON is from URL you can found in global const overlayJSON
     * It is embed here in case of problems during getting it at runtime.
     * Use the bot commands on Discord mentionned in @description to publicly register an overlay in this json
     */
    let knownOverlays = {};

    // Run the script with delay, MutationObserver fail in some configs (race condition between this script and the original app)
    //setTimeout(keepOurselfInDOM, 100);
    let intervalID = setInterval(keepOurselfInDOM, 1000);
})();

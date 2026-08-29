// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.2.1
// @description  Please organize with other participants on Discord: https://discord.gg/sXe5aVW2jV ; Press H to hide/show again the overlay.
// @author       PiRDub, ludolpif, ventston
// @match        https://place.zevent.fr/*
// @match        https://zevent-place.4each.dev/s/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zevent.fr
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://raw.githubusercontent.com/Ventston/zevent-zplace-overlays/main/browser-script/zevent-place-overlay.user.js
// @updateURL    https://raw.githubusercontent.com/Ventston/zevent-zplace-overlays/main/browser-script/zevent-place-overlay.user.js
// @antifeature  tracking  Anonymous usage counts (script version, language, screen size, overlays loaded). No cookie, no personal data, self-hosted, and can be turned off in the settings panel.
// ==/UserScript==
/*
 * Script used as base, form MinusKube: https://greasyfork.org/fr/scripts/444833-z-place-overlay/code
 * Original and this code licence: MIT
 * Copyright 2021-2026 PiRDub, ludolpif, ventston
 * Thanks to : grewa, BunlanG|Baron for help on CSS
 */

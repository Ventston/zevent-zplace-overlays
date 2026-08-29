// ==UserScript==
// @name         zevent-place-overlay
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      4.2.0
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

(() => {
  // src/constants.js
  var version = GM_info.script.version;
  var scriptUpdateURL = GM_info.script.updateURL;
  var placeOrigin = "https://place.zevent.fr";
  var presenceAttribute = "data-zpo-version";
  var serverBase = "https://api-zevent-place.4each.dev";
  var overlaysJsonUrl = serverBase + "/overlays.json";
  var versionJsonUrl = "https://raw.githubusercontent.com/Ventston/zevent-zplace-overlays/dev/browser-script/version.json";
  var symbolsUrl = serverBase + "/symbols.json";
  var messagesJsonUrl = serverBase + "/messages.json";
  var analyticsUrl = "https://stats.4each.dev/api/send";
  var analyticsWebsiteId = "8c8f193b-5271-4e29-b27f-73b54725accc";
  var inviteDiscordURL = "https://discord.gg/sXe5aVW2jV";

  // src/utils.js
  var isNewerVersion = (remote, local) => {
    const parse = (v) => {
      const [main, pre] = v.split("-");
      return { nums: main.split(".").map(Number), pre };
    };
    const r = parse(remote);
    const l = parse(local);
    for (let i = 0; i < Math.max(r.nums.length, l.nums.length); i++) {
      const diff = (r.nums[i] || 0) - (l.nums[i] || 0);
      if (diff) return diff > 0;
    }
    if (r.pre && !l.pre) return false;
    if (!r.pre && l.pre) return true;
    if (r.pre && l.pre) return r.pre > l.pre;
    return false;
  };
  var zpoLog = (msg) => {
    const ts = (/* @__PURE__ */ new Date()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    console.log(ts + " [zevent-place-overlay] " + msg);
  };
  var idSanityCheck = (id) => {
    if (typeof id !== "string") return false;
    const trimmedId = id.replaceAll(/\s/g, "");
    if (!trimmedId.match(/^[A-Za-z0-9-]+$/)) {
      zpoLog("idSanityCheck(id) invalid : " + id);
      return false;
    }
    return trimmedId;
  };
  var coordSanityCheck = (value) => {
    const trimmed = String(value ?? "").replaceAll(/\s/g, "");
    if (!trimmed) return null;
    const coord = Number(trimmed);
    if (!Number.isInteger(coord) || coord < 0) {
      zpoLog("coordSanityCheck(value) invalid : " + value);
      return false;
    }
    return coord;
  };
  var urlSanityCheck = (url) => {
    if (!url) return null;
    if (typeof url !== "string") return "#nonstring";
    let trimmedURL = url.substring(0, 260).replaceAll(/\s/g, "");
    if (trimmedURL.includes("imgur.com") && !trimmedURL.includes(".png")) {
      const imgurId = trimmedURL.split("/").pop();
      trimmedURL = "https://i.imgur.com/" + imgurId + ".png";
    }
    if (!trimmedURL.match(
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    )) {
      zpoLog("urlSanityCheck(url) invalid : " + url);
      return "#invalid";
    }
    return trimmedURL;
  };

  // src/store.js
  var persistedKeys = {
    wantedOverlays: "selectedOverlays",
    enableSymbols: "enableSymbols",
    enableAnalytics: "enableAnalytics",
    showCustomInput: "showCustomInput",
    dismissedMessages: "dismissedMessages"
  };
  var config = new Proxy(
    {
      knownOverlays: [],
      wantedOverlays: GM_getValue("selectedOverlays", []),
      knownMessages: [],
      dismissedMessages: GM_getValue("dismissedMessages", []),
      enableSymbols: GM_getValue("enableSymbols", false),
      enableAnalytics: GM_getValue("enableAnalytics", true),
      showCustomInput: GM_getValue("showCustomInput", false)
    },
    {
      set(target, property, value) {
        target[property] = value;
        const key = persistedKeys[property];
        if (key) GM_setValue(key, value);
        return true;
      }
    }
  );

  // src/data-fetch.js
  var mapPublicOverlays = (data) => {
    if (!Array.isArray(data)) return false;
    const mapped = [];
    for (const item of data) {
      const id = idSanityCheck(item.id);
      if (id === false) continue;
      if (![item.x, item.y, item.width, item.height].every(Number.isInteger)) continue;
      if (item.width <= 0 || item.height <= 0) continue;
      if (typeof item.imageUrl !== "string") continue;
      mapped.push({
        id,
        slug: idSanityCheck(item.slug) || id,
        community_name: typeof item.name === "string" ? item.name : id,
        description: typeof item.description === "string" ? item.description : "",
        community_twitch: urlSanityCheck(item.twitchUrl),
        community_discord: urlSanityCheck(item.discordUrl),
        thread_url: urlSanityCheck(item.threadUrl),
        overlay_url: serverBase + item.imageUrl,
        overlay_colorblind_url: item.colorblindImageUrl ? serverBase + item.colorblindImageUrl : null,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        linked_ids: Array.isArray(item.linkedIds) ? item.linkedIds.map(idSanityCheck).filter(Boolean) : [],
        is_default: item.isDefault === true,
        updated_at: typeof item.updatedAt === "string" ? item.updatedAt : null
      });
    }
    return mapped;
  };
  var fetchKnownOverlays = async (force = false) => {
    try {
      const url = force ? overlaysJsonUrl + "?ts=" + Date.now() : overlaysJsonUrl;
      const res = await fetch(url, { cache: force ? "reload" : "default", signal: AbortSignal.timeout(5e3) });
      zpoLog("fetchKnownOverlays() status: " + res.status);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = mapPublicOverlays(await res.json());
      if (!data) zpoLog("fetchKnownOverlays() invalid data, knownOverlays unchanged");
      return data;
    } catch (error) {
      zpoLog("fetchKnownOverlays() Exception: " + error);
      return false;
    }
  };

  // src/links.js
  var isWanted = (wanted, id) => wanted.some((o) => o.id === id);
  var linkedToAdd = (overlay, known, wanted) => (overlay.linked_ids ?? []).filter((id) => id !== overlay.id && !isWanted(wanted, id)).map((id) => known.find((o) => o.id === id)).filter(Boolean);
  var newlyLinkedToAdd = (known, wanted) => {
    const toAdd = [];
    for (const active of wanted) {
      const fresh = known.find((o) => o.id === active.id);
      if (!fresh) continue;
      const before = active.linked_ids ?? [];
      for (const id of fresh.linked_ids ?? []) {
        if (before.includes(id) || isWanted(wanted, id) || isWanted(toAdd, id)) continue;
        const overlay = known.find((o) => o.id === id);
        if (overlay) toAdd.push(overlay);
      }
    }
    return toAdd;
  };
  var defaultsToAdd = (known, wanted) => known.filter((o) => o.is_default && !isWanted(wanted, o.id));
  var isRemovable = (overlay, known = []) => {
    if (!overlay) return true;
    if (overlay.is_default) return false;
    return !(overlay.linked_ids ?? []).some((id) => known.find((o) => o.id === id)?.is_default);
  };
  var groupToRemove = (overlay, wanted) => wanted.filter((o) => o.id === overlay?.id || (overlay?.linked_ids ?? []).includes(o.id));
  var linkedNames = (overlay, wanted) => (overlay.linked_ids ?? []).map((id) => wanted.find((o) => o.id === id)).filter(Boolean).map((o) => o.community_name);

  // src/analytics.js
  var buildPayload = (name, data) => ({
    type: "event",
    payload: {
      website: analyticsWebsiteId,
      hostname: location.hostname,
      url: "/" + version,
      screen: screen.width + "x" + screen.height,
      language: navigator.language,
      ...name && { name },
      ...data && { data }
    }
  });
  var trackingEnabled = () => Boolean(analyticsWebsiteId) && config.enableAnalytics;
  var overlayProps = (overlay) => overlay.id.startsWith("custom-") ? { overlay: "custom" } : { overlay: overlay.community_name || overlay.id, id: overlay.id };
  var track = (name, data) => {
    if (!trackingEnabled()) return;
    fetch(analyticsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(name, data)),
      keepalive: true
    }).catch((error) => zpoLog("track() Exception: " + error));
  };
  var trackDailyOverlays = () => {
    if (!trackingEnabled()) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (GM_getValue("analyticsLastDaily", "") === today) return;
    GM_setValue("analyticsLastDaily", today);
    for (const overlay of config.wantedOverlays) {
      track("overlay-active", overlayProps(overlay));
    }
  };

  // src/geometry.js
  var overlayGeometry = (overlay) => {
    const { x, y, width, height } = overlay;
    if (![x, y].every(Number.isInteger)) return null;
    const sized = [width, height].every(Number.isInteger) && width > 0 && height > 0;
    return { left: x + "px", top: y + "px", width: sized ? width : null, height: sized ? height : null };
  };

  // src/query.js
  var paramName = "overlay";
  var overlayKeysFromQuery = (search) => {
    const ids = new URLSearchParams(search).getAll(paramName).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean).map(idSanityCheck).filter(Boolean);
    return [...new Set(ids)];
  };
  var searchWithoutOverlays = (search) => {
    const params = new URLSearchParams(search);
    params.delete(paramName);
    const rest = params.toString();
    return rest ? "?" + rest : "";
  };

  // src/selectors.js
  var getOriginalCanvas = () => {
    return document.querySelector("#place-canvas");
  };
  var getOverlayParent = () => {
    const canvas = getOriginalCanvas();
    return canvas.parentElement;
  };
  var getPanelParent = () => {
    return document.querySelector("#root");
  };

  // src/overlay.js
  var refreshKnownOverlays = async (force = false) => {
    const newOverlays = await fetchKnownOverlays(force);
    if (newOverlays) {
      const freshlyLinked = newlyLinkedToAdd(newOverlays, config.wantedOverlays);
      config.knownOverlays = newOverlays;
      config.wantedOverlays = config.wantedOverlays.reduce((acc, overlay) => {
        const exists = config.knownOverlays.find((o) => o.id === overlay.id);
        if (exists) {
          acc.push(exists);
        } else if (overlay.id.startsWith("custom-")) {
          acc.push(overlay);
        }
        return acc;
      }, []);
      for (const overlay of freshlyLinked) {
        zpoLog("refreshKnownOverlays() newly linked: " + overlay.id);
        addWantedOverlay(overlay, false);
      }
      applyDefaultOverlays();
      reloadUIKnownOverlays();
      reloadUIWantedOverlays();
      reloadWantedOverlaysInDOM();
    }
    refreshDisplayTime(document.querySelector("#zevent-place-overlay-known-ts"));
  };
  function addWantedOverlay(overlay, withLinked = true) {
    if (!config.wantedOverlays.find((o) => o.id === overlay.id)) {
      config.wantedOverlays = [...config.wantedOverlays, overlay];
      track("overlay-add", overlayProps(overlay));
    }
    appendOverlayToDOM(overlay);
    appendUIWantedOverlay(overlay);
    if (!withLinked) return;
    const linked = linkedToAdd(overlay, config.knownOverlays, config.wantedOverlays);
    for (const other of linked) {
      zpoLog("addWantedOverlay() linked: " + other.id);
      addWantedOverlay(other, false);
      const availNode = document.getElementById("avail-node-" + other.id);
      if (availNode) availNode.hidden = true;
    }
    if (linked.length) reloadUIWantedOverlays();
  }
  function applyDefaultOverlays() {
    for (const overlay of defaultsToAdd(config.knownOverlays, config.wantedOverlays)) {
      zpoLog("applyDefaultOverlays() " + overlay.id);
      addWantedOverlay(overlay);
    }
  }
  function applyQueryOverlays() {
    const keys = overlayKeysFromQuery(location.search);
    if (!keys.length) return;
    let missing = false;
    for (const key of keys) {
      const overlay = config.knownOverlays.find((o) => o.slug === key || o.id === key);
      if (!overlay) {
        zpoLog("applyQueryOverlays() unknown overlay: " + key);
        missing = true;
        continue;
      }
      if (config.wantedOverlays.find((o) => o.id === overlay.id)) {
        zpoLog("applyQueryOverlays() already active: " + key);
        continue;
      }
      zpoLog("applyQueryOverlays() " + key);
      addWantedOverlay(overlay);
      const availNode = document.getElementById("avail-node-" + overlay.id);
      if (availNode) availNode.hidden = true;
    }
    if (!missing) {
      history.replaceState(null, "", location.pathname + searchWithoutOverlays(location.search) + location.hash);
    }
  }
  function fitOverlayOnCanvas(image) {
    zpoLog("fitOverlayOnCanvas()");
    const origCanvas = getOriginalCanvas();
    const nw = image.naturalWidth;
    const nh = image.naturalHeight;
    if (!nw || !nh) {
      zpoLog("fitOverlayOnCanvas() WARNING: no nw or nh: " + nw + "," + nh);
      return;
    }
    if (nw % 300 || nh % 300) {
      if (nw % 7 === 0 && nh % 7 === 0) {
        zpoLog("fitOverlayOnCanvas() nw,nh (div by 7): " + nw + "," + nh);
        image.width = nw / 7;
        image.height = nh / 7;
      } else {
        zpoLog(
          "fitOverlayOnCanvas() WARNING: adding image size that is not multiple of 300 or 7, badly exported overlay"
        );
        image.width = origCanvas.width;
        image.height = origCanvas.height;
      }
    } else {
      zpoLog("fitOverlayOnCanvas() nw,nh (div by 3): " + nw + "," + nh);
      image.width = nw / 3;
      image.height = nh / 3;
    }
    zpoLog("fitOverlayOnCanvas() width,height: " + image.width + "," + image.height);
  }
  function removeWantedOverlay(overlayId) {
    const overlay = config.wantedOverlays.find((o) => o.id === overlayId);
    if (!isRemovable(overlay, config.knownOverlays)) {
      zpoLog("removeWantedOverlay() denied, overlay is pinned by the organizers: " + overlayId);
      return;
    }
    for (const member of groupToRemove(overlay, config.wantedOverlays)) {
      if (member.id !== overlayId) zpoLog("removeWantedOverlay() group member: " + member.id);
      dropOverlay(member.id);
    }
    if (!overlay) dropOverlay(overlayId);
  }
  function dropOverlay(overlayId) {
    config.wantedOverlays = config.wantedOverlays.filter((o) => o.id !== overlayId);
    removeOverlayFromDOM(overlayId);
    const availNode = document.getElementById("avail-node-" + overlayId);
    if (availNode) {
      availNode.hidden = false;
    }
    const wantedNode = document.getElementById("wanted-node-" + overlayId);
    if (wantedNode) {
      wantedNode.remove();
    }
  }
  function appendOverlayToDOM(overlay) {
    if (!overlay || !overlay.overlay_url && !overlay.overlay_colorblind_url) return;
    let url = overlay.overlay_url;
    if (config.enableSymbols && overlay.overlay_colorblind_url) {
      url = overlay.overlay_colorblind_url;
    }
    zpoLog("appendOverlayInDOM() url: " + url);
    const image = document.createElement("img");
    const cacheKey = overlay.updated_at ? encodeURIComponent(overlay.updated_at) : "x";
    image.src = url + (url.includes("?") ? "&t=" : "?t=") + cacheKey;
    image.className = "zevent-place-overlay-img";
    image.id = "zpo-overlay-" + overlay.id;
    image.style = "background: none; position: absolute; left: 0px; top: 0px;z-index: 1000; pointer-events: none;";
    const geometry = overlayGeometry(overlay);
    if (geometry) {
      image.style.left = geometry.left;
      image.style.top = geometry.top;
      if (geometry.width) {
        image.width = geometry.width;
        image.height = geometry.height;
      }
    } else {
      image.onload = function(event) {
        fitOverlayOnCanvas(event.target);
      };
    }
    image.onerror = function() {
      zpoLog("appendOverlayInDOM() image.onerror for url: " + url);
      if (overlay.id.startsWith("custom-")) {
        removeWantedOverlay(overlay.id);
        alert("Impossible de charger l'overlay " + overlay.community_name + ", veuillez v\xE9rifier l'URL: " + url);
      }
    };
    const parent = getOverlayParent();
    if (parent) {
      parent.appendChild(image);
    }
  }
  function removeOverlayFromDOM(overlayId) {
    const img = document.getElementById("zpo-overlay-" + overlayId);
    if (img) {
      img.remove();
    }
  }
  function reloadWantedOverlaysInDOM() {
    zpoLog("reloadWantedOverlaysInDOM()");
    const existingImgs = document.querySelectorAll(".zevent-place-overlay-img");
    existingImgs.forEach((img) => img.remove());
    config.wantedOverlays.forEach((overlay) => {
      appendOverlayToDOM(overlay);
    });
  }

  // src/symbols.js
  var SYMBOL_H = 5;
  var SYMBOL_W = 5;
  var colors = [];
  var symbols = new Uint32Array([]);
  var paletteObserver = null;
  var getSymbols = async () => {
    try {
      const response = await fetch(symbolsUrl);
      if (!response.ok) return zpoLog("Couldn't get symbols" + response.statusText);
      const data = await response.json();
      const loadedSymbols = data.symbols;
      zpoLog("getSymbols() loadedSymbols: " + Object.keys(loadedSymbols).length);
      symbols = new Uint32Array(loadedSymbols);
      const { height, width } = data;
      if (height) SYMBOL_H = height;
      if (width) SYMBOL_W = width;
    } catch (error) {
      zpoLog("Couldn't get symbols: " + error);
      symbols = new Uint32Array([
        4897444,
        4756004,
        15241774,
        11065002,
        15269550,
        33209205,
        15728622,
        15658734,
        33226431,
        33391295,
        32641727,
        15589098,
        11516906,
        9760338,
        15399560,
        4685802,
        15587182,
        29206876,
        3570904,
        15259182,
        29224831,
        21427311,
        22511061,
        15161013,
        4667844,
        11392452,
        11375466,
        6812424,
        5225454,
        29197179,
        18285009,
        31850982,
        19267878,
        16236308,
        33481548,
        22708917,
        14352822,
        7847326,
        7652956,
        22501038,
        28457653,
        9179234,
        30349539,
        4685269,
        18295249,
        26843769,
        24483191,
        5211003,
        14829567,
        17971345,
        28873275,
        4681156,
        21392581,
        7460636,
        23013877,
        29010254,
        18846257,
        21825364,
        29017787,
        4357252,
        23057550,
        26880179,
        5242308,
        15237450
      ]);
      zpoLog("getSymbols() using fallback symbols");
    }
  };
  var createCanvasForSymbol = (symbolValue, size) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    ctx.clearRect(0, 0, size, size);
    const scale = Math.floor(size / SYMBOL_W);
    const offsetX = Math.floor((size - SYMBOL_W * scale) / 2);
    const offsetY = Math.floor((size - SYMBOL_H * scale) / 2);
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < SYMBOL_H; y++) {
      for (let x = 0; x < SYMBOL_W; x++) {
        const bitIndex = y * SYMBOL_W + x;
        const bit = symbolValue >>> bitIndex & 1;
        if (bit) {
          ctx.fillRect(offsetX + x * scale - 1, offsetY + y * scale - 1, scale + 2, scale + 2);
        }
      }
    }
    ctx.fillStyle = "#000000";
    for (let y = 0; y < SYMBOL_H; y++) {
      for (let x = 0; x < SYMBOL_W; x++) {
        const bitIndex = y * SYMBOL_W + x;
        const bit = symbolValue >>> bitIndex & 1;
        if (bit) {
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }
    return canvas;
  };
  var injectSymbols = () => {
    const palette = document.querySelector(".color-picker");
    if (!palette) return zpoLog("injectSymbols() palette not found");
    const colors2 = palette.querySelectorAll(".color");
    if (!colors2) return zpoLog("injectSymbols() colors not found");
    colors2.forEach((colorDiv, index) => {
      const prevSymbol = colorDiv.querySelector(".zevent-place-overlay-symbol");
      if (prevSymbol) prevSymbol.remove();
      const span = colorDiv.querySelector("span");
      const colorValue = parseInt(span.getAttribute("data-color"));
      const symbolValue = symbols[colorValue];
      if (symbolValue) {
        const canvas = createCanvasForSymbol(symbolValue, 18);
        canvas.className = "zevent-place-overlay-symbol";
        canvas.addEventListener("click", (e) => {
          e.stopPropagation();
          span.click();
        });
        colorDiv.appendChild(canvas);
      }
    });
  };
  var injectSymbolToSelectedColor = () => {
    const colorButton = document.querySelector(".color-button");
    if (!colorButton) return zpoLog("injectSymbolToSelectedColor() colorButton not found");
    const bgColor = colorButton.style.backgroundColor;
    if (!bgColor) return zpoLog("injectSymbolToSelectedColor() bgColor not found");
    const rgb = bgColor.match(/\d+/g);
    if (!rgb || rgb.length < 3) return zpoLog("injectSymbolToSelectedColor() rgb not found");
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);
    const hex = (r << 16 | g << 8 | b).toString(16);
    const colorValue = parseInt(hex, 16);
    const colorIndex = colors.findIndex(
      (color) => color.colorCode.toLowerCase() === ("#" + hex.padStart(6, "0")).toLowerCase()
    );
    if (colorIndex === -1) return zpoLog("injectSymbolToSelectedColor() colorIndex not found for color " + colorValue);
    const symbolValue = symbols[colorIndex];
    if (!symbolValue) return zpoLog("injectSymbolToSelectedColor() symbolValue not found for color " + colorValue);
    const prevSymbol = colorButton.querySelector(".zevent-place-overlay-symbol");
    if (prevSymbol) prevSymbol.remove();
    const canvas = createCanvasForSymbol(symbolValue, 24);
    canvas.className = "zevent-place-overlay-symbol";
    canvas.addEventListener("click", (e) => {
      e.stopPropagation();
      colorButton.click();
    });
    colorButton.appendChild(canvas);
  };
  var addPaletteObserver = () => {
    paletteObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "attributes") {
          if (mutation.attributeName === "aria-expanded") {
            const target = mutation.target;
            if (target.getAttribute("aria-expanded") === "true") {
              injectSymbols();
            }
          } else if (mutation.attributeName === "style") {
            injectSymbolToSelectedColor();
          }
        }
      }
    });
    const colorButton = document.querySelector(".color-button");
    if (colorButton) {
      paletteObserver.observe(colorButton, { attributes: true });
    } else {
      zpoLog("observer() colorButton not found");
      setTimeout(addPaletteObserver, 1e3);
    }
  };
  var getColors = async () => {
    const response = await fetch("https://place-api.zevent.fr/graphql", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
        Accept: "*/*",
        "Accept-Language": "fr-FR,en-US;q=0.7,en;q=0.3",
        "content-type": "application/json",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
      },
      referrer: "https://place.zevent.fr/",
      body: '{"operationName":"getAvailableColors","variables":{},"query":"query getAvailableColors {\\n  getAvailableColors {\\n    colorCode\\n    name\\n    __typename\\n  }\\n}"}',
      method: "POST"
    });
    if (!response.ok) return zpoLog("Couldn't get colors" + response.statusText);
    const data = await response.json();
    const loadedColors = data.data?.getAvailableColors;
    if (!loadedColors || loadedColors?.length === 0) {
      zpoLog("getColors() loadedColors is empty, using fallback colors");
      colors = [
        { colorCode: "#000000" },
        { colorCode: "#333434" },
        { colorCode: "#D4D7D9" },
        { colorCode: "#FFFFFF" },
        { colorCode: "#6D302F" },
        { colorCode: "#9C451A" },
        { colorCode: "#6D001A" },
        { colorCode: "#BE0027" },
        { colorCode: "#FF2651" },
        { colorCode: "#FF2D00" },
        { colorCode: "#FFA800" },
        { colorCode: "#FFB446" },
        { colorCode: "#FFD623" },
        { colorCode: "#FFF8B8" },
        { colorCode: "#7EED38" },
        { colorCode: "#00CC4E" },
        { colorCode: "#00A344" },
        { colorCode: "#598D5A" },
        { colorCode: "#004B6F" },
        { colorCode: "#009EAA" },
        { colorCode: "#00CCC0" },
        { colorCode: "#33E9F4" },
        { colorCode: "#5EB3FF" },
        { colorCode: "#245AEA" },
        { colorCode: "#313AC1" },
        { colorCode: "#1832A4" },
        { colorCode: "#511E9F" },
        { colorCode: "#6A5CFF" },
        { colorCode: "#de0a7f" },
        { colorCode: "#B44AC0" },
        { colorCode: "#FF63AA" },
        { colorCode: "#E4ABFF" }
      ];
    } else {
      colors = loadedColors;
      const index = colors.findIndex((color) => color.colorCode.toLowerCase() === "#33e9f4");
      if (index !== -1) {
        const index2 = colors.findIndex(
          (color, i) => color.colorCode.toLowerCase() === "#33e9f4" && i !== index
        );
        if (index2 !== -1) {
          colors[index2].colorCode = "#de0a7f";
        }
      }
    }
  };
  var changeEnabledSymbols = async (enabled) => {
    config.enableSymbols = enabled;
    track("symbols", { enabled });
    if (enabled) {
      zpoLog("Symbols enabled");
      await Promise.all([getSymbols(), getColors()]);
      addPaletteObserver();
      injectSymbolToSelectedColor();
    } else {
      zpoLog("Symbols disabled");
      if (paletteObserver) {
        paletteObserver.disconnect();
        paletteObserver = null;
      }
      const ourOverlays = document.querySelectorAll(".zevent-place-overlay-symbol");
      ourOverlays.forEach(function(e) {
        e.remove();
      });
    }
    reloadWantedOverlaysInDOM();
    reloadUIWantedOverlays();
  };
  var initSymbols = async () => {
    if (config.enableSymbols) {
      await Promise.all([getSymbols(), getColors()]);
      const initSelectedColor = () => {
        const colorButton = document.querySelector(".color-button");
        if (colorButton && colorButton.style.backgroundColor) {
          injectSymbolToSelectedColor();
          addPaletteObserver();
        } else {
          setTimeout(initSelectedColor, 1e3);
        }
      };
      initSelectedColor();
    }
  };

  // _dvokivjpu:src/template/panel.html
  var panel_default = `<div id="zevent-place-overlay-ui-head">\r
    <button id="zevent-place-overlay-ui-toggle" aria-expanded="false">\r
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"\r
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"\r
             class="lucide lucide-chevron-down-icon lucide-chevron-down">\r
            <path d="m6 9 6 6 6-6"/>\r
        </svg>\r
    </button>\r
    Overlays\r
    <span id="zevent-place-overlay-ui-version" style="font-size: 70%; padding-left: 1em"></span>\r
    <div class="zpo-head-actions">\r
        <button id="btn-settings" aria-expanded="false" title="Param\xE8tres">\r
            <svg\r
                    xmlns="http://www.w3.org/2000/svg"\r
                    width="16"\r
                    height="16"\r
                    viewBox="0 0 24 24"\r
                    fill="none"\r
                    stroke="currentColor"\r
                    stroke-width="2"\r
                    stroke-linecap="round"\r
                    stroke-linejoin="round"\r
            >\r
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>\r
                <circle cx="12" cy="12" r="3"/>\r
            </svg>\r
        </button>\r
        <a href="{{scriptUpdateURL}}" alt="Update" target="_blank">\r
            <button title="Mettre \xE0 jour le script">\r
                <svg\r
                        xmlns="http://www.w3.org/2000/svg"\r
                        width="16"\r
                        height="16"\r
                        viewBox="0 0 24 24"\r
                        fill="none"\r
                        stroke="currentColor"\r
                        stroke-width="2"\r
                        stroke-linecap="round"\r
                        stroke-linejoin="round"\r
                >\r
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>\r
                    <path d="M21 3v5h-5"/>\r
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>\r
                    <path d="M8 16H3v5"/>\r
                </svg>\r
            </button>\r
        </a>\r
    </div>\r
</div>\r
<div id="newUpdate"></div>\r
<div id="zpo-messages"></div>\r
<div id="zevent-place-overlay-ui-body" aria-expanded="false">\r
    <div style="display: flex; align-items: baseline; padding-top: 10px; gap: 8px">\r
        <label for="enableSymbolsCheckbox">Activer les symboles (mode daltonien)</label>\r
        <input type="checkbox" id="enableSymbolsCheckbox"/>\r
    </div>\r
    <div id="zevent-place-overlay-ui-overlaylist">\r
        <div class="form-group" id="zpo-custom-add">\r
            <label for="zevent-place-overlay-ui-input-url">Ajout via URL</label>\r
            <div class="form-row">\r
                <input\r
                        id="zevent-place-overlay-ui-input-url"\r
                        name="zevent-place-overlay-ui-input-url"\r
                        type="text"\r
                        placeholder="https://un-site.com/un-lien-permanent.png"\r
                />\r
            </div>\r
            <div class="form-row" style="padding-top: 8px">\r
                <input\r
                        id="zevent-place-overlay-ui-input-x"\r
                        name="zevent-place-overlay-ui-input-x"\r
                        type="number"\r
                        min="0"\r
                        step="1"\r
                        placeholder="X"\r
                        title="Position X sur le canvas (optionnel)"\r
                />\r
                <input\r
                        id="zevent-place-overlay-ui-input-y"\r
                        name="zevent-place-overlay-ui-input-y"\r
                        type="number"\r
                        min="0"\r
                        step="1"\r
                        placeholder="Y"\r
                        title="Position Y sur le canvas (optionnel)"\r
                />\r
                <button id="btn-custom-add" title="Ajouter l'overlay">\r
                    <svg\r
                            xmlns="http://www.w3.org/2000/svg"\r
                            width="16"\r
                            height="16"\r
                            viewBox="0 0 24 24"\r
                            fill="none"\r
                            stroke="currentColor"\r
                            stroke-width="2"\r
                            stroke-linecap="round"\r
                            stroke-linejoin="round"\r
                    >\r
                        <path d="M5 12h14"/>\r
                        <path d="M12 5v14"/>\r
                    </svg>\r
                </button>\r
            </div>\r
        </div>\r
        <hr id="zpo-custom-add-sep"/>\r
        <div>\r
            <div class="zpo-section-title">\r
                <span\r
                >Overlays actifs\r
                    <span\r
                            id="zevent-place-overlay-wanted-ts"\r
                            style="font-size: 70%; padding-left: 1em"\r
                    ></span\r
                    ></span>\r
                <button id="btn-refresh-wanted">\r
                    <svg\r
                            xmlns="http://www.w3.org/2000/svg"\r
                            width="16"\r
                            height="16"\r
                            viewBox="0 0 24 24"\r
                            fill="none"\r
                            stroke="currentColor"\r
                            stroke-width="2"\r
                            stroke-linecap="round"\r
                            stroke-linejoin="round"\r
                    >\r
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>\r
                        <path d="M21 3v5h-5"/>\r
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>\r
                        <path d="M8 16H3v5"/>\r
                    </svg>\r
                </button>\r
            </div>\r
\r
            <div\r
                    id="zevent-place-overlay-ui-list-wanted-overlays"\r
                    style="display: flex; flex-direction: column; gap: 4px"\r
            ></div>\r
        </div>\r
        <hr/>\r
        <div>\r
            <div class="zpo-section-title">\r
                <span\r
                >Overlays disponibles\r
                    <span\r
                            id="zevent-place-overlay-known-ts"\r
                            style="font-size: 70%; padding-left: 1em"\r
                    ></span\r
                    ></span>\r
                <button id="btn-refresh-known">\r
                    <svg\r
                            xmlns="http://www.w3.org/2000/svg"\r
                            width="16"\r
                            height="16"\r
                            viewBox="0 0 24 24"\r
                            fill="none"\r
                            stroke="currentColor"\r
                            stroke-width="2"\r
                            stroke-linecap="round"\r
                            stroke-linejoin="round"\r
                    >\r
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>\r
                        <path d="M21 3v5h-5"/>\r
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>\r
                        <path d="M8 16H3v5"/>\r
                    </svg>\r
                </button>\r
            </div>\r
            <div class="zpo-section-subtitle">\r
                G\xE9r\xE9s sur le\r
                <a\r
                        href="{{inviteDiscordURL}}"\r
                        alt="Invitation Discord"\r
                        target="_blank"\r
                        style="text-decoration: underline"\r
                >Discord Commu ZEvent/Place\r
                </a>\r
            </div>\r
        </div>\r
        <div class="form-group">\r
            <input id="zevent-place-overlay-search" placeholder="Chercher des overlays"/>\r
        </div>\r
        <div id="zevent-place-overlay-ui-list-known-overlays"></div>\r
    </div>\r
</div>\r
`;

  // _dvokivjpu:src/template/settings.html
  var settings_default = `<div id="zpo-settings-panel" aria-expanded="false">\r
    <div class="zpo-settings-head">\r
        <span>Param\xE8tres</span>\r
        <button id="btn-settings-close" title="Fermer">\r
            <svg\r
                xmlns="http://www.w3.org/2000/svg"\r
                width="16"\r
                height="16"\r
                viewBox="0 0 24 24"\r
                fill="none"\r
                stroke="currentColor"\r
                stroke-width="2"\r
                stroke-linecap="round"\r
                stroke-linejoin="round"\r
            >\r
                <path d="M18 6 6 18" />\r
                <path d="m6 6 12 12" />\r
            </svg>\r
        </button>\r
    </div>\r
    <div class="zpo-settings-row">\r
        <label for="showCustomInputCheckbox">Afficher l'ajout via URL</label>\r
        <input type="checkbox" id="showCustomInputCheckbox" />\r
    </div>\r
    <div class="zpo-settings-row">\r
        <label for="enableAnalyticsCheckbox">Statistiques d'usage anonymes</label>\r
        <input type="checkbox" id="enableAnalyticsCheckbox" />\r
    </div>\r
    <p class="zpo-settings-note">\r
        Pour savoir combien de personnes utilisent le script et quels overlays sont les plus charg\xE9s.\r
    </p>\r
    <p class="zpo-settings-note">\r
        <strong>Envoy\xE9</strong> : version du script, langue et taille de l'\xE9cran, nom des overlays que vous chargez. Les\r
        overlays perso sont compt\xE9s sans leur URL.\r
    </p>\r
    <p class="zpo-settings-note">\r
        <strong>Jamais envoy\xE9</strong> : vos pixels, vos coordonn\xE9es, votre compte ZEvent. Pas de cookie ; votre IP sert\r
        seulement \xE0 compter les visites uniques c\xF4t\xE9 serveur, elle n'est pas conserv\xE9e. Statistiques auto-h\xE9berg\xE9es,\r
        jamais partag\xE9es.\r
    </p>\r
</div>\r
`;

  // _dvokivjpu:src/template/knownOverlay.html
  var knownOverlay_default = '<div class="action_add">\r\n    <button id="btn-add-{{overlayId}}">\r\n        <svg\r\n            xmlns="http://www.w3.org/2000/svg"\r\n            width="16"\r\n            height="16"\r\n            viewBox="0 0 24 24"\r\n            fill="none"\r\n            stroke="currentColor"\r\n            stroke-width="2"\r\n            stroke-linecap="round"\r\n            stroke-linejoin="round"\r\n        >\r\n            <path d="M5 12h14" />\r\n            <path d="M12 5v14" />\r\n        </svg>\r\n    </button>\r\n</div>\r\n<div class="community_name zpo-overlay-title">\r\n    <span title="{{title}}">{{title}}</span>\r\n</div>\r\n<div class="zpo-wrapper-actions">\r\n    {{#if threadUrl}}\r\n    <div>\r\n        <a href="{{threadUrl}}" target="_blank" title="Ouvrir le fil de discussion Discord">\r\n            <button class="secondary">\r\n                <svg\r\n                    xmlns="http://www.w3.org/2000/svg"\r\n                    width="16"\r\n                    height="16"\r\n                    fill="currentColor"\r\n                    class="bi bi-discord"\r\n                    viewBox="0 0 16 16"\r\n                >\r\n                    <path\r\n                        d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"\r\n                    />\r\n                </svg>\r\n            </button>\r\n        </a>\r\n    </div>\r\n    {{/if}} {{#if description}}\r\n    <div class="description_btn">\r\n        <button id="btn-description-{{overlayId}}">\r\n            <svg\r\n                xmlns="http://www.w3.org/2000/svg"\r\n                width="16"\r\n                height="16"\r\n                viewBox="0 0 24 24"\r\n                fill="none"\r\n                stroke="currentColor"\r\n                stroke-width="2"\r\n                stroke-linecap="round"\r\n                stroke-linejoin="round"\r\n            >\r\n                <circle cx="12" cy="12" r="10" />\r\n                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />\r\n                <path d="M12 17h.01" />\r\n            </svg>\r\n        </button>\r\n    </div>\r\n    {{/if}}\r\n</div>\r\n';

  // _dvokivjpu:src/template/wantedOverlay.html
  var wantedOverlay_default = `<div class="action_del" style="display: flex; justify-content: center; align-items: center; flex-shrink: 0">\r
    {{#if pinned}}\r
    <span class="zpo-pinned" title="Overlay mis en avant par l'organisation : il ne peut pas \xEAtre retir\xE9">\u{1F4CC}</span>\r
    {{/if}} {{#if removable}}\r
    <button id="btn-del-{{overlayId}}">\r
        <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            width="24"\r
            height="24"\r
            viewBox="0 0 24 24"\r
            fill="none"\r
            stroke="currentColor"\r
            stroke-width="2"\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            class="lucide lucide-minus-icon lucide-minus"\r
        >\r
            <path d="M5 12h14" />\r
        </svg>\r
    </button>\r
    {{/if}}\r
</div>\r
<div class="zpo-overlay-title">\r
    <span title="{{title}}">{{title}}</span>\r
    {{#if linkedTo}}\r
    <span class="zpo-linked" title="Groupe li\xE9 : s'active et se retire avec {{linkedTo}}">\r
        <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            width="24"\r
            height="24"\r
            viewBox="0 0 24 24"\r
            fill="none"\r
            stroke="currentColor"\r
            stroke-width="2"\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            class="lucide lucide-link-icon lucide-link"\r
        >\r
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />\r
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />\r
        </svg>\r
    </span>\r
    {{/if}}\r
</div>\r
<div class="zpo-wrapper-actions">\r
    {{#if threadUrl}}\r
    <div>\r
        <a href="{{threadUrl}}" target="_blank" title="Ouvrir le fil de discussion Discord">\r
            <button class="secondary">\r
                <svg\r
                    xmlns="http://www.w3.org/2000/svg"\r
                    width="16"\r
                    height="16"\r
                    fill="currentColor"\r
                    class="bi bi-discord"\r
                    viewBox="0 0 16 16"\r
                >\r
                    <path\r
                        d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"\r
                    />\r
                </svg>\r
            </button>\r
        </a>\r
    </div>\r
    {{/if}}\r
    <div class="preview_btn">\r
        <a href="{{overlayUrl}}" target="_blank" title="Ouvrir l'overlay dans un nouvel onglet">\r
            <button class="secondary">\r
                <svg\r
                    xmlns="http://www.w3.org/2000/svg"\r
                    width="24"\r
                    height="24"\r
                    viewBox="0 0 24 24"\r
                    fill="none"\r
                    stroke="currentColor"\r
                    stroke-width="2"\r
                    stroke-linecap="round"\r
                    stroke-linejoin="round"\r
                    class="lucide lucide-external-link-icon lucide-external-link"\r
                >\r
                    <path d="M15 3h6v6" />\r
                    <path d="M10 14 21 3" />\r
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />\r
                </svg>\r
            </button>\r
        </a>\r
    </div>\r
    <button id="show-hide-{{overlayId}}" class="zpo-btn-show-hide" title="Afficher/Masquer" data-shown="true">\r
        <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            width="24"\r
            height="24"\r
            viewBox="0 0 24 24"\r
            fill="none"\r
            stroke="currentColor"\r
            stroke-width="2"\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            class="lucide lucide-eye-icon eye"\r
        >\r
            <path\r
                d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"\r
            />\r
            <circle cx="12" cy="12" r="3" />\r
        </svg>\r
        <svg\r
            xmlns="http://www.w3.org/2000/svg"\r
            width="24"\r
            height="24"\r
            viewBox="0 0 24 24"\r
            fill="none"\r
            stroke="currentColor"\r
            stroke-width="2"\r
            stroke-linecap="round"\r
            stroke-linejoin="round"\r
            class="lucide lucide-eye-closed-icon eye-closed"\r
        >\r
            <path d="m15 18-.722-3.25" />\r
            <path d="M2 8a10.645 10.645 0 0 0 20 0" />\r
            <path d="m20 15-1.726-2.05" />\r
            <path d="m4 15 1.726-2.05" />\r
            <path d="m9 18 .722-3.25" />\r
        </svg>\r
    </button>\r
</div>\r
`;

  // _dvokivjpu:src/template/overlayDescription.html
  var overlayDescription_default = '{{#if description}}\r\n<div id="desc-node-{{overlayId}}" class="zpo-overlay-description" aria-expanded="false">{{description}}</div>\r\n{{/if}}\r\n';

  // _dvokivjpu:src/template/update.html
  var update_default = '<a class="zpo-update" href="{{scriptUpdateURL}}" title="Mettre \xE0 jour le script" target="_blank" rel="noopener">\r\n    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"\r\n         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"\r\n         class="lucide lucide-download-icon lucide-download">\r\n        <path d="M12 15V3"/>\r\n        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>\r\n        <path d="m7 10 5 5 5-5"/>\r\n    </svg>\r\n    Nouvelle version : v{{newVersion}}\r\n</a>\r\n';

  // _dvokivjpu:src/template/message.html
  var message_default = '<div class="zpo-message" data-level="{{level}}">\r\n    <svg class="zpo-icon-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24"\r\n         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"\r\n         stroke-linejoin="round">\r\n        <circle cx="12" cy="12" r="10"/>\r\n        <path d="M12 16v-4"/>\r\n        <path d="M12 8h.01"/>\r\n    </svg>\r\n    <svg class="zpo-icon-warning" xmlns="http://www.w3.org/2000/svg" width="24" height="24"\r\n         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"\r\n         stroke-linejoin="round">\r\n        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>\r\n        <path d="M12 9v4"/>\r\n        <path d="M12 17h.01"/>\r\n    </svg>\r\n    <svg class="zpo-icon-critical" xmlns="http://www.w3.org/2000/svg" width="24" height="24"\r\n         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"\r\n         stroke-linejoin="round">\r\n        <path d="M12 16h.01"/>\r\n        <path d="M12 8v4"/>\r\n        <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z"/>\r\n    </svg>\r\n    <div class="zpo-message-body">\r\n        <span class="zpo-message-content">{{content}}</span>\r\n        {{#if linkUrl}}\r\n        <a class="zpo-message-link" href="{{linkUrl}}" target="_blank" rel="noopener">{{linkLabel}}</a>\r\n        {{/if}}\r\n    </div>\r\n    {{#if dismissible}}\r\n    <button class="zpo-message-close" data-zpo-dismiss="{{key}}" title="Masquer ce message">\r\n        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"\r\n             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\r\n            <path d="M18 6 6 18"/>\r\n            <path d="m6 6 12 12"/>\r\n        </svg>\r\n    </button>\r\n    {{/if}}\r\n</div>\r\n';

  // src/ui.js
  var escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  var replaceValuesInHtml = (html, values) => {
    for (const key in values) {
      const regex = new RegExp(`{{${key}}}`, "g");
      const replacement = escapeHtml(values[key] || "");
      html = html.replace(regex, () => replacement);
    }
    html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, conditionKey, content) => {
      const conditionValue = values[conditionKey];
      return conditionValue && conditionValue !== "" && conditionValue !== null && conditionValue !== void 0 ? content : "";
    });
    return html;
  };
  var templates = {
    "main-ui": panel_default,
    settings: settings_default,
    "wanted-overlay": wantedOverlay_default,
    "known-overlay": knownOverlay_default,
    "overlay-description": overlayDescription_default,
    "update": update_default,
    "message": message_default
  };
  var syncBannerHeight = () => {
    const head = document.querySelector("#zevent-place-overlay-ui-head");
    const body = document.querySelector("#zevent-place-overlay-ui-body");
    if (!head || !body) return;
    const gap = body.getBoundingClientRect().top - head.getBoundingClientRect().bottom;
    body.style.setProperty("--zpo-banners", Math.max(0, Math.round(gap)) + "px");
  };
  var renderTemplate = (templateName, values = {}) => {
    const template = templates[templateName];
    if (!template) {
      zpoLog(`Error - Template ${templateName} not found`);
      return "";
    }
    return replaceValuesInHtml(template, values);
  };

  // src/version.js
  var checkVersion = async () => {
    try {
      const response = await fetch(versionJsonUrl + "?t=" + Date.now());
      if (!response.ok) return zpoLog("Couldn't get version.json");
      const { version: newVersion } = await response.json();
      const newVersionElement = document.getElementById("newUpdate");
      if (!newVersionElement) return;
      if (isNewerVersion(newVersion, version)) {
        newVersionElement.innerHTML = renderTemplate("update", { scriptUpdateURL, newVersion });
        newVersionElement.style.display = "block";
      } else {
        newVersionElement.innerHTML = "";
        newVersionElement.style.display = "none";
      }
      syncBannerHeight();
    } catch (err) {
      zpoLog("Couldn't get version: " + err);
    }
  };

  // src/messages.js
  var LEVELS = ["info", "warning", "critical"];
  var MAX_CONTENT = 500;
  var timestamp = (value) => {
    if (typeof value !== "string") return null;
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : ms;
  };
  var mapPublicMessages = (data) => {
    if (!Array.isArray(data)) return false;
    const mapped = [];
    for (const item of data) {
      const id = idSanityCheck(item.id);
      if (id === false) continue;
      if (typeof item.content !== "string" || !item.content.trim()) continue;
      const url = urlSanityCheck(item.linkUrl);
      const label = typeof item.linkLabel === "string" ? item.linkLabel.trim() : "";
      const withLink = url !== null && !url.startsWith("#") && label !== "";
      mapped.push({
        id,
        key: id + ":" + (typeof item.updatedAt === "string" ? item.updatedAt : ""),
        level: LEVELS.includes(item.level) ? item.level : "info",
        content: item.content.trim().slice(0, MAX_CONTENT),
        link_url: withLink ? url : null,
        link_label: withLink ? label : null,
        dismissible: item.dismissible !== false,
        starts_at: timestamp(item.startsAt),
        ends_at: timestamp(item.endsAt)
      });
    }
    return mapped;
  };
  var visibleMessages = (messages, now, dismissed) => messages.filter(
    (m) => (m.starts_at === null || m.starts_at <= now) && (m.ends_at === null || m.ends_at > now) && !(m.dismissible && dismissed.includes(m.key))
  );
  var fetchMessages = async () => {
    try {
      const res = await fetch(messagesJsonUrl, { signal: AbortSignal.timeout(5e3) });
      zpoLog("fetchMessages() status: " + res.status);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = mapPublicMessages(await res.json());
      if (!data) zpoLog("fetchMessages() invalid data, knownMessages unchanged");
      return data;
    } catch (error) {
      zpoLog("fetchMessages() Exception: " + error);
      return false;
    }
  };
  var renderMessages = () => {
    const container = document.querySelector("#zpo-messages");
    if (!container) return;
    const visible = visibleMessages(config.knownMessages, Date.now(), config.dismissedMessages);
    zpoLog("renderMessages() " + visible.length + "/" + config.knownMessages.length + " message(s)");
    container.innerHTML = visible.map(
      (m) => renderTemplate("message", {
        key: m.key,
        level: m.level,
        content: m.content,
        linkUrl: m.link_url,
        linkLabel: m.link_label,
        dismissible: m.dismissible ? "yes" : ""
      })
    ).join("");
    container.querySelectorAll("[data-zpo-dismiss]").forEach((btn) => {
      btn.onclick = () => dismissMessage(btn.dataset.zpoDismiss);
    });
    syncBannerHeight();
  };
  var dismissMessage = (key) => {
    zpoLog("dismissMessage() " + key);
    if (!config.dismissedMessages.includes(key)) {
      config.dismissedMessages = [...config.dismissedMessages, key];
    }
    renderMessages();
  };
  var refreshMessages = async () => {
    const messages = await fetchMessages();
    if (messages) {
      config.knownMessages = messages;
      const keys = messages.map((m) => m.key);
      const kept = config.dismissedMessages.filter((k) => keys.includes(k));
      if (kept.length !== config.dismissedMessages.length) {
        config.dismissedMessages = kept;
      }
    }
    renderMessages();
  };

  // src/panel.js
  function appendOurUI() {
    zpoLog("appendOurUI()");
    const origUI = getPanelParent();
    const ourUI = document.createElement("div");
    ourUI.id = "zevent-place-overlay-ui";
    ourUI.innerHTML = renderTemplate("main-ui", {
      scriptUpdateURL,
      inviteDiscordURL
    });
    ourUI.insertAdjacentHTML("beforeend", renderTemplate("settings"));
    const btnToggle = ourUI.querySelector("#zevent-place-overlay-ui-toggle");
    const body = ourUI.querySelector("#zevent-place-overlay-ui-body");
    if (btnToggle && body) {
      btnToggle.onclick = () => setExpanded(btnToggle, body, body.getAttribute("aria-expanded") !== "true");
    }
    const btnSettings = ourUI.querySelector("#btn-settings");
    const settings = ourUI.querySelector("#zpo-settings-panel");
    if (btnSettings && settings) {
      btnSettings.onclick = () => setExpanded(btnSettings, settings, settings.getAttribute("aria-expanded") !== "true");
      const btnCloseSettings = ourUI.querySelector("#btn-settings-close");
      if (btnCloseSettings) btnCloseSettings.onclick = () => setExpanded(btnSettings, settings, false);
    }
    const btnAdd = ourUI.querySelector("#btn-custom-add");
    if (btnAdd) btnAdd.onclick = eventAddCustomOverlay;
    const btnAskRefreshWantedOverlays = ourUI.querySelector("#btn-refresh-wanted");
    if (btnAskRefreshWantedOverlays) btnAskRefreshWantedOverlays.onclick = reloadWantedOverlaysInDOM;
    const btnAskRefreshKnownOverlays = ourUI.querySelector("#btn-refresh-known");
    if (btnAskRefreshKnownOverlays) btnAskRefreshKnownOverlays.onclick = () => refreshKnownOverlays(true);
    const versionSpan = ourUI.querySelector("#zevent-place-overlay-ui-version");
    if (versionSpan) {
      versionSpan.innerHTML = "v" + version;
    }
    const searchInput = ourUI.querySelector("#zevent-place-overlay-search");
    if (searchInput) {
      searchInput.oninput = searchOverlays;
    }
    const enableSymbolsCheckbox = ourUI.querySelector("#enableSymbolsCheckbox");
    if (enableSymbolsCheckbox) {
      enableSymbolsCheckbox.checked = config.enableSymbols;
      enableSymbolsCheckbox.onchange = (e) => {
        changeEnabledSymbols(e.target.checked);
      };
    }
    const enableAnalyticsCheckbox = ourUI.querySelector("#enableAnalyticsCheckbox");
    if (enableAnalyticsCheckbox) {
      enableAnalyticsCheckbox.checked = config.enableAnalytics;
      enableAnalyticsCheckbox.onchange = (e) => {
        config.enableAnalytics = e.target.checked;
      };
    }
    const customAdd = [ourUI.querySelector("#zpo-custom-add"), ourUI.querySelector("#zpo-custom-add-sep")];
    const showCustomInputCheckbox = ourUI.querySelector("#showCustomInputCheckbox");
    if (showCustomInputCheckbox) {
      const applyCustomAdd = (shown) => customAdd.forEach((node) => node && (node.hidden = !shown));
      showCustomInputCheckbox.checked = config.showCustomInput;
      applyCustomAdd(config.showCustomInput);
      showCustomInputCheckbox.onchange = (e) => {
        config.showCustomInput = e.target.checked;
        applyCustomAdd(e.target.checked);
      };
    }
    origUI.appendChild(ourUI);
    reloadUIWantedOverlays();
    reloadUIKnownOverlays();
    renderMessages();
    checkVersion();
  }
  function setExpanded(btn, target, expanded) {
    target.setAttribute("aria-expanded", String(expanded));
    btn.setAttribute("aria-expanded", String(expanded));
  }
  function eventAddCustomOverlay() {
    zpoLog("eventAddCustomOverlay()");
    const nodeInput = document.querySelector("#zevent-place-overlay-ui-input-url");
    const url = nodeInput.value;
    const checkedUrl = urlSanityCheck(url);
    if (!checkedUrl) {
      alert("URL invalide");
      return;
    }
    const x = coordSanityCheck(document.querySelector("#zevent-place-overlay-ui-input-x").value);
    const y = coordSanityCheck(document.querySelector("#zevent-place-overlay-ui-input-y").value);
    if (x === false || y === false) {
      alert("Position invalide : X et Y doivent \xEAtre des entiers positifs");
      return;
    }
    if (x === null !== (y === null)) {
      alert("Position incompl\xE8te : renseignez X et Y, ou laissez les deux vides");
      return;
    }
    const id = Date.now().toString(36);
    const overlay = {
      id: "custom-" + id,
      overlay_url: checkedUrl,
      community_name: "Custom " + id,
      description: "Ajout\xE9 manuellement"
    };
    if (x !== null) {
      overlay.x = x;
      overlay.y = y;
    }
    addWantedOverlay(overlay);
  }
  function searchOverlays(e) {
    const search = e.target.value.toLowerCase();
    zpoLog("searchOverlays :" + search);
    config.knownOverlays.forEach(function(overlay) {
      const node = document.getElementById("avail-node-" + overlay.id);
      if (!node) return;
      node.hidden = !(overlay.community_name.toLowerCase().includes(search) || overlay.description.toLowerCase().includes(search));
    });
  }
  function appendUIWantedOverlay(overlay) {
    zpoLog("appendUIWantedOverlays()");
    const ulWantedOverlays = document.querySelector("#zevent-place-overlay-ui-list-wanted-overlays");
    if (!ulWantedOverlays) return;
    const tr = document.createElement("div");
    tr.id = "wanted-node-" + overlay.id;
    tr.className = "zpo-overlay-line";
    tr.innerHTML = renderTemplate("wanted-overlay", {
      overlayId: overlay.id,
      overlayUrl: config.enableSymbols ? overlay.overlay_colorblind_url ?? overlay.overlay_url : overlay.overlay_url,
      threadUrl: overlay.thread_url,
      title: overlay.community_name,
      linkedTo: linkedNames(overlay, config.wantedOverlays).join(", "),
      removable: isRemovable(overlay, config.knownOverlays),
      pinned: !isRemovable(overlay, config.knownOverlays)
    });
    const btnDel = tr.querySelector("#btn-del-" + overlay.id);
    if (btnDel)
      btnDel.onclick = () => {
        removeWantedOverlay(overlay.id);
      };
    const showHideBtn = tr.querySelector(".zpo-btn-show-hide");
    if (showHideBtn) {
      showHideBtn.onclick = () => {
        const ourOverlay = document.querySelector("#zpo-overlay-" + overlay.id);
        if (ourOverlay) {
          const isHidden = ourOverlay.hidden;
          ourOverlay.hidden = !isHidden;
          showHideBtn.setAttribute("data-shown", isHidden.toString());
        }
      };
    }
    ulWantedOverlays.appendChild(tr);
  }
  function reloadUIWantedOverlays() {
    if (!config.wantedOverlays) {
      zpoLog("reloadUIWantedOverlays() for undefined wantedOverlays");
      return;
    }
    zpoLog("reloadUIWantedOverlays() for " + config.wantedOverlays.length + " wantedOverlays");
    const ulWantedOverlays = document.querySelector("#zevent-place-overlay-ui-list-wanted-overlays");
    if (!ulWantedOverlays) return;
    ulWantedOverlays.innerHTML = "";
    for (const overlay of config.wantedOverlays) {
      appendUIWantedOverlay(overlay);
    }
  }
  function appendUIKnownOverlay(ulKnownOverlays, overlay) {
    zpoLog("appendUIKnownOverlays()");
    const tr = document.createElement("div");
    tr.id = "avail-node-" + overlay.id;
    tr.className = "zpo-overlay-line";
    tr.innerHTML = renderTemplate("known-overlay", {
      overlayId: overlay.id,
      threadUrl: overlay.thread_url,
      description: overlay.description,
      title: overlay.community_name
    });
    const btnAdd = tr.querySelector("#btn-add-" + overlay.id);
    if (btnAdd)
      btnAdd.onclick = () => {
        addWantedOverlay(overlay);
        tr.hidden = true;
      };
    if (typeof overlay.description === "string") {
      const btnDescription = tr.querySelector("#btn-description-" + overlay.id);
      if (btnDescription)
        btnDescription.onclick = () => {
          const descNode = document.querySelector("#desc-node-" + overlay.id);
          if (descNode) {
            const isExpanded = descNode.getAttribute("aria-expanded") === "true";
            descNode.setAttribute("aria-expanded", isExpanded ? "false" : "true");
          }
        };
    }
    ulKnownOverlays.appendChild(tr);
    ulKnownOverlays.insertAdjacentHTML(
      "beforeend",
      renderTemplate("overlay-description", {
        description: overlay.description,
        overlayId: overlay.id
      })
    );
    if (config.wantedOverlays.find((o) => o.id === overlay.id)) {
      tr.hidden = true;
    }
  }
  function reloadUIKnownOverlays() {
    if (!config.knownOverlays) {
      zpoLog("reloadUIKnownOverlays() for undefined knownOverlays");
      return;
    }
    zpoLog("reloadUIKnownOverlays() for " + config.knownOverlays.length + " knownOverlays");
    const ulKnownOverlays = document.querySelector("#zevent-place-overlay-ui-list-known-overlays");
    if (!ulKnownOverlays) return;
    ulKnownOverlays.innerHTML = "";
    for (const overlay of config.knownOverlays) {
      appendUIKnownOverlay(ulKnownOverlays, overlay);
    }
  }
  function keepOurselfInDOM() {
    const origCanvas = document.querySelector("#place-canvas");
    if (!origCanvas) zpoLog("keepOurselfInDOM() origCanvas: " + origCanvas);
    const ourOverlays = document.querySelectorAll(".zevent-place-overlay-img");
    if (origCanvas && !ourOverlays.length && config.wantedOverlays.length > 0) {
      zpoLog("keepOurselfInDOM() overlays lost, re-injecting");
      reloadWantedOverlaysInDOM();
      reloadUIWantedOverlays();
    }
    const origUI = document.querySelector("#root");
    if (!origUI) zpoLog("keepOurselfInDOM() origUI: " + origUI);
    const ourUI = document.querySelector("#zevent-place-overlay-ui");
    if (origUI && !ourUI) {
      zpoLog("keepOurselfInDOM() UI lost, re-injecting");
      appendOurUI();
      reloadUIKnownOverlays();
    }
  }
  function refreshDisplayTime(domNode) {
    if (domNode) {
      const now = /* @__PURE__ */ new Date();
      domNode.innerHTML = "m\xE0j." + now.getHours() + "h" + String(now.getMinutes()).padStart(2, "0");
    }
  }

  // _z8xy1aek3:src/template/styles.css
  var styles_default = "@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Grotesk:wght@400;500;700&display=swap');\r\n\r\n#zevent-place-overlay-ui {\r\n    --zpo-bg: #14161d;\r\n    --zpo-card: #1b1e28;\r\n    --zpo-elevated: #242836;\r\n    --zpo-accent: #2a2f3f;\r\n    --zpo-border: #2a2f3d;\r\n    --zpo-fg: #e9ebf2;\r\n    --zpo-muted: #8e95aa;\r\n    --zpo-primary: #38bdf8;\r\n    --zpo-primary-hover: #20b0f4;\r\n    --zpo-primary-active: #0ea5e9;\r\n    --zpo-primary-fg: #14161d;\r\n    --zpo-destructive: #e5484d;\r\n    --zpo-warn: #f5b544;\r\n    --zpo-ring: rgba(56, 189, 248, 0.25);\r\n    --zpo-checker: rgba(233, 235, 242, 0.07);\r\n    --zpo-font-sans: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;\r\n    --zpo-font-pixel: 'Silkscreen', ui-monospace, 'Cascadia Mono', Consolas, monospace;\r\n\r\n    max-width: 350px;\r\n    min-width: 300px;\r\n    font-family: var(--zpo-font-sans);\r\n    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);\r\n    padding: 0 12px;\r\n    border-radius: 0;\r\n    border: 1px solid var(--zpo-border);\r\n    background: var(--zpo-card);\r\n    color: var(--zpo-fg);\r\n    position: fixed;\r\n    top: 16px;\r\n    left: 16px;\r\n    z-index: 99999;\r\n}\r\n\r\n#zevent-place-overlay-ui [hidden] {\r\n    display: none !important;\r\n}\r\n\r\n#zevent-place-overlay-ui-toggle > svg {\r\n    transition: transform 0.3s ease;\r\n}\r\n#zevent-place-overlay-ui-toggle[aria-expanded='true'] > svg {\r\n    transform: rotate(180deg);\r\n}\r\n\r\n#zevent-place-overlay-ui-head {\r\n    position: relative;\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n    gap: 8px;\r\n    padding: 12px 0;\r\n    font-family: var(--zpo-font-pixel);\r\n    font-size: 13px;\r\n    letter-spacing: 0.02em;\r\n}\r\n\r\n#zevent-place-overlay-ui-head::after {\r\n    content: '';\r\n    position: absolute;\r\n    left: -12px;\r\n    right: -12px;\r\n    bottom: 0;\r\n    height: 6px;\r\n    pointer-events: none;\r\n    border-top: 1px solid var(--zpo-border);\r\n    border-bottom: 1px solid var(--zpo-border);\r\n    background-image: conic-gradient(\r\n        var(--zpo-checker) 25%,\r\n        transparent 25% 50%,\r\n        var(--zpo-checker) 50% 75%,\r\n        transparent 75%\r\n    );\r\n    background-size: 12px 12px;\r\n}\r\n\r\n#zevent-place-overlay-ui-version,\r\n#zevent-place-overlay-wanted-ts,\r\n#zevent-place-overlay-known-ts {\r\n    font-family: var(--zpo-font-sans);\r\n    color: var(--zpo-muted);\r\n}\r\n\r\n#zevent-place-overlay-ui hr {\r\n    all: unset;\r\n    border: none;\r\n    border-top: 1px solid var(--zpo-border);\r\n    margin-top: 16px;\r\n    width: 100%;\r\n}\r\n\r\n#zevent-place-overlay-ui input {\r\n    width: 100%;\r\n    box-sizing: border-box;\r\n    padding: 8px 12px;\r\n    border-radius: 0;\r\n    border: 1px solid var(--zpo-border);\r\n    background-color: var(--zpo-bg);\r\n    color: var(--zpo-fg);\r\n    font-size: 14px;\r\n    font-family: var(--zpo-font-sans);\r\n    transition:\r\n        border-color 0.15s ease,\r\n        box-shadow 0.15s ease;\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='number'] {\r\n    -moz-appearance: textfield;\r\n    appearance: textfield;\r\n    text-align: center;\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='number']::-webkit-inner-spin-button,\r\n#zevent-place-overlay-ui input[type='number']::-webkit-outer-spin-button {\r\n    -webkit-appearance: none;\r\n    margin: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui input:focus {\r\n    outline: none;\r\n    border-color: var(--zpo-primary);\r\n    box-shadow: 0 0 0 3px var(--zpo-ring);\r\n}\r\n\r\n#zevent-place-overlay-ui input::placeholder {\r\n    color: var(--zpo-muted);\r\n    opacity: 1;\r\n}\r\n\r\n#zevent-place-overlay-ui button {\r\n    height: 28px;\r\n    min-height: 28px;\r\n    width: 28px;\r\n    min-width: 28px;\r\n    color: var(--zpo-fg);\r\n    background: transparent;\r\n    border: 1px solid var(--zpo-border);\r\n    border-radius: 0;\r\n    justify-content: center;\r\n    align-items: center;\r\n    padding: 0;\r\n    font-size: 13px;\r\n    font-weight: 500;\r\n    font-family: var(--zpo-font-sans);\r\n    display: inline-flex;\r\n    cursor: pointer;\r\n    transition:\r\n        background-color 0.15s ease,\r\n        border-color 0.15s ease,\r\n        color 0.15s ease;\r\n}\r\n\r\n#zevent-place-overlay-ui button:hover {\r\n    background: var(--zpo-accent);\r\n    border-color: #3a4256;\r\n}\r\n\r\n#zevent-place-overlay-ui button:active {\r\n    background: var(--zpo-border);\r\n}\r\n\r\n#zevent-place-overlay-ui button > svg {\r\n    height: 16px;\r\n    width: 16px;\r\n    padding: 0;\r\n    justify-content: center;\r\n    flex-shrink: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui #zevent-place-overlay-ui-toggle {\r\n    border-color: transparent;\r\n}\r\n#zevent-place-overlay-ui #zevent-place-overlay-ui-toggle:hover {\r\n    background: var(--zpo-accent);\r\n    border-color: transparent;\r\n}\r\n\r\n#zevent-place-overlay-ui #btn-custom-add,\r\n#zevent-place-overlay-ui [id^='btn-add-'] {\r\n    background: var(--zpo-primary);\r\n    border-color: var(--zpo-primary);\r\n    color: var(--zpo-primary-fg);\r\n}\r\n#zevent-place-overlay-ui #btn-custom-add:hover,\r\n#zevent-place-overlay-ui [id^='btn-add-']:hover {\r\n    background: var(--zpo-primary-hover);\r\n    border-color: var(--zpo-primary-hover);\r\n}\r\n#zevent-place-overlay-ui #btn-custom-add:active,\r\n#zevent-place-overlay-ui [id^='btn-add-']:active {\r\n    background: var(--zpo-primary-active);\r\n    border-color: var(--zpo-primary-active);\r\n}\r\n\r\n#zevent-place-overlay-ui [id^='btn-del-']:hover {\r\n    background: rgba(229, 72, 77, 0.15);\r\n    border-color: var(--zpo-destructive);\r\n    color: var(--zpo-destructive);\r\n}\r\n\r\n#zevent-place-overlay-ui button.secondary {\r\n    background: var(--zpo-elevated);\r\n    border-color: var(--zpo-border);\r\n    color: var(--zpo-fg);\r\n}\r\n#zevent-place-overlay-ui button.secondary:hover {\r\n    background: var(--zpo-accent);\r\n    border-color: #3a4256;\r\n}\r\n#zevent-place-overlay-ui button.secondary:active {\r\n    background: var(--zpo-border);\r\n}\r\n#zevent-place-overlay-ui button.secondary > svg {\r\n    height: 16px;\r\n    width: 16px;\r\n    padding: 0;\r\n    justify-content: center;\r\n    flex-shrink: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui label {\r\n    color: var(--zpo-fg);\r\n    font-size: 13px;\r\n    font-weight: 500;\r\n    margin-bottom: 4px;\r\n    display: block;\r\n}\r\n\r\n#zevent-place-overlay-ui a {\r\n    color: var(--zpo-primary);\r\n    text-decoration: none;\r\n    transition: color 0.15s ease;\r\n}\r\n\r\n#zevent-place-overlay-ui a:hover {\r\n    color: #7dd3fc;\r\n    text-decoration: underline;\r\n}\r\n\r\n#zevent-place-overlay-ui-list-wanted-overlays,\r\n#zevent-place-overlay-ui-list-known-overlays {\r\n    width: 100%;\r\n    margin: 8px 0;\r\n}\r\n\r\n#zevent-place-overlay-ui-list-wanted-overlays {\r\n    display: flex;\r\n    flex-direction: column;\r\n    gap: 4px;\r\n    max-height: calc(32px * 5 + 4px * 4);\r\n    overflow-y: auto;\r\n}\r\n\r\n#zevent-place-overlay-ui-list-known-overlays {\r\n    max-height: calc(100vh - 200px);\r\n    overflow-y: auto;\r\n    display: flex;\r\n    flex-direction: column;\r\n    gap: 4px;\r\n}\r\n\r\n#zevent-place-overlay-ui-body {\r\n    scrollbar-width: thin;\r\n    scrollbar-color: var(--zpo-border) transparent;\r\n    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\r\n    display: flex;\r\n    flex-flow: row wrap;\r\n    flex-direction: column;\r\n    overflow: hidden;\r\n}\r\n\r\n#zevent-place-overlay-ui-body[aria-expanded='false'] {\r\n    height: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui-body[aria-expanded='true'] {\r\n    height: calc(100vh - 84px - var(--zpo-banners, 0px));\r\n}\r\n\r\n#zevent-place-overlay-ui-overlaylist {\r\n    flex: 1;\r\n    overflow: hidden;\r\n    padding-top: 20px;\r\n    box-sizing: border-box;\r\n    display: flex;\r\n    flex-direction: column;\r\n}\r\n\r\n#zevent-place-overlay-ui-overlaylist::-webkit-scrollbar {\r\n    width: 6px;\r\n}\r\n\r\n#zevent-place-overlay-ui-overlaylist::-webkit-scrollbar-track {\r\n    background: transparent;\r\n}\r\n\r\n#zevent-place-overlay-ui-overlaylist::-webkit-scrollbar-thumb {\r\n    background-color: var(--zpo-border);\r\n    border-radius: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui-overlaylist::-webkit-scrollbar-thumb:hover {\r\n    background-color: var(--zpo-primary);\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox'] {\r\n    -webkit-appearance: none;\r\n    -moz-appearance: none;\r\n    appearance: none;\r\n    background-color: var(--zpo-bg);\r\n    margin: 0;\r\n    font: inherit;\r\n    color: currentColor;\r\n    width: 16px;\r\n    height: 16px;\r\n    border: 1px solid var(--zpo-border);\r\n    border-radius: 0;\r\n    display: grid;\r\n    place-content: center;\r\n    padding: 0;\r\n    cursor: pointer;\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox']:checked {\r\n    background: var(--zpo-primary);\r\n    border-color: var(--zpo-primary);\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox']::before {\r\n    content: '';\r\n    width: 10px;\r\n    height: 10px;\r\n    -webkit-clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);\r\n    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);\r\n    transform: scale(0);\r\n    transform-origin: bottom left;\r\n    transition: 120ms transform ease-in-out;\r\n    box-shadow: inset 1em 1em var(--zpo-primary-fg);\r\n    background-color: CanvasText;\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox']:checked::before {\r\n    transform: scale(1);\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox']:hover {\r\n    border-color: var(--zpo-primary);\r\n    background: var(--zpo-accent);\r\n}\r\n\r\n#zevent-place-overlay-ui input[type='checkbox']:checked:hover {\r\n    background: var(--zpo-primary-hover);\r\n    border-color: var(--zpo-primary-hover);\r\n}\r\n\r\n.zevent-place-overlay-symbol {\r\n    position: absolute;\r\n    top: 50%;\r\n    left: 50%;\r\n    transform: translate(-50%, -50%);\r\n    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));\r\n}\r\n\r\n@media (max-width: 400px) {\r\n    #zevent-place-overlay-ui {\r\n        max-width: calc(100vw - 32px);\r\n        min-width: 280px;\r\n    }\r\n\r\n    #zevent-place-overlay-ui input {\r\n        font-size: 16px;\r\n    }\r\n}\r\n\r\n#zevent-place-overlay-ui .form-group {\r\n    margin: 12px 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .form-row {\r\n    display: flex;\r\n    gap: 8px;\r\n    align-items: center;\r\n    justify-content: center;\r\n}\r\n\r\n#zevent-place-overlay-ui .form-row input {\r\n    flex: 1;\r\n}\r\n\r\n#zevent-place-overlay-ui .form-row button {\r\n    margin-left: 0;\r\n    flex-shrink: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-section-title {\r\n    font-family: var(--zpo-font-pixel);\r\n    font-size: 11px;\r\n    letter-spacing: 0.04em;\r\n    margin: 16px 0 8px 0;\r\n    padding-bottom: 6px;\r\n    border-bottom: 1px solid var(--zpo-border);\r\n\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-section-subtitle {\r\n    font-size: 12px;\r\n    color: var(--zpo-muted);\r\n    margin-top: -8px;\r\n    margin-bottom: 8px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-head-actions {\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 4px;\r\n}\r\n\r\n#zpo-settings-panel {\r\n    position: absolute;\r\n    top: 0;\r\n    left: calc(100% + 9px);\r\n    width: 270px;\r\n    box-sizing: border-box;\r\n    padding: 0 12px 12px;\r\n    background: var(--zpo-card);\r\n    border: 1px solid var(--zpo-border);\r\n    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);\r\n    /* align\xE9 sur le haut du panneau, lui-m\xEAme \xE0 16px du viewport : on garde la m\xEAme marge en bas */\r\n    max-height: calc(100vh - 32px);\r\n    overflow-y: auto;\r\n    scrollbar-width: thin;\r\n    scrollbar-color: var(--zpo-border) transparent;\r\n}\r\n\r\n#zpo-settings-panel[aria-expanded='false'] {\r\n    display: none;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-head {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n    gap: 8px;\r\n    padding: 12px 0 10px;\r\n    margin-bottom: 4px;\r\n    border-bottom: 1px solid var(--zpo-border);\r\n    font-family: var(--zpo-font-pixel);\r\n    font-size: 11px;\r\n    letter-spacing: 0.04em;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-row {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n    gap: 8px;\r\n    padding: 6px 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-row + .zpo-settings-note {\r\n    margin-top: 6px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-note {\r\n    margin: 0 0 8px;\r\n    font-size: 11px;\r\n    line-height: 1.5;\r\n    color: var(--zpo-muted);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-note:last-child {\r\n    margin-bottom: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-note strong {\r\n    color: var(--zpo-fg);\r\n    font-weight: 500;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-settings-row label {\r\n    margin-bottom: 0;\r\n    font-weight: 400;\r\n}\r\n\r\n@media (max-width: 400px) {\r\n    #zevent-place-overlay-ui #zpo-settings-panel {\r\n        position: static;\r\n        width: auto;\r\n        margin: 0 -12px;\r\n        border-left: none;\r\n        border-right: none;\r\n        box-shadow: none;\r\n    }\r\n}\r\n\r\n#zevent-place-overlay-ui #btn-settings[aria-expanded='true'] {\r\n    background: var(--zpo-accent);\r\n    color: var(--zpo-primary);\r\n}\r\n\r\n#zevent-place-overlay-ui .action_add {\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n    flex-shrink: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .community_name {\r\n    flex: 1;\r\n    padding: 5px;\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    align-items: center;\r\n    max-width: 160px;\r\n    white-space: nowrap;\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n}\r\n\r\n#zevent-place-overlay-ui .community_discord {\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n    flex-shrink: 0;\r\n    padding: 2px;\r\n}\r\n\r\n#zevent-place-overlay-ui .description_btn {\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n    flex-shrink: 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .thread_url {\r\n    display: flex;\r\n    justify-content: center;\r\n    align-items: center;\r\n    flex-shrink: 0;\r\n    padding: 2px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-wrapper-actions {\r\n    display: flex;\r\n    gap: 4px;\r\n    align-items: center;\r\n    justify-content: center;\r\n    margin-left: auto;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-btn-show-hide[data-shown='true'] > .eye-closed,\r\n#zevent-place-overlay-ui .zpo-btn-show-hide[data-shown='false'] > .eye {\r\n    display: none;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-btn-show-hide[data-shown='true'] > .eye,\r\n#zevent-place-overlay-ui .zpo-btn-show-hide[data-shown='false'] > .eye-closed {\r\n    display: block;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-line {\r\n    display: flex;\r\n    align-items: center;\r\n    gap: 8px;\r\n    justify-content: space-between;\r\n    padding: 4px;\r\n    flex-wrap: wrap;\r\n    border-radius: 0;\r\n    transition: background-color 0.15s ease;\r\n    font-size: 12px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-line:hover {\r\n    background-color: rgba(56, 189, 248, 0.08);\r\n}\r\n\r\n#zevent-place-overlay-ui #newUpdate:empty {\r\n    display: none;\r\n}\r\n\r\n#zevent-place-overlay-ui #newUpdate {\r\n    margin: 8px 0;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-update {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    gap: 8px;\r\n    height: 30px;\r\n    border: 1px solid var(--zpo-warn);\r\n    background: rgba(245, 181, 68, 0.12);\r\n    color: var(--zpo-warn);\r\n    font-size: 12px;\r\n    transition: background-color 0.15s ease, color 0.15s ease;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-update:hover {\r\n    background: var(--zpo-warn);\r\n    color: var(--zpo-primary-fg);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-update > svg {\r\n    width: 14px;\r\n    height: 14px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message {\r\n    --zpo-level: var(--zpo-primary);\r\n    display: flex;\r\n    align-items: flex-start;\r\n    gap: 8px;\r\n    margin: 8px 0;\r\n    padding: 8px 10px;\r\n    border: 1px solid var(--zpo-level);\r\n    background: color-mix(in srgb, var(--zpo-level) 12%, transparent);\r\n    color: var(--zpo-primary);\r\n    font-size: 12px;\r\n    line-height: 1.45;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message[data-level='warning'] {\r\n    --zpo-level: var(--zpo-warn);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message[data-level='critical'] {\r\n    --zpo-level: var(--zpo-destructive);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message > svg {\r\n    display: none;\r\n    width: 14px;\r\n    height: 14px;\r\n    flex-shrink: 0;\r\n    margin-top: 2px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message[data-level='info'] > .zpo-icon-info,\r\n#zevent-place-overlay-ui .zpo-message[data-level='warning'] > .zpo-icon-warning,\r\n#zevent-place-overlay-ui .zpo-message[data-level='critical'] > .zpo-icon-critical {\r\n    display: block;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message-body {\r\n    flex: 1;\r\n    min-width: 0;\r\n    color: var(--zpo-fg);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message-content {\r\n    display: block;\r\n    white-space: pre-line;\r\n    overflow-wrap: anywhere;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message-link {\r\n    display: inline-block;\r\n    margin-top: 4px;\r\n    color: var(--zpo-level);\r\n    text-decoration: underline;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message-close {\r\n    height: 20px;\r\n    min-height: 20px;\r\n    width: 20px;\r\n    min-width: 20px;\r\n    border-color: transparent;\r\n    color: inherit;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-message-close:hover {\r\n    background: var(--zpo-accent);\r\n    border-color: transparent;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-title {\r\n    flex: 1;\r\n    padding: 5px;\r\n    max-width: 160px;\r\n    white-space: nowrap;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-title > span {\r\n    overflow: hidden;\r\n    text-overflow: ellipsis;\r\n    display: inline-block;\r\n    max-width: 100%;\r\n    line-height: 17px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-title:has(.zpo-linked) > span:first-child {\r\n    max-width: calc(100% - 18px);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-title > span.zpo-linked {\r\n    display: inline-flex;\r\n    align-items: center;\r\n    opacity: 0.7;\r\n    cursor: help;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-linked > svg {\r\n    height: 14px;\r\n    width: 14px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-pinned {\r\n    opacity: 0.7;\r\n    cursor: help;\r\n    font-size: 14px;\r\n    line-height: 28px;\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-description {\r\n    padding: 16px;\r\n    height: 100%;\r\n    font-size: 12px;\r\n    display: block;\r\n    color: var(--zpo-muted);\r\n}\r\n\r\n#zevent-place-overlay-ui .zpo-overlay-description[aria-expanded='false'] {\r\n    height: 0;\r\n    padding: 0;\r\n    display: none;\r\n}\r\n\r\n#zevent-place-overlay-ui #newUpdate > div {\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    gap: 6px;\r\n}\r\n";

  // src/style.js
  var injectStyles = () => {
    GM_addStyle(styles_default);
  };

  // src/misc.js
  var listenSpaceEvent = () => {
    document.addEventListener("keyup", function(e) {
      if (e.code === "Space" && e.target === document.body) {
        const buttons = document.querySelectorAll(".buttons");
        if (!buttons.length) {
          return;
        }
        const colorButton = document.querySelector(".color-button");
        if (!colorButton) {
          return;
        }
        const bgColor = colorButton.style.backgroundColor;
        if (bgColor !== "rgb(0, 0, 0)") {
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
  var initMisc = () => {
    listenSpaceEvent();
  };

  // src/presence.js
  var announcePresence = () => {
    document.documentElement.setAttribute(presenceAttribute, version);
  };

  // src/main.js
  (function() {
    if (window.location.origin !== placeOrigin) {
      announcePresence();
      return;
    }
    if (!Array.isArray(config.wantedOverlays)) {
      config.wantedOverlays = [];
    }
    initMisc();
    track();
    refreshKnownOverlays().then(() => {
      applyQueryOverlays();
      trackDailyOverlays();
    });
    injectStyles();
    appendOurUI();
    refreshMessages();
    initSymbols();
    setInterval(keepOurselfInDOM, 1e3);
    setInterval(refreshKnownOverlays, 1e3 * 60);
    setInterval(refreshMessages, 1e3 * 30);
    setInterval(checkVersion, 1e3 * 60 * 5);
    checkVersion();
    let showAll = true;
    document.addEventListener("keypress", function(event) {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable]")) {
        return;
      }
      if (event.code === "KeyH") {
        showAll = !showAll;
        const ourOverlays = document.querySelectorAll(".zevent-place-overlay-img");
        ourOverlays.forEach(function(e) {
          e.hidden = !showAll;
        });
        const btnShowHide = document.querySelectorAll(".zpo-btn-show-hide");
        btnShowHide.forEach(function(btn) {
          btn.setAttribute("data-shown", showAll);
        });
      }
    });
    const canvasObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const canvas = document.querySelector("#place-canvas");
          if (canvas) {
            reloadWantedOverlaysInDOM();
            observer.disconnect();
            break;
          }
        }
      }
    });
    canvasObserver.observe(document.body, { childList: true, subtree: true });
  })();
})();

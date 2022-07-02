// ==UserScript==
// @name         NM trade enhancement
// @namespace    7nik
// @version      2.1.3
// @description  Adds enhancements to the trading window
// @author       7nik
// @homepageURL  https://github.com/7nik/userscripts
// @supportURL   https://github.com/7nik/userscripts/issues
// @updateURL    https://github.com/7nik/userscripts/raw/master/NM%20trade%20enhancement.user.js
// @downloadURL  https://github.com/7nik/userscripts/raw/master/NM%20trade%20enhancement.user.js
// @match        https://www.neonmob.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @run-at       document-start
// @require      https://github.com/rafaelw/mutation-summary/raw/master/src/mutation-summary.js
// @require      https://unpkg.com/@popperjs/core@2
// @require      https://unpkg.com/tippy.js@6
// ==/UserScript==

/* globals MutationSummary NM angular io tippy */
/* eslint-disable
    max-classes-per-file,
    sonarjs/cognitive-complexity,
    sonarjs/no-duplicate-string,
    unicorn/no-fn-reference-in-iterator
 */

"use strict";

const RESET_BUTTON_ICON = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAQAAAD8x0bcAAABNU\
lEQVQoz2NgwAsamFxsQpnxq2FwMnP77CyMV4kDj9t3lyAC5rjnuD+35MRvlbz7GzdjAua4zXDbhkc6lDmU01Hb/Ye7JB7nup91/\
+j+1rUDpxJPPve17s/c/wPhA3dtrEpcpdzWuQe7lrmfcf/s/t/NF8MdHurOAe7PPRxcorwk3Fzd4t0uObCgG8LorOT2zFnLLdpJ\
2bXcQcJF0205irwxq4s70MvtriZARU7uRs56rhPd41y3uIV7BHpY+vFCXOLs/liLzcPSfYfbektOtyQ/Xpcod3+PdI90tyR3b3D\
ceQuCwsNT1F2/gcmtxu2Ea6SzmoOM+363g25tiBi64/7Xjdstz/0UxGr3RW43XPjdot0TQdBSCGKZn1sWA5MDiwMPVBeTq6rbet\
dAD3UQ9OViIA4AAM0mVgxU9d2NAAAAAElFTkSuQmCC`;

const CORE_GEM_ICON = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAACTUlEQV\
QoU3VRW0iTYRh+3m/7928rt9LNZaZzSzecCzNqDDWEKAqFyEpZrMPwVDCCIOh610HSTRB0oAPdBNkBlKLb8CK6KDqAGUROiqw12\
8G5/fv/r2/LiV303Hx87/s+PM/7vIQVDNznusJ8sjfgMl5yO6TIsU5putI7fjPV6XdIt4JO4/mFD5gaHCS11KPKwJHLif2qyq52\
e2Snv1F+m8iop8Jdhtfn7mW2L2n8ttcubevYIn8R82f2+OnZCpnT0fFkd1HDpChUdXmN6GiSUVTxc+ZHPjr3S73CCTZ3tQSfQy5\
x0oyhr8eHF9Q/nuzhGq4BvMViZvA1GtBWZ4DJQIgn1dzcomIq2ZP1BK/dAItRV7I7y/UYpYGz0w+UbK5fp2fUGvTAVl8NsyA6q/\
VIZDUspMvrlSFrGtbnFUEmDkYPaWjosTe9uHSnqKiBKpsVO/oCsNqtMAglSUfI5rUyURWv8j0LFMSf4SXXs5MEzilyesqfS2buF\
paVdovNgu5DQdRs2gAS/jgX8zkVv+ez0PIqiOENSdKJsfDGd6tpj45OeBYT+QnhoM3RUIPe8G6Y1xlRFEl+/ZRCPquCMfaeTDg8\
FrJ//OdUXDgYiTzpTGdyN5RC0bvZacPeg7uQSgJLmSKYnmZ0Oj48HK6dJhI7r71zJZRodNKz8C31VDhwtfia4fK4hCJ9tpqMB0I\
hS1mxglXblULJwXDk0b50avm6s7mpodm3NS5JfGQoXPu8ovhfcqkRi8VYPN6+01FXf9Hd6r4wP1vzKhajv7GvwR8AsNgcRdQufw\
AAAABJRU5ErkJggg==`;

const SEARCH_ICON = `'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 \
20 20"><path fill="%239f96a8" d="M 7 0 A 7 7 0 1 0 11 13 L 16 19 A 2 2 0 1 0 19 16 L 13 11 A 7 7 0 \
0 0 7 0 L 7 2 A 5 5 0 0 1 7 12 A 5 5 0 0 1 7 2"/></svg>'`;

GM_addStyle(`
    #freebies-nav-btn {
        width: 70px;
    }
    .trade--side--items--loading:empty {
        display: none;
    }
    .pack-tier--pack .pack {
        height: 120px;
    }

    .trade--add-items--filters {
        display: flex;
        flex-wrap: wrap;
        justify-content: stretch;
        align-content: space-between;
        height: 89px;
    }
    .trade--add-items--filters input.small.search {
        font-size: 12px;
        height: auto;
        padding: 0.5em 0.6em;
        width: 20px;
    }
    .trade--add-items--filters .filter-sets {
        width: calc(49% - 50px);
        flex-grow: 1;
    }
    .trade--add-items--filters input.search:focus {
        width: calc(50% - 30px);
        margin: 0;
        flex-grow: 1;
    }
    .trade--add-items--filters input.search:focus + .filter-sets {
        display: none;
    }
    .trade--add-items--filters .icon-button {
        align-self: flex-end;
        padding: 13px 0 0 5px;
        font-size: inherit;
        width: 30px;
        display: none;
        cursor: pointer;
    }
    .trade--add-items--filters .icon-button:hover {
        color: #085b85;
    }
    .trade--add-items--filters span.reset {
        font-size: inherit;
        text-align: right;
        align-self: flex-end;
        width: 30px;
        cursor: pointer;
    }
    .trade--add-items--filters span.reset .reset-sett {
        display: inline-block;
        vertical-align: middle;
        width: 18px;
        height: 18px;
        opacity: 0.8;
        background-image: url(${RESET_BUTTON_ICON});
        background-size: contain;
        background-position: bottom;
        background-repeat: no-repeat;
    }
    .trade--add-items--filters .filter-sets:hover + .icon-button,
    .trade--add-items--filters .filter-sets + .icon-button:hover {
        display: initial;
    }
    .trade--add-items--filters .filter-sets:hover + .icon-button + .reset,
    .trade--add-items--filters .filter-sets + .icon-button:hover + .reset {
        display: none;
    }
    .trade--add-items--filters select.series{
        flex-grow: 1;
    }

    #print-list .hiddenSeries {
        padding: 5px 20px;
        border-bottom: 1px solid rgba(0,0,0,.1);
        white-space: normal;
    }
    #print-list .hiddenSeries > span {
        font-size: 10px;
        color: #9f96a8;
    }
    #print-list .hiddenSeries span span {
        white-space: nowrap;
    }
    #print-list .hiddenSeries a {
        cursor: pointer;
        color: #9f96a8;
        position: relative;
        bottom: -1px;
    }
    #print-list .hiddenSeries a:hover {
        color: #085b85;
    }

    #print-list .hidden-item {
        display: none;
    }

    .trade--item .icon-button {
        margin-left: 0.5ch;
        position: relative;
        bottom: 1px;
        opacity: 0;
        color: #9f96a8;
        cursor: pointer;
    }
    .trade--item .search-series-button {
        width: 10px;
        height: 10px;
        background-image: url(${SEARCH_ICON});
    }
    .trade--item:hover .icon-button {
        opacity: 1;
    }
    .trade--item .card-trading {
        font-size: 13px;
        position: absolute;
        top: 15px;
        right: 20px;
    }
    .trade--item .print-chooser {
        border: none;
        background: none;
        color: #5f5668;
        cursor: pointer;
    }

    #trade--search--empty {
        animation: fadeIn 0s 0.15s backwards;
    }
    * ~ #trade--search--empty {
        opacity: 0;
    }
    @keyframes fadeIn {
        from {opacity: 0;}
        to {opacity: 1;}
    }

    .tippy-box[data-theme~='trade'] {
        background: #efefef;
        border-radius: 5px;
        filter: drop-shadow(0 1px 4px rgb(0, 0, 0, 0.35));
        width: 280px;
        max-width: 280px;
    }
    .tippy-box[data-theme~='trade'] .tippy-arrow {
        color: #efefef;
    }
    .tippy-box[data-theme~='trade'] header {
        padding: 7px;
        border-bottom: 1px solid rgba(0,0,0,.1);
        text-align: center;
        user-select: none;
    }
    .tippy-box[data-theme~='trade'] header a {
        cursor: pointer;
        font-weight: 500;
        padding: 1px 4px;
        border-radius: 7px;
    }
    .tippy-box[data-theme~='trade'] header a.off {
        color: #888;
        cursor: initial;
    }
    .tippy-box[data-theme~='trade'] header a:not(.off):hover {
        background: rgba(0,0,0,.15);
    }
    .tippy-box[data-theme~='trade'][data-theme~='sidebar'] {
        box-shadow: 1px 1px 7px rgba(0, 0, 0, .15);
    }
    .tippy-box[data-theme~='trade'][data-theme~='sidebar'] .btn {
        display: none;
    }

    .tippy-box[data-theme~='tooltip'] {
        max-width: 250px;
        background: #FBF8CF;
        color: #2c2830;
        box-shadow: 0 1px 2px rgba(0, 0, 0, .15);
    }
    .tippy-box[data-theme~='tooltip'] .tippy-arrow {
        color: #FBF8CF;
    }
    .tippy-box[data-theme~='tooltip'] .i {
        width: 18px;
        height: 15px;
        margin: 0 0 3px 2px;
    }
    .tippy-box[data-theme~='tooltip'] .i.core {
        background-image: url(${CORE_GEM_ICON});
        background-size: auto;
        width: 15px;
    }
    .tippy-box[data-theme~='tooltip'] .pipe {
        margin-bottom: 4px;
    }

    #messages {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }
    #messages .last-action {
        font-size: 9pt;
        color: #857a90;
    }
    #messages > :last-child {
        overflow: auto;
        flex-grow: 1;
    }
    #messages .comments {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    #messages .comments--list--container {
        flex-shrink: 1;
        flex-grow: 1;
        position: initial;
    }
    #messages .comments--field:not(:only-child) {
        position: initial;
    }

    .btn.wislist-btn {
        padding: 14px 18px;
    }
    #wishlist--animate {
        position: fixed;
        top: 0;
        height: 100vh;
        width: 100vw;
        background: rgba(37,26,48,.9);
        z-index: 5;
        color: silver;
    }
    #wishlist--animate > i {
        position: absolute;
        font-size: 20pt;
        animation-name: flyout;
        animation-duration: var(--time);
        animation-fill-mode: forwards;
    }
    @keyframes flyout {
        from {
            top: var(--startY);
            left: var(--startX);
        }
        to {
            top: var(--endY);
            left: var(--endX);
        }
    }

    div.set-header--collect-it + div.set-header--collect-it {
        display: none;
    }

    .gray-card img {
        filter: grayscale(1);
    }
    /* block showing of video context menu */
    .piece-video.original::after {
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
    }

    .collection--prints .card-trading-icon {
        position: absolute;
        left: 3%;
        top: 3%;
    }
    .collection--prints .card-trading-icon:not([data-length="0"]) {
        cursor: pointer;
        z-index: 4;
        color: white;
        box-shadow: 1.5px -1.5px white, -1.5px 1.5px white, 1.5px 1.5px white, -1.5px -1.5px white;
        font-size: 9pt;
        background: black;
        padding: 2px;
        margin: 5px;
        opacity: 0.85;
        transform: rotate(45deg);
        line-height: 1;
    }
    .card-trading-icon:not([data-length="0"])::before {
        display: inline-block;
        font-family: 'glyphter nm icon font';
        content: '\\0053';
    }
    .collection--prints .card-trading-icon:not([data-length="0"])::before {
        vertical-align: top;
        transform: rotate(-45deg);
    }
    .set-checklist .card-trading-icon:not([data-length="0"])::before {
        vertical-align: text-top;
        font-size: 12px;
        color: #857a90;
    }
    .collection--prints [ng-if="!piece.own_count"] ~ .card-trading-icon {
        opacity: 0.5;
    }
    .trade-preview--print.highlight-card {
        border-radius: 5px;
        box-shadow: 0 2px 5px #8400ff;
    }
`);

const cardsInTrades = (() => {
    let res;
    return {
        lastUpdate: -1,
        receive: {},
        give: {},
        loading: new Promise((resolve) => { res = resolve; }),
        ready () {
            cardsInTrades.loading = false;
            res();
        },
        /**
         * Returns list of trades where the given card is involved
         * @param  {object} print - the involved card
         * @param  {("give"|"receive"|"both")} dir - how the card should be involved in a trade
         * @param  {("print"|"card")} level - look for a certain print or all prints
         * @return {Promise<number[]>} - list of trade IDs
         */
        getTrades: async (print, dir = "both", level = "print") => {
            if (cardsInTrades.loading) await cardsInTrades.loading;

            const tradeIds = [];
            if (!print) return tradeIds;

            if (level === "print") {
                if (dir === "give" || dir === "both") {
                    tradeIds.push(...cardsInTrades.give[print.id]?.[print.print_id] ?? []);
                }
                if (dir === "receive" || dir === "both") {
                    tradeIds.push(...cardsInTrades.receive[print.id]?.[print.print_id] ?? []);
                }
            } else {
                if (cardsInTrades.give[print.id] && (dir === "give" || dir === "both")) {
                    // eslint-disable-next-line guard-for-in, no-restricted-syntax
                    for (const pid in cardsInTrades.give[print.id]) {
                        tradeIds.push(...cardsInTrades.give[print.id][pid]);
                    }
                }
                if (cardsInTrades.receive[print.id] && (dir === "receive" || dir === "both")) {
                    // eslint-disable-next-line guard-for-in, no-restricted-syntax
                    for (const pid in cardsInTrades.receive[print.id]) {
                        tradeIds.push(...cardsInTrades.receive[print.id][pid]);
                    }
                }
            }

            return tradeIds;
        },
        /**
         * Updates usage in trades for the given print
         * @param  {number} tradeId - the trade ID with the print
         * @param  {("give"|"receive")} side - how the print is involved in the trade
         * @param  {number} cid - card ID
         * @param  {number} pid - print ID
         * @param  {(-1,+1)} change - remove or add the print
         */
        updatePrint: (tradeId, side, cid, pid, change) => {
            if (!(cid in cardsInTrades[side])) cardsInTrades[side][cid] = {};
            if (!(pid in cardsInTrades[side][cid])) cardsInTrades[side][cid][pid] = [];
            if (change > 0) {
                cardsInTrades[side][cid][pid].push(tradeId);
            } else {
                cardsInTrades[side][cid][pid] = cardsInTrades[side][cid][pid]
                    .filter((id) => id !== tradeId);
            }
            cardsInTrades.lastUpdate = Date.now();
        },
    };
})();

const templatePatches = [];

const debug = (...args) => console.debug("[NM trade enhancement]", ...args);

/**
 * Wrapper of trade object
 */
class Trade {
    /**
     * Wrapper for trade info object
     * @param  {Object} trade - Trade info object
     */
    constructor (trade) {
        this.id = trade.id;
        this.state = trade.state;
        const youAreBidder = trade.bidder.id === NM.you.attributes.id;
        this.you = youAreBidder ? trade.bidder : trade.responder;
        this.yourOffer = youAreBidder ? trade.bidder_offer.prints : trade.responder_offer.prints;
        this.yourOffer.reverse().sort((a, b) => b.rarity.rarity - a.rarity.rarity);
        this.partner = youAreBidder ? trade.responder : trade.bidder;
        this.parnerOffer = youAreBidder ? trade.responder_offer.prints : trade.bidder_offer.prints;
        this.parnerOffer.reverse().sort((a, b) => b.rarity.rarity - a.rarity.rarity);
    }

    /**
     * Creates the trade preview
     * @return {HTMLElement} Element with trade preview
     */
    makeTradePreview (highlightCardId) {
        const a = document.createElement("a");
        a.className = "trade-preview";
        a.href = `?view-trade=${this.id}`;
        a.innerHTML = `
            <div class="trade-preview--give">
                <div class="trade-preview--heading small-caps">You will give</div>
                ${this.yourOffer.map(Trade.makeThumb).join("")}
            </div>
            <div class="trade-preview--get">
                <div class="trade-preview--heading small-caps">${this.partner.name} will give</div>
                ${this.parnerOffer.map(Trade.makeThumb).join("")}
            </div>
            <div class="btn small trade-preview--action">View Trade</div>`;
        // eslint-disable-next-line no-underscore-dangle
        a.addEventListener("click", () => a._tippy?.hide());

        if (highlightCardId) {
            const card = a.querySelector(`[data-print-id="${highlightCardId}"`);
            if (card) card.classList.add("highlight-card");
        }

        return a;
    }

    /**
     * Creates small thumbnail of a print
     * @param  {Object} print - Print for thumbnailing
     * @return {string} HTML code of the thumbnail
     */
    static makeThumb (print) {
        return `
        <span class="trade-preview--print" data-print-id="${print.id}">
            <div class="piece small fluid">
                <figure class="front">
                    <img class="asset" src="${print.piece_assets.image.small.url}">
                    <span class="piece-info">
                        <i class="i tip ${print.rarity.class}"></i>
                    </span>
                </figure>
            </div>
        </span>`;
    }

    /**
     * Gets and caches info about a trade by its id
     * @param  {number|string} tradeId - Trade id
     * @param  {boolean} [useCache=true] - May use cache or forcely do request
     * @return {Promise<Trade>} trade info
     */
    static async get (tradeId, useCache = true) {
        if (!Trade.cache[tradeId] || !useCache) {
            Trade.cache[tradeId] = await api("api", `/trades/${tradeId}/`);
            saveValue("tradesCache", Trade.cache);
        }
        return new Trade(Trade.cache[tradeId]);
    }

    static cache = (() => {
        const trades = loadValue("tradesCache", { minDate: 0 });
        // remove outdated trades
        Reflect.ownKeys(trades).forEach((id) => {
            if (new Date(trades[id].expire_date) < trades.minDate) {
                delete trades[id];
            }
        });
        return trades;
    })()
}

/**
 * A collection of items with property id
 */
class Collection {
    /**
     * Constructor.
     * @param  {string} name - Name loading and saving the collection
     * @param  {?object[]} items - The collection.
     *                            If not provided, will be loaded from `localStoreage`.
     */
    constructor (name, items) {
        this.name = name;
        if (items) {
            this.items = items;
            this.save();
        } else {
            this.items = loadValue(name, []);
        }
    }

    /**
     * Save the collection to `localStorage` if name provided.
     */
    save () { if (this.name) saveValue(this.name, this.items); }

    /**
     * Adds items to the collection with overwriting existing one and saves the collection.
     * @param {object|object[]|Collection} items - Item(s) to add.
     */
    add (items) {
        if (items.trades) items = items.trades;
        if (!Array.isArray(items)) items = [items];
        this.items = this.items.filter((item) => !items.find(({ id }) => id === item.id));
        this.items.unshift(...items);
        this.save();
    }

    /**
     * Removes given items from the collection or, if provided function, filters them and saves.
     * @param  {object|object[]|Collection|function} items - Items to remove or, if it's function,
     *                                                  uses it find items for removing.
     */
    remove (items) {
        if (typeof items === "function") {
            this.items = this.items.filter((item) => !items(item));
        } else {
            if (items.trades) items = items.trades;
            if (!Array.isArray(items)) items = [items];
            items.forEach((item) => {
                const index = this.items.findIndex(({ id }) => id === item.id);
                if (index >= 0) this.items.splice(index, 1);
            });
        }
        this.save();
    }

    /**
     * Applies given function to every item.
     * @param {function} fn - Function to apply to a item.
     */
    forEach (fn) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        this.items.forEach(fn);
    }

    /**
     * Applies given function to every item and returns arrays of results.
     * @param {function} fn - Function to apply to a item.
     * @return {any[]} Array of results.
     */
    map (fn) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        return this.items.map(fn);
    }

    /**
     * Get number of items in the collection.
     * @return {number} - Number of items in the collection.
     */
    get count () { return this.items.length; }

    /**
     * Make the collection iterable
     */
    * [Symbol.iterator] () {
        yield* this.items;
    }
}

/**
 * Reads a saved value from `localStorage` if presented, otherwise - default value
 * @param  {string} name - Name of the value
 * @param  {?any} defValue - Default value of the value
 * @return {any} Saved or default value
 */
function loadValue (name, defValue) {
    const fullName = "NM_trade_enhancements_".concat(name);
    if (fullName in localStorage) {
        return JSON.parse(localStorage[fullName]);
    }
    // TODO: rid of GM_getValue
    const value = GM_getValue(name, defValue);
    if (value !== defValue) saveValue(name, value);
    return value;
}

/**
 * Saves a value to `localStorage`
 * @param  {string} name - Name of the value
 * @param  {any} value - Value to save
 */
function saveValue (name, value) {
    const fullName = "NM_trade_enhancements_".concat(name);
    localStorage[fullName] = JSON.stringify(value);
}

/**
 * Converts string to The Camel Case
 * @param  {string} str - String for converting
 * @return {string} String in the camel case
 */
function toPascalCase (str) {
    return str
        .trim()
        .replace(/\s+/g, " ")
        .split(" ")
        .map((s) => s[0].toUpperCase().concat(s.slice(1).toLowerCase()))
        .join(" ");
}

/**
 * Returns a scope binded to the element
 * @param  {HTMLElement} element - Element
 * @return {Object} Binded scope
 */
function getScope (element) {
    return angular.element(element).scope();
}

/**
 * API call to server
 * @param  {("api"|"napi"|"root")} type - Which API scheme use
 * @param  {string} url - Relative URL to API
 * @param  {object} [body] - Body (params) of the request
 * @return {Promise<Object>} Parsed JSON response
 */
function api (type, url, body) {
    let fullUrl;
    switch (type) {
        case "api":  fullUrl = `https://www.neonmob.com/api${url}`; break;
        case "napi": fullUrl = `https://napi.neonmob.com${url}`;    break;
        case "root": fullUrl = `https://www.neonmob.com${url}`;     break;
        default:     fullUrl = url;
    }
    // forbid parallel requests
    this.lastRequest = (this.lastRequest ?? Promise.resolve())
        .then(() => fetch(fullUrl, body), () => fetch(fullUrl, body))
        .then((res) => res.json());
    return this.lastRequest;
}

/**
 * Will call the callback for existing and added elements which match the selector
 * @param  {HTMLElement} rootNode - In whose subtree wait for the elements
 * @param  {string} selector - Selector of the target elements
 * @param  {function(HTMLElement): undefined} callback - Callback applied to the elements
 */
function forAllElements (rootNode, selector, callback) {
    rootNode.querySelectorAll(selector).forEach((elem) => callback(elem));
    new MutationSummary({
        rootNode,
        queries: [{ element: selector }],
        callback: (summaries) => summaries[0].added.forEach((elem) => callback(elem)),
    });
}

/**
 * Returns a promise which will be resolved when the element appears
 * @param  {HTMLElement} rootNode - In whose subtree wait for the element
 * @param  {string} selector - Selector of the target element
 * @return {Promise<HTMLElement>} The added element
 */
function waitForElement (rootNode, selector) {
    const element = rootNode.querySelector(selector);
    if (element) return Promise.resolve(element);

    return new Promise((resolve) => {
        const observer = new MutationSummary({
            rootNode,
            queries: [{ element: selector }],
            callback: (summaries) => {
                observer.disconnect();
                resolve(summaries[0].added[0]);
            },
        });
    });
}

/**
 * Adds listeners to creating and finishing trades
 * @param  {function(trades[])} onloaded - Handler for currently pending trades
 * @param  {function(trade)} onadded - Handler for new trades
 * @param  {function(trade)} onremoved - Handler for trades finished in any way
 */
function onTradeChange (onloaded, onadded, onremoved) {
    if (!unsafeWindow.io) {
        setTimeout(onTradeChange, 100, onloaded, onadded, onremoved);
        return;
    }

    const socketTrades = io.connect(
        "https://napi.neonmob.com/trades",
        { transports: ["websocket"] },
    );

    if (onloaded) socketTrades.on("loadInitial", ({ results }) => onloaded(results));
    if (onadded) socketTrades.on("addItem", (result) => onadded(result));
    if (onremoved) socketTrades.on("removeItem", (result) => onremoved(result));
}

/**
 * Gets and caches info about a series by its id
 * @param  {(number|string)} settId - Series id
 * @return {Promise<Object>} series info
 */
function getSeriesInfo (settId) {
    if (!getSeriesInfo[settId]) {
        getSeriesInfo[settId] = api("api", `/setts/${settId}/`);
        getSeriesInfo[settId].then((data) => {
            getSeriesInfo[settId] = data;
        });
    }
    return getSeriesInfo[settId];
}

/**
 * Keep data in the variable `cardsInTrades` syncronized with pending
 */
async function updateCardsInTrade () {
    const updateTrade = async ({ object: { id } }, change) => {
        const trade = await Trade.get(id);
        trade.yourOffer.forEach(({ id: cid, print_id: pid }) => {
            cardsInTrades.updatePrint(id, "give", cid, pid, change);
        });
        trade.parnerOffer.forEach(({ id: cid, print_id: pid }) => {
            cardsInTrades.updatePrint(id, "receive", cid, pid, change);
        });
    };

    onTradeChange(
        (initialTrades) => {
            Promise.all(initialTrades.map((trade) => updateTrade(trade, +1)))
                .then(cardsInTrades.ready);
        },
        (addedTrade) => {
            updateTrade(addedTrade, +1);
        },
        (removedTrade) => {
            updateTrade(removedTrade, -1);
        },
    );
}

/**
 * Add notifications of auto-withdrawn trades
 */
function fixAutoWithdrawnTrade () {
    if (!unsafeWindow.io) {
        setTimeout(fixAutoWithdrawnTrade, 100);
        return;
    }

    let pendingTrades = new Collection("pendingTrades");
    const hiddenTrades = new Collection("hiddenTrades");
    const socketNotif = io.connect(
        "https://napi.neonmob.com/notifications",
        { transports: ["websocket"] },
    );

    /**
     * Show trade in notification if it was auto-withdrawn
     * @param {object} trade - Trade info
     */
    function addAutoWithdrawnNotification (trade) {
        if (trade.verb_phrase !== "auto-withdrew") return;
        trade.read = false;
        hiddenTrades.add(trade);
        // add the trade to notifications
        socketNotif.listeners("addItem")[0]?.(trade);
    }

    socketNotif.on("loadInitial", ({ results: notifications }) => {
        const minTime = new Date(notifications[notifications.length - 1].actor.time).getTime();
        Trade.cache.minDate = minTime;
        hiddenTrades.remove((trade) => new Date(trade.actor.time) < minTime);
        if (hiddenTrades.count > 0) {
            const [addItem] = socketNotif.listeners("addItem");
            if (addItem) {
                hiddenTrades.forEach((trade) => addItem(trade));
            } else {
                notifications.push(...hiddenTrades);
            }
        }
    });

    onTradeChange(
        (initialTrades) => {
            pendingTrades.remove(initialTrades);
            pendingTrades.forEach(async (trade) => {
                trade.verb_phrase = (await Trade.get(trade.object.id, false)).state;
                addAutoWithdrawnNotification(trade);
            });
            pendingTrades = new Collection("pendingTrades", initialTrades);
        },
        (addedTrade) => {
            pendingTrades.add(addedTrade);
        },
        (removedTrade) => {
            pendingTrades.remove(removedTrade);
            addAutoWithdrawnNotification(removedTrade);
        },
    );

    // synchronize added notification status when they get read
    window.addEventListener("click", ({ target }) => {
        // when clicked the notification
        const notifElem = target.closest("li.nm-notifications-feed--item");
        if (notifElem) {
            const { notification } = getScope(notifElem);
            if (notification.verb_phrase === "auto-withdrew") {
                if (notification.read) return;
                // replace trade with read copy to avoid side-effect and save
                hiddenTrades.add({ ...notification, read: true });
            }
        // when clicked "Mark all read"
        } else if (target.matches("a.text-link")) {
            // replace trades with read copies to avoid side-effect and save
            hiddenTrades.forEach((trade) => {
                if (!trade.read) hiddenTrades.add({ ...trade, read: true });
            });
        }
    }, true);
}

/**
 * Fixes the Open Pack button color for series with additional freebie packs
 * @param  {HTMLElement} button - <span.collect-it-button>
 */
async function fixFreebieCount (button) {
    const { sett } = getScope(button);
    // skip discontinued, unreleased, limited
    if (sett.discontinued
        || new Date(sett.released) > Date.now()
        || sett.edition_size === "limited"
    ) {
        return;
    }
    // assume all series with extra freebies packs have the same number of them
    // use value from the previous visit
    let realFreebiesNumber = loadValue("realFreebiesNumber", 3);
    if (realFreebiesNumber !== 3) {
        sett.daily_freebies = realFreebiesNumber;
    }
    // get the current number of freebies
    const numberUpdated = fixFreebieCount.numberUpdated
        ?? (fixFreebieCount.numberUpdated = api("api", `/pack-tiers/?sett_id=${sett.id}`)
            .then((packs) => packs
                .filter((pack) => pack.currency === "freebie")
                // eslint-disable-next-line unicorn/no-reduce
                .reduce((num, pack) => num + pack.count, 0))
            .then((freebieNumber) => {
                if (realFreebiesNumber !== freebieNumber) {
                    realFreebiesNumber = freebieNumber;
                    saveValue("realFreebiesNumber", freebieNumber);
                    return true;
                }
                return false;
            }));
    if (await numberUpdated) {
        sett.daily_freebies = realFreebiesNumber;
    }
}

/**
 * Adds how ago was last action of the user
 * @param {HTMLElement} header - <div.nm-conversation--header>
 */
async function addLastActionAgo (header, watchForChanges = true) {
    const userId = getScope(header).recipient.id;
    const lastActionAgo = await api("napi", `/activityfeed/user/${userId}/?amount=5&page=1`)
        .then((data) => data[0]?.created ?? "one eternity ago");

    const div = document.createElement("div");
    div.className = "last-action";
    div.innerHTML = `last action: <i>${lastActionAgo}</i>`;
    header.querySelector(".nm-conversation--header h3").append(div);

    if (watchForChanges === false) return;

    new MutationSummary({
        rootNode:  header.querySelector(".nm-conversation--header h3 a"),
        queries: [{ characterData: true }],
        callback: (summaries) => {
            header.querySelector(".last-action")?.remove();
            addLastActionAgo(header, false);
        },
    });
}

/**
 * Adds to pending trades in the sidebar priviews
 * @param {HTMLElement} notification - <li.nm-notification> or <li.nm-notifications-feed--item>
 */
async function addTradePreview (notification) {
    const scope = getScope(notification);
    if (scope.notification && scope.notification.object.type !== "trade-event") return;
    const tradeId = (scope.notification ?? scope.trade).object.id;
    const tip = tippy(notification, {
        onTrigger: async (instance) => {
            if (instance.props.content) return;
            addTradePreview.currentTradeId = tradeId;
            const preview = (await Trade.get(tradeId)).makeTradePreview();
            // set only if it still actuall
            if (addTradePreview.currentTradeId === tradeId) {
                instance.setContent(preview);
            }
        },
        onShow: (instance) => document.body.contains(notification),
    });
    const tips = addTradePreview.tips ?? (addTradePreview.tips = {});
    tips[tradeId] = tip;
    const singleton = addTradePreview.singleton
        ?? (addTradePreview.singleton = tippy.createSingleton([tip], {
            delay: [600, 200],
            placement: "left",
            theme: "trade sidebar",
            overrides: ["onTrigger", "onShow"],
        }));
    singleton.setInstances(Object.values(tips));
}

/**
 * Allows you to confirm/decline a confirm message and close a trade by keyboard.
 * @param {Event} ev - keyup event
 */
function addHotkeys (ev) {
    if (["Enter", "NumpadEnter", "Space"].includes(ev.code)
        && document.querySelector("#message.show #confirm-btn, #alert.show #alert-btn")
    ) {
        document.querySelector("#message.show #confirm-btn, #alert.show #alert-btn").click();
        ev.preventDefault();
        ev.stopPropagation();
    }
    if (ev.code === "Escape") {
        // if a confirm message is shown
        if (document.querySelector("#message.show #cancel-btn")) {
            document.querySelector("#message.show #cancel-btn").click();
            ev.stopPropagation();
        // if a trade window is open
        } else if (document.querySelector(".nm-modal--actionbar--left")) {
            document.querySelector(".nm-modal--actionbar--left").click();
            ev.stopPropagation();
        }
        // remove tippy tips
        $("[data-tippy-root]").remove();
        // otherwise an overlay will be closed by the angular
    }
    if (ev.code === "ArrowRight") {
        document.querySelector("#piece-detail-container .next")?.click();
    }
    if (ev.code === "ArrowLeft") {
        document.querySelector("#piece-detail-container .previous")?.click();
    }
}

/**
 * Adds an alternative directive for displaying a piece which allows to see
 * the colored/animed version of a card by clicking and holding on it.
 */
function makePiecePeekable () {
    // replace directive with custom one
    templatePatches.push({
        names: ["partials/art/piece/piece.partial.html"],
        patches: [{
            target: `data-art-piece-asset="piece"`,
            replace: `data-art-peekable-piece-asset="piece"`,
        }],
    });
    // based on https://d1ld1je540hac5.cloudfront.net/_dev/angular-app/art/piece/piece-asset.directive.js
    angular.module("Art").directive("artPeekablePieceAsset", () => ({
        templateUrl: "partials/art/piece/piece-asset.partial.html",
        scope: {
            piece: "=artPeekablePieceAsset",
            requestedSize: "=?artSize",
            width: "=?artWidth",
            height: "=?artHeight",
            fluid: "=?artFluid",
            isPublic: "=?artPublic",
            showLoading: "=?artShowLoading",
            isPackOpenPage: "=?artPackOpenPage",
        },
        controller: [
            "$scope",
            "$element",
            "artPieceService",
            "artUser",
            "wsLumberjack",
            "artConstants",
            ($scope, $elem, artPieceService, artUser, wsLumberjack, artConstants) => {
                const adaptors = {
                    video: {
                        getSize: () => ($scope.requestedSize === "xlarge"
                            ? (!$scope.isPublic && hasPiece() ? "original" : "large")
                            : $scope.requestedSize),
                        isValid () {
                            try {
                                const canViewVideo = $scope.isPublic
                                    || (artUser.isAuthenticated() && hasPiece());
                                if (!canViewVideo) return false;

                                if (!$scope.fluid && this.getSize() && this.getData()) {
                                    return true;
                                }
                            } catch (ex) {
                                wsLumberjack.exception(ex);
                            }
                            return false;
                        },
                        getData () { return $scope.piece.piece_assets.video?.[this.getSize()]; },
                    },
                    image: {
                        getSize: () => $scope.requestedSize,
                        isValid: () => true,
                        getData () { return $scope.piece.piece_assets.image[this.getSize()]; },
                    },
                };
                // used by Sett creator only
                const redrawAssetListener = $scope.$on("artRedrawAsset", (ev, pieceId) => {
                    if ($scope.piece.id !== pieceId) return;
                    init();
                });

                function init () {
                    $scope.requestedSize = $scope.requestedSize || "large";
                    $scope.fluid = !!$scope.fluid;
                    $scope.isPublic = !!$scope.isPublic;
                    $scope.showLoading = $scope.showLoading !== false;
                    $scope.settVersion = artConstants.VERSION_TYPES.limited;

                    $scope.assetType = calcAssetType();
                    const adaptor = adaptors[$scope.assetType];

                    $scope.pieceClass = `piece-${$scope.assetType}`;
                    if (!$scope.isPublic && !hasPiece()) $scope.pieceClass += " gray-card";
                    if ($scope.assetType === "video" && adaptor.getSize() === "original") {
                        $scope.pieceClass += " original";
                    }

                    $scope.videoSources = [];
                    $scope.imageUrl = "";
                    $scope.posterUrl = "";

                    const pieceData = adaptor.getData();
                    if (!pieceData) return;

                    $scope.videoSources = adaptors.video.getData()?.sources;
                    $scope.imageUrl = adaptors.image.getData().url;
                    $scope.posterUrl = $scope.imageUrl;

                    $scope.dimensionStyle = getDimensionStyle(pieceData);
                    $scope.calcedWidth = $scope.dimensionStyle.width;
                    $scope.calcedHeight = $scope.dimensionStyle.height;
                }

                function calcAssetType () {
                    const adaptor = adaptors[$scope.piece.asset_type];
                    if (adaptor && adaptor.isValid()) return $scope.piece.asset_type;
                    return "image";
                }

                function getDimensionStyle (data) {
                    const ratio = data.width / data.height;
                    let height;
                    let width;

                    if ($scope.fluid) return {};

                    if ($scope.width && $scope.height) {
                        if (ratio < $scope.width / $scope.height) {
                            height = $scope.height;
                            width = Math.ceil($scope.height * ratio);
                        } else {
                            width = $scope.width;
                            height = Math.ceil($scope.width / ratio);
                        }
                    } else if ($scope.height) {
                        height = $scope.height;
                        width = Math.ceil($scope.height * ratio);
                    } else if ($scope.width) {
                        width = $scope.width;
                        height = Math.ceil($scope.width / ratio);
                    } else {
                        width = data.width;
                        height = data.height;
                    }

                    width = Math.min(width, data.width);
                    height = Math.min(height, data.height);

                    return { width, height };
                }

                function hasPiece () { return artPieceService.hasPiece(artUser, $scope.piece); }

                init();

                if (!$scope.isPublic && !hasPiece()) {
                    const type = $scope.piece.piece_assets.video ? "animated" : "colored";
                    tippy($elem[0], {
                        content: `Press and hold to see the ${type} version`,
                        theme: "tooltip",
                    });

                    $elem.on("mousedown", (ev) => {
                        $scope.$apply(() => {
                            ev.preventDefault();
                            $scope.pieceClass = $scope.pieceClass.replace(" gray-card", "");
                            if ($scope.videoSources) {
                                if ($scope.videoSources[0].mime_type === "image/gif") {
                                    $scope.imageUrl = $scope.videoSources[0].url;
                                } else if (ev.button === 0) {
                                    $scope.assetType = "video";
                                }
                            }
                        });
                    });
                    $elem.on("mouseup", () => {
                        $scope.$apply(() => {
                            $scope.pieceClass += " gray-card";
                            if ($scope.videoSources) {
                                if ($scope.videoSources[0].mime_type === "image/gif") {
                                    $scope.imageUrl = $scope.posterUrl;
                                } else {
                                    $scope.assetType = "image";
                                }
                            }
                        });
                    });
                }

                $scope.$on("$destroy", () => {
                    redrawAssetListener();
                });
            },
        ],
    }));
}

/**
 * Adds a controller to wishlist or unwishlist all unowned cards according to rariry filters
 */
function addWishlistButton () {
    // add button to wishlist/unwishlist cards in collection
    templatePatches.push({
        names: ["partials/collection/collection-prints.partial.html"],
        patches: [{
            target: `<div class="collection--sett-actions">`,
            append: `
                <span
                    class="btn wislist-btn tip"
                    title="Wishlist/unwishlist unowned cards according to the chosen rarities"
                    ng-if="isOwner"
                    ng-controller="wishlistCardsButton"
                    ng-click="toggleWishlists($event)"
                >
                    {{ favoriteFilter.selected ? "Unwishlist cards" : "Wishlist cards" }}
                </span>`,
        }],
    });
    angular.module("nm.trades").controller("wishlistCardsButton", ["$scope", ($scope) => {
        $scope.toggleWishlists = async (ev) => {
            // as we don't have access to the list of all cards
            // we'll make CollectionController to show cards we need and save them all

            // save current filters
            const { ownership, duplicate } = $scope.filters;
            const favorite  = $scope.favoriteFilter?.selected;
            const wishlistMode = !favorite;

            // set temporal filters
            $scope.favoriteFilter.selected = false;
            $scope.filters.ownership = "unowned";
            $scope.filters.duplicate = null;
            $scope.applyFilters();

            // get the cards
            let cards = [];
            let count;
            do {
                count = cards.length;
                $scope.getNextPage();
                cards = $scope.columns.flat();
            } while (cards.length > count);
            cards = cards.filter((card) => card.favorite !== wishlistMode);

            // restore the filters now to avoid small lagging that is visible due to animation
            $scope.favoriteFilter.selected = favorite;
            $scope.filters.ownership = ownership;
            $scope.filters.duplicate = duplicate;
            $scope.applyFilters();

            // create object that will link card and it's card on the screen
            const stars = cards.map((card) => {
                const x0 = ev.clientX / window.innerWidth * 100;
                const y0 = ev.clientY / window.innerHeight * 100;
                const x = 5 + Math.random() * 90;
                const y = 5 + Math.random() * 90;
                const d = Math.hypot(x0 - x, y0 - y);
                const elem = document.createElement("i");
                elem.className = wishlistMode ? "icon-like" : "icon-liked";
                elem.style.setProperty("--endX",  `${x}%`);
                elem.style.setProperty("--endY", `${y}%`);
                elem.style.setProperty("--time", `${1 + Math.random() * cards.length * 0.4}s`);
                return { card, elem, d };
            });
            stars.sort((a, b) => b.d - a.d);

            // create container with stars that display the wishlist status of the cards
            const div = document.createElement("div");
            div.id = "wishlist--animate";
            div.style.setProperty("--startX", `${ev.clientX / window.innerWidth * 100}%`);
            div.style.setProperty("--startY", `${ev.clientY / window.innerHeight * 100}%`);
            div.append(...stars.map(({ elem }) => elem));
            document.body.prepend(div);

            // sequentially favorite the cards
            const params = {
                method: "POST",
                headers: new Headers({
                    "X-CSRFToken": document.cookie.match(/csrftoken=(\w+)/)[1],
                }),
            };
            // eslint-disable-next-line no-restricted-syntax
            for (const star of stars) {
                // eslint-disable-next-line no-await-in-loop
                await api("api", `/pieces/${star.card.id}/favorite/`, params);
                star.card.favorite = !star.card.favorite;
                star.elem.className = wishlistMode ? "icon-liked" : "icon-like";
            }

            div.remove();
            $scope.applyFilters();
        };
    }]);
}

/**
 * Patches AngularJS to show button to rollback an edited trade.
 */
function addRollbackTradeButton () {
    // insert button to rollback the trade
    templatePatches.push({
        names: ["/static/common/trades/partial/footer.html"],
        patches: [{
            target: "<span>Offer Trade</span></button>",
            append:
                `<button class="btn subdued"
                    ng-if="getWindowState()==='counter' || getWindowState()==='modify'"
                    ng-controller="rollbackTradeButton"
                    ng-click="cancelChanges()"
                >
                    <span>Back</span>
                </button>`,
        }],
    });
    // add logic of the button
    angular.module("nm.trades").controller("rollbackTradeButton", [
        "$scope",
        "nmTrades",
        ($scope, nmTrades) => {
            // save copies of the original offers
            const bidderOffer = nmTrades.getOfferData("bidder_offer").prints.slice();
            const respOffer = nmTrades.getOfferData("responder_offer").prints.slice();

            $scope.cancelChanges = () => {
                // restore offers
                nmTrades.setOfferData("bidder_offer", bidderOffer);
                nmTrades.setOfferData("responder_offer", respOffer);

                // at countering the bidder and the responder are swapped
                // so we need to swap them back
                if (nmTrades.getWindowState() === "counter") {
                    nmTrades.startCounter();
                }

                nmTrades.setWindowState("view");
            };
            debug("rollbackTradeButton initiated");
        },
    ]);
}

/**
 * Apply enhancement to the trade window
 */
async function addTradeWindowEnhancements () {
    // a service to get user collection and their progress
    angular.module("nm.trades").factory("userCollections", [() => {
        debug("userCollections initiated");
        const collections = {};
        return {
            getCollections (user) {
                if (user.id in collections) return collections[user.id];
                collections[user.id] = fetch(user.links.collected_setts_names_only)
                    .then((resp) => resp.json())
                    .then((setts) => {
                        const settMap = {};
                        // eslint-disable-next-line no-restricted-syntax
                        for (const sett of setts) {
                            settMap[sett.id] = sett;
                        }
                        collections[user.id] = settMap;
                        return settMap;
                    });
                return collections[user.id];
            },
            dropCollection (user) {
                if (user.id in collections) delete collections[user.id];
            },
            getProgress (user, settId) {
                if (!(user.id in collections)) {
                    return this.getCollections(user).then(() => this.getProgress(user, settId));
                }
                if (collections[user.id] instanceof Promise) {
                    return collections[user.id].then(() => this.getProgress(user, settId));
                }
                if (!collections[user.id][settId]) return null;
                const {
                    name,
                    links: { permalink },
                    core_piece_count: coreCount,
                    chase_piece_count: chaseCount,
                    variant_piece_count: variantCount,
                    legendary_piece_count: legendaryCount,
                    owned_metrics: {
                        owned_core_piece_count: coreOwned,
                        owned_chase_piece_count: chaseOwned,
                        owned_variant_piece_count: variantOwned,
                        owned_legendary_piece_count: legendaryOwned,
                    },
                } = collections[user.id][settId];
                return {
                    name,
                    permalink,
                    coreCount,
                    chaseCount,
                    variantCount,
                    legendaryCount,
                    totalCount: coreCount + chaseCount + variantCount + legendaryCount,
                    coreOwned,
                    chaseOwned,
                    variantOwned,
                    legendaryOwned,
                    totalOwned: coreOwned + chaseOwned + variantOwned + legendaryOwned,
                };
            },
        };
    }]);

    // a service to get, edit, and sync filter sets
    angular.module("nm.trades").factory("tradeFilterSets", [() => {
        const setsObj = loadValue("filter_sets", {});
        const setsArr = [];
        // eslint-disable-next-line guard-for-in, no-restricted-syntax
        for (const key in setsObj) {
            if (!Array.isArray(setsObj[key].hiddenSeries)) setsObj[key].hiddenSeries = [];
            setsArr.push({ id: key, name: key });
        }
        setsArr.sort((a, b) => (a.name > b.name ? 1 : -1));
        setsArr.unshift({ id: null, name: "Choose a filter set" });
        setsArr.push({ id: "new_filter_set", name: "Save filters..." });

        debug("tradeFilterSets initiated");
        return {
            getFilterSets () { return setsArr; },
            getFilterSet (id) {
                const {
                    filters,
                    settName,
                    state,
                    hiddenSeries,
                } = setsObj[id];
                const seriesFilter = settName !== false ? filters.sett ?? state : undefined;
                return {
                    filters: {
                        // these props are optional so add "non-selected status"
                        wish_list_by: false,
                        incomplete_by: false,
                        not_owned_by: false,
                        ...filters,
                    },
                    seriesFilter,
                    hiddenSeries,
                };
            },
            saveFilterSet (filters, seriesFilter, hiddenSeries) {
                let name = prompt("Enter name of filter set"); // eslint-disable-line no-alert
                if (!name) {
                    return null;
                }
                name = toPascalCase(name);

                const filterSet = {
                    filters: { ...filters },
                    // eslint-disable-next-line no-alert
                    state: window.confirm("Include the selected series?")
                        ? seriesFilter
                        : undefined,
                    hiddenSeries: [...hiddenSeries],
                };
                if (!(name in setsObj)) {
                    setsArr.splice(-1, 0, { id: name, name });
                }
                setsObj[name] = filterSet;
                saveValue("filter_sets", setsObj);
                return name;
            },
            deleteFilterSet (id) {
                // eslint-disable-next-line no-alert
                if (id in setsObj && window.confirm("Delete this filter set?")) {
                    delete setsObj[id];
                    setsArr.splice(setsArr.findIndex((set) => set.id === id), 1);
                    saveValue("filter_sets", setsObj);
                    return true;
                }
                return false;
            },
            hasDefaultFilterSet () {
                return "Default" in setsObj;
            },
        };
    }]);

    // insert collection progress
    templatePatches.push({
        names: [
            "/static/common/trades/partial/add.html",
            "/static/common/trades/partial/item-list.html",
        ],
        patches: [{
            target: "<dt class=small-caps>Rarity</dt>",
            prepend:
                `<dt class=small-caps>Collected</dt>
                <dd>
                    <span
                        nm-collection-progress=you
                        nm-collection-progress-sett-id=print.sett_id
                    ></span>,
                    <span
                        nm-collection-progress=partner
                        nm-collection-progress-sett-id=print.sett_id
                    ></span>
                </dd>`,
        }],
    });
    // a directive to display collection progress
    angular.module("nm.trades").directive(
        "nmCollectionProgress",
        ["userCollections", (userCollections) => ({
            scope: {
                user: "=nmCollectionProgress",
                settId: "=nmCollectionProgressSettId",
            },
            template: `
                <span ng-class="{'text-warning': ready && !hasCollection}">
                    {{username}}:&nbsp;
                    <span ng-if="!ready">?</span>
                    <a ng-if="ready && hasCollection"
                        href="{{link}}"
                        target="_blank"
                        class="href-link"
                    >
                        {{progress}}
                    </a>
                    <span ng-if="ready && !hasCollection">—</span>
                </span>
            `.trim().replace(/\n\s+/g, ""),
            replace: true,
            async link (scope, $elem) {
                scope.ready = false;
                scope.username = scope.user.id === NM.you.attributes.id
                    ? "You"
                    : scope.user.first_name;

                const data = userCollections.getProgress(scope.user, scope.settId);
                const sett = data instanceof Promise ? await data : data;

                scope.hasCollection = !!sett;
                scope.ready = true;
                if (!sett) return;

                scope.link = sett.permalink.concat(`/user${scope.user.links.profile}/cards/`);
                scope.progress = `${sett.totalOwned}/${sett.totalCount}`;

                const a = await waitForElement($elem[0], "a");
                const content = [
                    `${sett.coreOwned}/${sett.coreCount}&nbsp;<i class='i core'></i>`,
                    sett.chaseCount
                        ? `<i class=pipe></i>
                            ${sett.chaseOwned}/${sett.chaseCount}&nbsp;
                            <i class='i chase'></i>`
                        : "",
                    // if here are all 4 type then locate them in 2 rows
                    sett.variantCount
                        ? (sett.chaseCount * sett.variantCount * sett.legendaryCount
                            ? "<br>"
                            : "<i class=pipe></i>")
                        : "",
                    sett.variantCount
                        ? `${sett.variantOwned}/${sett.variantCount}&nbsp;<i class='i variant'></i>`
                        : "",
                    sett.legendaryCount
                        ? `<i class=pipe></i>
                            ${sett.legendaryOwned}/${sett.legendaryCount}
                            <i class='i legendary'></i>`
                        : "",
                ];

                tippy(a, {
                    allowHTML: true,
                    content: content.join(""),
                    theme: "tooltip",
                });
            },
        })],
    );

    // insert the print chooser
    templatePatches.push({
        names: ["/static/common/trades/partial/item-list.html"],
        patches: [{
            target: "#{{print.print_num}}",
            replace: "<span nm-print-chooser=print></span>",
        }],
    });
    // a directive to allow users to choose print
    angular.module("nm.trades").directive("nmPrintChooser", ["nmTrades", (nmTrades) => ({
        template: `
            <span ng-if="!active() || state === 'loading'">
                #{{card.print_num}}
            </span>
            <span ng-if="active() && state === 'view'"
                class="tip"
                style="cursor: pointer"
                title="Change print number"
                ng-click="loadPrints()"
            >
                #{{card.print_num}}
            </span>
            <select class="print-chooser"
                ng-if="active() && state === 'choose'"
                ng-model="$parent.print"
                ng-options="print as '#'+print.print_num for print in prints"
                ng-change="setPrint()"
                ng-class="{'disabled': prints.length == 1}"
                ng-disabled="prints.length == 1"
            ></select>
        `.trim().replace(/\n\s+/g, ""),
        scope: {
            card: "=nmPrintChooser",
        },
        link (scope, $elem) {
            const giving = $elem.closest(".trade--side").is(".trade--you");
            const offerType = giving ? "bidder_offer" : "responder_offer";
            const offer = nmTrades.getOfferData(offerType).prints.slice();
            const print = offer.find(({ id }) => id === scope.card.id);
            // allow to change print during editing the trade and only on users side
            scope.active = () => giving
                && ["create", "modify", "counter"].includes(nmTrades.getWindowState());
            scope.state = "view";
            scope.loadPrints = async () => {
                scope.state = "loading";
                angular.element(".tip").tooltip("hide");
                const user = giving ? NM.you.attributes : nmTrades.getTradingPartner();
                const url = `/users/${user.id}/piece/${scope.card.id}/detail/`;
                const details = await api("api", url);
                scope.$apply(() => {
                    scope.prints = details.refs[details.payload[1]].prints;
                    scope.print = scope.prints.find((p) => p.id === print.print_id)
                        ?? scope.prints[scope.prints.length - 1];
                    scope.state = "choose";
                });
            };
            scope.setPrint = () => {
                print.print_id = scope.print.id;
                print.print_num = scope.print.print_num;
                // no direct access the variable _selectedIds so we modify in such way
                nmTrades.setOfferData(offerType, nmTrades.getOfferData(offerType).prints);
            };
        },
    })]);

    templatePatches.push({
        names: ["/static/common/trades/partial/create.html"],
        patches: [{
            // we cannot override a directive so we replace it in the template to our own directive
            target: "nm-trades-add",
            replace: "nm-trades-add2",
        }],
    }, {
        names: ["/static/common/trades/partial/add.html"],
        patches: [{
            // insert buttons to select or hide card's series
            target: "{{print.sett_name}}</a>",
            append:
                `<span ng-if="!filters.sett">
                    <span class="icon-button search-series-button"
                        ng-click="selectSeries(print.sett_id)"></span>
                    <span class="icon-button" ng-click="hideSeries(print.sett_id)">🗙</span>
                </span>`,
        }, {
            // display list of hidden series
            target: "<ul",
            prepend:
                `<div class="hiddenSeries" ng-if="hiddenSeries.length && !filters.sett">
                    <span class="small-caps">Hidden series: </span>
                    <span ng-repeat="sett in hiddenSeries">
                        <span class="tip" title="{{sett.tip}}">{{sett.name}}</span>
                        <a ng-click="showSeries(sett.id)">✕</a>{{$last ? "" : ","}}
                    </span>
                </div>`,
        }, {
            // insert list of filter sets and button to reset selected series
            target: `<select class="btn small subdued series"`,
            prepend:
                `<select class="btn small subdued filter-sets"
                    ng-model=$parent.filterSetId
                    ng-options="fset.id as fset.name for fset in filterSets"
                    ng-change=applyFilterSet()
                ></select>
                <span class="icon-button tip"
                    title="Delete filter set"
                    ng-click="deleteFilterSet()">🗑</span>
                <span class="reset tip" title="Reset series" ng-click="selectSeries(null)">
                    <i class='reset-sett'></i>
                </span>`,
        }, {
            // display series filters in the list of collecting series
            target: `<select class="btn small subdued series" ng-model=filters.sett`,
            replace: `<select class="btn small subdued series" ng-model=$parent.seriesFilter`,
        }, {
            // more advanced filtering is used instead of
            target: `ng-if="showCards() && displayPrintInList(print)"`,
            replace: "",
        }, {
            // fix loading indicator
            target: "!itemData.length && !showLoading()",
            replace: "!itemData.length && !loadingMore",
        }],
    });
    // based on https://d1ld1je540hac5.cloudfront.net/client/common/trades/module/add.js
    angular.module("nm.trades").directive("nmTradesAdd2", [
        "$timeout",
        "artNodeHttpService",
        "artPieceService",
        "artResource",
        "artSubscriptionService",
        "artUser",
        "artUrl",
        "nmTrades",
        "userCollections",
        "tradeFilterSets",
        (
            $timeout,
            artNodeHttpService,
            artPieceService,
            artResource,
            artSubscriptionService,
            artUser,
            artUrl,
            nmTrades,
            userCollections,
            tradeFilterSets,
        ) => ({
            scope: {
                partner: "=nmTradesAdd2",
                direction: "@nmTradesAdd2Direction",
                settId: "=?nmTradesAdd2Sett",
            },
            // $scope.direction is either 'give' or 'receive'
            // if 'give' this is the items the logged in user will give
            // if 'receive' this is the items the logged in user will receive
            templateUrl: "/static/common/trades/partial/add.html",
            link (scope, $elem) {
                scope.you = artUser.toObject();
                scope.addItemsActive = false;
                scope.loading = false;
                scope.typing = false;
                scope.loadingMore = false;
                scope.showBio = false;
                scope.itemData = [];
                scope.fullItemData = [];
                scope.hiddenSeries = [];
                scope.baseUrl = "/api/search/prints/";
                scope.filterSets = tradeFilterSets.getFilterSets();
                scope.filterSetId = null;

                const offerType = scope.direction === "give" ? "bidder_offer" : "responder_offer";
                const receivingUser = scope.direction === "give" ? scope.partner : scope.you;
                const givingUser = scope.direction === "give" ? scope.you : scope.partner;

                // if all cards are from the same series, set it as intial
                scope.initSettId = +scope.settId || null;
                if (!scope.initSettId && nmTrades.getOfferData(offerType).prints.length > 0) {
                    const [print, ...prints] = nmTrades.getOfferData(offerType).prints;
                    scope.initSettId = prints.every((pr) => pr.sett_id === print.sett_id)
                        ? print.sett_id
                        : null;
                }

                scope.notOwnedBy = {
                    val: false,
                    filter: receivingUser.id,
                };

                scope.wishListBy = {
                    val: false,
                    filter: receivingUser.id,
                };

                scope.incompleteBy = {
                    val: false,
                    filter: receivingUser.id,
                };

                scope.filters = {
                    user_id: givingUser.id,
                    partner_id: receivingUser.id,
                    search: null,
                    sett: scope.initSettId,
                    duplicates_only: false,
                    common: false,
                    uncommon: false,
                    rare: false,
                    veryRare: false,
                    extraRare: false,
                    variant: false,
                    chase: false,
                    legendary: false,
                };

                scope.updateWishListByFilter = () => {
                    if (scope.wishListBy.val) {
                        scope.filters.wish_list_by = scope.wishListBy.filter;
                    } else {
                        delete scope.filters.wish_list_by;
                    }
                    scope.load();
                };

                scope.updateIncompleteByFilter = () => {
                    if (scope.incompleteBy.val) {
                        scope.filters.incomplete_by = scope.incompleteBy.filter;
                    } else {
                        delete scope.filters.incomplete_by;
                    }
                    scope.load();
                };

                scope.updateNotOwnedByFilter = () => {
                    if (scope.notOwnedBy.val) {
                        scope.filters.not_owned_by = scope.notOwnedBy.filter;
                    } else {
                        delete scope.filters.not_owned_by;
                    }
                    scope.load();
                };

                let typingTimeout = null;
                scope.updateSearchFilter = () => {
                    if (!scope.typing) scope.typing = true;
                    $timeout.cancel(typingTimeout);
                    typingTimeout = $timeout(() => {
                        scope.load();
                        scope.typing = false;
                    }, 500);
                };

                scope.openAddItems = () => {
                    scope.addItemsActive = true;
                    artSubscriptionService.broadcast(`open-add-trade-items-${givingUser.id}`);
                };

                scope.closeAddItems = () => {
                    scope.addItemsActive = false;
                };

                scope.addPrint = (print) => {
                    nmTrades.addItem(offerType, "prints", print);
                    scope.closeAddItems();
                };

                scope.canAddItems = () => {
                    const offerData = nmTrades.getOfferData(offerType);
                    return offerData.prints.length < 5;
                };

                scope.hideSeries = (settId) => {
                    const yourSett = userCollections.getProgress(scope.you, settId);
                    const partnerSett = userCollections.getProgress(scope.partner, settId);
                    scope.hiddenSeries.push({
                        id: settId,
                        name: (yourSett ?? partnerSett).name,
                        tip: `You: ${yourSett
                                ? `${yourSett.totalOwned}/${yourSett.totalCount}`
                                : "—"},
                            ${scope.partner.first_name}: ${partnerSett
                                ? `${partnerSett.totalOwned}/${partnerSett.totalCount}`
                                : "—"}`,
                    });
                    scope.load();
                    scope.loading = false;
                };

                scope.showSeries = (settId) => {
                    const pos = scope.hiddenSeries.findIndex(({ id }) => id === settId);
                    if (pos >= 0) {
                        scope.hiddenSeries.splice(pos, 1);
                        scope.load();
                        scope.loading = false;
                    }
                };

                scope.selectSeries = (settId) => {
                    scope.seriesFilter = settId;
                    scope.load();
                };

                scope.isEmpty = () => scope.items.length === 0;

                // now users can trade only cards, but it cannot be removed because otherwise,
                // tips will be processed before calling getTooltip
                scope.showCards = () => true;

                scope.getPrintCount = artPieceService.getPrintCount.bind(artPieceService);

                scope.giving = () => scope.direction === "give";

                scope.getUrl = () => artUrl.updateParams(scope.baseUrl, scope.filters);

                scope.showLoading = () => scope.typing
                    || scope.loading && !scope.loadingMore;

                scope.getTooltip = (filter) => {
                    switch (filter) {
                        case "unowned":
                            return scope.giving()
                                ? "Cards your partner doesn't own"
                                : "Cards you don't own";
                        case "multiples":
                            return scope.giving()
                                ? "Cards you own multiples of"
                                : "Cards your partner owns multiples of";
                        case "wish_list":
                            return scope.giving()
                                ? "Cards your partner wishlisted"
                                : "Cards you wishlisted";
                        case "incomplete_by":
                            return scope.giving()
                                ? "Cards from same series you and your partner are collecting"
                                : "Cards from same series your partner and you are collecting";
                        default:
                            throw new Error(`Unknown filter: ${filter}`);
                    }
                };

                scope.deleteFilterSet = () => {
                    if (tradeFilterSets.deleteFilterSet(scope.filterSetId)) {
                        scope.filterSetId = null;
                    }
                };

                scope.applyFilterSet = () => {
                    if (!scope.filterSetId) return;
                    if (scope.filterSetId === "new_filter_set") {
                        scope.filterSetId = tradeFilterSets.saveFilterSet(
                            scope.filters,
                            scope.seriesFilter,
                            scope.hiddenSeries,
                        );
                        return;
                    }
                    const {
                        filters,
                        seriesFilter,
                        hiddenSeries,
                    } = tradeFilterSets.getFilterSet(scope.filterSetId);

                    if (seriesFilter !== undefined) scope.seriesFilter = seriesFilter;
                    scope.hiddenSeries = [...hiddenSeries];
                    Object.entries(filters).forEach(([filterName, filterValue]) => {
                        switch (filterName) {
                            case "sett":
                                // will be set at card loading
                                break;
                            case "search":
                            case "duplicates_only":
                            case "common":
                            case "uncommon":
                            case "rare":
                            case "veryRare":
                            case "extraRare":
                            case "variant":
                            case "chase":
                            case "legendary":
                                if (scope.filters[filterName] !== filterValue) {
                                    scope.filters[filterName] = filterValue;
                                }
                                break;
                            case "wish_list_by":
                            case "incomplete_by":
                            case "not_owned_by":
                                // if state of the filter need to be changed
                                // eslint-disable-next-line no-bitwise
                                if (!!scope.filters[filterName] !== !!filterValue) {
                                    let container;
                                    switch (filterName) {
                                        case "wish_list_by": container = "wishListBy"; break;
                                        case "incomplete_by": container = "incompleteBy"; break;
                                        case "not_owned_by": container = "notOwnedBy"; break;
                                        // no default
                                    }
                                    if (filterValue) {
                                        scope[container].val = true;
                                        scope.filters[filterName] = scope[container].filter;
                                    } else {
                                        scope[container].val = false;
                                        delete scope.filters[filterName];
                                    }
                                }
                                break;
                            case "user_id":
                            case "partner_id":
                                break;
                            default:
                                console.error(`Unknow filter ${filterName}`);
                                break;
                        }
                    });
                    const { filterSetId } = scope;
                    // apply filters and (re)load cards
                    scope.load();
                    scope.filterSetId = filterSetId;
                };

                let currLock = 0;
                async function displayPrint (print, lock) {
                    let showSeries;
                    let data;
                    switch (scope.seriesFilter) {
                        case "allSeries":
                            showSeries = true;
                            break;
                        case "finite": {
                            showSeries = print.num_prints_total !== "unlimited";
                            break;
                        }
                        case "infinite": {
                            showSeries = print.num_prints_total === "unlimited";
                            break;
                        }
                        case "freePackAvailable": {
                            data = getSeriesInfo(print.sett_id);
                            if (data instanceof Promise) data = await data;
                            showSeries = new Date(data.discontinue_date) > Date.now()
                                && (!data.freebies_discontinued
                                    || new Date(data.freebies_discontinued) > Date.now());
                            break;
                        }
                        case "anyPackAvailable": {
                            data = getSeriesInfo(print.sett_id);
                            if (data instanceof Promise) data = await data;
                            showSeries = new Date(data.discontinue_date) > Date.now();
                            break;
                        }
                        case "outOfPrint": {
                            data = getSeriesInfo(print.sett_id);
                            if (data instanceof Promise) data = await data;
                            showSeries = new Date(data.discontinue_date) < Date.now();
                            break;
                        }
                        default:
                            showSeries = !!scope.filters.sett;
                    }
                    showSeries &&= !scope.hiddenSeries.find(({ id }) => id === print.sett_id);
                    if (currLock === lock // filtering is still actuall
                            && showSeries
                            && !nmTrades.hasCard(offerType, print)
                            && !scope.itemData.includes(print)
                    ) {
                        scope.itemData.push(print);
                    }
                }

                async function displayPrints (prints, lock) {
                    await Promise.all(prints.map((print) => displayPrint(print, lock)));
                    if (currLock !== lock) return;
                    scope.loading = false;
                    scope.loadingMore = false;
                    // if nothing to display - load next data
                    if (scope.itemData.length < 10) {
                        scope.getNextPage();
                        return;
                    }
                    // avoid infinite card loading when not adding cards
                    if (!scope.addItemsActive) return;
                    // when cards will be displayed - trigger loading next data
                    // if user is close to end of list
                    await waitForElement($elem[0], "#print-list");
                    if ($elem.find("#print-list").scroll().length === 0) {
                        scope.getNextPage();
                    }
                }

                let prevUrl;
                scope.load = () => {
                    scope.filterSetId = null;
                    scope.loading = true;
                    scope.loadingMore = false;
                    scope.itemData = [];

                    if (!scope.seriesFilter) scope.seriesFilter = "allSeries";
                    scope.filters.sett = typeof scope.seriesFilter === "number"
                        ? scope.seriesFilter
                        : null;
                    currLock += 1;

                    const url = scope.getUrl();
                    // if were changed only user-side filters
                    if (url === prevUrl) {
                        displayPrints(scope.fullItemData, currLock);
                        return;
                    }

                    prevUrl = url;
                    const lock = currLock;
                    artResource.retrievePaginated(url).then((data) => {
                        if (currLock !== lock) return;
                        scope.fullItemData = data;
                        displayPrints(data, currLock);
                    });
                };

                let lock2 = false;
                scope.getNextPage = () => {
                    if (lock2 || scope.loading || !scope.fullItemData.next) return;
                    scope.loading = true;
                    scope.loadingMore = true;
                    lock2 = true;
                    scope.fullItemData.retrieveNext().then((data) => {
                        lock2 = false;
                        displayPrints(data, currLock);
                    });
                };

                function tradeChanged (ev) {
                    if (ev.offerType !== offerType) return;
                    if (ev.action === "added") {
                        scope.itemData.splice(scope.itemData.indexOf(ev.print), 1);
                    } else {
                        // print of the same card
                        const print = scope.fullItemData.find(({ id }) => id === ev.print.id);
                        if (print) displayPrint(print, currLock);
                    }
                }

                artSubscriptionService.subscribe("trade-change", tradeChanged);
                scope.$on("$destroy", () => {
                    artSubscriptionService.unsubscribe("trade-change", tradeChanged);
                });

                // initiate all data
                const stopWord = /^(the)? /i;
                function prepareSettsForDisplay (settData) {
                    if (!settData) return;

                    scope.collectedSetts.push(...Object.values(settData)
                        .map(({ id, name }) => ({ id, name, $name: name.replace(stopWord, "") }))
                        .sort((a, b) => a.$name.localeCompare(b.$name)));

                    if (settData[scope.initSettId]) {
                        scope.seriesFilter = scope.initSettId;
                        scope.filters.sett = scope.initSettId;
                    } else if (scope.initSettId) {
                        scope.seriesFilter = "allSeries";
                        scope.filters.sett = null;
                        scope.load();
                    }
                }

                scope.collectedSetts = [
                    { id: "allSeries", name: "Choose a Series" },
                    { id: "infinite", name: "Unlimited series" },
                    { id: "finite", name: "Limited series" },
                    { id: "freePackAvailable", name: "Free packs available" },
                    { id: "anyPackAvailable", name: "Any packs available" },
                    { id: "outOfPrint", name: "Out of print series" },
                    { id: null, name: "" },
                ];
                scope.seriesFilter = scope.initSettId ?? "allSeries";
                if (tradeFilterSets.hasDefaultFilterSet()) {
                    scope.filterSetId = "Default";
                    scope.applyFilterSet(); // triggers scope.load()
                } else {
                    scope.load();
                    scope.seriesFilter = "allSeries";
                }
                const data = userCollections.getCollections(givingUser);
                if (data instanceof Promise) {
                    data.then(prepareSettsForDisplay);
                } else {
                    prepareSettsForDisplay(data);
                }
                debug("nmTradesAdd2 initiated");
            },
        }),
    ]);
}

/**
 * Adds a button to open a promo pack if available
 */
function addPromoPackButton () {
    // add button for promo pack
    templatePatches.push({
        names: ["partials/art/set-header.partial.html"],
        patches: [{
            target: `<div class="set-header--collect-it" nm-collect-it-button="sett"></div>`,
            prepend: `
                <div class="set-header--collect-it" nm-promo-pack-btn=sett>
                    <span class="btn reward collect-it-button">Open promo pack</span>
                </div>`,
        }],
    });
    // define the button logic
    angular.module("neonmobApp").directive("nmPromoPackBtn", [
        "poRoute",
        "artOverlay",
        "artMessage",
        "poPackSelect",
        "poMilestones",
        "artConfig",
        "$http",
        (poRoute, artOverlay, artMessage, poPackSelect, poMilestones, artConfig, $http) => ({
            scope: {
                sett: "=nmPromoPackBtn",
            },
            link: (scope, $elem) => {
                const { promoCode, settId } = loadValue("promoCode", {});
                if (!promoCode || +settId !== scope.sett.id) {
                    $elem.remove();
                    return;
                }
                $elem.click(async () => {
                    // merged re-implementation of nmPromoCodes.redeemPromoCode and
                    // poRoute.launchOpenPromoPack to correctly proceed errors
                    artOverlay.show("promocodes-redeeming");

                    poPackSelect.setPackType(poPackSelect.PROMO_PACK);
                    poPackSelect.startPackSelect(scope.sett.links.self);
                    try {
                        await poMilestones.initPoMilestones();
                        await poPackSelect.fetchSett();
                        const resp = await $http.post(artConfig.api["api-promo-codes-redeem"], {
                            code: promoCode,
                            store_signup_sett: false,
                        });
                        await poRoute.openPack(resp.data.pack);
                    } catch (ex) {
                        artOverlay.hide();
                        if (ex.status === 400) {
                            artMessage.showAlert(ex.data.detail);
                        } else {
                            artMessage.showAlert(`
                                Sorry, we were not able to redeem your promocode.
                                Please try again by going to the url or
                                contact via the feedback button.`);
                        }
                        console.log(ex);
                    } finally {
                        saveValue("promoCode", {});
                        $elem.remove();
                    }
                });
                debug("nmPromoPackBtn initiated");
            },
        }),
    ]);
}

/**
 * Adds a controller for NM Trade Enhancements settings block on the account settings page
 */
function addTradeEnhancementsSettings () {
    // the nm.account.settings module is available only at the account settings page
    if (!window.location.pathname.startsWith("/account/")) return;
    // add settings to enable/disable auto-opening of promo packs
    templatePatches.push({
        names: ["/static/page/account/partial/account-settings.partial.html"],
        pages: ["/account/"],
        patches: [{
            target: `account-settings-email-subscriptions.partial.html'"></div>`,
            append:
                `<fieldset class="nmte-settings--fieldset"
                    data-ng-controller=nmTradeEnhancementsSettingsController
                >
                    <h2 class=strike-through-header>Trade Enhancements</h2>
                    <div class="field checkbox-slider--field">
                        <span class=input>
                            <span class=checkbox-slider>
                                <input
                                    type=checkbox
                                    class=checkbox-slider--checkbox
                                    id=nmte-promo
                                    ng-model=disableAutoOpeningPromo
                                    ng-change=updatePromo()
                                >
                                <span class=checkbox-slider--knob></span>
                            </span>
                            <label class=checkbox-slider--label for=nmte-promo>
                                Disable auto-opening of promo packs
                            </label>
                        </span>
                    </div>
                </fieldset>`,
        }],
    });
    angular.module("nm.account.settings").controller("nmTradeEnhancementsSettingsController", [
        "$scope",
        ($scope) => {
            $scope.disableAutoOpeningPromo = !loadValue("openPromo", true);
            $scope.updatePromo = () => {
                saveValue("openPromo", !$scope.disableAutoOpeningPromo);
                console.log($scope.disableAutoOpeningPromo);
            };
            debug("nmTradeEnhancementsSettingsController initiated");
        },
    ]);
}

/**
 * Add a directive for providing cards in the same order as in the series checklist
 */
function addChecklistOrderCards () {
    // make cards order match with one in the series checklist
    templatePatches.push({
        names: ["partials/art/sett-checklist.partial.html"],
        patches: [{
            target: `id="sett-checklist" `,
            append: `add-checklist-ordered-cards="pieces" `,
        }, {
            target: `data-art-sett-checklist-rarity-group="pieces"`,
            replace: `data-art-sett-checklist-rarity-group="checklistCards"`,
        }],
    });
    angular.module("neonmobApp").directive("addChecklistOrderedCards", [() => ({
        scope: { pieces: "=addChecklistOrderedCards" },
        link: (scope, $elem) => {
            scope.$watch("pieces", (newValue, oldValue) => {
                scope.$parent.checklistCards = scope.pieces?.slice()
                    .sort((a, b) => a.rarity.rarity - b.rarity.rarity);
            });
            debug("addChecklistOrderedCards initiated");
        },
    })]);
}

/**
 * Shows in which trades the card is used if it is
 */
function addUsageInTrades () {
    templatePatches.push({
        // insert card usage on collection page
        names: ["partials/collection/collection-prints.partial.html"],
        patches: [{
            target: `title="Limited Edition"></span>`,
            append: `<span
                data-ng-controller="nmUsageInTrades"
                data-length="{{trades.length}}"
                class="card-trading-icon"></span>`,
        }],
    }, {
        // insert card usage on series page
        names: ["partials/art/sett-checklist-rarity-group.partial.html"],
        patches: [{
            target: `</li>`,
            prepend: `<span
                data-ng-controller="nmUsageInTrades"
                data-length="{{trades.length}}"
                class="card-trading-icon"></span>`,
        }],
    }, {
        // insert card usage in trades
        names: [
            "/static/common/trades/partial/add.html",
            "/static/common/trades/partial/item-list.html",
        ],
        patches: [{
            target: "</li>",
            prepend: `
                <span data-ng-controller="nmUsageInTrades" class="card-trading">
                    <span ng-if="trades.length === 1" class="text-warning">
                        Used in another trade
                    </span>
                    <span ng-if="trades.length > 1" class="text-warning">
                        Used in {{trades.length}} more trades
                    </span>
                </span>`,
        }],
    });
    angular.module("nm.trades").controller("nmUsageInTrades", [
        "$scope",
        "$element",
        "nmTrades",
        ($scope, $elem, nmTrades) => {
            const dir = $scope.print // if it's a trade window
                ? ($elem.closest(".trade--side.trade--you").length > 0 ? "give" : "receive")
                : "both";
            const lvl = dir === "give" ? "print" : "card";
            const currentTrade = $scope.print ? nmTrades.getId() : null;
            $scope.trades = [];

            async function loadTrades () {
                let trades = await cardsInTrades.getTrades($scope.print ?? $scope.piece, dir, lvl);
                // exclude the current trade
                if (trades.length > 0 && currentTrade) {
                    trades = trades.filter((trade) => trade !== currentTrade);
                }
                attachTip($elem[0], trades, $scope.piece?.id);
                $scope.$apply(() => { $scope.trades = trades; });
            }

            if ($scope.print) {
                // when in a trade
                $scope.$watch(() => $scope.print.print_id, loadTrades);
            } else {
                // when viewing the card
                $scope.$watch(() => cardsInTrades.lastUpdate, loadTrades);
            }
        },
    ]);

    async function attachTip (elem, tradeIds, cardId) {
        // destroy preivous tip if presented
        // eslint-disable-next-line no-underscore-dangle
        elem._tippy?.destroy();
        if (tradeIds.length === 0) return;

        const trades = await Promise.all(tradeIds.map((id) => Trade.get(id)));

        const tip = document.createElement("div");
        if (trades.length === 1) {
            tip.append(trades[0].makeTradePreview(cardId));
        } else {
            let pos = 0;
            const controls = document.createElement("header");
            controls.className = "text-prominent text-small";
            controls.innerHTML = `
                <a class="off">&lt;</a>
                trade with <span>${trades[0].partner.name}</span>
                <a>&gt;</a>`;
            const [prev, currTrade, next] = controls.children;

            const showTradePreivew = async (change) => {
                pos += change;
                if (pos < 0 || pos >= trades.length) {
                    pos -= change;
                    return;
                }
                prev.classList.toggle("off", pos === 0);
                next.classList.toggle("off", pos === trades.length - 1);
                currTrade.textContent = trades[pos].partner.name;
                controls.nextSibling.replaceWith(trades[pos].makeTradePreview(cardId));
            };
            prev.addEventListener("click", (ev) => showTradePreivew(-1));
            next.addEventListener("click", (ev) => showTradePreivew(+1));

            tip.append(
                controls,
                trades[pos].makeTradePreview(cardId),
            );
        }

        tippy(elem, {
            appendTo: document.body,
            delay: [500, 200],
            interactive: true,
            content: tip,
            theme: "trade",
        });
    }
}

/**
 * Patch the given object with templates;
 * @param  {$cacheFactory.Cache} $templateCache - map of templates
 */
function patchTemplates ($templateCache) {
    templatePatches.push({
        names: ["partials/trade/piece-trader-list.partial.html"],
        patches: [{
            // allow to see the total number of needs/seekers
            target: /span\s+data-ng-pluralize([^}]*)}} (Owners|Collectors)/g,
            replace: (str, p1, p2) => `span
                class="tip"
                title="{{itemData.count}} ${p2}"
                data-ng-pluralize${p1}}} ${p2}`,
        }],
    }, {
        names: ["partials/art/sett-checklist-rarity-group.partial.html"],
        patches: [{
            // enable arrows on the detailed card view
            target: `nm-show-piece-detail="piece" `,
            append: `nm-show-piece-detail-collection="pieces" `,
        }],
    }, {
        // sort cards by rarity in a trade preview in the conversation
        names: ["partials/component/comments.partial.html"],
        patches: [{
            target: `comment.attachment.bidder_offer.prints`,
            append: ` | orderBy:'rarity.rarity':true`,
        }, {
            target: `comment.attachment.responder_offer.prints`,
            append: ` | orderBy:'rarity.rarity':true`,
        }],
    });
    templatePatches.forEach(({ names, patches, pages }) => names.forEach((name) => {
        // if set to apply the patch only on certain pages
        if (pages && pages.every((page) => !window.location.pathname.startsWith(page))) {
            return;
        }
        let template = $templateCache.get(name);
        let fromCache = true;
        if (!template) {
            template = document.getElementById(name)?.textContent;
            fromCache = false;
        }
        if (!template) {
            console.error(`Couldn't get template ${name}`);
            return;
        }
        // eslint-disable-next-line object-curly-newline
        patches.forEach(({ target, prepend, replace, append }) => {
            if (replace != null) {
                template = template.replaceAll(target, replace);
            } else if (prepend != null) {
                template = template.replaceAll(target, prepend.concat(target));
            } else {
                template = template.replaceAll(target, target.concat(append));
            }
        });
        if (fromCache) {
            $templateCache.put(name, template);
        } else {
            document.getElementById(name).textContent = template;
        }
    }));
    debug("templates patched");
}

/**
 * Patch the nmTrades service
 * @param  {Service} nmTrades - service to patch
 * @param  {Service} userCollections - service to get user's collections
 * @param  {Service} artSubscriptionService - service to broadcast messages
 */
function patchNMTrades (nmTrades, userCollections, artSubscriptionService) {
    const replaceArray = (target, source) => {
        target.splice(0, target.length, ...source);
    };
    // make setting the trading cards easier
    nmTrades.setOfferData = (offerType, prints) => {
        replaceArray(nmTrades.getOfferData(offerType).prints, prints);
        replaceArray(nmTrades.getPrintIds(offerType), prints.map((print) => print.print_id));
    };
    // replace method `nmTrades.startCounter` with one that doesn't resets variable `_tradeId`
    nmTrades.startCounter = () => {
        nmTrades.startModify(); // to set `_parentId`

        // swap offers without overwriting arrays
        const bidOffer = nmTrades.getOfferData("bidder_offer").prints.slice();
        const respOffer = nmTrades.getOfferData("responder_offer").prints.slice();

        nmTrades.setOfferData("bidder_offer", respOffer);
        nmTrades.setOfferData("responder_offer", bidOffer);

        // swap bidder and responder without overwriting objects themself
        const bidder = nmTrades.getBidder();
        const responder = nmTrades.getResponder();

        Object.getOwnPropertyNames(bidder).forEach((prop) => {
            [bidder[prop], responder[prop]] = [responder[prop], bidder[prop]];
        });

        nmTrades.setWindowState("counter");
    };
    // load user collections when trade is loading and notify about added/removed cards
    const origSetWindowState = nmTrades.setWindowState;
    nmTrades.setWindowState = (state) => {
        if (state === "create" || state === "view") {
            // preload collections
            userCollections.getCollections(nmTrades.getResponder());
            userCollections.getCollections(nmTrades.getBidder());
            // sort cards by rarity
            const comp = (a, b) => b.rarity.rarity - a.rarity.rarity;
            nmTrades.setOfferData(
                "bidder_offer",
                nmTrades.getOfferData("bidder_offer").prints.sort(comp),
            );
            nmTrades.setOfferData(
                "responder_offer",
                nmTrades.getOfferData("responder_offer").prints.sort(comp),
            );
        }
        origSetWindowState(state);
    };
    const origClearTradeQuery = nmTrades.clearTradeQuery;
    nmTrades.clearTradeQuery = () => {
        userCollections.dropCollection(nmTrades.getTradingPartner());
        origClearTradeQuery();
    };
    // broadcast a message when the trade get changed
    const origAddItem = nmTrades.addItem;
    nmTrades.addItem = (offerType, itemType, print) => {
        origAddItem(offerType, itemType, print);
        artSubscriptionService.broadcast(
            "trade-change",
            { offerType, action: "added", print },
        );
    };
    const origRemoveItem = nmTrades.removeItem;
    nmTrades.removeItem = (offerType, itemType, index) => {
        const print = nmTrades.getOfferData(offerType).prints[index];
        origRemoveItem(offerType, itemType, index);
        artSubscriptionService.broadcast(
            "trade-change",
            { offerType, action: "removed", print },
        );
    };

    // check if a card is added to trade
    nmTrades.hasCard = (offerType, card) => !!nmTrades
        .getOfferData(offerType).prints.find(({ id }) => id === card.id);

    debug("nmTrades patched");
}

/**
 * Patch artResource to cache list of partners for 15 minutes.
 */
function patchArtResource (artResource) {
    const origFunc = artResource.retrievePaginatedAllowCancel;
    const cache = {};
    artResource.retrievePaginatedAllowCancel = (config) => {
        // this function is used only in the partner search list
        // so it safe to use only the url as a key
        if (!(config.url in cache)) {
            cache[config.url] = origFunc(config);
            const timer = setTimeout(() => { delete cache[config.url]; }, 15 * 60 * 1000);
            // do not cache bad responces
            cache[config.url].catch(() => {
                delete cache[config.url];
                clearTimeout(timer);
            });
        }
        return cache[config.url];
    };
    debug("artResource patched");
}

/**
 * Apply patches with two ways
 */
function applyPatches () {
    let applied = false;
    const patcher = [
        "$templateCache",
        "nmTrades",
        "userCollections",
        "artSubscriptionService",
        "artResource",
        (
            $templateCache,
            nmTrades,
            userCollections,
            artSubscriptionService,
            artResource,
        ) => {
            patchTemplates($templateCache);
            patchNMTrades(nmTrades, userCollections, artSubscriptionService);
            patchArtResource(artResource);
            applied = true;
        },
    ];

    angular.module("nmApp").run(patcher);
    window.addEventListener("load", () => {
        if (applied) return;
        debug("late patching");
        const getService = angular.element(document.body).injector().get;
        const func = patcher.pop();
        func(...patcher.map(getService));
    });
}

// =============================================================================
//                         Program execution start
// =============================================================================

if (window.location.pathname.startsWith("/redeem/") && !loadValue("openPromo", true)) {
    // cancel auto-opening a promo pack and redirect to series page
    const getCookie = (name) => document.cookie.split(";")
        .find((str) => str.trim().startsWith(name))
        ?.split("=")?.[1];
    const promoCode = getCookie("promo_code");
    if (promoCode) {
        const settId = getCookie("promo_sett_url").match(/\d+/)[0];
        saveValue("promoCode", { promoCode, settId });
        // remove cookies to not trigger auto-opening of the promo pack
        document.cookie = "promo_code=;max-age=0;path=/";
        document.cookie = "promo_sett_url=;max-age=0;path=/";
        document.location = `/series/${settId}/`;
    }
    // further execution will only cause errors
    return;
}

fixAutoWithdrawnTrade();
updateCardsInTrade();

document.addEventListener("keyup", addHotkeys, true);
document.addEventListener("DOMContentLoaded", () => {
    forAllElements(document, "div.nm-conversation--header", addLastActionAgo);
    forAllElements(document, "li.nm-notification, li.nm-notifications-feed--item", addTradePreview);
    forAllElements(document, "span.collect-it.collect-it-button", fixFreebieCount);

    try {
        angular.module("nm.trades");
    } catch {
        console.warn("[NM trade enhancements] Nothing to patch!");
        // to not break angular
        return;
    }

    addRollbackTradeButton();
    addTradeWindowEnhancements();
    addPromoPackButton();
    addTradeEnhancementsSettings();
    addChecklistOrderCards();
    addWishlistButton();
    addUsageInTrades();
    makePiecePeekable();
    applyPatches();
});

// ==UserScript==
// @name         NM trade enhancement
// @namespace    7nik
// @version      2.0-beta
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

    .trade--side--header .filter-sets + .icon-button {
        display: none;
        color: #5f5668;
        margin-left: 0.3em;
    }
    .trade--side--header:hover .filter-sets + .icon-button {
        display: initial;
    }
    .trade--side--header .filter-sets + .icon-button:hover {
        color: #085b85;
    }

    .trade--add-items--filters input.search,
    .trade--add-items--filters select.series{
        width: 47.8%;
    }
    .trade--add-items--filters span.reset {
        border: none;
        margin: 5px -0.75% 5px 0;
        width: 3%;
        cursor: pointer;
        text-align: right;
    }
    .trade--add-items--filters span.reset .reset-sett {
        display: inline-block;
        width: 100%;
        max-width: 18px;
        height: 18px;
        opacity: 0.8;
        background-image: url(${RESET_BUTTON_ICON});
        background-size: contain;
        background-position: bottom;
        background-repeat: no-repeat;
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
        box-shadow: 0 1px 2px rgba(0, 0, 0, .15);
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
`);

const cardsInTrades = (() => {
    let res;
    return {
        receive: {},
        give: {},
        loading: new Promise((resolve) => { res = resolve; }),
        ready () {
            cardsInTrades.loading = false;
            res();
        },
    };
})();

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
        this.partner = youAreBidder ? trade.responder : trade.bidder;
        this.parnerOffer = youAreBidder ? trade.responder_offer.prints : trade.bidder_offer.prints;
    }

    /**
     * Creates the trade preview
     * @return {HTMLElement} Element with trade preview
     */
    makeTradePreview () {
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

        return a;
    }

    /**
     * Creates small thumbnail of a print
     * @param  {Object} print - Print for thumbnailing
     * @return {string} HTML code of the thumbnail
     */
    static makeThumb (print) {
        return `
        <span class="trade-preview--print">
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
    return GM_getValue(name, defValue);
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
    const updatePrint = (tradeId, side, pid, change) => {
        if (pid in cardsInTrades[side]) {
            if (change > 0) {
                cardsInTrades[side][pid].push(tradeId);
            } else {
                cardsInTrades[side][pid] = cardsInTrades[side][pid]
                    .filter((id) => id !== tradeId);
            }
        } else if (change > 0) {
            cardsInTrades[side][pid] = [tradeId];
        }
    };
    const updateTrade = async ({ object: { id } }, change) => {
        const trade = await Trade.get(id);
        // you can propose the same print in multiple trades
        trade.yourOffer.forEach(({ print_id: pid }) => updatePrint(id, "give", pid, change));
        // but you usually do only one trade for a some print do group by card id
        trade.parnerOffer.forEach(({ id: pid }) => updatePrint(id, "receive", pid, change));
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
        .then((data) => data[0]?.created ?? "roughly never");

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
        // otherwise an overlay will be closed by the angular
    }
}

/**
 * On detailed view of a card makes grayed image colored/animed at clicking and holding on it.
 * @param  {HTMLElement} piece - <div[data-art-piece-asset='piece']>
 */
function makePiecePeekable (piece) {
    if (!piece.querySelector("img[src*='_gray']")) return;

    const { imageSize, piece: { piece_assets: { image, video } } } = getScope(piece);
    const videoSize = imageSize === "xlarge" ? "large" : imageSize;

    piece.addEventListener("mousedown", (ev) => {
        if (ev.button !== 0) return;
        ev.preventDefault();

        let elem;
        if (video) {
            elem = document.createElement("video");
            elem.autoplay = true;
            elem.loop = true;
            elem.innerHTML = video[videoSize].sources
                .map(({ mime_type: type, url }) => `<source src="${url}" type="${type}">`)
                .join("");
            elem.addEventListener("loadedmetadata", () => { elem.style.cursor = null; });
        } else {
            elem = document.createElement("img");
            elem.src = image[imageSize].url;
            elem.addEventListener("load", () => { elem.style.cursor = null; });
        }
        elem.style.position = "absolute";
        elem.style.top = "0";
        elem.style.width = "100%";
        elem.style.height = "100%";
        elem.style.background = "transparent";
        elem.style.cursor = "progress";
        piece.firstElementChild.append(elem);
        window.addEventListener("mouseup", () => elem.remove(), { once: true });
    });
}

/**
 * Adds button to wishlist all unowned cards according to rariry filters
 * @param {HTMLElement} container - <div.collection--filters>
 */
function addWishlistButton (container) {
    // add button to only your collections
    // use such check because when the container is just added, it's `scope.isOwner` is still false
    if (window.location.pathname.match(/user\/(.+)\/cards/)?.[1] !== NM.you.attributes.username) {
        return;
    }
    const button = document.createElement("span");
    button.className = "btn wislist-btn tip";
    button.textContent = "Wishlist cards";
    button.title = "Wishlist unowned cards according to the chosen rarities";
    button.addEventListener("click", wishlistCards);
    container.append(button);
}

/**
 * Wishlist all unowned card according to rarity filters
 * @param  {Event} ev - The button click event
 */
async function wishlistCards (ev) {
    const container = ev.target.closest(".sett-detail-container");
    const {
        applyFilters,
        favoriteFilter,
        filters,
        getNextPage,
    } = getScope(container);

    // save current filters
    const { ownership, duplicate } = filters;
    const favorite  = favoriteFilter?.selected;

    // set temporal filters
    favoriteFilter.selected = false;
    filters.ownership = "unowned";
    filters.duplicate = null;
    applyFilters();

    // display and save all cards
    let cards = [];
    let count;
    do {
        count = cards.length;
        getNextPage();
        cards = getScope(container).columns.flat();
    } while (cards.length > count);
    cards = cards.filter((card) => !card.favorite);

    // restore the filters now to avoid small lagging that is visible due to animation
    favoriteFilter.selected = favorite;
    filters.ownership = ownership;
    filters.duplicate = duplicate;
    applyFilters();

    // create container with stars that display the wishlist status of the cards
    const div = document.createElement("div");
    div.id = "wishlist--animate";
    div.style.setProperty("--startX", `${ev.clientX / window.innerWidth * 100}%`);
    div.style.setProperty("--startY", `${ev.clientY / window.innerHeight * 100}%`);
    div.append(...cards.map(({ id }) => {
        const i = document.createElement("i");
        i.className = "icon-like";
        i.id = `card-${id}`;
        i.style.setProperty("--endX",  `${5 + Math.random() * 90}%`);
        i.style.setProperty("--endY", `${5 + Math.random() * 90}%`);
        i.style.setProperty("--time", `${1 + Math.random() * cards.length * 0.67}s`);
        return i;
    }));
    document.body.prepend(div);

    // sequentially favorite the cards
    const params = {
        method: "POST",
        headers: new Headers({ "X-CSRFToken": document.cookie.match(/csrftoken=(\w+)/)[1] }),
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const card of cards) {
        // eslint-disable-next-line no-await-in-loop
        await api("api", `/pieces/${card.id}/favorite/`, params);
        card.favorite = !card.favorite;
        div.querySelector(`#card-${card.id}`).className = "icon-liked";
    }

    div.remove();
}

/**
 * Patches AngularJS to show button to rollback an edited trade.
 */
function addRollbackTradeButton () {
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

    // a directive to mark cards used in other trades
    angular.module("nm.trades").directive("nmUsedInTrades", ["nmTrades", (nmTrades) => {
        const attachTip = async (elem, tradeIds) => {
            // destroy preivous tip if presented
            // eslint-disable-next-line no-underscore-dangle
            elem._tippy?.destroy();
            if (tradeIds.length === 0) return;

            const trades = await Promise.all(tradeIds.map((id) => Trade.get(id)));

            const tip = document.createElement("div");
            if (trades.length === 1) {
                tip.append(trades[0].makeTradePreview());
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
                    controls.nextSibling.replaceWith(trades[pos].makeTradePreview());
                };
                prev.addEventListener("click", (ev) => showTradePreivew(-1));
                next.addEventListener("click", (ev) => showTradePreivew(+1));

                tip.append(
                    controls,
                    trades[pos].makeTradePreview(),
                );
            }

            tippy(elem, {
                appendTo: document.body,
                delay: [500, 200],
                interactive: true,
                content: tip,
                theme: "trade",
            });
        };
        const getTrades = async (print, elem) => {
            if (cardsInTrades.loading) await cardsInTrades.loading;

            const giving = elem.closest(".trade--side").matches(".trade--you");
            const pid = print[giving ? "print_id" : "id"];
            let tradeIds = cardsInTrades[giving ? "give" : "receive"][pid] ?? [];

            // exclude the current trade
            if (tradeIds?.length > 0 && nmTrades.getId()) {
                const currentTrade = nmTrades.getId();
                tradeIds = tradeIds.filter((trade) => trade !== currentTrade);
            }

            return tradeIds;
        };

        return {
            scope: {
                print: "=nmUsedInTrades",
            },
            template: `
                <span ng-if="length > 0" class="text-warning">
                    <span ng-if="length === 1">Used in another trade</span>
                    <span ng-if="length > 1">Used in {{length}} more trades</span>
                </span>
            `,
            async link (scope, $elem) {
                scope.length = 0;
                scope.$watch(
                    () => scope.print.print_id,
                    () => getTrades(scope.print, $elem[0]).then((trades) => {
                        scope.$apply(() => { scope.length = trades.length; });
                        attachTip($elem[0], trades);
                    }),
                );
            },
        };
    }]);

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
            <select ng-if="active() && state === 'choose'"
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
                scope.prints = details.refs[details.payload[1]].prints;
                scope.print = scope.prints[scope.prints.length - 1];
                scope.state = "choose";
            };
            scope.setPrint = () => {
                const offerType = giving ? "bidder_offer" : "responder_offer";
                const offer = nmTrades.getOfferData(offerType).prints.slice();
                const print = offer.find(({ id }) => id === scope.card.id);
                const pos = offer.indexOf(print);
                print.print_id = scope.print.id;
                print.print_num = scope.print.print_num;
                // no direct access the variable _selectedIds so we modify is such way
                nmTrades.getPrintIds(offerType).splice(pos, 1, print.print_id);
            };
        },
    })]);

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

                let lastUrl;
                async function displayPrint (print, url) {
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
                    if (lastUrl === url // filtering is still actuall
                            && showSeries
                            && !nmTrades.hasPrintId(offerType, print.print_id)
                            && !scope.itemData.includes(print)) {
                        scope.itemData.push(print);
                    }
                }

                async function displayPrints (prints, url) {
                    await Promise.all(prints.map((print) => displayPrint(print, url)));
                    if (lastUrl !== url) return;
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

                scope.load = () => {
                    scope.filterSetId = null;
                    scope.loading = true;
                    scope.loadingMore = false;
                    scope.itemData = [];

                    if (!scope.seriesFilter) scope.seriesFilter = "allSeries";
                    scope.filters.sett = typeof scope.seriesFilter === "number"
                        ? scope.seriesFilter
                        : null;

                    const url = scope.getUrl();
                    if (url === lastUrl) {
                        displayPrints(scope.fullItemData, url);
                        return;
                    }

                    lastUrl = url;
                    artResource.retrievePaginated(url).then((data) => {
                        if (lastUrl !== url) return;
                        scope.fullItemData = data;
                        displayPrints(data, url);
                    });
                };

                scope.getNextPage = () => {
                    if (scope.loading || !scope.fullItemData.next) return;
                    scope.loading = true;
                    scope.loadingMore = true;
                    scope.fullItemData.retrieveNext().then((data) => {
                        displayPrints(data, lastUrl);
                    });
                };

                function tradeChanged (ev) {
                    if (ev.offerType !== offerType) return;
                    if (ev.action === "added") {
                        scope.itemData.splice(scope.itemData.indexOf(ev.print), 1);
                    } else if (scope.fullItemData.includes(ev.print)) {
                        displayPrint(ev.print, lastUrl);
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
 * Patch the given object with templates;
 * @param  {$cacheFactory.Cache} $templateCache - map of templates
 */
function patchTemplates ($templateCache) {
    [{
        names: ["/static/common/trades/partial/create.html"],
        patches: [{
            // we cannot override a directive so we replace it in the template to our own directive
            target: "nm-trades-add",
            replace: "nm-trades-add2",
        }],
    }, {
        names: [
            "/static/common/trades/partial/add.html",
            "/static/common/trades/partial/item-list.html",
        ],
        patches: [{
            // insert collection progress
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
        }, {
            // insert card usage in trades
            target: "</li>",
            prepend: `<span nm-used-in-trades=print class="card-trading"></span>`,
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
            // insert button to reset selected series
            target: `<select class="btn small subdued series"`,
            prepend:
                `<span class="reset tip" title="Reset series" ng-click="selectSeries(null)">
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
            target: "will give",
            append: ", use filter set",
        }, {
            // insert list of filter sets
            target: "<span class=trade--side--header--actions ng-click",
            prepend: `
                <select class="btn small subdued filter-sets"
                    ng-model=filterSetId
                    ng-options="fset.id as fset.name for fset in filterSets"
                    ng-change=applyFilterSet()
                ></select>
                <span class="icon-button" ng-click="deleteFilterSet()">🗑</span>`,
        }, {
            // fix loading indicator
            target: "!itemData.length && !showLoading()",
            replace: "!itemData.length && !loadingMore",
        }],
    }, {
        names: ["/static/common/trades/partial/item-list.html"],
        patches: [{
            // insert the print chooser
            target: "#{{print.print_num}}",
            replace: "<span nm-print-chooser=print></span>",
        }],
    }, {
        names: ["/static/common/trades/partial/footer.html"],
        patches: [{
            // insert button to rollback the trade
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
    }, {
        names: ["partials/art/set-header.partial.html"],
        patches: [{
            target: `<div class="set-header--collect-it" nm-collect-it-button="sett"></div>`,
            prepend: `
                <div class="set-header--collect-it" nm-promo-pack-btn=sett>
                    <span class="btn reward collect-it-button">Open promo pack</span>
                </div>`,
        }],
    }, {
        names: ["partials/trade/piece-trader-list.partial.html"],
        patches: [{
            target: /span\s+data-ng-pluralize([^}]*)}} (Owners|Collectors)/g,
            replace: (str, p1, p2) => `span
                class="tip"
                title="{{itemData.count}} ${p2}"
                data-ng-pluralize${p1}}} ${p2}`,
        }],
    }].forEach(({ names, patches }) => names.forEach((name) => {
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

if (window.location.pathname.startsWith("/redeem/")) {
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
    } else {
        document.location = "/";
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
    forAllElements(document, "div[data-art-piece-asset='piece']", makePiecePeekable);
    forAllElements(document, "div.collection--filters", addWishlistButton);

    try {
        angular.module("nm.trades");
    } catch {
        console.warn("[NM trade enhancements] Nothing to patch!");
        // to not break angular
        return;
    }

    applyPatches();
    addRollbackTradeButton();
    addTradeWindowEnhancements();
    addPromoPackButton();
});

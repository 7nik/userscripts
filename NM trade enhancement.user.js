// @namespace    7nik
// @version      1.2.3
// @description  Adds enhancements to the trading window
// @author       7nik
// @homepageURL  https://github.com/7nik/userscripts
// @supportURL   https://github.com/7nik/userscripts/issues
// @updateURL    https://github.com/7nik/userscripts/raw/master/NM%20trade%20enhancement.user.js
// @downloadURL  https://github.com/7nik/userscripts/raw/master/NM%20trade%20enhancement.user.js
// @match        https://www.neonmob.com/*
// @grant        GM_addStyle
// @require      https://github.com/rafaelw/mutation-summary/raw/master/src/mutation-summary.js
// ==/UserScript==

/* globals MutationSummary NM angular */
/* eslint-disable sonarjs/no-duplicate-string */

"use strict";

GM_addStyle(`
    #freebies-nav-btn {
        width: 70px;
    }
    .trade--side--items--loading:empty {
        display: none;
    }

    .trade--add-items--filters .search,
    .trade--add-items--filters .series,
    .trade--add-items--filters .customSeries {
        width: 47.8%;
    }
    .trade--add-items--filters .customSeries {
        margin-left: 1%;
    }
    .trade--add-items--filters .customSeries + .series {
        display: none;
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
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAQAAAD8x0bcAAABNUlEQVQoz2NgwAsamFxsQpnxq2FwMnP77CyMV4kDj9t3lyAC5rjnuD+35MRvlbz7GzdjAua4zXDbhkc6lDmU01Hb/Ye7JB7nup91/+j+1rUDpxJPPve17s/c/wPhA3dtrEpcpdzWuQe7lrmfcf/s/t/NF8MdHurOAe7PPRxcorwk3Fzd4t0uObCgG8LorOT2zFnLLdpJ2bXcQcJF0205irwxq4s70MvtriZARU7uRs56rhPd41y3uIV7BHpY+vFCXOLs/liLzcPSfYfbektOtyQ/Xpcod3+PdI90tyR3b3DceQuCwsNT1F2/gcmtxu2Ea6SzmoOM+363g25tiBi64/7Xjdstz/0UxGr3RW43XPjdot0TQdBSCGKZn1sWA5MDiwMPVBeTq6rbetdAD3UQ9OViIA4AAM0mVgxU9d2NAAAAAElFTkSuQmCC);
        background-size: contain;
        background-position: bottom;
        background-repeat: no-repeat;
    }

    #print-list .hiddenSeries {
        padding: 5px 20px;
        border-bottom: 1px solid rgba(0,0,0,.1);
        white-space: normal;
    }
    #print-list .hiddenSeries > :last-child {
        font-size: 11px;
        color: #9f96a8;
    }
    #print-list .hiddenSeries span span {
        white-space: nowrap;
    }
    #print-list .hiddenSeries a {
        color: #9f96a8;
        position: relative;
        bottom: -1px;
        margin-left: 0.5ch;
    }
    #print-list .hiddenSeries a:hover {
        color: #085b85;
    }

    #print-list .hidden-item {
        display: none;
    }

    .trade--item a:link, .trade--item a:visited {
        color: #5f5668;
    }
    .trade--item a:link:hover, .trade--item a:visited:hover {
        color: #085b85;
    }
    .trade--item a.icon-button {
        margin-left: 0.5ch;
        position: relative;
        bottom: -1px;
        opacity: 0;
    }
    .trade--item:hover a.icon-button {
        opacity: 1;
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

    .tooltip .tooltip-inner {
        max-width: 250px;
    }
    .tooltip .i {
        width: 18px;
        height: 15px;
        margin: 0 0 3px 2px;
    }
    .tooltip .i.core {
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAACTUlEQVQoU3VRW0iTYRh+3m/7928rt9LNZaZzSzecCzNqDDWEKAqFyEpZrMPwVDCCIOh610HSTRB0oAPdBNkBlKLb8CK6KDqAGUROiqw128G5/fv/r2/LiV303Hx87/s+PM/7vIQVDNznusJ8sjfgMl5yO6TIsU5putI7fjPV6XdIt4JO4/mFD5gaHCS11KPKwJHLif2qyq52e2Snv1F+m8iop8Jdhtfn7mW2L2n8ttcubevYIn8R82f2+OnZCpnT0fFkd1HDpChUdXmN6GiSUVTxc+ZHPjr3S73CCTZ3tQSfQy5x0oyhr8eHF9Q/nuzhGq4BvMViZvA1GtBWZ4DJQIgn1dzcomIq2ZP1BK/dAItRV7I7y/UYpYGz0w+UbK5fp2fUGvTAVl8NsyA6q/VIZDUspMvrlSFrGtbnFUEmDkYPaWjosTe9uHSnqKiBKpsVO/oCsNqtMAglSUfI5rUyURWv8j0LFMSf4SXXs5MEzilyesqfS2buFpaVdovNgu5DQdRs2gAS/jgX8zkVv+ez0PIqiOENSdKJsfDGd6tpj45OeBYT+QnhoM3RUIPe8G6Y1xlRFEl+/ZRCPquCMfaeTDg8FrJ//OdUXDgYiTzpTGdyN5RC0bvZacPeg7uQSgJLmSKYnmZ0Oj48HK6dJhI7r71zJZRodNKz8C31VDhwtfia4fK4hCJ9tpqMB0IhS1mxglXblULJwXDk0b50avm6s7mpodm3NS5JfGQoXPu8ovhfcqkRi8VYPN6+01FXf9Hd6r4wP1vzKhajv7GvwR8AsNgcRdQufwAAAABJRU5ErkJggg==);
        background-size: auto;
        width: 15px;
    }
    .tooltip .pipe {
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
`);

/**
 * API call to server
 * @param  {("api"|"napi"|"root")} type Which API scheme use
 * @param  {string} url Relative URL to API
 * @return {Promise<Object>} Parsed JSON response
 */
function api (type, url) {
    let fullUrl;
    switch (type) {
        case "api":  fullUrl = `https://www.neonmob.com/api${url}`; break;
        case "napi": fullUrl = `https://napi.neonmob.com${url}`;    break;
        case "root": fullUrl = `https://www.neonmob.com${url}`;     break;
        default:     fullUrl = url;
    }
    return fetch(fullUrl).then((res) => res.json());
}

/**
 * Will call the callback for existing and added elements which match the selector
 * @param  {HTMLElement} rootNode In whose subtree wait for the elements
 * @param  {string} selector Selector of the target elements
 * @param  {Function} callback Callback applied to the elements
 */
function forAllElements (rootNode, selector, callback) {
    rootNode.querySelectorAll(selector).forEach(callback);
    new MutationSummary({
        rootNode,
        queries: [{ element: selector }],
        callback: (summaries) => summaries[0].added.forEach((elem) => callback(elem)),
    });
}

/**
 * Returns a promise which will be resolved when the element appears
 * @param  {HTMLElement} rootNode In whose subtree wait for the element
 * @param  {string} selector Selector of the target element
 * @return {Promise<HTMLElement>} Promise that will return the element
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
 * Gets and caches info about a series by its id
 * @param  {number|string} settId series id
 * @return {Promise<Object>} series info
 */
function getSeriesInfo (settId) {
    if (!getSeriesInfo[settId]) {
        getSeriesInfo[settId] = api("api", `/setts/${settId}/`);
    }
    return getSeriesInfo[settId];
}

/* states and labels of the card filter */
const CF_LABELS = {
    allSeries: "",
    infinite: "Unlimited series",
    finite: "Limited series",
    freePackAvailable: "Free packs available",
    anyPackAvailable: "Any packs available",
    outOfPrint: "Out of print series",
    certainSeries: "",
};
const CF_STATES = Reflect.ownKeys(CF_LABELS);

function scrollCardList (card) {
    // trigger loading next cards if no scrollbars and user can't do it itself
    const list = card.closest("#print-list");
    if (
        list
        && list.scrollHeight <= list.clientHeight
        && list.parentElement.classList.contains("active")
    ) {
        list.dispatchEvent(new Event("scroll"));
    }
    // remove message about empty search if there are items
    if (
        list.querySelector(".trade--item:not(.hidden-item)")
        && list.querySelector("#trade--search--empty")
    ) {
        list.querySelector("#trade--search--empty").remove();
    }
    // if no visible cards and no message
    if (
        !list.querySelector(".trade--item:not(.hidden-item)")
        && !list.querySelector(".trade--search--empty")
    ) {
        const name = list.closest(".trade--side").matches(".trade--you")
            ? "You don't"
            : `${angular
                    .element(list.closest(".trade--add-items"))
                    .scope()
                    .partner
                    .first_name
                } doesn't`;

        const div = document.createElement("div");
        div.id = "trade--search--empty";
        div.className = "trade--search--empty";
        div.innerHTML = `
            <div class="text-emoji">😭</div>
            <div class="text-emphasis text-subdued text-body">
                ${name} have any cards matching that search.
            </div>
        `;
        list.querySelector(".trade--side--items--loading").append(div);
    }
}

/**
 * Shows or hides the card depending on the state
 * @param  {HTMLElement} card <li.trade--item>
 * @param  {string} state A value from CCF_STATES
 */
function applyCardFilter (card, state, hiddenSeries) {
    card.classList.remove("hidden-item");
    switch (state) {
        case "allSeries":
            // only apply hidden series
            break;
        case "finite": {
            const cardCount = card
                .querySelector("[ng-bind-html*='print.num_prints_total']")
                .textContent;
            if (cardCount === "∞") card.classList.add("hidden-item");
            break;
        }
        case "infinite": {
            const cardCount = card
                .querySelector("[ng-bind-html*='print.num_prints_total']")
                .textContent;
            if (cardCount !== "∞") card.classList.add("hidden-item");
            break;
        }
        case "freePackAvailable": {
            const scope = angular.element(card.closest("li")).scope();
            getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                .then(({ discontinue_date: oopDate, freebies_discontinued: freeEnds }) => {
                    if (
                        new Date(oopDate) < Date.now()
                        || freeEnds && new Date(freeEnds) < Date.now()
                    ) {
                        card.classList.add("hidden-item");
                        scrollCardList(card);
                    }
                });
            break;
        }
        case "anyPackAvailable": {
            const scope = angular.element(card.closest("li")).scope();
            getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                .then(({ discontinue_date: oopDate }) => {
                    if (new Date(oopDate) < Date.now()) {
                        card.classList.add("hidden-item");
                        scrollCardList(card);
                    }
                });
            break;
        }
        case "outOfPrint": {
            const scope = angular.element(card.closest("li")).scope();
            getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                .then(({ discontinue_date: oopDate }) => {
                    if (new Date(oopDate) > Date.now()) {
                        card.classList.add("hidden-item");
                        scrollCardList(card);
                    }
                });
            break;
        }
        case "certainSeries":
            // no filtering at all if selected certain series
            return;
        default:
            console.error(`Unknow state ${state}`);
            return;
    }
    const seriesName = card.querySelector("dd:nth-of-type(2)").firstChild.textContent;
    if (seriesName in hiddenSeries) {
        card.classList.add("hidden-item");
    }

    scrollCardList(card);
}

/**
 * Adds filter to one side of trade window
 * @param {HTMLElement} side <div.trade--add-items>
 */
async function addCardFilter (side) {
    if (!side) return;
    let currentState = CF_STATES[0];

    // It's easier to create a proxy element with
    // additional options than fight with angular
    const origSeriesList = side.querySelector("select.series");
    // wait untill list of user collection is loaded
    if (origSeriesList.disabled) {
        await new Promise((resolve) => {
            const observer = new MutationSummary({
                rootNode: origSeriesList,
                queries: [{ attribute: "disabled" }],
                callback: () => {
                    observer.disconnect();
                    resolve();
                },
            });
        });
    }

    const hiddenSeries = {};
    const hiddenSeriesElem = document.createElement("div");
    /**
     * Adds/removes series from the list and hides/shows/rebuilds list of hidden series
     * @param  {string} seriesName which series add or remove from the list
     * @param  {string} collectionStats if false-like then remove series otherwise add it
     */
    function updateHiddenSeriesList (seriesName, collectionStats) {
        if (seriesName) {
            if (collectionStats) {
                hiddenSeries[seriesName] = collectionStats;
            } else {
                delete hiddenSeries[seriesName];
            }
        }
        if (origSeriesList.value !== "0" || Reflect.ownKeys(hiddenSeries).length === 0) {
            hiddenSeriesElem.style.display = "none";
            return;
        }
        hiddenSeriesElem.style.display = "block";
        if (!seriesName) return;
        hiddenSeriesElem.lastElementChild.innerHTML = Object.entries(hiddenSeries)
            .sort()
            .map(([name, stats]) => (
                `<span class="tip" title="${stats}">${name}</span><a href="#"">✕</a>`
            ))
            .join(", ");
    }

    // "replace" original <select> with customized one
    const newSeriesList = origSeriesList.cloneNode(true);
    // sometimes here is no the empty option so add it if needed
    if (newSeriesList.firstElementChild.value !== "") {
        newSeriesList.insertAdjacentHTML(
            "afterbegin",
            `<option value="" label=""></option>`,
        );
    }
    newSeriesList.insertAdjacentHTML(
        "afterbegin",
        Object.entries(CF_LABELS)
            .filter(([state, label]) => label)
            .map(([state, label]) => `<option value="${state}">${label}</option>`)
            .join(""),
    );
    newSeriesList.getAttributeNames()
        .filter((name) => name.startsWith("ng-"))
        .forEach((name) => newSeriesList.removeAttribute(name));
    Array.from(newSeriesList.classList)
        .filter((name) => name.startsWith("ng-"))
        .forEach((name) => newSeriesList.classList.remove(name));
    newSeriesList.classList.replace("series", "customSeries");
    newSeriesList.addEventListener("change", () => {
        // if selected the empty option, change it to "Choose a Series"
        if (newSeriesList.value === "") {
            newSeriesList.value = 0;
        }
        // if selected filter
        if (newSeriesList.value in CF_LABELS) {
            currentState = newSeriesList.value;
            origSeriesList.value = 0;

            side.querySelectorAll(".trade--item")
                .forEach((card) => applyCardFilter(card, currentState, hiddenSeries));
            if (
                side.querySelector(".trade--item:not(.hidden-item)")
                && side.querySelector("#trade--search--empty")
            ) {
                side.querySelector("#trade--search--empty").remove();
            }
        } else {
            currentState = CF_STATES[newSeriesList.value === "0" ? 0 : CF_STATES.length - 1];
            origSeriesList.value = newSeriesList.value;
        }
        updateHiddenSeriesList();
        origSeriesList.dispatchEvent(new Event("change"));
    });
    origSeriesList.parentElement.insertBefore(newSeriesList, origSeriesList);

    // element with list of hidden series
    hiddenSeriesElem.className = "hiddenSeries";
    hiddenSeriesElem.innerHTML = `<span class="small-caps">Hidden series: </span><span></span>`;
    hiddenSeriesElem.style.display = "none";
    hiddenSeriesElem.addEventListener("click", (ev) => {
        if (ev.target.nodeName !== "A") return;
        const seriesName = ev.target.previousSibling.textContent;
        updateHiddenSeriesList(seriesName, null);
        side.querySelectorAll(".trade--item")
            .forEach((cardd) => applyCardFilter(cardd, currentState, hiddenSeries));
        ev.preventDefault();
    });
    // div#print-list is re-created at any change of the filters
    forAllElements(side, "#print-list", (printList) => {
        printList.insertAdjacentElement("afterbegin", hiddenSeriesElem);
    });

    // auto-apply filter to new cards
    forAllElements(side, "li.trade--item", (card) => {
        const dd = card.querySelector("dd:nth-of-type(2)");

        // button to set card's series as selected
        const findElem = document.createElement("a");
        findElem.href = "#";
        findElem.textContent = "🔍";
        findElem.className = "icon-button";
        findElem.addEventListener("click", (ev) => {
            const seriesName = findElem.parentElement.firstElementChild.textContent;
            const seriesNumber = newSeriesList.querySelector(`[label="${seriesName}"]`).value;
            if (!seriesNumber) {
                console.error(`Series ${seriesName} was not found`);
                return;
            }
            newSeriesList.value = seriesNumber;
            newSeriesList.dispatchEvent(new Event("change"));

            ev.preventDefault();
        });
        dd.append(findElem);

        // button to select card's series
        const hideElem = document.createElement("a");
        hideElem.href = "#";
        hideElem.textContent = "✕";
        hideElem.className = "icon-button";
        hideElem.addEventListener("click", (ev) => {
            updateHiddenSeriesList(
                dd.firstChild.textContent, // series name
                card.querySelector("dd:nth-of-type(3)").textContent, // collection stats
            );
            side.querySelectorAll(".trade--item")
                .forEach((cardd) => applyCardFilter(cardd, currentState, hiddenSeries));
            ev.preventDefault();
        });
        dd.append(hideElem);

        applyCardFilter(card, currentState, hiddenSeries);
    });
}

/**
 * @typedef {Object} UserData
 * @property {string} name User name
 * @property {string} link Link to user profile
 * @property {Object} profile User profile
 * @property {Object} setts Map of user collections
 */
/**
 * Gather user's info into one object
 * @param  {Object} profile User profile
 * @param  {string=} name User name to display
 * @return {Promise<UserData>} User data
 */
async function getUserData (profile, name = profile.first_name) {
    const users = getUserData.users || (getUserData.users = {});
    if (!users[profile.id]) {
        const setts = (await api(null, profile.links.collected_setts_names_only))
            .reduce((settMap, sett) => {
                // eslint-disable-next-line no-param-reassign
                settMap[sett.name.trim().replace(/\s{2,}/g, " ")] = sett;
                return settMap;
            }, {});
        users[profile.id] = {
            name,
            profile,
            setts,
            link: profile.links.profile,
        };
    }
    return users[profile.id];
}

/**
 * Returns an <a> with link to the collection and the collection progress at tooltip
 * @param  {UserData} user User data
 * @param  {HTMLElement} card <li.trade--item>
 * @return {HTMLElement} <a>
 */
function getCollectionStats (user, card) {
    const settName = card.querySelector("dd:nth-of-type(2)").firstChild.textContent.trim();
    const sett = user.setts[settName];
    const total = (rarity) => sett[`${rarity}_piece_count`];
    const owned = (rarity) => sett.owned_metrics[`owned_${rarity}_piece_count`];
    const span = document.createElement("span");
    span.textContent = `${user.name}: `;

    if (!sett) {
        span.textContent += "—";
        span.classList.add("text-warning");
        return span;
    }
    const a = document.createElement("a");
    a.href = sett.links.permalink.replace("/series", `${user.link}/collection`);
    a.textContent = `
        ${(owned("core") + owned("chase") + owned("variant") + owned("legendary"))}
        /
        ${(total("core") + total("chase") + total("variant") + total("legendary"))}
    `.replace(/\s/g, "");
    $(a).tooltip({
        container: "body",
        html: "html",
        title: ["core", "chase", "variant", "legendary"]
            .filter((rarity) => total(rarity))
            .map((r) => `${owned(r)}/${total(r)}&nbsp;<i class='i ${r}'></i>`)
            // if 4 items then locate them in 2 rows
            .reduce((prevs, curr, i, { length }) => (
                `${prevs}${length === 4 && i === 2 ? "<br>" : "<i class='pipe'></i>"}${curr}`
            )),
    });
    a.addEventListener("click", (ev) => ev.stopPropagation(), true);
    span.append(a);
    return span;
}

/**
 * Adds to card your and partner's collection progress
 * @param {UserData} you Your data
 * @param {UserData} partner Partner data
 * @param {HTMLElement} card <li.trade--item>
 */
function addCollectionProgress (you, partner, card) {
    const cardInfo = card.querySelector(".trade--item--meta");
    const rarity = card.querySelector("dt:nth-of-type(3)");
    const dt = document.createElement("dt");
    dt.className = "small-caps";
    dt.textContent = "Collected";
    cardInfo.insertBefore(dt, rarity);
    const dd = document.createElement("dd");
    dd.className = "collected-cards";
    dd.append(getCollectionStats(you, card), ", ", getCollectionStats(partner, card));
    cardInfo.insertBefore(dd, rarity);
}

/**
 * Turns name of sett to link to user's collection
 * @param {UserData} user1 User1 data
 * @param {UserData} user2 User2 data
 * @param {HTMLElement} card <li.trade--item>
 */
function addLinkToSett (user1, user2, card) {
    const dd = card.querySelector("dd:nth-of-type(2)");
    const settName = dd.firstChild.textContent.trim();
    const sett = user1.setts[settName] || user2.setts[settName];
    if (!sett) {
        console.error(`Error: series not found: ${settName}`);
        return;
    }
    const a = document.createElement("a");
    a.href = sett.links.permalink;
    a.textContent = settName;
    a.addEventListener("click", (ev) => ev.stopPropagation(), true);
    dd.firstChild.replaceWith(a);
}

/**
 * Adds button before the <select> to resets it
 * @param {HTMLElement} select The <select> element
 */
function addResetSeries (select) {
    const span = document.createElement("span");
    span.className = "filter-group reset tip";
    span.title = "Reset series";
    span.innerHTML = "<span class='btn-filter subdued'><i class='reset-sett'></i></span>";
    span.addEventListener("click", () => {
        select.value = 0; // eslint-disable-line no-param-reassign
        select.dispatchEvent(new Event("change"));
    });
    select.parentElement.insertBefore(span, select);
}

/**
 * Apply enhancement to the trade window
 * @param {HTMLElement} tradeWindow <div.nm-modal.trade>
 */
async function addEnhancements (tradeWindow) {
    forAllElements(tradeWindow, ".trade--add-items", addCardFilter);
    forAllElements(tradeWindow, "select.customSeries", addResetSeries);

    const you = await getUserData(NM.you.attributes, "You");
    // wait for the appearance of partner data and then get it
    const partner = await waitForElement(tradeWindow, "div.trade--side--item-list")
        .then((elem) => angular.element(elem).scope().partner)
        .then((profile) => getUserData(profile));
    // add info to cards
    forAllElements(tradeWindow, ".trade--item", (card) => {
        addCollectionProgress(you, partner, card);
        addLinkToSett(you, partner, card);
    });
}

/**
 * Adds how ago was last action of the user
 * @param {HTMLElement} header div.nm-conversation--header
 */
async function addLastActionAgo (header, watchForChanges = true) {
    const userId = angular.element(header).scope().recipient.id;
    const lastActionAgo = await api("napi", `/activityfeed/user/${userId}/?amount=5&page=1`)
        .then((data) => data[0].created);

    const div = document.createElement("div");
    div.className = "last-action";
    div.innerHTML = `last action: <i>${lastActionAgo}</i>`;
    header.querySelector(".nm-conversation--header h3").append(div);

    if (watchForChanges === false) return;

    new MutationSummary({
        rootNode:  header.querySelector(".nm-conversation--header h3 a"),
        queries: [{ characterData: true }],
        callback: (summaries) => {
            header.querySelector(".last-action").remove();
            addLastActionAgo(header, false);
        },
    });
}

//------------------------
// Program execution start
//------------------------

forAllElements(document, "div.nm-modal.trade", addEnhancements);
forAllElements(document, "div.nm-conversation--header", addLastActionAgo);

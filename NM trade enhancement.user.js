// ==UserScript==
// @name         NM trade enhancement
// @namespace    7nik
// @version      1.4.14
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
    .trade--add-items--filters select.series,
    .trade--add-items--filters select.customSeries {
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
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAQAAAD8x0bcAAA\
BNUlEQVQoz2NgwAsamFxsQpnxq2FwMnP77CyMV4kDj9t3lyAC5rjnuD+35MRvlbz7GzdjAua4zXDbhkc6lDmU01Hb/Ye7JB7nup\
91/+j+1rUDpxJPPve17s/c/wPhA3dtrEpcpdzWuQe7lrmfcf/s/t/NF8MdHurOAe7PPRxcorwk3Fzd4t0uObCgG8LorOT2zFnLL\
dpJ2bXcQcJF0205irwxq4s70MvtriZARU7uRs56rhPd41y3uIV7BHpY+vFCXOLs/liLzcPSfYfbektOtyQ/Xpcod3+PdI90tyR3\
b3DceQuCwsNT1F2/gcmtxu2Ea6SzmoOM+363g25tiBi64/7Xjdstz/0UxGr3RW43XPjdot0TQdBSCGKZn1sWA5MDiwMPVBeTq6r\
betdAD3UQ9OViIA4AAM0mVgxU9d2NAAAAAElFTkSuQmCC);
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
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAA\
CTUlEQVQoU3VRW0iTYRh+3m/7928rt9LNZaZzSzecCzNqDDWEKAqFyEpZrMPwVDCCIOh610HSTRB0oAPdBNkBlKLb8CK6KDqAGU\
ROiqw128G5/fv/r2/LiV303Hx87/s+PM/7vIQVDNznusJ8sjfgMl5yO6TIsU5putI7fjPV6XdIt4JO4/mFD5gaHCS11KPKwJHLi\
f2qyq52e2Snv1F+m8iop8Jdhtfn7mW2L2n8ttcubevYIn8R82f2+OnZCpnT0fFkd1HDpChUdXmN6GiSUVTxc+ZHPjr3S73CCTZ3\
tQSfQy5x0oyhr8eHF9Q/nuzhGq4BvMViZvA1GtBWZ4DJQIgn1dzcomIq2ZP1BK/dAItRV7I7y/UYpYGz0w+UbK5fp2fUGvTAVl8\
NsyA6q/VIZDUspMvrlSFrGtbnFUEmDkYPaWjosTe9uHSnqKiBKpsVO/oCsNqtMAglSUfI5rUyURWv8j0LFMSf4SXXs5MEzilyes\
qfS2buFpaVdovNgu5DQdRs2gAS/jgX8zkVv+ez0PIqiOENSdKJsfDGd6tpj45OeBYT+QnhoM3RUIPe8G6Y1xlRFEl+/ZRCPquCM\
faeTDg8FrJ//OdUXDgYiTzpTGdyN5RC0bvZacPeg7uQSgJLmSKYnmZ0Oj48HK6dJhI7r71zJZRodNKz8C31VDhwtfia4fK4hCJ9\
tpqMB0IhS1mxglXblULJwXDk0b50avm6s7mpodm3NS5JfGQoXPu8ovhfcqkRi8VYPN6+01FXf9Hd6r4wP1vzKhajv7GvwR8AsNg\
cRdQufwAAAABJRU5ErkJggg==);
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
    img.asset.remove-gray {
        cursor: pointer;
    }
`);

const cardsInTrades = { receive: {}, give: {}, ready: false };

/**
 * Adds card fitlers to one side of the trade window
 */
class CardFilter {
    /**
     * Constructor
     * @param {HTMLElement} side - <div.trade--add-items>
     */
    constructor (side) {
        if (!side) return null;
        if (new.target !== CardFilter) return null; // if called without `new`

        this.side = side;
        this.isMySide = side.closest(".trade--side").matches(".trade--you");
        this.scope = getScope(side);
        this.currentState = CardFilter.STATES.allSeries;
        this.hiddenSeries = {};
        this.hiddenSeriesElem = document.createElement("div");

        this.initFilterSets();
        this.initHiddenSeries();
        this.replaceSeriesList().then(() => {
            this.addResetSeries();
            this.filterSetSelect.disabled = false;
            this.filterSetSelect.classList.remove("disabled");
            // set default filter set if it presented
            if ("Default" in CardFilter.filterSets) {
                this.filterSetSelect.value = "Default";
                this.filterSetSelect.dispatchEvent(new Event("change"));
            }
            // auto-apply filters to new cards
            forAllElements(this.side, "li.trade--item", (card) => this.onCardAdded(card));
        });
    }

    /**
     * Replace series list <select> with new one
     * which allows to select filter for series
     */
    async replaceSeriesList () {
        // It's easier to create a proxy element with
        // additional options than fight with angular
        const origSeriesList = this.side.querySelector("select.series");
        // wait until list of user collection is loaded
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

        if (origSeriesList.value !== "0") this.currentState = CardFilter.STATES.certainSeries;

        // "replace" original <select> with customized one
        const newSeriesList = origSeriesList.cloneNode(true);
        this.seriesSelect = newSeriesList;
        // sometimes here is no the empty option so add it if needed
        if (newSeriesList.firstElementChild.value !== "") {
            newSeriesList.insertAdjacentHTML(
                "afterbegin",
                `<option value="" label=""></option>`,
            );
        }
        // remove trailing spaces in series names
        newSeriesList.querySelectorAll("[label$=' ']")
            .forEach((option) => option.setAttribute("label", option.getAttribute("label").trim()));
        // add states
        newSeriesList.insertAdjacentHTML(
            "afterbegin",
            Object.entries(CardFilter.STATE_LABELS)
                .filter(([state, label]) => label)
                .map(([state, label]) => `<option value="${state}">${label}</option>`)
                .join(""),
        );
        // remove angular's data
        newSeriesList.getAttributeNames()
            .filter((name) => name.startsWith("ng-"))
            .forEach((name) => newSeriesList.removeAttribute(name));
        Array.from(newSeriesList.classList)
            .filter((name) => name.startsWith("ng-"))
            .forEach((name) => newSeriesList.classList.remove(name));
        newSeriesList.classList.replace("series", "customSeries");

        newSeriesList.addEventListener("change", () => {
            const oldValue = origSeriesList.value;
            // if selected the empty option, change it to "Choose a Series"
            if (newSeriesList.value === "") {
                newSeriesList.value = "0";
            }
            // if selected a filter
            if (newSeriesList.value in CardFilter.STATES) {
                this.currentState = newSeriesList.value;
                origSeriesList.value = "0";
            } else {
                this.currentState = newSeriesList.value === "0"
                    ? CardFilter.STATES.allSeries
                    : CardFilter.STATES.certainSeries;
                origSeriesList.value = newSeriesList.value;
            }
            // apply filters
            this.updateHiddenSeriesList();
            this.side.querySelectorAll(".trade--item")
                .forEach((card) => this.applyCardFilter(card));
            // hide a message if it's presented and there are visible cards
            if (
                this.side.querySelector(".trade--item:not(.hidden-item)")
                && this.side.querySelector("#trade--search--empty")
            ) {
                this.side.querySelector("#trade--search--empty").remove();
            }

            if (origSeriesList.value !== oldValue) {
                origSeriesList.dispatchEvent(new Event("change"));
            }
        });
        origSeriesList.before(newSeriesList);
    }

    /**
     * Adds button before the series list to resets it
     */
    addResetSeries () {
        const span = document.createElement("span");
        span.className = "filter-group reset tip";
        span.title = "Reset series";
        span.innerHTML = "<span class='btn-filter subdued'><i class='reset-sett'></i></span>";
        span.addEventListener("click", () => {
            this.seriesSelect.value = 0; // eslint-disable-line no-param-reassign
            this.seriesSelect.dispatchEvent(new Event("change"));
        });
        this.seriesSelect.before(span);
    }

    /**
     * Initialize hidden series filter
     */
    initHiddenSeries () {
        // element with list of hidden series
        this.hiddenSeriesElem.className = "hiddenSeries";
        this.hiddenSeriesElem.innerHTML = `
            <span class="small-caps">Hidden series: </span><span></span>
        `;
        this.hiddenSeriesElem.style.display = "none";
        this.hiddenSeriesElem.addEventListener("click", (ev) => {
            if (ev.target.nodeName !== "A") return;
            const seriesName = ev.target.previousSibling.textContent;
            this.updateHiddenSeriesList(seriesName, null);
            this.side.querySelectorAll(".trade--item")
                .forEach((cardd) => this.applyCardFilter(cardd));
            ev.preventDefault();
        });
        // div#print-list is re-created at any change of the filters
        forAllElements(this.side, "#print-list", (printList) => {
            printList.prepend(this.hiddenSeriesElem);
        });
    }

    /**
     * Adds/removes series from the list and hides/shows/rebuilds list of hidden series
     * @param  {string} seriesName - Series name for adding or removing from the list
     * @param  {?string} collectionStats - Series stats (will be displayed in tooltip),
     *                                  if `null` then the series will be removed from hidden
     */
    updateHiddenSeriesList (seriesName, collectionStats) {
        if (seriesName) {
            if (collectionStats) {
                this.hiddenSeries[seriesName] = collectionStats;
            } else {
                delete this.hiddenSeries[seriesName];
            }
        }
        // if selected certain series or no hidden series
        if (this.currentState === CardFilter.STATES.certainSeries
            || Reflect.ownKeys(this.hiddenSeries).length === 0
        ) {
            this.hiddenSeriesElem.style.display = "none";
            return;
        }
        this.hiddenSeriesElem.style.display = "block";

        if (!seriesName) return;
        this.hiddenSeriesElem.lastElementChild.innerHTML = Object.entries(this.hiddenSeries)
            .sort()
            .map(([name, stats]) => (
                `<span class="tip" title="${stats}">${name}</span><a href="#"">✕</a>`
            ))
            .join(", ");
    }

    /**
     * Initialize <select> with filter sets
     */
    initFilterSets () {
        // select for filter sets
        const filterSetSelect = document.createElement("select");
        filterSetSelect.className = "btn small subdued filter-sets disabled";
        filterSetSelect.disabled = true;
        filterSetSelect.innerHTML = [
            "<option value selected>Choose filter set</option>",
            ...Reflect.ownKeys(CardFilter.filterSets)
                .sort()
                .map((name) => `<option>${name}</option>`),
            "<option value='new_filter_set'>Save filters...</option>",
        ].join("");
        this.filterSetSelect = filterSetSelect;

        // button to delete the current filter set
        const delFiltSetBtn = document.createElement("a");
        delFiltSetBtn.href = "#";
        delFiltSetBtn.textContent = "🗑";
        delFiltSetBtn.className = "icon-button";
        delFiltSetBtn.style.display = "none";

        filterSetSelect.addEventListener("change", () => {
            if (filterSetSelect.value === "new_filter_set") {
                const filterSetName = this.saveFilterSet();
                if (filterSetName) {
                    filterSetSelect.value = filterSetName;
                    delFiltSetBtn.style.display = null;
                } else {
                    filterSetSelect.value = "";
                }
                return;
            }
            if (filterSetSelect.value in CardFilter.filterSets) {
                this.applyFilterSet(CardFilter.filterSets[filterSetSelect.value]);
                delFiltSetBtn.style.display = null;
            } else {
                delFiltSetBtn.style.display = "none";
            }
        });

        delFiltSetBtn.addEventListener("click", (ev) => {
            if (filterSetSelect.value in CardFilter.filterSets
                && window.confirm("Delete this filter set?") // eslint-disable-line no-alert
            ) {
                const name = filterSetSelect.value;
                delete CardFilter.filterSets[name];
                saveValue("filter_sets", CardFilter.filterSets);
                document.querySelectorAll("select.filter-sets").forEach((sel) => {
                    [...sel.options].find((option) => option.textContent === name).remove();
                    sel.value = "";
                });
                delFiltSetBtn.style.display = "none";
            }
            ev.preventDefault();
        });

        // add them for the document
        const header = this.side.querySelector(".trade--side--header");
        // remove text nodes with no text
        header.childNodes.forEach((node) => {
            if (node.nodeName === "#text" && node.textContent.trim().length === 0) {
                node.remove();
            }
        });
        header.append(", use filter set ", filterSetSelect, delFiltSetBtn);
        // reset selector when some filter was changed
        this.side.querySelector(".trade--add-items--filters").addEventListener("change", () => {
            delFiltSetBtn.style.display = "none";
            filterSetSelect.value = "";
        });
    }

    /**
     * Save the current filter set
     * @return {?string} Name of the filter set, null if user canceled saving
     */
    saveFilterSet () {
        let name = prompt("Enter name of fitler set"); // eslint-disable-line no-alert
        if (!name) {
            return null;
        }
        name = toPascalCase(name);

        const filterSet = {
            filters: {
                wish_list_by: false,
                incomplete_by: false,
                not_owned_by: false,
                ...this.scope.filters,
            },
            settName: window.confirm("Include series name?") // eslint-disable-line no-alert
                ? this.seriesSelect.selectedOptions[0].label
                : false,
            state: this.currentState,
            hiddenSeries: { ...this.hiddenSeries },
        };
        if (filterSet.settName === false && filterSet.state === CardFilter.STATES.certainSeries) {
            filterSet.state = CardFilter.STATES.allSeries;
        }
        CardFilter.filterSets[name] = filterSet;
        saveValue("filter_sets", CardFilter.filterSets);

        // add new filter set to all selectors
        document.querySelectorAll("select.filter-sets").forEach((sel) => {
            const option = document.createElement("option");
            option.innerHTML = name;
            sel.lastElementChild.before(option);
        });
        return name;
    }

    /**
     * Apply filter set and load cards
     * @param  {string} options.state - State of CardFilter
     * @param  {string|boolean} options.settName - Name of selected series,
     *                                             if it's `false` the sereis won't changed
     * @param  {Object} options.hiddenSeries - Map of the hidden series
     * @param  {Object} options.filters - Map of native filters
     */
    applyFilterSet ({ state, settName, hiddenSeries, filters }) { // eslint-disable-line object-curly-newline, max-len
        this.currentState = state;
        this.hiddenSeries = { ...hiddenSeries };
        this.updateHiddenSeriesList();
        if (settName !== false) {
            this.seriesSelect.value = this.seriesSelect
                .querySelector(`[label="${settName}"]`).value;
        }
        Object.entries(filters).forEach(([filterName, filterValue]) => {
            switch (filterName) {
                case "sett":
                    // change sett only it's "enabled"
                    if (settName !== false && this.scope.filters.sett !== filterValue) {
                        this.scope.filters.sett = filterValue;
                    }
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
                    if (this.scope.filters[filterName] !== filterValue) {
                        this.scope.filters[filterName] = filterValue;
                    }
                    break;
                case "wish_list_by":
                case "incomplete_by":
                case "not_owned_by":
                    // if state of the filter need to be changed
                    // eslint-disable-next-line no-bitwise
                    if (!!this.scope.filters[filterName] ^ !!filterValue) {
                        let container;
                        switch (filterName) {
                            case "wish_list_by": container = "wishListBy"; break;
                            case "incomplete_by": container = "incompleteBy"; break;
                            case "not_owned_by": container = "notOwnedBy"; break;
                            // no default
                        }
                        if (filterValue) {
                            this.scope[container].val = true;
                            this.scope.filters[filterName] = this.scope[container].filter;
                        } else {
                            this.scope[container].val = false;
                            delete this.scope.filters[filterName];
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
        // apply filters and (re)load cards
        this.scope.load();
        // this.seriesSelect.dispatchEvent(new Event("change"));
    }

    /**
     * Shows or hides the card depending on the state
     * @param  {HTMLElement} card - <li.trade--item>
     */
    applyCardFilter (card) {
        CardFilter.showCard(card);
        switch (this.currentState) {
            case CardFilter.STATES.allSeries:
                // only apply hidden series filter
                break;
            case CardFilter.STATES.finite: {
                const cardCount = card
                    .querySelector("[ng-bind-html*='print.num_prints_total']")
                    .textContent;
                if (cardCount === "∞") CardFilter.hideCard(card);
                break;
            }
            case CardFilter.STATES.infinite: {
                const cardCount = card
                    .querySelector("[ng-bind-html*='print.num_prints_total']")
                    .textContent;
                if (cardCount !== "∞") CardFilter.hideCard(card);
                break;
            }
            case CardFilter.STATES.freePackAvailable: {
                const scope = getScope(card.closest("li"));
                getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                    .then(({ discontinue_date: oopDate, freebies_discontinued: freeEnds }) => {
                        if (
                            new Date(oopDate) < Date.now()
                            || freeEnds && new Date(freeEnds) < Date.now()
                        ) {
                            CardFilter.hideCard(card);
                            this.scrollCardList();
                        }
                    });
                break;
            }
            case CardFilter.STATES.anyPackAvailable: {
                const scope = getScope(card.closest("li"));
                getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                    .then(({ discontinue_date: oopDate }) => {
                        if (new Date(oopDate) < Date.now()) {
                            CardFilter.hideCard(card);
                            this.scrollCardList();
                        }
                    });
                break;
            }
            case CardFilter.STATES.outOfPrint: {
                const scope = getScope(card.closest("li"));
                getSeriesInfo((scope.print || scope.$parent.print).sett_id)
                    .then(({ discontinue_date: oopDate }) => {
                        if (new Date(oopDate) > Date.now()) {
                            CardFilter.hideCard(card);
                            this.scrollCardList();
                        }
                    });
                break;
            }
            case CardFilter.STATES.certainSeries:
                // no filtering at all if selected certain series
                return;
            default:
                console.error(`Unknow state ${this.currentState}`);
                return;
        }
        const seriesName = card.querySelector("dd:nth-of-type(2)").firstChild.textContent;
        if (seriesName in this.hiddenSeries) {
            CardFilter.hideCard(card);
        }

        this.scrollCardList();
    }

    /**
     * Triggers loading next cards if needed or
     * displaying message if there is no cards at all
     * @param  {HTMLElement} card - <li.trade--item>
     */
    scrollCardList (card) {
        const list = this.side.querySelector("#print-list");
        // trigger loading next cards if no scrollbars and user can't do it itself
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
            const name = this.isMySide
                ? "You don't"
                : `${getScope(list.closest(".trade--add-items")).partner.first_name} doesn't`;

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
     * Handler for new cards: add buttons "select series",
     * "hide series", and apply the filters
     * @param  {HTMLElement} card - <li.trade--item>
     */
    onCardAdded (card) {
        const dd = card.querySelector("dd:nth-of-type(2)");

        // button to set card's series as selected
        const findElem = document.createElement("a");
        findElem.href = "#";
        findElem.textContent = "🔍";
        findElem.className = "icon-button";
        findElem.addEventListener("click", (ev) => {
            const seriesName = findElem.parentElement.firstElementChild.textContent;
            const seriesNumber = this.seriesSelect.querySelector(`[label="${seriesName}"]`).value;
            if (!seriesNumber) {
                console.error(`Series "${seriesName}"" was not found`);
                return;
            }
            this.seriesSelect.value = seriesNumber;
            this.seriesSelect.dispatchEvent(new Event("change"));

            ev.preventDefault();
        });
        dd.append(findElem);

        // button to select card's series
        const hideElem = document.createElement("a");
        hideElem.href = "#";
        hideElem.textContent = "✕";
        hideElem.className = "icon-button";
        hideElem.addEventListener("click", (ev) => {
            this.updateHiddenSeriesList(
                dd.firstChild.textContent, // series name
                card.querySelector("dd:nth-of-type(3)").textContent, // collection stats
            );
            this.side.querySelectorAll(".trade--item")
                .forEach((cardd) => this.applyCardFilter(cardd));
            ev.preventDefault();
        });
        dd.append(hideElem);

        this.applyCardFilter(card);
    }

    /**
     * Hide card and pause video if it's animated
     * @param  {HTMLElement} card - <li.trade--item>
     */
    static hideCard (card) {
        card.classList.add("hidden-item");
        const video = card.querySelector("video");
        if (video) video.pause();
    }

    /**
     * Show card and play video if it's animated
     * @param  {HTMLElement} card - <li.trade--item>
     */
    static showCard (card) {
        card.classList.remove("hidden-item");
        const video = card.querySelector("video");
        if (video) video.play();
    }

    // map of filter sets
    static filterSets = loadValue("filter_sets", {})

    // states and labels of the card filter
    static STATE_LABELS = {
        allSeries: "",
        infinite: "Unlimited series",
        finite: "Limited series",
        freePackAvailable: "Free packs available",
        anyPackAvailable: "Any packs available",
        outOfPrint: "Out of print series",
        certainSeries: "",
    }

    static STATES = Reflect
        .ownKeys(CardFilter.STATE_LABELS)
        // eslint-disable-next-line unicorn/no-reduce
        .reduce((states, name) => { states[name] = name; return states; }, {})
}

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
    // forbid parallel requests
    this.lastRequest = (this.lastRequest ?? Promise.resolve())
        .then(() => fetch(fullUrl), () => fetch(fullUrl))
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
    }
    return getSeriesInfo[settId];
}

/**
 * @typedef {Object} UserData
 * @property {string} name - User name
 * @property {string} link - Link to user profile
 * @property {Object} profile - User profile
 * @property {Object} setts - Map of user collections
 */
/**
 * Gather user's info into one object
 * @param  {Object} profile - User profile
 * @param  {string=} name - User name to display
 * @return {Promise<UserData>} User data
 */
async function getUserData (profile, name = profile?.first_name) {
    if (!profile) return null;
    const users = getUserData.users || (getUserData.users = {});
    if (!users[profile.id]) {
        const settNames = await api(null, profile.links.collected_setts_names_only);
        const settMap = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const sett of settNames) {
            settMap[sett.name.trim().replace(/\s{2,}/g, " ")] = sett;
        }
        users[profile.id] = {
            name,
            profile,
            setts: settMap,
            link: profile.links.profile,
        };
    }
    return users[profile.id];
}

/**
 * Returns an <a> with link to the collection and the collection progress at its tooltip
 * @param  {UserData} user - User data
 * @param  {HTMLElement} card - <li.trade--item>
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
    a.classList.add("href-link");
    a.href = sett.links.permalink.concat(`/user${user.link}/cards/`);
    a.target = "_blank";
    a.textContent = `
        ${(owned("core") + owned("chase") + owned("variant") + owned("legendary"))}
        /
        ${(total("core") + total("chase") + total("variant") + total("legendary"))}
    `.replace(/\s/g, "");
    tippy(a, {
        allowHTML: true,
        content: ["core", "chase", "variant", "legendary"]
            .filter((rarity) => total(rarity))
            .map((r) => `${owned(r)}/${total(r)}&nbsp;<i class='i ${r}'></i>`)
            // if 4 items then locate them in 2 rows
            // eslint-disable-next-line unicorn/no-reduce
            .reduce((prevs, curr, i, { length }) => (
                `${prevs}${length === 4 && i === 2 ? "<br>" : "<i class='pipe'></i>"}${curr}`
            )),
        theme: "tooltip",
    });
    span.append(a);
    return span;
}

/**
 * Adds to card your and partner's collection progress
 * @param {UserData} you - Your data
 * @param {UserData} partner - Partner data
 * @param {HTMLElement} card - <li.trade--item>
 */
function addCollectionProgress (you, partner, card) {
    const rarity = card.querySelector("dt:nth-of-type(3)");
    const dt = document.createElement("dt");
    dt.className = "small-caps";
    dt.textContent = "Collected";
    rarity.before(dt);
    const dd = document.createElement("dd");
    dd.className = "collected-cards";
    dd.append(getCollectionStats(you, card), ", ", getCollectionStats(partner, card));
    rarity.before(dd);
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
                .then(() => { cardsInTrades.ready = true; });
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
 * If a card is used in trades, adds appropriative text
 * @param {HTMLElement} card - <li.trade--item>
 */
async function addUsingInTrades (card) {
    if (!cardsInTrades.ready) {
        setTimeout(addUsingInTrades, 100, card);
        return;
    }

    const isMySide = card.closest(".trade--side").matches(".trade--you");
    const pid = getScope(card).print[isMySide ? "print_id" : "id"];
    let tradeIds = cardsInTrades[isMySide ? "give" : "receive"][pid];

    // exclute current trade
    if (tradeIds?.length > 0
        && window.location.search
        && getScope(document.querySelector("div.nm-modal")).getWindowState() !== "create"
    ) {
        const currentTrade = +new URLSearchParams(window.location.search).get("view-trade");
        tradeIds = tradeIds.filter((trade) => trade !== currentTrade);
    }

    if (!tradeIds || tradeIds.length === 0) return;

    const trades = await Promise.all(tradeIds.map((tradeId) => Trade.get(tradeId)));
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

    const span = document.createElement("span");
    span.className = "card-trading text-warning";
    span.textContent = trades.length === 1
        ? "Used in another trade"
        : `Used in ${trades.length} more trades`;
    tippy(span, {
        // allowHTML: true,
        appendTo: document.body,
        delay: [500, 200],
        interactive: true,
        content: tip,
        theme: "trade",
    });
    card.append(span);
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
 * Allows you to click on gray cards to reveal the colored cards
 * @param {HTMLElement} card image - <img.asset[src*="_gray"]>
 */
async function removeGray (card) {
    if (card.src.match(/_gray\..{2,7}$/)) {
        card.classList.add("remove-gray");
        card.addEventListener('click', () => {
            card.src = card.src.replace('_gray', '');
        }, {once : true});
    }
}

/**
 * Add to the card a selector to choose print for trading
 * @param {HTMLElement} card - <li.trade--item>
 */
async function addPrintChooser (card) {
    const { id: cardId, print_num: printNum } = getScope(card).print;
    const itemList = getScope(card.closest(".trade--side--item-list"));
    const userId = itemList.offerType === "bidder_offer" ? itemList.you.id : itemList.partner.id;
    const details = await api("api", `/users/${userId}/piece/${cardId}/detail/`);
    const { prints } = details.refs[details.payload[1]];

    const select = document.createElement("select");
    select.innerHTML = prints
        .map(({ print_num: num, id }) => `<option value="${id}" label="#${num}">#${num}</option>`)
        .join();
    select.options[prints.findIndex(({ print_num: num }) => num === printNum)].selected = true;
    select.addEventListener("change", (ev) => {
        // in fact, we need update the variable _selectedIds but we don't have access to it
        // so we make re-adding card with updated data
        const print = itemList.getOfferData().prints.find(({ id }) => id === cardId);
        const pos = itemList.getOfferData().prints.indexOf(print);
        itemList.removeItem(itemList.offerType, "prints", pos);
        print.print_num = +ev.target.selectedOptions[0].textContent;
        print.print_id = +ev.target.value;
        getScope(card.closest(".trade--side").querySelector(".trade--add-items")).addPrint(print);

        if (card.lastChild.matches(".card-trading")) {
            card.lastChild.remove();
        }
        addUsingInTrades(card);
    });

    const span = card.querySelector("dd:nth-child(10) span");
    delete span.dataset.originalTitle;
    span.style.cursor = null;
    span.textContent = span.textContent.slice(span.textContent.indexOf("/"));
    span.prepend(select);
}

/**
 * Apply enhancement to the trade window
 * @param {HTMLElement} tradeWindow - <div.nm-modal.trade>
 */
async function addTradeWindowEnhancements (tradeWindow) {
    forAllElements(tradeWindow, ".trade--add-items", (side) => new CardFilter(side));

    const you = getUserData(NM.you.attributes, "You");
    // wait for the appearance of partner data and then get it
    const partner = waitForElement(tradeWindow, "div.trade--side--item-list")
        .then((elem) => getScope(elem)?.partner)
        .then((profile) => getUserData(profile));
    // add info to cards
    forAllElements(tradeWindow, ".trade--item", async (card) => {
        // allow tweak only choosen cards and during trade edition
        if (getScope(card.closest(".trade--side--item-list"))?.showRemove) {
            const dd = card.querySelector("dd:nth-child(8)");
            const span = document.createElement("span");
            span.className = "tip";
            span.title = "Change print id";
            span.style.cursor = "pointer";
            span.textContent = dd.textContent;
            dd.innerHTML = "";
            dd.append(span);
            dd.addEventListener("click", () => addPrintChooser(card));
        }
        addUsingInTrades(card);
        addCollectionProgress(await you, await partner, card);
    });
}

/**
 * Adds how ago was last action of the user
 * @param {HTMLElement} header - <div.nm-conversation--header>
 */
async function addLastActionAgo (header, watchForChanges = true) {
    const userId = getScope(header).recipient.id;
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

// =============================================================================
//                         Program execution start
// =============================================================================

fixAutoWithdrawnTrade();
updateCardsInTrade();

document.addEventListener("DOMContentLoaded", () => {
    forAllElements(document, "div.nm-modal.trade", addTradeWindowEnhancements);
    forAllElements(document, "div.nm-conversation--header", addLastActionAgo);
    forAllElements(document, "li.nm-notification, li.nm-notifications-feed--item", addTradePreview);
    forAllElements(document, "span.collect-it.collect-it-button", fixFreebieCount);
    forAllElements(document, "img.asset[src*='_gray']", removeGray);
});

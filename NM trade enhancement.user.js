// ==UserScript==
// @name         NM trade enhancement
// @namespace    7nik
// @version      1.0
// @description  Adds to trade window a finite/infitite card count filter
// @author       7nik
// @match        https://www.neonmob.com/*
// @grant        none
// @require      https://github.com/rafaelw/mutation-summary/raw/master/src/mutation-summary.js
// ==/UserScript==


(function() {
    'use strict';

    document.head.appendChild(document.createElement("style")).innerHTML = `
        #freebies-nav-btn {
            width: 70px;
        }

        .trade--add-items--filters > span:not(.rarities) {
            width: 6% !important;
        }
        .trade--add-items--filters > .cardcount {
            margin-right: 1%;
            text-align: center;
            margin-top: 10px;
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
    `;

    /**
     * API call to server
     * @param  {("api"|"napi"|"root")} type - which API scheme use
     * @param  {string} url - relative URL to API
     * @return {JSON} parsed JSON response
     */
    function api(type, url) {
        switch (type) {
            case "api":  url = "https://www.neonmob.com/api" + url; break;
            case "napi": url = "https://napi.neonmob.com"    + url; break;
            case "root": url = "https://www.neonmob.com"     + url; break;
        }
        return fetch(url).then(res => res.json());
    }

    /**
     * Calls the callback for added elements which match the selector
     * @param  {HTMLElement} [rootNode=document] - in whose subtree wait for the elements
     * @param  {string} selector - selector of the target elements
     * @param  {Function} callback - callback applied to the elements
     */
    function onElementsAdded(rootNode = 1, selector, callback) {
        if (typeof rootNode == "string") {
            [rootNode, selector, callback] = [document, rootNode, selector];
        }
        if (!rootNode) return;
        new MutationSummary({
            rootNode: rootNode,
            queries: [{ element: selector }],
            callback: (summaries) => summaries[0].added.forEach(callback),
        });
    }

    /**
     * Returns a promise which will be resolved when the element appears
     * @param  {HTMLElement} [rootNode=document] - in whose subtree wait for the element
     * @param  {string} selector - selector of the target element
     * @return {Promise} will be resolved when the elemnt aprears
     */
    function waitForElement(rootNode, selector) {
        if (typeof rootNode == "string") {
            [rootNode, selector] = [document, rootNode];
        }
        const element = rootNode.querySelector(selector);
        if (element) return Promise.resolve(element);

        return new Promise((resolve) => {
            const observer = new MutationSummary({
                rootNode: rootNode,
                queries: [{ element: selector }],
                callback: (summaries) => {
                    observer.disconnect();
                    resolve(summaries[0].added[0]);
                },
            });
        });
    }

    const states = ["default", "finite", "infitite"];
    const labels = {"default":"#|∞", "finite":"#", "infitite":"∞"}

    /**
     * Shows or hides the card depending on the state
     * @param  {HTMLElement} card - li.trade--item
     * @param  {string} state - a value from states
     */
    function applyCardCountFilter(card, state) {
        const cardCount = card.querySelector("[ng-bind-html*='print.num_prints_total']")
            .innerHTML == "∞" ? "infitite" : "finite";
        card.classList.remove("hidden-item");
        if (state == states[0]) return;
        if (state != cardCount) card.classList.add("hidden-item");

        // trigger loading next cards if no scrollbars and user can't do it itself
        const list = card.closest("#print-list");
        if (!list || list.scrollHeight > list.clientHeight) return;
        list.dispatchEvent(new Event("scroll"));
    }

    /**
     * Adds filter to one side of trade window
     * @param {HTMLElement} side - div.trade--side
     */
    function addCardCountFilter(side) {
        if (!side) return;
        let state = states[0];

        // create and add filter's button
        const btn = document.createElement("span");
        btn.className = "btn-filter btn subdued small";
        btn.innerHTML = labels[state];
        btn.onclick = () => {
            state = states[states.indexOf(state)+1] || states[0];
            btn.classList[state == "default" ? "remove" : "add"]("selected");
            btn.innerText = labels[state];

            side.querySelectorAll(".trade--item")
                .forEach(card => applyCardCountFilter(card, state));
        };

        const filter = document.createElement("span");
        filter.className = "filter-group cardcount tip";
        filter.setAttribute("data-original-title", "Finite or infinite cards");
        filter.append(btn);

        waitForElement(side, ".trade--add-items--filters").then(filters =>
            filters.insertBefore(filter, filters.querySelector("span.rarities")));

        // autoapply filter to new cards
        onElementsAdded(side, ".trade--item", card => applyCardCountFilter(card, state));
    }

    /**
     * Get a <span> with a collection progress of card's series
     * @param  {object[]} data - array of info about user's collections
     * @param  {HTMLElement} card - li.trade--item
     * @return {(HTMLElement|string)} <span> or "—" if user doesn't collect the series
     */
    function getCollectionStats(data, card) {
        const seriesName = card.querySelector("dd:nth-of-type(2)").innerText.trim();
        const series = data.find(s => s.name.trim() == seriesName);
        if (!series) return "—";
        const total = (rarity) => series[rarity+"_piece_count"];
        const owned = (rarity) => series.owned_metrics["owned_"+rarity+"_piece_count"];

        const span = document.createElement("span");
        span.className = "tip";
        span.innerText =
            (owned("core")+owned("chase")+owned("variant")+owned("legendary")) + "/" +
            (total("core")+total("chase")+total("variant")+total("legendary"));

        const tip = ["core", "chase", "variant", "legendary"]
            .filter(rarity => total(rarity))
            .map(r => `${owned(r)}/${total(r)} <i class='i ${r}'></i>`)
            .join("<i class='pipe'></i>")
        span.setAttribute("data-original-title", tip);
        return span;
    }

    /**
     * Adds to card your and partner's collection progress
     * @param {Object[]} yourData - array of info about your collections
     * @param {string} parnerName - name of the partner
     * @param {Object[]} partnersData array of info about partner's collections
     */
    function addCollectionProgress(yourData, parnerName, partnersData, card) {
        const cardInfo = card.querySelector(".trade--item--meta");
        const rarity = card.querySelector("dt:nth-of-type(3)");

        const dt = document.createElement("dt");
        dt.className = "small-caps";
        dt.innerText = "Collected";
        const dd = document.createElement("dd");
        dd.className = "collected-cards";
        dd.append("You: ", getCollectionStats(yourData, card), ", ",
            parnerName, ": ", getCollectionStats(partnersData, card), ".");

        cardInfo.insertBefore(dt, rarity)
        cardInfo.insertBefore(dd, rarity)
    }

    /**
     * Turns name of series to link to user's collection
     * @param {Object} owner - info about collection owner
     * @param {Object[]} data - array of info about onwer's collections
     * @param {HTMLElement} card - li.trade--item
     */
    function addLinkToSeries(owner, data, card) {
        const dd = card.querySelector("dd:nth-of-type(2)");
        const seriesName = dd.innerText.trim();
        const collectionLink = data
            .find(series => series.name.trim() == seriesName)
            .links.permalink
            .replace("/series", owner.links.profile+"/collection");
        dd.innerHTML = `<a href='${collectionLink}'>${seriesName}</a>`;
    }

    const you = NM.you.attributes;
    let yourData;
    /**
     * Adds to cards collection progress and turn name of series to link
     * @param {HTMLElement} tradeWindow - div.trade--side
     */
    async function addInfo(tradeWindow) {
        yourData = yourData || await api("napi", "/user/"+you.id+"/owned-setts-metrics");
        let partner = await waitForElement("a.nm-conversation-header--recipient");
        partner = await api("api", "/users/"+partner.href.match(/\d+/)[0]);
        const partnersData = await api("napi", "/user/"+partner.id+"/owned-setts-metrics");

        function addInfoToCard(card) {
            addCollectionProgress(yourData, partner.first_name, partnersData, card);
            const [owner, data] = card
                .closest(".trade--side")
                .classList.contains("trade--you")
                ? [you, yourData] : [partner, partnersData];
            addLinkToSeries(owner, data, card);
        }

        // add info to cards
        onElementsAdded(tradeWindow, ".trade--item", addInfoToCard);
        tradeWindow.querySelectorAll(".trade--item").forEach(addInfoToCard);
    }

    /**
     * Apply enhacement to the trade window
     * @param  {?HTMLElement} tradeWindow div.nm-modal.trade
     */
    function addEnhancements(tradeWindow) {
        if (!tradeWindow) return;
        addInfo(tradeWindow);
        onElementsAdded(tradeWindow, "div.trade--side", addCardCountFilter);
        tradeWindow.querySelectorAll("div.trade--side").forEach(addCardCountFilter);
    }

    onElementsAdded("div.nm-modal.trade", addEnhancements);
    addEnhancements(document.querySelector("div.nm-modal.trade"));

})();
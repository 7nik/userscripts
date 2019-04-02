// ==UserScript==
// @name         NM trade enhancement
// @namespace    7nik
// @version      1.1
// @description  Adds enhancements to the trading window
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
        .trade--side--items--loading:empty {
            disply: none;
        }

        .trade--add-items--filters .search, .trade--add-items--filters .series {
            width: 47.8%;
        }
        .trade--add-items--filters > span:not(.rarities) {
            width: 6.5%;
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
        .trade--add-items--filters span.cardcount {
            margin-right: 1%;
            text-align: center;
            margin-top: 10px;
        }
        .trade--add-items--filters span.filter-group.help {
            width: 4%;
            margin-left: 0.5%;
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
        #trade--search--empty {
            animation: fadeIn 0s 0.15s backwards;
        }
        * ~ #trade--search--empty {
            opacity: 0;
        }
        .tooltip {
            max-width: 300px;
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
        @keyframes fadeIn {
            from {opacity: 0;}
            to {opacity: 1;}
        }
    `;

    /**
     * API call to server
     * @param  {("api"|"napi"|"root")} type Which API scheme use
     * @param  {string} url Relative URL to API
     * @return {Promise<Object>} Parsed JSON response
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
     * Will call the callback for existing and added elements which match the selector
     * @param  {HTMLElement=} rootNode In whose subtree wait for the elements
     * @param  {string} selector Selector of the target elements
     * @param  {Function} callback Callback applied to the elements
     */
    function forAllElements(rootNode, selector, callback) {
        if (typeof rootNode == "string") {
            [rootNode, selector, callback] = [document, rootNode, selector];
        }
        if (!rootNode) return;
        rootNode.querySelectorAll(selector).forEach(callback);
        new MutationSummary({
            rootNode: rootNode,
            queries: [{ element: selector }],
            callback: (summaries) => summaries[0].added.forEach(callback),
        });
    }

    /**
     * Returns a promise which will be resolved when the element appears
     * @param  {HTMLElement=} rootNode In whose subtree wait for the element
     * @param  {string} selector Selector of the target element
     * @return {Promise<HTMLElement>} Promise that will return the element
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

    /* states and labels of the card count filter */
    const CCF_STATES = ["default", "finite", "infinite"];
    const CCF_LABELS = {"default":"#|∞", "finite":"#", "infinite":"∞"};

    /**
     * Shows or hides the card depending on the state
     * @param  {HTMLElement} card <li.trade--item>
     * @param  {string} state A value from CCF_STATES
     */
    function applyCardCountFilter(card, state) {
        const cardCount = card.querySelector("[ng-bind-html*='print.num_prints_total']")
            .innerHTML == "∞" ? CCF_STATES[2] : CCF_STATES[1];
        card.classList.remove("hidden-item");
        if (state == CCF_STATES[0]) return;
        if (state != cardCount) card.classList.add("hidden-item");
        // trigger loading next cards if no scrollbars and user can't do it itself
        const list = card.closest("#print-list");
        if (list && list.scrollHeight <= list.clientHeight) {
            list.dispatchEvent(new Event("scroll"));
        }
        // remove message about empty search if there are items
        if (list.querySelector(".trade--item:not(.hidden-item)") &&
            list.querySelector("#trade--search--empty")) {
            list.querySelector("#trade--search--empty").remove();
        }
        // if no visible cards and no message
        if (!list.querySelector(".trade--item:not(.hidden-item)") &&
            !list.querySelector(".trade--search--empty")) {

            const div = document.createElement("div");
            div.id = "trade--search--empty";
            div.className = "trade--search--empty";
            div.innerHTML =
            `<div class="text-emoji">😭</div>
             <div class="text-emphasis text-subdued text-body">
                You don't have any cards matching that search.
             </div>`;
            list.querySelector(".trade--side--items--loading").append(div);
        }
    }

    /**
     * Adds filter to one side of trade window
     * @param {HTMLElement} side <div.trade--add-items>
     */
    function addCardCountFilter(side) {
        if (!side) return;
        let state = CCF_STATES[0];

        // create and add filter's button
        const btn = document.createElement("span");
        btn.className = "btn-filter btn subdued small";
        btn.innerHTML = CCF_LABELS[state];
        btn.onclick = () => {
            state = CCF_STATES[CCF_STATES.indexOf(state)+1] || CCF_STATES[0];
            btn.classList[state == "default" ? "remove" : "add"]("selected");
            btn.innerText = CCF_LABELS[state];

            side.querySelectorAll(".trade--item")
                .forEach(card => applyCardCountFilter(card, state));
            if (side.querySelector(".trade--item:not(.hidden-item)") &&
                side.querySelector("#trade--search--empty")) {
                side.querySelector("#trade--search--empty").remove();
            }
        };
        const filter = document.createElement("span");
        filter.className = "filter-group cardcount tip";
        filter.setAttribute("title", "Finite or infinite cards");
        filter.append(btn);
        const filters =  side.querySelector(".trade--add-items--filters");
        filters.insertBefore(filter, filters.querySelector("span.rarities"));

        // auto-apply filter to new cards
        forAllElements(side, ".trade--item", card => applyCardCountFilter(card, state));
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
    async function getUserData(profile, name = profile.first_name) {
        let users = window[Symbol.for("userdatas")];
        if (!users) users = window[Symbol.for("userdatas")] = {};
        if (!users[profile.id]) {
            let setts = await api(null, profile.links.collected_setts_names_only);
            setts = setts.reduce((ss,s) => (ss[s.name.trim()] = s, ss), {});
            users[profile.id] = {
                name: name,
                profile: profile,
                link: profile.links.profile,
                setts: setts,
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
    function getCollectionStats(user, card) {
        const settName = card.querySelector("dd:nth-of-type(2)").innerText.trim();
        const sett = user.setts[settName];
        const total = (rarity) => sett[rarity+"_piece_count"];
        const owned = (rarity) => sett.owned_metrics["owned_"+rarity+"_piece_count"];
        const a = document.createElement("a");

        if (!sett) {
            a.innerText = "—";
            return a;
        }

        a.href = sett.links.permalink.replace("/series", user.link+"/collection");
        a.innerText =
            (owned("core")+owned("chase")+owned("variant")+owned("legendary")) + "/" +
            (total("core")+total("chase")+total("variant")+total("legendary"));
        a.className = "tip";
        a.setAttribute("title", ["core", "chase", "variant", "legendary"]
            .filter(rarity => total(rarity))
            .map(r => `${owned(r)}/${total(r)} <i class='i ${r}'></i>`)
            .join("<i class='pipe'></i>")
        );
        a.addEventListener("click", (ev) => ev.stopPropagation(), true);
        return a;
    }

    /**
     * Adds to card your and partner's collection progress
     * @param {UserData} you Your data
     * @param {UserData} partner Partner data
     * @param {HTMLElement} card <li.trade--item>
     */
    function addCollectionProgress(you, partner, card) {
        const cardInfo = card.querySelector(".trade--item--meta");
        const rarity = card.querySelector("dt:nth-of-type(3)");
        const dt = document.createElement("dt");
        dt.className = "small-caps";
        dt.innerText = "Collected";
        cardInfo.insertBefore(dt, rarity);
        const dd = document.createElement("dd");
        dd.className = "collected-cards";
        dd.append(you.name, ": ", getCollectionStats(you, card), ", ",
              partner.name, ": ", getCollectionStats(partner, card), ".");
        cardInfo.insertBefore(dd, rarity);
    }

    /**
     * Turns name of sett to link to user's collection
     * @param {UserData} user1 User1 data
     * @param {UserData} user2 User2 data
     * @param {HTMLElement} card <li.trade--item>
     */
    function addLinkToSett(user1, user2, card) {
        const dd = card.querySelector("dd:nth-of-type(2)");
        const settName = dd.innerText.trim();
        const sett = user1.setts[settName] || user2.setts[settName];
        if (!sett) {
            // alert("Error: series not found: " + settName);
            console.error(card.outerHTML);
            return;
        }
        const a = document.createElement("a");
        a.href = sett.links.permalink;
        a.innerText = settName;
        a.addEventListener("click", (ev) => ev.stopPropagation(), true);
        dd.firstChild.replaceWith(a);
    }

    /**
     * Adds button before the <select> to resets it
     * @param {HTMLElement} select The <select> element
     */
    function addResetSeries(select) {
        let span = document.createElement("span");
        span.className = "filter-group reset tip";
        span.title = "Reset series";
        span.innerHTML = "<span class='btn-filter subdued'><i class='reset-sett'></i></span>";
        span.addEventListener("click", () => {
            select.value = 0;
            select.dispatchEvent(new Event("change"));
        });
        select.parentElement.insertBefore(span, select);
    }

    /**
     * Apply enhancement to the trade window
     * @param {HTMLElement} tradeWindow <div.nm-modal.trade>
     */
    async function addEnhancements(tradeWindow) {
        forAllElements(tradeWindow, ".trade--add-items", addCardCountFilter);
        forAllElements(tradeWindow, "select.series", addResetSeries);

        const you = await getUserData(NM.you.attributes, "You");
        // wait for the appearance of partner data and then get it
        const partner = await waitForElement("div.trade--side--item-list")
            .then(elem => angular.element(elem).scope().partner)
            .then(profile => getUserData(profile));
        // add info to cards
        forAllElements(tradeWindow, ".trade--item", (card) => {
            addCollectionProgress(you, partner, card);
            addLinkToSett(you, partner, card);
        });
    }

    forAllElements("div.nm-modal.trade", addEnhancements);

})();
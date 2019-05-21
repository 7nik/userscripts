// ==UserScript==
// @name         AP meta-tags
// @namespace    7nik@anime-pictures.net
// @version      1.0.2
// @description  moves some tags and cosplay tags into separate section
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    "use strict";

    const metaTagSelector = [
        87,     // scan
        323,    // vector
        639,    // game cg
        6283,   // official art
        10934,  // cropped
        11309,  // dual persona
        11590,  // spoiler
        18166,  // multiple persona
        20373,  // collaboration
        123331, // revision
        137612, // borrowed character
    ].map(id => "#tag_li_"+id).join(",");

    function tagCount(li) {
        let count = li.lastElementChild.innerText;
        if (count.indexOf("K") >= 0) {
            return parseInt(count)*1000;
        } else {
            return parseInt(count);
        }
    }

    function makeTagsMeta() {
        let tags = document.querySelectorAll(metaTagSelector);
        tags = Array.from(document.querySelectorAll("#post_tags li[class='']"))
            .filter(li => li.innerText.indexOf("(cosplay)") >= 0)
            .concat(Array.from(tags || []))
            .sort((t1, t2) => tagCount(t2) - tagCount(t1));
        if (!tags.length) return;

        const span = document.querySelector("#post_tags li[class='']").previousElementSibling;
        span.insertAdjacentHTML("beforeBegin", "<span>meta tags</span>");
        tags.forEach(tag => {
            tag.className = "purple";
            tag.firstElementChild.className += " big_tag";
            span.parentElement.insertBefore(tag, span);
        });
    }

    GM_addStyle(
        `.tags li.purple a {
            color: #870fff;
        }
        .tags li.purple a + span {
            border-color: #9c60d7 #9658d5 #8f4bd2;
            background-image: linear-gradient(to bottom, #bd95e4, #a36cda);
        }`
    );

    new MutationObserver(function(mutations) {
        makeTagsMeta();
    }).observe(document.getElementById("post_tags"), {childList: true});
    makeTagsMeta();

})();
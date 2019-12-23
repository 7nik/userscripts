// ==UserScript==
// @name         AP tag edit+ (tag list updater)
// @namespace    7nik@anime-pictures.net
// @version      2.0.1
// @description  Replace tag id with tag name in tag edit window
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @grant        none
// ==/UserScript==

/* global ts */

"use strict";

const windows = {};

new MutationObserver(([mutation]) => {
    const lis = [...mutation.target.querySelectorAll("li")].filter((li) => (
        li.classList.length === 0
        && li.lastElementChild.textContent.trim() === "1"
    ));
    if (lis.length > 0 && lis[0].previousElementSibling.nodeName === "SPAN") {
        lis.forEach((li) => {
            const tagName = li.firstElementChild.textContent;
            const { tagId } = li.lastElementChild.firstElementChild.dataset;
            if (tagId in windows && !windows[tagId].closed) return;
            windows[tagId] = window.open(
                `/pictures/view_edit_tag/${tagId}`,
                `${ts["Edit tag"]} ${tagName}`,
                "width=500,height=700,alwaysRaised=yes",
            );
        });
    }
}).observe(
    document.getElementById("post_tags"),
    { childList: true },
);

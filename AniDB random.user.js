// ==UserScript==
// @name         AniDB random
// @namespace    7nik
// @version      1.0
// @description  Adds buttons to choose random anime in the wishlist
// @author       You
// @match        https://anidb.net/user/wishlist*
// @grant        none
// ==/UserScript==

"use strict";

function randomAnime (ev) {
    const type = ev.target.classList[1];
    $("table.wishlist td.name a[style]").removeAttr("style");
    const list = $(`table.wishlist tr.wishlist:has(a${type ? `.${type}` : ""})`);
    const elem = list.eq(Math.floor(list.length * Math.random()));
    elem.find(".name a").attr("style", "color:red !important;");
    elem[0].scrollIntoView();
    document.scrollingElement.scrollTop -= window.innerHeight / 2;
}

const div = document.createElement("div");
div.style.position = "fixed";
div.style.bottom = 0;
div.style.right = 0;
div.style.left = "auto";
div.style.backgroundColor = "#000B";
div.style.padding = "10px";
div.innerHTML = `
    <span style="cursor:pointer">Random:</span>
    <a class="i_icon i_pri_high" style="cursor:pointer"></a>
    <a class="i_icon i_pri_med" style="cursor:pointer"></a>
    <a class="i_icon i_pri_low" style="cursor:pointer"></a>
`;
div.addEventListener("click", randomAnime);

document.body.append(div);

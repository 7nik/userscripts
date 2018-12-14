// ==UserScript==
// @name         pixiv img size and pixiv.me link
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Add size of the illustrations and direct links to them.
// @author       7nik
// @match        https://www.pixiv.net/member_illust.php*
// @match        https://www.pixiv.net/member.php*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function addStacc() {
        const pic = document.querySelector("a[href^='/member_illust.php?mode=medium&illust_id=']");
        if (!pic) return;
        const postId = pic.href.match(/\d+/)[0];
        if (addStacc.postId == postId) return;
        addStacc.postId = postId;
        fetch("/ajax/illust/" + postId)
            .then(resp => resp.json()
                  .then(({body:{userAccount: stacc}}) => {
                      const userName = document.getElementsByClassName("_2VLnXNk")[0];
                      userName.innerHTML = `<a href="https://pixiv.me/${stacc}" style="color:black">${userName.innerText}</a>`;
        }));
    }

    function addSize(data) {
        const has = (parent, childSel) => !!parent.querySelector(childSel);
        let cont, a, div;

        // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
        cont = document.querySelector("figure section");
        if (cont && !has(cont, "div > a:not([class])")) {
            div = document.createElement("div");
            div.style.position = "absolute";
            div.style.top = "0";
            div.style.left = "0";
            div.style.margin = "15px";
            div.style.fontWeight = "500";
            div.style.color = "black";
            div.innerHTML =
                `<a href="${data[0].urls.original}">${data[0].width}x${data[0].height}</a>` +
                (data.length > 1 ? `, <a href="${window.location.href.replace("medium", "manga")}">...</a>` : "");
            cont.appendChild(div);
        }

        // https://www.pixiv.net/member_illust.php?mode=manga&illust_id=
        // side links
        cont = document.getElementsByClassName("item-container");
        if (cont.length && !has(cont[0], "a[style]")) {
            for (let i = 0; i < cont.length; i++) {
                a = document.createElement("a");
                a.style.display = "inline-block";
                a.style.verticalAlign = "top";
                a.style.margin = "5px 5px 0 0";
                a.style.width = 0;
                a.style.direction = "rtl";
                // a.style.fontSize = "14px";
                a.href = data[i].urls.original;
                a.innerText = data[i].width + "x" + data[i].height;
                cont[i].insertBefore(a, cont[i].firstElementChild);
            }
        }

        // https://www.pixiv.net/member_illust.php?mode=manga&illust_id=
        // links under thumbnails
        cont = document.querySelectorAll(".thumbnail-item:not(.footer-item)");
        if (cont.length && !has(cont[0], "a")) {
            for (let i = 0; i < cont.length; i++) {
                a = document.createElement("a");
                a.style.display = "block";
                a.style.textAlign = "center";
                a.href = data[i].urls.original;
                a.innerText = data[i].width + "x" + data[i].height;
                cont[i].appendChild(a);
            }
            cont[0].parentElement.lastElementChild.style.marginBottom = "24px";
        }
    }

    function putSize() {
        const postId = (window.location.href.match(/&illust_id=(\d+$)/) || [])[1];
        if (!postId) return;
        if (putSize.data && putSize.data.postId === postId) {
            if (putSize.data.length) {
                addSize(putSize.data);
            }
            return;
        }

        putSize.data = {postId: postId};
        fetch("/ajax/illust/" + postId + "/pages")
            .then(resp => resp.json()
                  .then(data => {
                      putSize.data = data.body;
                      putSize.data.postId = postId;
                      addSize(putSize.data);
        }));
    }

    function onAddedElem(parent, func) {
        if (!parent) return;
        new MutationObserver(function (mutations) {
            mutations.forEach( mutation => mutation.addedNodes.forEach(elem => func(elem)));
        }).observe(parent, {childList: true});
    };

    onAddedElem(document.getElementById("root"), (elem) => {
        if (elem.nodeName == "DIV" && elem.className) {
            onAddedElem(elem, (elem) => {
                // if (window.location.pathname.startsWith("/member_illust.php?mode=medium&illust_id=")) {
                    onAddedElem(elem.querySelector("article"), putSize);
                // }
                // if (window.location.pathname.startsWith("/member.php?id=") ||
                //     window.location.pathname.startsWith("/member_illust.php?id=") ||
                //     window.location.pathname.startsWith("/bookmark.php?id=")) {
                    addStacc.postId = null;
                    onAddedElem(elem, (elem) => {
                        if (elem.className) {
                            addStacc();
                            onAddedElem(elem.querySelector("ul.KvF6Ntf"), addStacc);
                        }
                    });
                // }
            });
        }
    });

    onAddedElem(document.getElementsByClassName("thumbnail-items")[0], putSize);

    putSize();

})();

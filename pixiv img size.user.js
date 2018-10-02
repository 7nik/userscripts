// ==UserScript==
// @name         pixiv img size
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add size of the illustrations and direct links to them.
// @author       7nik
// @match        https://www.pixiv.net/member_illust.php*
// @match        https://www.pixiv.net/member.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let data = {};

    function putSize() {
        function addSize(data) {
            let has = (parent, childSel) => !!parent.querySelector(childSel);
            let cont, a, div;

            cont = document.querySelector("figure > div:nth-child(2) > div");
            if (cont && !has(cont, "div > a:not([class])")) {
                div = document.createElement("div");
                div.style.position = "absolute";
                div.style.top = "0";
                div.style.margin = "15px";
                div.style.fontWeight = "500";
                div.style.color = "black";
                div.innerHTML = `<a href="${data[0].urls.original}">${data[0].width}x${data[0].height}</a>${ data.length > 1 ? ", ..." : ""}`;
                cont.appendChild(div);
            }

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

        let postId = (window.location.href.match(/&illust_id=(\d+$)/) || [])[1];
        if (data.postId === postId) {
            if (data.length) addSize(data);
            return;
        }

        data = {postId: postId};
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "/ajax/illust/" + postId + "/pages", true);
        xhr.send();
        xhr.onloadend = () => {
            data = JSON.parse(xhr.responseText).body;
            data.postId = postId;
            addSize(data);
        }
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
                onAddedElem(elem.querySelector("article"), putSize);
            });
        }
    });

    onAddedElem(document.getElementsByClassName("thumbnail-items")[0], putSize);

    putSize();

})();
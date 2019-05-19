// ==UserScript==
// @name         pixiv img size and pixiv.me link
// @namespace    http://tampermonkey.net/
// @version      1.2.3
// @description  Add size of the illustrations and direct links to them.
// @author       7nik
// @match        https://www.pixiv.net/member_illust.php*
// @match        https://www.pixiv.net/member.php*
// @grant        none
// @run-at       document-end
// @require      https://raw.githubusercontent.com/rafaelw/mutation-summary/421110f84178aa9e4098b38df83f727e5aea3d97/src/mutation-summary.js
// ==/UserScript==

(function() {
    'use strict';

    const addPixivme = (function () {

        function putPixivme(name) {
            const userName = document.getElementsByClassName("VyO6wL2")[0];
            userName.innerHTML = `<a href="https://pixiv.me/${name}" style="color:black">${userName.innerText}</a>`;
        }

        async function viaSketch() {
            const userId = new URL(window.location).searchParams.get("id");
            const resp = await fetch("https://sketch.pixiv.net/api/pixiv/user/posts/latest?user_id=" + userId);
            if (!resp.ok) return false;
            return (await resp.json()).data.user.url.match(/[a-z0-9_-]+$/);
        }

        async function viaIllust() {
            const pic = document.querySelector("a[href^='/member_illust.php?mode=medium&illust_id=']");
            if (!pic) return false;
            const postId = pic.href.match(/\d+/)[0];
            const resp = await fetch("/ajax/illust/" + postId);
            return (await resp.json()).body.userAccount;
        }

        function delay(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }

        return async function () {
            if (document.querySelector("div.VyO6wL2 a")) return;
            let name = await viaSketch();
            if (name === false) {
                name = await viaIllust();
                while (name === false) {
                    await delay(300);
                    name = await viaIllust();
                }
            }
            putPixivme(name);
        };

    })();

    const addSize = (function() {

        function putSize(data) {
            const has = (parent, childSel) => !!parent.querySelector(childSel);
            let cont, a, div;

            // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
            // add link into post description
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

            // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
            // add links below image for mutli-page posts
            cont = document.querySelectorAll("figure > div[role] > div.hSFWCP > div[role]");
            if (cont.length && data.length>1 && !has(cont[0], "a:not([class])")) {
                for (let i = 0; i < cont.length; i++) {
                    a = document.createElement("a");
                    a.style.marginTop = "5px";
                    a.style.zIndex = 2;
                    a.style.position = "relative";
                    a.style.display = "block";
                    a.style.textAlign = "center";
                    a.href = data[i].urls.original;
                    a.innerText = data[i].width + "x" + data[i].height;
                    cont[i].appendChild(a);
                    cont[i].style.flexDirection = "column";
                }
            }

            cont = document.querySelectorAll("body > div[role] img, body > div[role] figure");
            if (cont.length && !has(cont[0].parentElement, "a")) {
                for (let i = 0; i < cont.length; i++) {
                    a = document.createElement("a");
                    a.style.height = "0";
                    a.style.order = 2;
                    a.href = data[i].urls.original;
                    a.innerText = data[i].width + "x" + data[i].height;
                    cont[i].parentElement.appendChild(a);
                    cont[i].parentElement.style.flexDirection = "column";
                    cont[i].parentElement.parentElement.style.marginBottom = "20px";
                }
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

        const datas = {};

        return function() {
            const postId = new URL(window.location).searchParams.get("illust_id");
            if (!postId) return;
            if (datas[postId]) {
                if (datas[postId] !== "pending") {
                    putSize(datas[postId]);
                }
                return;
            }

            datas[postId] = "pending";
            fetch("/ajax/illust/" + postId + "/pages")
                .then(resp => resp.json())
                .then(data => {
                    datas[postId] = data.body;
                    putSize(datas[postId]);
            });
        };
    })();

    function onElementsAdded(selector, callback) {
        new MutationSummary({
            queries: [{ element: selector }],
            callback: (summaries) => summaries[0].added.forEach(callback),
        });
    }

    onElementsAdded("h1.VyO6wL2", addPixivme);
    onElementsAdded(".thumbnail-item", addSize);
    onElementsAdded("div.dCQVle", addSize); // ???
    onElementsAdded("div.gtm-medium-work-expanded-view", addSize);
    onElementsAdded("section", addSize);
    onElementsAdded("div[role]", aadSize);

    addSize();

})();

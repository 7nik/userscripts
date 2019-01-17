// ==UserScript==
// @name         pixiv img size and pixiv.me link
// @namespace    http://tampermonkey.net/
// @version      1.1
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
        const userId = new URL(window.location).searchParams.get("id");
        if (!userId) return;
        fetch("https://sketch.pixiv.net/api/pixiv/user/posts/latest?user_id=" + userId)
            .then(resp => resp.json())
            .then(({data:{user:{url:url}}}) => {
                const stacc = url.match(/[a-z0-9_-]+$/);
                const userName = document.getElementsByClassName("VyO6wL2")[0];
                userName.innerHTML = `<a href="https://pixiv.me/${stacc}" style="color:black">${userName.innerText}</a>`;
            })
            .catch(() => {
                const pic = document.querySelector("a[href^='/member_illust.php?mode=medium&illust_id=']");
                if (!pic) return;
                const postId = pic.href.match(/\d+/)[0];
                fetch("/ajax/illust/" + postId)
                    .then(resp => resp.json())
                    .then(({body:{userAccount: stacc}}) => {
                        const userName = document.getElementsByClassName("VyO6wL2")[0];
                        userName.innerHTML = `<a href="https://pixiv.me/${stacc}" style="color:black">${userName.innerText}</a>`;
                });
            });
    }

    function addSize(data) {
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
        cont = document.querySelectorAll("figure div > div[role]");
        if (cont.length && cont.length>1 && !has(cont[0], "a:not([class])")) {
            for (var i = 0; i < cont.length; i++) {
                a = document.createElement("a");
                a.style.marginTop = "5px";
                a.href = data[i].urls.original;
                a.innerText = data[i].width + "x" + data[i].height;
                cont[i].appendChild(a);
                cont[i].style.flexDirection = "column";
            }
            console.log("filled div[role]")
        } else {
            console.log("no div[role]")
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
        const postId = new URL(window.location).searchParams.get("illust_id");
        if (!postId) return;
        if (putSize.data && putSize.data.postId === postId) {
            if (putSize.data.length) {
                addSize(putSize.data);
            }
            return;
        }

        putSize.data = {postId: postId};
        fetch("/ajax/illust/" + postId + "/pages")
            .then(resp => resp.json())
            .then(data => {
                putSize.data = data.body;
                putSize.data.postId = postId;
                addSize(putSize.data);
        });
    }

    function onAddedElem(query, func) {
        let [, tagName, id, className] = query.match(/(\w+)?(?:#(\w+))?(?:\.(\w+))?/);
        new MutationObserver(function (mutations) {
            mutations.forEach(mutation => mutation.addedNodes.forEach(elem => {
                if (tagName && (tagName!=elem.nodeName.toLowerCase()) ||
                    id && (id!=elem.id) ||
                    className && (elem.className.indexOf(className)>=0)) {
                    return;
                }
                func(elem);
            }));
        }).observe(document.body, {childList: true, subtree: true});
    }

    onAddedElem("div.VyO6wL2", addStacc);
    onAddedElem(".thumbnail-items", putSize);
    onAddedElem("div.dCQVle", putSize);
    onAddedElem("section._2PSiU82", putSize);

})();

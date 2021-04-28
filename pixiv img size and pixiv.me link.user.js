// ==UserScript==
// @name         pixiv img size and pixiv.me link
// @namespace    http://tampermonkey.net/
// @version      2.1.1
// @description  Add size of the illustrations and direct links to them.
// @author       7nik
// @match        https://www.pixiv.net/en/users/*
// @match        https://www.pixiv.net/users/*
// @match        https://www.pixiv.net/en/artworks/*
// @match        https://www.pixiv.net/artworks/*
// @grant        GM_download
// @grant        GM_addStyle
// @run-at       document-end
// @require      https://raw.githubusercontent.com/rafaelw/mutation-summary/421110f84178aa9e4098b38df83f727e5aea3d97/src/mutation-summary.js
// ==/UserScript==

/* global GM_download MutationSummary */

"use strict";

const addPixivme = (function addPixivmeWrapper () {
    function putPixivme (name) {
        const userName = document.querySelector("div.hgYhRu h1");
        userName.innerHTML = `<a href="https://pixiv.me/${name}">${userName.textContent}</a>`;
    }

    async function viaMobileApi () {
        const userId = window.location.href.match(/\d+/)[0];
        const resp = await fetch(`https://www.pixiv.net/touch/ajax/user/details?id=${userId}&lang=en`);
        if (!resp.ok) return false;
        return (await resp.json()).body.user_details.user_account;
    }

    async function viaSketch () {
        const userId = window.location.href.match(/\d+/)[0];
        const resp = await fetch(`https://sketch.pixiv.net/api/pixiv/user/posts/latest?user_id=${userId}`);
        if (!resp.ok) return false;
        return (await resp.json()).data.user.url.match(/[\w-]+$/);
    }

    async function viaIllust () {
        const pic = document.querySelector("a[href^='/en/artworks/'],a[href^='/artworks/']");
        if (!pic) return null;
        const postId = pic.href.match(/\d+/)[0];
        const resp = await fetch(`/ajax/illust/${postId}`);
        return (await resp.json()).body.userAccount;
    }

    function delay (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    return async function addPixivmeFn () {
        if (document.querySelector("div.hgYhRu h1 a")) return;
        let name = await viaMobileApi();
        if (name === false) {
            name = await viaSketch();
        }
        if (name === false) {
            name = await viaIllust();
        }
        while (name === null) {
            await delay(300); // eslint-disable-line no-await-in-loop
            name = await viaIllust(); // eslint-disable-line no-await-in-loop
        }
        putPixivme(name);
    };
}());

const addSize = (function addSizeWrapper () {
    const toLink = (data) => (!data
        ? console.log("no data")
        : ` <a href="${data.urls.original}">${data.width}x${data.height}</a>
            <a href="${data.urls.original}" target="_blank" class="dwnldimg" >⇓</a>`
    );

    function putSize (postId, data) {
        const has = (parent, childSel) => !!parent.querySelector(childSel);
        let conts;

        // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
        // add link into post description
        conts = document.querySelector("figure ~ div section");
        if (conts && !has(conts, "div > a:not([class])")) {
            const div = document.createElement("div");
            div.className = "orglnk";
            div.dataset.postId = postId;
            div.style.position = "absolute";
            div.style.top = "0";
            div.style.left = "0";
            div.style.margin = "10px";
            div.style.fontWeight = "500";
            div.innerHTML = toLink(data[0]) + (data.length === 1 ? "" : `,..`);
            conts.append(div);
        }

        // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
        // add links below image for mutli-page posts
        conts = document.querySelectorAll("figure > div[role] > div > div[role]");
        if (data.length > 1) {
            for (let i = 0; i < conts.length; i++) { // eslint-disable-line unicorn/no-for-loop
                // eslint-disable-next-line no-continue
                if (has(conts[i], "a:not([class])")) continue;
                const span = document.createElement("span");
                span.className = "orglnk";
                span.dataset.postId = postId;
                span.style.marginTop = "5px";
                span.style.zIndex = 2;
                span.style.position = "relative";
                span.style.display = "block";
                span.style.textAlign = "center";
                span.innerHTML = toLink(data[i]);
                conts[i].append(span);
                conts[i].style.flexDirection = "column";
            }
        }

        // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
        // add links under mini-previews on mutli-page posts
        conts = document.querySelectorAll("body > div > style + div div[aria-disabled] div");
        for (let i = 0; i < conts.length; i++) { // eslint-disable-line unicorn/no-for-loop
            // eslint-disable-next-line no-continue
            if (has(conts[i], "a")) continue;
            const span = document.createElement("span");
            span.className = "orglnk";
            span.dataset.postId = postId;
            span.style.height = "0";
            span.style.order = 2;
            span.innerHTML = toLink(data[i]);
            conts[i].append(span);
            conts[i].style.flexDirection = "column";
            conts[i].parentElement.style.marginBottom = "20px";
        }
    }

    const cache = {};

    return function addSizeFn () {
        // const postId = new URL(window.location).searchParams.get("illust_id");
        const postId = (window.location.href.match(/\/(\d+)/) || [])[1];
        if (!postId) return;
        document.querySelectorAll(`.orglnk:not([data-post-id="${postId}"])`)
            .forEach(((el) => el.remove()));
        if (cache[postId]) {
            if (cache[postId] !== "pending") {
                putSize(postId, cache[postId]);
            }
            return;
        }

        cache[postId] = "pending";
        fetch(`/ajax/illust/${postId}/pages`)
            .then((resp) => resp.json())
            .then((data) => {
                cache[postId] = data.body;
                putSize(postId, cache[postId]);
            });
    };
}());

const downloadImage = (function downloadImageWrapper () {
    GM_addStyle(`
        #bar-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
        }
        #bar-container div {
            height: 2px;
            width: 0;
            background: #0096fa;
            margin: 1px 0;
        }
        body.downloading {
            cursor: wait;
        }
        body.downloading a {
            cursor: progress;
        }
    `);

    const barCont = document.createElement("div");
    barCont.id = "bar-container";
    document.body.append(barCont);

    return function downloadImageFn (ev) {
        if (!ev.target.matches("a.dwnldimg")) return;
        ev.preventDefault();
        ev.stopPropagation();

        this.loads = this.loads ?? 0 + 1;
        document.body.classList.add("downloading");

        const bar = document.createElement("div");
        barCont.append(bar);
        const url = ev.target.href;

        GM_download({
            url,
            name: url.match(/[\w.]+$/i)[0],
            headers: {
                referer: "https://www.pixiv.net/",
            },
            onprogress ({ loaded, total }) {
                bar.style.width = `${loaded / total * 100}%`;
            },
            onload () {
                setTimeout(() => {
                    bar.remove();
                    this.loads -= 1;
                    if (!this.loads) document.body.classList.remove("downloading");
                }, 1000);
            },
        });
    };
}());

function onElementsAdded (selector, callback) {
    new MutationSummary({
        queries: [{ element: selector }],
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        callback: (summaries) => summaries[0].added.forEach(callback),
    });
}

window.addEventListener("click", downloadImage, true);
window.addEventListener("auxclick", downloadImage, true);

onElementsAdded("div.hgYhRu", addPixivme);
onElementsAdded("section", addSize);
onElementsAdded("div[aria-disabled]", addSize);
onElementsAdded("div[role='presentation']", addSize);

addSize();

// ==UserScript==
// @name         pixiv img size and pixiv.me link
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Add size of the illustrations and direct links to them.
// @author       7nik
// @match        https://www.pixiv.net/en/users/*
// @match        https://www.pixiv.net/users/*
// @match        https://www.pixiv.net/en/artworks/*
// @match        https://www.pixiv.net/artworks/*
// @match        https://i.pximg.net/*
// @grant        GM_download
// @grant        window.close
// @run-at       document-end
// @require      https://raw.githubusercontent.com/rafaelw/mutation-summary/421110f84178aa9e4098b38df83f727e5aea3d97/src/mutation-summary.js
// ==/UserScript==

/* global GM_download MutationSummary */

"use strict";

if (window.location.hostname === "i.pximg.net" && window.location.hash === "#download") {
    GM_download(window.location.href, window.location.pathname.match(/[\w.]+$/i)[0]);
    setTimeout(window.close, 1000);
    return;
}

const addPixivme = (function addPixivmeWrapper () {
    function putPixivme (name) {
        const userName = document.querySelector("div.cSpfix h1");
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
        if (document.querySelector("div.cSpfix h1 a")) return;
        let name = await viaMobileApi();
        if (name === false) {
            name = await viaSketch();
            if (name === false) {
                name = await viaIllust();
                while (name === null) {
                    await delay(300); // eslint-disable-line no-await-in-loop
                    name = await viaIllust(); // eslint-disable-line no-await-in-loop
                }
            }
        }
        putPixivme(name);
    };
}());

const addSize = (function addSizeWrapper () {
    const toLink = (data) => (!data
        ? console.log("no data")
        : ` <a href="${data.urls.original}">${data.width}x${data.height}</a>
            <a href="${data.urls.original}#download" target="_blank" >⇓</a>`
    );

    function putSize (data) {
        const has = (parent, childSel) => !!parent.querySelector(childSel);
        let conts;

        // https://www.pixiv.net/member_illust.php?mode=medium&illust_id=
        // add link into post description
        conts = document.querySelector("figure ~ div section");
        if (conts && !has(conts, "div > a:not([class])")) {
            const div = document.createElement("div");
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
        if (conts.length > 0 && data.length > 1 && !has(conts[0], "a:not([class])")) {
            for (let i = 0; i < conts.length; i++) { // eslint-disable-line unicorn/no-for-loop
                const span = document.createElement("span");
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
        conts = document.querySelectorAll("body > div[role] img, body > div[role] figure");
        if (conts.length > 0 && !has(conts[0].parentElement, "a")) {
            for (let i = 0; i < conts.length; i++) { // eslint-disable-line unicorn/no-for-loop
                const span = document.createElement("span");
                span.style.height = "0";
                span.style.order = 2;
                span.innerHTML = toLink(data[i]);
                conts[i].parentElement.append(span);
                conts[i].parentElement.style.flexDirection = "column";
                conts[i].parentElement.parentElement.style.marginBottom = "20px";
            }
        }
    }

    const datas = {};

    return function addSizeFn () {
        // const postId = new URL(window.location).searchParams.get("illust_id");
        const postId = (window.location.href.match(/\/(\d+)/) || [])[1];
        if (!postId) return;
        if (datas[postId]) {
            if (datas[postId] !== "pending") {
                putSize(datas[postId]);
            }
            return;
        }

        datas[postId] = "pending";
        fetch(`/ajax/illust/${postId}/pages`)
            .then((resp) => resp.json())
            .then((data) => {
                datas[postId] = data.body;
                putSize(datas[postId]);
            });
    };
}());

function onElementsAdded (selector, callback) {
    new MutationSummary({
        queries: [{ element: selector }],
        callback: (summaries) => summaries[0].added.forEach(callback),
    });
}

onElementsAdded("div.cSpfix", addPixivme);
onElementsAdded("div.gtm-medium-work-expanded-view", addSize);
onElementsAdded("section", addSize);
onElementsAdded("div[role='presentation']", addSize);

addSize();

// TODO:
// do not touch hover-ups

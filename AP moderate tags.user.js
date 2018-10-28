// ==UserScript==
// @name         AP moderate tags
// @namespace    7nik@anime-pictures.net
// @version      1.1.2
// @description  Allow moderate recommended tags the way as regular one
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*moderation=1
// @match        https://anime-pictures.net/pictures/moderating_pre_tags/*
// @grant        none
// ==/UserScript==

/* global AnimePictures:false lang:false post_id:false get_by_id:false */

(function() {
    'use strict';

    const log = (...args) => console.log(...args);
    // const log = () => {};

    if (window.location.pathname.startsWith("/pictures/moderating_pre_tags/")) {
        document.querySelectorAll(".messages td:nth-child(3) a").forEach(a => (a.href += "&moderation=1"));
        return;
    }
    if (window.location.search.indexOf("moderation=1") < 0) return;

    let cache, pretags, scrollTop = 0;
    window.addEventListener("unload", () => cache && (localStorage["mt_cache"] = JSON.stringify(cache)));
    window.addEventListener("unload", () => pretags && (localStorage["mt_pretags"] = JSON.stringify(pretags)));

    let style = document.createElement("style");
    style.innerHTML = "body.wait * {cursor: wait;} body.wait a, body.wait a * { cursor: progress; }";
    document.body.appendChild(style);

    function ajax(url, params, method = "POST") {
        // if params is skipped
        if (arguments.length == 2 && typeof params === "string") {
            [params, method] = [null, params];
        }
        if (params && method === "GET") {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(k => k + "=" + params[k]).join("&");
            params = null;
        }
        params = {
            method: method,
            body: params && Object.keys(params).reduce((form, key) => {form.append(key, params[key]); return form;}, new FormData()),
        };
        return fetch(url, params).then(resp => {
            if (!resp.ok) throw {query: method+" "+url, status: resp.status, statusText: resp.statusText};
            return resp;
        });
    }

    // query via ajax1 can be execute successively only
    const order = [];
    function ajax1() {
        const args = arguments;
        const query = new Promise(async function(resolve, reject){
            if (order.length) {
                await order[order.length-1];
            }
            try {
                resolve(await ajax(...args));
            } catch (e) {
                reject(e);
            }
            order.shift();
        });
        order.push(query);
        return query;
    }

    async function deletePreTag(preTagId) {
        const {success, msg} = await (await ajax("/pictures/del_pre_tag/"+preTagId)).json();
        if (!success) log("error of pretag removing: ", msg);
        const editTag = document.querySelector(`span[data-pretag-id="${preTagId}"]`);
        if (!editTag) return; // no pretag on the page
        const li = editTag.parentNode.parentNode;
        if (li.previousElementSibling.nodeName == "SPAN" && (li.nextElementSibling == null || li.nextElementSibling.nodeName == "SPAN")) {
            li.parentNode.removeChild(li.previousElementSibling);
        }
        li.parentNode.removeChild(li);
    }

    async function acceptPreTag(preTagId) {
        const {success, msg} = await (await ajax1("/pictures/accept_pre_tag/"+preTagId)).json();
        if (!success) {
            log("error of pretag accepting: ", msg);
            const editTag = document.querySelector(`span[data-pretag-id="${preTagId}"]`);
            if (!editTag) return; // no pretag on the page
            const li = editTag.parentNode.parentNode;
            if (li.previousElementSibling.nodeName == "SPAN" && (li.nextElementSibling == null || li.nextElementSibling.nodeName == "SPAN")) {
                li.parentNode.removeChild(li.previousElementSibling);
            }
            li.parentNode.removeChild(li);
        }
        const editTag = document.querySelector(`span[data-pretag-id="${preTagId}"]`);
        if (!editTag) return; // no pretag on the page
        const tagId = editTag.getAttribute("data-tag-id");
        editTag.parentNode.previousElementSibling.style.backgroundImage = null;
        editTag.innerHTML = `${editTag.innerText}<span id="delete_span_tag_${tagId}" class="icon_delete"></span><span id="set_span_tag_${tagId}" class="icon_frame"></span><span id="edit_span_tag_${tagId}" class="icon_edit"></span>`;
    }

    const categories = ((langs, lang, def) => langs[lang] || langs[def])({
        "en" : {
            "unknown": 0,
            "character": 1,
            "reference": 2,
            "copyright (product)": 3,
            "author": 4,
            "game copyright": 5,
            "other copyright": 6,
            "object": 7,
        },
        "ru": {
            "неизвестно": 0,
            "персонаж": 1,
            "описание": 2,
            "копирайт (продукт)": 3,
            "автор": 4,
            "игровой копирайт": 5,
            "иной копирайт": 6,
            "объект": 7,
        },
        "jp": {
            "不明": 0,
            "キャラクター名": 1,
            "特性、状態": 2,
            "作品名（製品名）": 3,
            "アーティスト名": 4,
            "作品名（ゲーム）": 5,
            "other copyright": 6,
            "物質": 7,
        },
    }, lang, "en");
    const ord = {3:0, 5:1, 6:2, 1:3, 4:4, 2:5, 7:6, 0:7};
    async function getTagInfo(tagName) {
        const tag = {name: tagName};
        const dom = new DOMParser().parseFromString(await (await ajax("https://anime-pictures.net/pictures/view_all_tags/0", {search_text: tagName, lang: lang}, "GET")).text(), "text/html");
        const names = Array.from(dom.querySelectorAll(".all_tags td:nth-child(2) a, .all_tags td:nth-child(3) a, .all_tags td:nth-child(4) a"))
            .filter(a => a.innerText === tagName);
        if (names.length) {
            const tr = names[0].parentElement.parentElement;
            tag.id = tr.children[0].innerText;
            tag.type = categories[tr.children[4].innerText];
            tag.count = +tr.children[5].innerText + 1;
        } else {
            log("failed to get info about " + tagName);
            tag.name += "<no info>";
            tag.id = 0;
            tag.type = 0;
            tag.count = 0;
        }
        return tag;
    }

    async function getCachedTagInfo(tagName) {
        if (!cache) {
            cache = JSON.parse(localStorage["mt_cache"] || "{}");
            // remove unused items
            const now = new Date().getTime();
            Object.keys(cache).forEach(key => {if (cache[key].date + 7*24*3600*1000 < now) delete cache[key];});
        }
        if (cache[tagName]) {
            const tag = cache[tagName];
            tag.date = new Date().getTime();
            return Object.assign({}, tag); // return a copy
        }
        const tag = await getTagInfo(tagName);
        tag.date = new Date().getTime();
        cache[tagName] = tag;
        return Object.assign({}, tag); // return a copy
    }

    async function readModeratingTags() {
        document.body.className += " wait";
        const pics = {};
        let i = 0;
        let dom;
        do {
            dom = new DOMParser().parseFromString(await (await ajax("https://anime-pictures.net/pictures/moderating_pre_tags/"+i+"?lang="+lang, "GET")).text(), "text/html");
            for (const tr of dom.querySelectorAll(".messages tr")) {
                const children = tr.children;
                const tag = await getCachedTagInfo(children[1].querySelector("a").innerText);
                tag.preId = children[0].parentNode.id.match(/\d+/)[0];
                tag.by = children[0].querySelector("a").innerText;
                tag.postId = children[2].querySelector("a").href.match(/\d+/)[0];
                if (!pics[tag.postId]) {
                    pics[tag.postId] = [tag];
                } else {
                    pics[tag.postId].push(tag);
                }
            }
            i++;
        } while (dom.querySelector(`p.numeric_pages a[href*='${i}']`));

        Object.keys(pics).forEach(k => (pics[k] = pics[k].sort((a,b) => (a.type == b.type) ? b.count - a.count : ord[a.type] - ord[b.type])));
        localStorage["mt_pretags"] = JSON.stringify(pics);
        localStorage["mt_lastUpdate"] = new Date().getTime();

        document.body.className = document.body.className.replace(" wait", "");
    }

    function getCount (li) {
        if (!li || li.nodeName == "SPAN") return 0;
        const n = li.lastElementChild.firstElementChild.textContent.trim();
        return (n.indexOf("K") >= 0) ? parseInt(n)*1000 : +n;
    }

    function makeLi(tag, uploaderName) {
        const li = document.createElement("li");
        li.id = "tag_li_" + tag.id;
        li.className = [3,5,6].indexOf(tag.type) >=0 ? "green" : tag.type == 1 ? "blue" : tag.type == 4 ? "orange" : "";
        li.title = "by " + tag.by;
        li.innerHTML = `
<a href="/pictures/view_posts/0?search_tag=${tag.name}&amp;lang=ru"
   title="Аниме картинки с тегом ${tag.name}"
   class="${[1,3,4,5,6].indexOf(tag.type) >= 0 ? "big_tag" : ""} ${(tag.by !== uploaderName) ? "not_my_tag_border" : ""}"
>
  ${tag.name}
</a>
<span>
  <span class="edit_tag" data-pretag-id="${tag.preId}" data-tag-id="${tag.id}">
    ${tag.count >= 1000 ? Math.floor(tag.count/1000) + "K" : tag.count}
    <span class="accept" title="Accept"> ✓ </span>
    <span class="decline" title="Decline"> ✗ </span>
    <span id="edit_span_tag_${tag.id}" class="icon_edit"></span>
  </span>
</span>`;
        li.firstElementChild.style.backgroundImage = "linear-gradient(to right, transparent 90%, aqua)";
        li.firstElementChild.style.color = [3,5,6].indexOf(tag.type) >=0 ? "green" : tag.type == 1 ? "#006699" : tag.type == 4 ? "orange" : null;
        return li;
    }
    function makeCategory(type, elem) {
        const span = document.createElement("span");
        span.innerText = Object.keys(categories).find(k => categories[k] == type);
        return span;
    }

    function addPreTags() {
        if (!pretags || document.querySelector(".tags li span.accept")) return;

        const presentedTags = Array.from(document.querySelectorAll(".tags a")).map(a => a.innerText);
        pretags[post_id] = pretags[post_id].filter((tag, i, tags) => {
            // accepted presented tags
            if (presentedTags.indexOf(tag.name) >= 0) {
                log(tag.name + " %cautoaccepted", "color: green;");
                acceptPreTag(tag.preId);
                return false;
            // decline double tags
            } else if (tags.findIndex(t => t.name === tag.name) < i) {
                log(tag.name + " %cautodeclined", "color: red");
                deletePreTag(tag.preId);
                return false;
            }
            return true;
        });
        if (!pretags[post_id].length) {
            delete pretags[post_id];
            localStorage["mt_pretags"] = JSON.stringify(pretags);
            pretags = null;
            return;
        }

        const ptags = Array.from(pretags[post_id] || []); // copy the array
        if (!ptags.length) return;

        const uploaderName = document.querySelector(".post_content_avatar a").innerText;
        const ul = document.getElementsByClassName("tags")[0];
        let curElem = document.querySelector("#post_tags span");
        let curType = categories[curElem.innerText];
        curElem = curElem.nextElementSibling;
        let tag;

        loop: while (ptags.length || tag) {
            tag = tag || ptags.shift();
            while (curElem) {
                if (ord[tag.type] < ord[curType]) {
                    ul.insertBefore(makeCategory(tag.type), curElem);
                    ul.insertBefore(makeLi(tag, uploaderName), curElem);
                    curType = tag.type;
                    tag = null;
                    continue loop;
                }
                if (ord[tag.type] > ord[curType]) {
                    while (curElem && curElem.nodeName !== "SPAN") {
                        curElem = curElem.nextElementSibling;
                    }
                    if (curElem && curElem.nodeName === "SPAN") {
                        curType = categories[curElem.innerText];
                        if (ord[tag.type] >= ord[curType]) curElem = curElem.nextElementSibling;
                    }
                    continue loop;
                }
                // t.type === curType
                while (+tag.count < getCount(curElem)) {
                    curElem = curElem.nextElementSibling;
                }
                ul.insertBefore(makeLi(tag, uploaderName), curElem);
                tag = null;
                continue loop;
            }
            if (tag.type !== curType) {
                ul.insertBefore(makeCategory(tag.type), curElem);
                curType = tag.type;
            }
            ul.insertBefore(makeLi(tag, uploaderName), curElem);
            tag = null;
        }
        ul.parentNode.scrollTop = scrollTop;
    }

    async function loadModeratingTags() {
        if (+localStorage["mt_lastUpdate"] + 3600*1000 < new Date().getTime()) await readModeratingTags();

        pretags = JSON.parse(localStorage["mt_pretags"] || "{}");
        if (!pretags[post_id]) {
            await readModeratingTags();
            pretags = JSON.parse(localStorage["mt_pretags"] || "{}");
        }
        if (!pretags[post_id]) return;

        addPreTags();

        document.getElementById("post_tags").addEventListener("click", async function(event){
            const preTagId = event.target.parentNode.getAttribute("data-pretag-id");
            if (event.target.getAttribute("class") == "accept") {
                log(event.target.parentNode.parentNode.previousElementSibling.innerText + " %caccepted", "color: green;");
                event.target.nextElementSibling.remove();
                event.target.remove();
                await acceptPreTag(preTagId);
                scrollTop = document.getElementById("post_tags").scrollTop;
                AnimePictures.post.refresh_tags();
            } else if (event.target.getAttribute("class") == "decline") {
                log(event.target.parentNode.parentNode.previousElementSibling.innerText + " %cdeclined", "color: red;");
                event.target.previousElementSibling.remove();
                event.target.remove();
                await deletePreTag(preTagId);
            } else {
                return;
            }
            const tags = pretags[post_id];
            tags.splice(tags.findIndex(t => t.preId == preTagId), 1);
            if (!tags.length) {
                delete pretags[post_id];
                localStorage["mt_pretags"] = JSON.stringify(pretags);
                pretags = null;
            }
        });

        new MutationObserver(function(mutations) {
            addPreTags();
        }).observe(document.getElementById("post_tags"), {childList: true});
    }

    loadModeratingTags();

})();
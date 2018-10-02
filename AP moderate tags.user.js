// ==UserScript==
// @name         AP moderate tags
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Allow moderate recommended tags the way as regular one
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*moderation=1
// @match        https://anime-pictures.net/pictures/moderating_pre_tags/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /* global AnimePictures:false lang:false post_id:false get_by_id:false */
    /* eslint dot-notation: "off" */

    if (window.location.pathname.startsWith("/pictures/moderating_pre_tags/")) {
        document.querySelectorAll(".messages td:nth-child(3) a").forEach(a => (a.href += "&moderation=1"));
        return;
    }

    if (window.location.search.indexOf("moderation=1") < 0) return;

    let cache, pretags;
    window.addEventListener("unload", () => cache && (localStorage["mt_cache"] = JSON.stringify(cache)));
    window.addEventListener("unload", () => pretags && (localStorage["mt_pretags"] = JSON.stringify(pretags)));

    async function ajax(url, params, handler, method = "POST") {
        // if params is skipped
        if (typeof params === "function") [params, handler, method] = [{}, params, handler || method];
        if (method === "GET") {
            url += (url.indexOf("?") >= 0 ? "&" : "?") + Object.keys(params).map(k => k + "=" + params[k]).join("&");
            params = {};
        }
        return new Promise(function (resolve, reject) {
            params = Object.keys(params).reduce((form, key) => {form.append(key, params[key]); return form;}, new FormData());
            let xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = async function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(await handler(xhr));
                } else {
                    reject({status: this.status, statusText: xhr.statusText});
                }
            };
            xhr.onerror = function () {
                reject({status: this.status, statusText: xhr.statusText});
            };
            xhr.send(params);
        });
    }

    async function deletePreTag(preTagId) {
        let request = function(req) {
            let {success, msg} = JSON.parse(req.responseText);
            if (!success) console.log("error of pretag removing: ", msg);
            let li = document.querySelector(`span[data-pretag-id="${preTagId}"]`).parentNode.parentNode;
            if (li.previousElementSibling.nodeName == "SPAN" && (li.nextElementSibling == null || li.nextElementSibling.nodeName == "SPAN")) {
                li.parentNode.removeChild(li.previousElementSibling);
            }
            li.parentNode.removeChild(li);
        };
        await ajax("/pictures/del_pre_tag/"+preTagId, request);
    }

    async function acceptPreTag(preTagId) {
        let request = function(req) {
            let {success, msg} = JSON.parse(req.responseText);
            if (!success) {
                console.log("error of pretag accepting: ", msg);
                let li = document.querySelector(`span[data-pretag-id="${preTagId}"]`).parentNode.parentNode;
                if (li.previousElementSibling.nodeName == "SPAN" && (li.nextElementSibling == null || li.nextElementSibling.nodeName == "SPAN")) {
                    li.parentNode.removeChild(li.previousElementSibling);
                }
                li.parentNode.removeChild(li);
            }
            let butcont = document.querySelector(`span[data-pretag-id="${preTagId}"]`);
            if (butcont) {
                let tagId = butcont.getAttribute("data-tag-id");
                butcont.parentNode.previousElementSibling.style.backgroundImage = null;
                butcont.removeChild(butcont.firstElementChild);
                butcont.removeChild(butcont.firstElementChild);
                butcont.removeChild(butcont.firstElementChild);
                butcont.innerHTML += `<span id="delete_span_tag_${tagId}" class="icon_delete"></span><span id="set_span_tag_${tagId}" class="icon_frame"></span><span id="edit_span_tag_${tagId}" class="icon_edit"></span>`;
            }
        };
        await ajax("/pictures/accept_pre_tag/"+preTagId, request);
    }

    const categories = lang == "jp" ? {
        "不明": 0,
        "キャラクター名": 1,
        "特性、状態": 2,
        "作品名（製品名）": 3,
        "アーティスト名": 4,
        "作品名（ゲーム）": 5,
        "other copyright": 6,
        "物質": 7,
    } : lang == "ru" ? {
        "неизвестно": 0,
        "персонаж": 1,
        "описание": 2,
        "копирайт (продукт)": 3,
        "автор": 4,
        "игровой копирайт": 5,
        "иной копирайт": 6,
        "объект": 7,
    } : {
        "unknown": 0,
        "character": 1,
        "reference": 2,
        "copyright (product)": 3,
        "author": 4,
        "game copyright": 5,
        "other copyright": 6,
        "object": 7,
    };
    const ord = {3:0, 5:1, 6:2, 1:3, 4:4, 2:5, 7:6, 0:7};
    async function getTagInfo(tagName) {
        let request = function(req) {
            let tag = {name: tagName};
            let dom = document.createRange().createContextualFragment(req.responseText);
            let tr = Array.from(dom.querySelectorAll(".all_tags td:nth-child(2) a, .all_tags td:nth-child(3) a, .all_tags td:nth-child(4) a"))
                .filter(a => a.innerText === tagName)[0].parentElement.parentElement;
            tag.id = tr.children[0].innerText;
            tag.type = categories[tr.children[4].innerText];
            tag.count = +tr.children[5].innerText + 1;

            return tag;
        };
        return await ajax("https://anime-pictures.net/pictures/view_all_tags/0", {search_text: tagName, lang: lang}, request, "GET");
    }

    async function getCachedTagInfo(tagName) {
        if (!cache) {
            cache = JSON.parse(localStorage["mt_cache"] || "{}");
            let now = new Date().getTime();
            Object.keys(cache).forEach(key => {if (cache[key].date + 7*24*3600*1000 < now) delete cache[key];});
        }
        if (cache[tagName]) {
            let tag = cache[tagName];
            tag.date = new Date().getTime();
            return Object.assign({}, tag); // return a copy
        }
        let tag = await getTagInfo(tagName);
        tag.date = new Date().getTime();
        cache[tagName] = tag;
        return Object.assign({}, tag); // return a copy
    }

    async function readModeratingTags() {
        document.body.setAttribute("style", "cursor: wait;");
        let pics = {};
        let i = 0;
        let request = async function(req) {
            let dom = document.createRange().createContextualFragment(req.responseText);
            for (let tr of dom.querySelectorAll(".messages tr")) {
                let children = tr.children;
                let tag = await getCachedTagInfo(children[1].querySelector("a").innerText);
                tag.preId = children[0].parentNode.id.match(/\d+/)[0];
                tag.by = children[0].querySelector("a").innerText;
                tag.postId = children[2].querySelector("a").href.match(/\d+/)[0];
                if (!pics[tag.postId]) {
                    pics[tag.postId] = [tag];
                } else {
                    pics[tag.postId].push(tag);
                }
            }
            if (dom.querySelector(`p.numeric_pages a[href*='${i+1}']`)) {
                i++;
                return true;
            }
            return false;
        }

        while (await ajax("https://anime-pictures.net/pictures/moderating_pre_tags/"+i, request, "GET"));

        Object.keys(pics).forEach(k => pics[k] = pics[k].sort((a,b) => (a.type == b.type) ? b.count - a.count : ord[a.type] - ord[b.type]));
        localStorage["mt_pretags"] = JSON.stringify(pics);
        localStorage["mt_lastUpdate"] = new Date().getTime();
        document.body.removeAttribute("style");
    }

    function addPreTags() {
        if (!pretags || document.querySelector(".tags li span.accept")) return;

        const uploaderName = document.querySelector(".post_content_avatar a").innerText;
        const getCount = li => { if (!li || li.nodeName == "SPAN") return 0; let n = li.lastElementChild.firstElementChild.textContent.trim(); return (n.indexOf("K") >= 0) ? parseInt(n)*1000 : +n; };

        function addTag(tag, elem) {
            let li = document.createElement("li");
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
            document.querySelector(".tags").insertBefore(li, elem);
            li.firstElementChild.style.backgroundImage = "linear-gradient(to right, transparent 90%, aqua)";
            li.firstElementChild.style.color = [3,5,6].indexOf(tag.type) >=0 ? "green" : tag.type == 1 ? "#006699" : tag.type == 4 ? "orange" : null;
        }
        function addSpan(type, elem) {
            let span = document.createElement("span");
            span.innerText = Object.keys(categories).find(k => categories[k] == type);
            document.querySelector(".tags").insertBefore(span, elem);
        }

        let ptags = Array.from(pretags[post_id] || []); // copy the array
        if (!ptags.length) return;

        let curElem = document.querySelector("#post_tags span");
        let curType = categories[curElem.innerText];
        curElem = curElem.nextElementSibling;
        let t;

        loop: while (ptags.length || t) {
            t = t || ptags.shift();
            while (curElem) {
                if (ord[t.type] < ord[curType]) {
                    addSpan(t.type, curElem);
                    addTag(t, curElem);
                    curType = t.type;
                    t = null;
                    continue loop;
                }
                if (ord[t.type] > ord[curType]) {
                    while (curElem && curElem.nodeName !== "SPAN") {
                        curElem = curElem.nextElementSibling;
                    }
                    if (curElem && curElem.nodeName === "SPAN") {
                        curType = categories[curElem.innerText];
                        if (ord[t.type] >= ord[curType]) curElem = curElem.nextElementSibling;
                    }
                    continue loop;
                }
                // t.type === curType
                while (+t.count < getCount(curElem)) {
                    curElem = curElem.nextElementSibling;
                }
                addTag(t, curElem);
                t = null;
                continue loop;
            }
            if (t.type !== curType) {
                addSpan(t.type, curElem);
                curType = t.type;
            }
            addTag(t);
            t= null;
        }
        console.log("pretags added");
    }

    async function loadModeratingTags() {
        if (+localStorage["mt_lastUpdate"] + 3600*1000 < new Date().getTime()) await readModeratingTags();

        pretags = JSON.parse(localStorage["mt_pretags"]);
        if (!pretags[post_id]) {
            await readModeratingTags();
            pretags = JSON.parse(localStorage["mt_pretags"]);
        }
        if (!pretags[post_id]) return;

        addPreTags();

        document.getElementById("post_tags").addEventListener("click", async function(event){
            let preTagId = event.target.parentNode.getAttribute("data-pretag-id");
            if (event.target.getAttribute("class") == "accept") {
                await acceptPreTag(preTagId);
                AnimePictures.post.refresh_tags();
            } else if (event.target.getAttribute("class") == "decline") {
                await deletePreTag(preTagId);
            } else {
                return;
            }
            let tags = pretags[post_id];
            tags.splice(tags.findIndex(t => t.preId == preTagId), 1);
            if (!tags.length) {
                delete pretags[post_id];
                localStorage["mt_pretags"] = JSON.stringify(pretags);
                pretags = null;
            }
        });

        new MutationObserver(function(mutations) {
            addPreTags();
            console.log("triggered");
        }).observe(document.getElementById("post_tags"), {childList: true});
    }

    loadModeratingTags();


})();
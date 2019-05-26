// ==UserScript==
// @name         AP mass tag remover
// @namespace    7nik@anime-pictures.net
// @version      1.1.1
// @description  Add button to remove tag from multiple pictures
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_posts/*
// @grant        none
// ==/UserScript==

/* global AnimePictures:false lang:false get_by_id:false ts:false */

(function() {
    'use strict';

    function say(text) {
        const dialog = get_by_id("dialog");
        if (!dialog) {
            const background = document.createElement("div");
            background.id = "dialog";
            background.className = "post_content";
            background.style.position = "fixed";
            background.style.top = "0";
            background.style.margin = "0";
            background.style.height = "100%";
            background.style.width = "100%";
            background.style.display = "flex";
            background.style.zIndex = "100";
            background.style.background = "rgba(0,0,0,0.75)";
            background.innerHTML = `
                <div style="margin:auto">
                    <div class="title">Executing...</div>
                    <div class="post_content body" style="margin:0;">${text}</div>
                </div>`;
            document.body.appendChild(background);
            return;
        }
        if (text) {
            dialog.lastElementChild.lastElementChild.innerHTML = text;
            dialog.style.display = "flex";
        } else {
            dialog.style.display = "none";
        }
    }

    const sleep = (time) => new Promise((res) => setTimeout(res, time));

    let lastAjax = Promise.resolve();
    function ajax(url, params, method = "POST") {
        // if params is skipped
        if (arguments.length == 2 && typeof params === "string") {
            [params, method] = [null, params];
        }
        if (params && method === "GET") {
            url += (url.includes("?") ? "&" : "?") +
                   Object.keys(params).map(k => k + "=" + params[k]).join("&");
            params = null;
        }
        if (params) {
            params = {
                method: method,
                body: Object.keys(params)
                  .reduce((fd,k) => (fd.append(k, params[k]), fd), new FormData()),
            };
        } else {
            params = { method: method };
        }
        lastAjax = lastAjax
            .then(() => sleep(50))
            .then(() => fetch(url, params))
            .then(resp => {
                if (!resp.ok) throw resp;
                return resp;
            });
        return lastAjax;
    }

    async function getTagId(tagName) {
        if (!tagName) return null;
        const dom = new DOMParser().parseFromString(
            await ajax("https://anime-pictures.net/pictures/view_all_tags/0",
                       {search_text: tagName, lang: lang},
                       "GET")
                 .then(r => r.text()),
            "text/html");
        const tr = Array.from(dom.querySelectorAll(".all_tags td:not(:last-child) a"))
            .filter(a => a.innerText === tagName)[0].parentElement.parentElement;
        return tr.children[0].innerText;
    }

    const getTagIds = (tagNames) => Promise
        .all(tagNames
            .toLowerCase()
            .split("||")
            .map(tagName => getTagId(tagName.trim())))
        .then(tagIds => tagIds.filter(tagId => tagId !== null));


    async function removeTag(tagId, postId) {
        if (!tagId || !postId) return;
        const {success, errormsg} =
            await ajax("/pictures/del_tag_from_post/"+postId,
                       {"tag_id": tagId})
            .then(r => r.json());
        if (!success) {
            say(errormsg);
            console.error("Error:", errormsg);
        }
    }

    const removeTags = (tagIds, postId) => Promise.all(tagIds.map((tagId) => removeTag(tagId, postId)));

    async function start() {
        const postCount = document.querySelectorAll("#posts input[type=checkbox]:checked").length;
        let doneCounter = 0;
        const startTime = Date.now();

        say("Preparing...");
        const tagIds = await getTagIds(get_by_id("multi_tags").value);
        const checkboxes = Array.from(document.querySelectorAll("#posts input[type=checkbox]:checked"));
        for (const checkbox of checkboxes) {
            const postId = checkbox.name.substr(6);
            say(`Done ${doneCounter++} of ${postCount}`);
            await removeTags(tagIds, postId);
        }
        const time = Date.now() - startTime;
        console.log(`took ${time} ms, ${Math.round(time/postCount)} ms per post`);
        say("Done");
        setTimeout(() => {
            AnimePictures.post_list.refresh(window.location.pathname + window.location.search);
            say(null);
        }, 500);
    }

    const button = document.createElement("input");
    button.type = "button";
    button.value = (lang === "ru") ? "Убрать теги" : "Remove tags";
    button.onclick = start;
    button.style.marginBottom = "3px";
    button.style.padding = "1px 4px";
    get_by_id("multi_add_tags")
        .parentNode
        .insertBefore(button, get_by_id("multi_add_tags").previousSibling);

})();
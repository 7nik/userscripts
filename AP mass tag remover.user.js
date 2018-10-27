// ==UserScript==
// @name         AP mass tag remover
// @namespace    7nik@anime-pictures.net
// @version      1.0.1
// @description  Add button to remove tag from multiple pictures
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_posts/*
// @grant        none
// ==/UserScript==

/* global AnimePictures:false lang:false get_by_id:false ts:false */

(function() {
    'use strict';

    function say(text) {
        let dialog = get_by_id("dialog");
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
            background.innerHTML = `<div style="margin:auto"><div class="title">Executing...</div><div class="post_content body" style="margin:0;">${text}</div></div>`;
            document.body.appendChild(background);
            return;
        }
        if (text) {
            dialog.lastChild.lastChild.innerHTML = text;
            dialog.style.display = "flex";
        } else {
            dialog.style.display = "none";
        }
    }

    function sleep(time) {
        return new Promise((res) => setTimeout(res, time));
    }

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
            // credentials: "same-origin",
            body: params && Object.keys(params).reduce((form, key) => {form.append(key, params[key]); return form;}, new FormData()),
        };
        return fetch(url, params).then(resp => {
            if (!resp.ok) throw {query: method+" "+url, status: resp.status, statusText: resp.statusText};
            return resp;
        });
    }

    async function getTagId(tagName) {
        let dom = new DOMParser().parseFromString(await (await ajax("https://anime-pictures.net/pictures/view_all_tags/0", {search_text: tagName, lang: lang}, "GET")).text(), "text/html");
        let tr = Array.from(dom.querySelectorAll(".all_tags td:nth-child(2) a, .all_tags td:nth-child(3) a, .all_tags td:nth-child(4) a"))
            .filter(a => a.innerText === tagName)[0].parentElement.parentElement;
        return tr.children[0].innerText;
    }

    async function getTagIds(tagNames) {
        tagNames = tagNames.toLowerCase().split("||").map(t => t.trim());
        let tagIds = [];
        for (let name of tagNames) {
            tagIds.push(await getTagId(name));
            await sleep(100);
        }
        return tagIds;
    }

    async function removeTag(tagId, postId) {
        if (!tagId || !postId) return;
        let {post_tags, success, errormsg} = await (await ajax("/pictures/del_tag_from_post/"+postId, {"tag_id": tagId})).json();
        if (!success) {
            say(errormsg);
            console.error("Error:", errormsg);
        }
    }

    async function removeTags(tagIds, postId) {
        for (let tagId of Array.from(tagIds)) { // prevent changes to the original array
            await removeTag(tagId, postId);
            await sleep(100);
        }
    }

    async function start() {
        let postCount = document.querySelectorAll("#posts input[type=checkbox]:checked").length;
        let doneCounter = 0;
        let startTime = new Date();

        let tagIds = await getTagIds(get_by_id("multi_tags").value);
        let checkbox;
        while (checkbox = document.querySelector("#posts input[type=checkbox]:checked")) {
            let postId = checkbox.name.substr(6);
            say("Done " + doneCounter++ + " of " + postCount);
            await removeTags(tagIds, postId);
            checkbox.click();
        }
        console.log(`took ${new Date().getTime() - startTime} ms, ${Math.round((new Date().getTime() - startTime)/postCount)} ms per post`);
        say("Done");
        setTimeout(() => AnimePictures.post_list.refresh(window.location.pathname + window.location.search) || say(""), 1000);
    }

    let button = document.createElement("input");
    button.type = "button";
    button.value = (lang === "ru") ? "Убрать тег" : "Remove tag";
    button.onclick = start;
    get_by_id("multi_add_tags").parentNode.insertBefore(button, get_by_id("multi_add_tags").previousSibling);

})();
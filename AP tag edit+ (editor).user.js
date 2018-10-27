// ==UserScript==
// @name         AP tag edit+ (editor)
// @namespace    7nik@anime-pictures.net
// @version      1.0.0
// @description  Replace tag id with tag name in tag edit window, autoset tag type, unsave exit protection, convert links to a tag to the tag name
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_edit_tag/*
// @grant        none
// ==/UserScript==

/* global AnimePictures:false lang:false post_id:false get_by_id:false ajax_request2:false */

(function() {
    'use strict';

    // convert raw HTML to DOMElement
    const HTMLToDOM = (html) => new DOMParser().parseFromString(html, 'text/html').body.firstChild;

    // take tag id from the source field and put tag name to the target field
    function get_tag_name(source, target) {
        let value = "";
        if (source.value.trim() !== "") {
            value = source.value.trim();
        }
        const request = function(req) {
            if (req.readyState != 4) {
                return;
            }
            if (req.status != 200) {
                console.log("Network error");
                return;
            }
            const json_req = JSON.parse(req.responseText);
            target.value = json_req.success ? json_req.name : "None";
        };

        ajax_request2(
            "/pictures/get_tag_name_by_id/"+value,
            {},
            request
        );
    }

    // take tag name from the source field and put tag id or "" to the target field
    function get_tag_id(source, target) {
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
        }, document.body.parentElement.lang, "en");
        const progress_gif = get_by_id("page_load_progress");
        let value = "";
        if (source.value.trim() !== "") {
            value = source.value.trim().toLowerCase();
        }
        let request = function(req) {
            if (req.readyState != 4) return;
            progress_gif.style.visibility = "hidden";
            if (req.status != 200) {
                console.log("Network error");
                return;
            }
            let tag = {name: value};
            let dom = document.createRange().createContextualFragment(req.responseText);
            let tr = Array.from(dom.querySelectorAll(".all_tags td:nth-child(2) a, .all_tags td:nth-child(3) a, .all_tags td:nth-child(4) a"))
                .filter(a => a.innerText === value)[0].parentElement.parentElement;
            tag.id = tr.children[0].innerText;
            tag.type = categories[tr.children[4].innerText];
            tag.count = +tr.children[5].innerText + 1;

            target.value = tag.id;
            source.style.background = "";

            if (source.id == "parent_name") {
                let tagtype = get_by_id("tag_type");
                if (tagtype.value == "0" && [3,5,6].indexOf(tag.type) >=0) tagtype.value = 1; // set character type;
            }
            if (source.id == "alias_name") {
                get_by_id("tag_type").value = tag.type;
            }
        };
        ajax_request2(
            `https://anime-pictures.net/pictures/view_all_tags/0?search_text=${value}&lang=ru`,
            {},
            request,
            "GET");
    }
    // replace a link to a tag with a tag name
    function link2tag(e) {
        let link = e.dataTransfer.getData("text");
        if (!link) return;
        let tagname = link.match(/https?:\/\/[^\?]+\?(?:s_mode=s_tag_full&)?(?:search_tag|tags|word|name|title)=([^&]+)/i);
        if (!tagname) return;
        e.preventDefault();
        e.stopPropagation();
        e.target.value = decodeURIComponent(tagname[1].replace(/[\+_]/g, " ")).trim().toLowerCase();
    }
    // hide the original field, add and bind the replacer field
    function replace_field(original, replacer) {
        // put the the replacer after the original
        if (original.parentNode.lastNode === original) {
            original.parentNode.appendChild(replacer);
        } else {
            original.parentNode.insertBefore(replacer, original.nextSibling);
        }
        original.style.display = "none";
        if (original.value) {
            // fill in replacer with a tag name of an original field's tag id
            get_tag_name(original, replacer);
        }
        // the code above can be moved to the server side
        new AnimePictures.AutoComplete(replacer.id, '/pictures/autocomplete_tag', false);

        let old_value, get_name_timeout;
        function update_tag_id() {
            if (replacer.value == old_value && old_value !== undefined) return;
            old_value = replacer.value;
            // if the replacer has any text then make its background red until the original field gets a tag id
            if (replacer.value.trim()) {
                replacer.style.background = "#F88";
                clearTimeout(get_name_timeout);
                get_name_timeout = setTimeout(() => get_tag_id(replacer, original), 300);
            } else {
                replacer.style.background = "";
                original.value = "";
                clearTimeout(get_name_timeout);
            }
        }
        replacer.addEventListener("keydown", update_tag_id);
        replacer.addEventListener("input", update_tag_id);
        replacer.addEventListener("drop", (e) => {link2tag(e); update_tag_id()});
        Array.from(document.getElementsByClassName("autocomplite")).forEach(e => e.addEventListener("click", function() {
            if (replacer !== document.activeElement) return;
            clearTimeout(get_name_timeout);
            old_value = replacer.value;
            get_tag_id(replacer, original);
        }));
    }

    // added protection from saving a tag with the unknown type and triggering updating of a tag list
    function edit_tag2() {
        if (get_by_id("tag_type").value === "0") {
            get_by_id("edit_error").innerHTML = "You should set the tag type!";
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        changed = false;
        let request = function(req) {
            if (req.readyState != 4) {
                return;
            }
            if (req.status != 200) {
                console.log("Network error");
                return;
            }
            var {success, errormsg} = JSON.parse(req.responseText);
            if (success) {
                if (window.opener) window.opener.postMessage({ cmd: "update_tags" }, "https://anime-pictures.net");
                window.close();
            } else {
                get_by_id("edit_error").innerHTML = errormsg;
            }
        };
        ajax_request2(
            "/pictures/edit_tag/" + /*get tag id*/ document.querySelector(".edit_tag_wrap :first-child").innerText.match(/\d+/)[0],
            {
                "tag_type": get_by_id("tag_type").value,
                "alias": get_by_id("alias").value,
                "parent": get_by_id("parent").value,
                "name_en": get_by_id("name_en").value,
                "name_ru": get_by_id("name_ru").value,
                "name_jp": get_by_id("name_jp").value,
                "description_en": get_by_id("description_en").value,
                "description_ru": get_by_id("description_ru").value,
                "description_jp": get_by_id("description_jp").value
            },
            request
        );
    }

    replace_field(get_by_id("alias") , HTMLToDOM('<input style="width:180px;" type="text" name="alias_name"  id="alias_name"  value="">'));
    replace_field(get_by_id("parent"), HTMLToDOM('<input style="width:180px;" type="text" name="parent_name" id="parent_name" value="">'));
    replace_field(get_by_id("to_tag"), HTMLToDOM('<input style="width:133px;" type="text" name="to_tag_name" id="to_tag_name" value="">'));

    // protection from closing the window with unsaved changes
    let changed = false;
    document.querySelectorAll("#tag_type, #alias_name, #parent_name, #name_en, #name_ru, #name_jp, #description_en, #description_ru, #description_jp")
        .forEach(e => e.addEventListener("input", () => (changed = true)));
    window.onbeforeunload = () => changed ? true : null;
    get_by_id("save_tag").removeEventListener("click", edit_tag);
    get_by_id("save_tag").addEventListener("click", edit_tag2);

    document.querySelectorAll("#name_en, #name_ru, #name_jp")
        .forEach(e => e.addEventListener("drop", link2tag));

    let tagtype = get_by_id("tag_type");
    get_by_id("description_en").addEventListener("input", (e) => {
        if (tagtype.value != "0") return;
        if (e.target.value.startsWith("http")) tagtype.value = 4;
    });
})();
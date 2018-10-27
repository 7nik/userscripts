// ==UserScript==
// @name         AP tag replacer
// @namespace    7nik@anime-pictures.net
// @version      0.1
// @description  Add button and hotkey to add and/or remove a tag
// @author       You
// @match        https://anime-pictures.net/pictures/view_post/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/* global AnimePictures:false lang:false post_id:false get_by_id:false ts:false ajax_request2:false*/

(function() {
    'use strict';

    let add_tag_name = "", add_tag_id = 160396;
    let remove_tag_name = "hair up", remove_tag_id = 13828;
    let close_window = 0, go_next_pic = -1; // 1 = right, -1 = left

    function finish() {
        get_by_id("replace_tag").style.display = "none";
        if (close_window) {
            window.close();
        } else if (go_next_pic === 1) {
            document.querySelector(".chevron_right").click();
        } else if (go_next_pic === -1) {
            document.querySelector(".chevron_left").click();
        }
    }

    function remove_tag(tag_id, post_id, callback) {
        if (!tag_id) {
            callback && callback();
            return;
        }
        var request = function(req) {
            if ((req.readyState != 4) || (req.status != 200)) return;
            let {post_tags, success, errormsg} = JSON.parse(req.responseText);
            if (success) {
                get_by_id("post_tags").innerHTML = post_tags;
                callback && callback();
            } else {
                get_by_id("add_tag_status").innerHTML = errormsg;
                console.log("Error: ", errormsg);
            }
        };
        ajax_request2(
            "/pictures/del_tag_from_post/"+post_id,
            {"tag_id": tag_id},
            request
        );
    }

    function add_tag(tag_name, post_id, callback) {
        if (!tag_name) {
            callback && callback();
            return;
        }
        var request = function(req) {
            if ((req.readyState != 4) || (req.status != 200)) return;
            let {success, errormsg} = JSON.parse(req.responseText);
            if (success) {
                callback && callback();
            } else {
                get_by_id("add_tag_status").innerHTML = errormsg;
                console.log("Error: ", errormsg);
            }
        };
        ajax_request2(
            "/pictures/add_tag_to_post/" + post_id,
            {"text": tag_name, "add_new_tag": "false"},
            request
        );
    }

    let start = () => add_tag(add_tag_name, post_id, remove_tag(remove_tag_id, post_id, finish));

    if (get_by_id("tag_li_"+add_tag_id)) { // the tag already added
        add_tag_name = "";
        add_tag_id = 0;
    }
    if (!get_by_id("tag_li_"+remove_tag_id)) { // the tag already removed
        remove_tag_name = "";
        remove_tag_id = 0;
    }
    if (!add_tag_name && !remove_tag_name) return; // nothing to add or remove

    get_by_id("add_tag_form").insertBefore(new DOMParser().parseFromString(`<input type="button" id="replace_tag" style="margin:3px 0;" value="${remove_tag_name} → ${add_tag_name}" />`, 'text/html').body.firstChild, get_by_id("add_tag_input"));
    get_by_id("replace_tag").onclick = start;

    AnimePictures.hotkeys.push({
        descr: `replace tag ${remove_tag_name} with ${add_tag_name}`,
        hotkey: "R",
        pages: ["/pictures/view_post"],
        selectors: [],
        action: start,
    });

})();
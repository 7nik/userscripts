// ==UserScript==
// @name         AP tag edit+ (tag list updater)
// @namespace    7nik@anime-pictures.net
// @version      1.0.0
// @description  Replace tag id with tag name in tag edit window
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @grant        none
// ==/UserScript==

/* global AnimePictures:false lang:false post_id:false get_by_id:false ts:false ajax_request2:false*/

(function() {
    'use strict';

    function add_tag(add_new_tag) {
        let input_tag = get_by_id("add_tag_input");
        let add_tag_status = get_by_id("add_tag_status");
        let post_tags = get_by_id("post_tags");

        add_new_tag = typeof add_new_tag !== 'undefined' ? add_new_tag : "false";
        if (input_tag.value == "") {
            return;
        }
        let request = function(req) {
            if (req.readyState != 4) {
                return;
            }
            if (req.status != 200) {
                console.log("Network error");
                return;
            }
            let {post_tags: tags, error_new_tag, error_new_tag_user, success, errormsg} = JSON.parse(req.responseText);
            // added code
            if (add_new_tag == "true" && tags != null) {
                // find at the end of <ul> sequence of <li> of tags used only once
                let lis = /(?:\s*<li[^>]*>\s*<a[^>]*>[^<]*<\/a>\s*<span>\s*<span[^>]*>1\s*(?:<span[^>]*><\/span>){3}\s*<\/span>\s*<\/span>\s*<\/li>)+\s*<\/ul>/.exec(tags);
                if (lis) {
                    for (let reg = />([^<]+)<\/a>\s*<span>\s*<span class="edit_tag" data-tag-id="(\d+)">1\s*</g, match = reg.exec(lis[0]); match; match = reg.exec(lis[0]) ) {
                        window.open(
                            '/pictures/view_edit_tag/'+match[2],
                            ts["Edit tag"] + " " + match[1],
                            'width=500,height=700'
                        );
                    }
                }
            }
            if (success) {
                add_tag_status.innerHTML = ts["Ok"];
                post_tags.innerHTML = tags;
                input_tag.value = "";
                get_by_id("recommend_tags").innerHTML = "";
            } else {
                add_tag_status.innerHTML = errormsg;
                if (tags != null) {
                    post_tags.innerHTML = tags;
                }
                if (error_new_tag) {
                    if (confirm(ts["WARNING Add new tag"] + errormsg)) {
                        // loosing a reference due replacing of the function
                        /*self.post.*/add_tag("true");
                    }
                }
                if (error_new_tag_user) {
                    alert(ts["ERROR Add new tag"] + errormsg);
                }
            }
        };
        ajax_request2(
            "/pictures/add_tag_to_post/" + post_id,
            {"text": input_tag.value, "add_new_tag": add_new_tag},
            request
        );
        return false;
    }

    get_by_id("add_tag_submit").removeEventListener("click", AnimePictures.post.add_tag);
    get_by_id("add_tag_form").removeEventListener("submit", AnimePictures.post.add_tag);
    AnimePictures.post.add_tag = add_tag;
    get_by_id("add_tag_submit").addEventListener("click", AnimePictures.post.add_tag);
    get_by_id("add_tag_form").addEventListener("submit", AnimePictures.post.add_tag);

})();

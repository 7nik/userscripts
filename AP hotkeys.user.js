// ==UserScript==
// @name         AP hotkeys
// @namespace    7nik@anime-pictures.net
// @version      1.2.0
// @description  Adds support of hotkeys
// @author       7nik
// @match        https://anime-pictures.net/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    /* global AnimePictures:false lang:false post_id:false get_by_id:false ts:false ajax_request2:false*/

    /* difference from the std.js's implementation:
    1. don't corrupt history of the field changes
    2. support asking of a tag param
    3. fold a selected text with the tag and put the cursor after it or insert the empty tag and put the cursor inside it
    */
    function pasteBBTag(textarea, bbtag, askParam, param = "") {
        const getSelText = (text) => window.getSelection ? window.getSelection().toString() : document.selection.createRange().text;
        let text = getSelText();
        textarea.focus();
        if (!text) text = getSelText();

        if (askParam) {
            param = prompt(askParam, param) || param;
        }
        if (param) {
            param = "=" + param;
        }

        // set the cursor after the bbtag if any text was selected, otherwise - inside the bbtag
        let cursorPos = textarea.selectionStart + (text ? 2*bbtag.length + param.length + text.length + 5 : bbtag.length + param.length + 2);
        document.execCommand("insertText", false, "[" + bbtag + param + "]" + text + "[/" + bbtag + "]");
        textarea.selectionStart = textarea.selectionEnd = cursorPos;
    }

    function showAvailableHotkeys() {
        const html = [`
<div style="margin:auto">
    <div class="title">Avaible on this page hotkeys</div>
    <div class="post_content body" style="margin:0;">
        <table>`,
            ...hotkeys
                .filter((hk) => hk.pages.some((url) => window.location.pathname.startsWith(url)))
                .map((hk) => `<tr><td>${hk.hotkey}&nbsp;</td><td>&nbsp;${hk.descr}</td></tr>`),
       `</table>
    </div>
</div>`].join("");

        const background = document.createElement("div");
        background.innerHTML = html;
        background.id = "message";
        background.className = "post_content";
        background.style.position = "fixed";
        background.style.top = "0";
        background.style.margin = "0";
        background.style.height = "100%";
        background.style.width = "100%";
        background.style.display = "flex";
        background.style.zIndex = "100";
        background.style.background = "rgba(0,0,0,0.75)";
        background.onclick = (event) => (event.target == background) && document.body.removeChild(background);

        document.body.appendChild(background);
    }

    const hotkeys = AnimePictures.hotkeys = [
        {
            descr: "close this message or unfocus element",
            hotkey: "Escape",
            pages: ["/"], // all pages
            selectors: ["#message"],
            action: (element) => document.body.removeChild(element),
        },
        {
            descr: "(help) show this message",
            hotkey: "H",
            pages: ["/"],
            selectors: [],
            action: () => showAvailableHotkeys(),
        },
        {
            descr: "(add) focus on an input field for adding tags",
            hotkey: "A",
            pages: ["/pictures/view_post/"],
            selectors: ["#add_tag_input"],
            action: (element) => element.focus(),
        },
        {
            descr: "(query) focus on an input field for searching",
            hotkey: "Q",
            pages: ["/"],
            selectors: ["#search_tag_input", "input[name='search_text']","#tag_changes_search_tag", "#side_search_tag"],
            action: (element) => element.focus(),
        },
        {
            descr: "(query) focus on a side search field",
            hotkey: "Shift+Q",
            pages: ["/"], // all pages
            selectors: ["#side_search_tag"],
            action: (element) => element.focus(),
        },
        {
            descr: "(download) download the image",
            hotkey: "D",
            pages: ["/pictures/view_post/"],
            selectors: ["a.download_icon"],
            action: (element) => element.click(),
        },
        {
            descr: "(star) star the image",
            hotkey: "S",
            pages: ["/pictures/view_post/"],
            selectors: ["span.star_it"],
            action: (element) => element.click(),
        },
        {
            descr: "(unStar) unstar the image",
            hotkey: "Shift+S",
            pages: ["/pictures/view_post/"],
            selectors: ["span.unstar_it"],
            action: (element) => element.click(),
        },
        {
            descr: "(view) open the full image",
            hotkey: "V",
            pages: ["/pictures/view_post/"],
            selectors: ["#big_preview_cont > a"],
            action: (element) => element.click(),
        },
        {
            descr: "(favorite) add the image to default favorite",
            hotkey: "F",
            pages: ["/pictures/view_post/"],
            selectors: ["select[name='favorite_folder']"],
            action: (e) => {e.value = "default"; if (e.fireEvent) e.fireEvent("onchange"); else e.dispatchEvent(new Event('change'));},
        },
        {
            descr: "(unFavorite) remove the image from favorite",
            hotkey: "Shift+F",
            pages: ["/pictures/view_post/"],
            selectors: ["select[name='favorite_folder']"],
            action: (e) => {e.value = "Null"; if (e.fireEvent)  e.fireEvent("onchange"); else e.dispatchEvent(new Event('change'));},
        },
        {
            descr: "(comment) focus on the comment/message textarea",
            hotkey: "C",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/"],
            selectors: ["textarea"],
            action: (element) => element.focus(),
        },
        {
            descr: "save changes of a tag",
            hotkey: "Ctrl+S",
            pages: ["/pictures/view_edit_tag/"],
            selectors: ["#save_tag"],
            action: (element) => element.click(),
        },
        {
            descr: "decline changes of a tag",
            hotkey: "Escape",
            pages: ["/pictures/view_edit_tag/"],
            selectors: ["#save_tag + input"],
            action: (element) => element.click(),
        },
        {
            descr: "(bold) make selected text bold",
            hotkey: "Ctrl+B",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "B")),
        },
        {
            descr: "(italic) make selected text italic",
            hotkey: "Ctrl+I",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "I")),
        },
        {
            descr: "(underline) make selected text underline",
            hotkey: "Ctrl+U",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "U")),
        },
        {
            descr: "(picture) fold selected text as picture",
            hotkey: "Ctrl+P",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "IMG")),
        },
        {
            descr: "fold selected text as link",
            hotkey: "Ctrl+K",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "URL", "Paste URL")),
        },
        {
            descr: "fold selected text as tag",
            hotkey: "Ctrl+E",
            pages: ["/profile/messages_from_user/", "/chat/view", "/pictures/view_post/", "/pictures/view_edit_tag/"],
            selectors: ["textarea:focus", "textarea"],
            action: (element) => (pasteBBTag(element, "URL", null, "https://anime-pictures.net/pictures/view_posts/0?search_tag="+getSelText().replace(/\s/g, "+"))),
        },
        {
            descr: "send message",
            hotkey: "Ctrl+Enter",
            pages: ["/profile/messages_from_user/", "/pictures/view_post/"],
            selectors: ["textarea:focus ~ button", "textarea:focus ~ input", "a.bbcode_tag ~ input"],
            action: (element) => element.click(),
        },
        {
            descr: "go to the previous neighbour image",
            hotkey: "Z",
            pages: ["/pictures/view_post/"],
            selectors: ["a.chevron_left"],
            action: (element) => element.click(),
        },
        {
            descr: "go to the next neighbour image",
            hotkey: "X",
            pages: ["/pictures/view_post/"],
            selectors: ["a.chevron_right"],
            action: (element) => element.click(),
        }
    ];

    if (document.querySelector(".numeric_pages")) {
        hotkeys.push(
            {
                descr: "go to previous search page",
                hotkey: "A",
                pages: ["/"],
                selectors: [".numeric_pages a:first-child"],
                action: (element) => element.click(),
            },
            {
                descr: "go to next search page",
                hotkey: "D",
                pages: ["/"],
                selectors: [".numeric_pages a:last-child"],
                action: (element) => element.click(),
            }
        );
    }

    if (window.is_moderator) {
        hotkeys.push(
            {
                descr: "choose image status NEW",
                hotkey: "1",
                pages: ["/pictures/view_post/"],
                selectors: ["form[action*='set_post_status']"],
                action: (e) => {e.querySelector("select").value = 0; e.querySelector("[type=submit]").focus();},
            },
            {
                descr: "choose image status PRE",
                hotkey: "2",
                pages: ["/pictures/view_post/"],
                selectors: ["form[action*='set_post_status']"],
                action: (e) => {e.querySelector("select").value = -2; e.querySelector("[type=submit]").focus();},
            },
            {
                descr: "choose image status PUBLIC",
                hotkey: "3",
                pages: ["/pictures/view_post/"],
                selectors: ["form[action*='set_post_status']"],
                action: (e) => {e.querySelector("select").value = 1; e.querySelector("[type=submit]").focus();},
            },
            {
                descr: "choose image status BAN",
                hotkey: "4",
                pages: ["/pictures/view_post/"],
                selectors: ["form[action*='set_post_status']"],
                action: (e) => {e.querySelector("select").value = 2; e.querySelector("[name=status_type]").focus();},
            },
            {
                descr: "(add) focus on an input field for tag copying",
                hotkey: "Shift+A",
                pages: ["/pictures/view_post/"],
                selectors: ["input[name='from_post']"],
                action: (e) => e.focus(),
            },
            {
                descr: "(link) focus on an input field for picture linking",
                hotkey: "L",
                pages: ["/pictures/view_post/"],
                selectors: ["input[name='rel_post']"],
                action: (e) => e.focus(),
            }
        );
    }

    document.addEventListener("keydown", function (event) {
        // get hotkey name
        let hotkey = "", controlHotKey = false;
        if (event.ctrlKey) {
            hotkey += "Ctrl+";
            controlHotKey = true;
        }
        if (event.altKey) {
            hotkey += "Alt+";
            controlHotKey = true;
        }
        if (event.shiftKey) {
            hotkey += "Shift+";
        }
        if (event.metaKey) {
            hotkey += "Win+";
            controlHotKey = true;
        }
        hotkey += (event.key.length > 1) ? event.key : String.fromCharCode(event.which || event.keyCode);
        const focusElem = document.activeElement;
        // unfocus on Escape
        if ((hotkey === "Escape") && (focusElem !== document.body)) {
            focusElem.blur();
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // return if it is just text typing
        if (!controlHotKey && ((focusElem.tagName === "TEXTAREA") || (focusElem.tagName === "INPUT" && focusElem.type !== "button" && focusElem.type !== "submit"))) {
            return;
        }
        // filter hotkeys by a current url and the hotkey, execute hotkey.func for the first found by selectors an element and cancel KeyEvent if the element was found
        if (hotkeys
            .filter((hk) => hk.hotkey === hotkey)
            .filter((hk) => hk.pages.some((url) => window.location.pathname.startsWith(url)))
            .some(function (hk) {
                const element = hk.selectors.reduce((elem, sel) => elem || document.querySelector(sel), null);
                if (!element && hk.selectors.length) return false;
                hk.action(element);
                return true;
            })) {
                event.preventDefault();
                event.stopPropagation();
        }
    });

    // add a link to show avaible for current page hotkeys
    if (document.querySelector("#footer span")) {
        document.querySelector("#footer span").innerHTML += ", <a id='show_hotkeys' href='#' style='color:white;'>shortcuts</a>";
        document.getElementById("show_hotkeys").onclick = function (event) {
            this.blur(); // remove focus from #show_hotkeys to avoid double pressing Escape to close the message
            event.preventDefault();
            event.stopPropagation();
            showAvailableHotkeys();
        };
    }
})();
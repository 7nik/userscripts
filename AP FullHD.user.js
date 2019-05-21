// ==UserScript==
// @name         AP FullHD
// @namespace    7nik@anime-pictures.net
// @version      1.1.1
// @description  Makes almost everything visible in a brower window when it is maximazed
// @author       7nik
// @match        https://anime-pictures.net/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #body_wrapper {
            min-height: calc(100vh - 186px);
        }
        div#cont.cont_view_post > div[itemscope]:first-child:not(#part0) {
            grid-area: 1/3 / 3/4;
            display: flex !important;
            flex-direction: column;
        }
        div#cont.cont_view_post > div[itemscope]:first-child:not(#part0) > :first-child {
            display: none;
        }
        #part1 {
            display: flex;
            flex-direction: column;
        }
        div[itemscope] > .post_content:not(.moderator), #part1 > .post_content:not(.moderator) {
            order: 1;
        }
        textarea#comment_text {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
        }
        #comments td:nth-child(2) {
            border-right: none; /* I think this border is excess */
        }
        #sidebar > div[style] {
            display: none;
        }
        .title {
            height: 32px;
        }
        .sidebar_login img {
            vertical-align: top;
        }

        @media screen and (min-width: 1630px) and (max-width: 1899px)  {
            div#content {
                margin: 0;
                width: calc(100% - 300px);
            }
            div#cont.cont_view_post {
                margin: 10px auto;
            }
            #cont > #part2 > div:last-child /* comment block wripper */ {
                width: 680px !important;
            }
        }

        @media screen and (orientation: landscape) and (min-width: 1900px) {
            div#content {
                margin: 0;
            }
            div#cont.cont_view_post {
                display: grid;
                grid-template-columns: auto 1fr auto 1fr 296px 1fr 300px;
                grid-template-rows: auto auto 1fr;
                margin: 10px 0;
                width: calc(100vw - 15px);
                padding: 0;
                overflow: initial;
            }
            div#cont:not(.cont_view_post) {
                margin: 10px 0;
                width: calc(100vw - 335px);
            }
            div#cont.cont_view_post > div:first-child:not(#part0) {
                grid-area: 1 / span 3;
                width: 100%;
                text-align: center;
            }
            #cont > #part0 {
                grid-area: 2 / 1;
            }
            #cont > #part1 {
                grid-area: 2/3 / 4/4;
            }
            #cont > #part2 {
                grid-area: 3 / 1;
            }
            #cont.cont_view_post > div:not(.post_content) {
                width: 640px !important;
            }
            #cont.cont_view_post > * > div:not(.body) {
                width: 640px !important;
                margin: 0 0 10px 0;
            }
            #cont :not(#part0) .post_content:last-child {
                margin-bottom: 0;
            }

            #cont .moderator {
                font-size: 97%;
                word-spacing: -1.5px;
            }
            #comments iframe /* youtube video */ {
                width: 520px;
                height: 292.5px;
            }
        }


        @media screen and (min-width: 1630px) {
            div#sidebar {
                position: fixed;
                right: 0;
                top: 76px;
                margin: 0;
                height: calc(100vh - 76px);
                display: flex;
                flex-direction: column;
            }
            div#tags_sidebar {
                position: absolute;
                background: none;
                left: -305px;
                top: 0px;
                height: 100%;
            }
            div#tags_sidebar > div:last-child {
                display: flex;
                flex-direction: column;
                height: calc(100% - 36px);
                padding: 4px 0 !important;
            }
            div#tags_sidebar > div:last-child br {
                display: none;
            }
            div#post_tags {
                flex-grow: 1;
            }
            div#sidebar_last_scores {
                overflow: hidden;
                margin: 0;
            }
            div#sidebar_last_scores_body {
                height: calc(100% - 32px);
            }
        }
        @media screen and (min-width: 1900px) {
            div#tags_sidebar {
                left: calc((1891px - 100vw) / 3 - 296px);
            }
        }
    `);

    document.addEventListener("DOMContentLoaded", function () {
        if (document.querySelector("#cont.cont_view_post")) {
            document.querySelector("#cont > div[itemscope]").id = "part0";
            const div = document.querySelector("#cont > div[itemscope] > div:first-child");
            const container1 = document.createElement("div");
            container1.id = "part1";
            do {
                container1.append(div.nextElementSibling);
            } while (div.nextElementSibling.lastElementChild.className != "image_body");

            const container2 = document.createElement("div");
            container2.id = "part2";
            while (div.nextElementSibling) container2.append(div.nextElementSibling);
            container2.append(document.querySelector("#cont > div:last-child")); // comments

            document.getElementById("cont").append(container1, container2);

            const anim_img = document.querySelector("#big_preview_cont video");
            if (anim_img) { // video stops after moving it in the DOM so start it play
                 anim_img.play();
            }
        }

        if (document.getElementById("sidebar_last_scores_body")) {
            document.getElementById("sidebar_last_scores_body")
                .parentElement.id = "sidebar_last_scores";
        }

        const sidebar = document.getElementById("sidebar");
        function alignSidebar (ev) {
            const scrollTop = document.scrollingElement.scrollTop;
            const scrollHeight = document.scrollingElement.scrollHeight;
            const clientHeight = document.scrollingElement.clientHeight;
            const top = Math.max(0, 76 - scrollTop);
            const bottom = Math.max(0, scrollTop+clientHeight+130 - scrollHeight);
            sidebar.style.height = clientHeight-top-bottom + "px";
            sidebar.style.top = top + "px";
        }

        document.addEventListener("scroll", alignSidebar, true);
        window.addEventListener("resize", alignSidebar, true);
        alignSidebar();
    });
})();
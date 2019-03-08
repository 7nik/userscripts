// ==UserScript==
// @name         AP FullHD
// @namespace    7nik@anime-pictures.net
// @version      1.0.2.1
// @description  Makes almost everything visible in a brower window when it is maximazed
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.head.appendChild(document.createElement("style")).innerHTML =
`
#content {
    margin: 0;
    width: calc(100% - 300px);
}
#cont {
    position: relative;
    margin: 0 auto;
    padding: 0;
    overflow: inherit;
}
#comment_text {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}
.comment_block td:nth-child(2) {
    border-right: none; /* I think this border is excess */
}

@media screen and (min-width: 1000px) and (max-width: 1630px) {
    #cont > div:last-child /* comment blocks */ {
        width: 98% !important;
    }
}

@media screen and (min-width: 1630px) and (max-width: 1900px)  {
    #content {
        box-sizing: border-box;
        padding-left: 300px;
    }
    #cont.cont_view_post {
        width: calc(100% - 300px);
        margin: 9px auto; /* override second.css?v=54:1080 */
    }
    #content > .post_content {
        margin: 9px auto;
        width: 680px;
        padding-right: 10px;
    }
}

@media screen and (orientation: landscape) and (min-width: 1900px) {
    #cont > div.post_content /* ban message block */ {
        width: 1289px;
        margin: -1px 0 9px 0;
        text-align: center;
    }
    #cont.cont_view_post {
        margin: 9px 0 0 0 ;
    }
    #cont .post_content {
    	margin: 0 9px 9px 0;
        width: 640px;
    }
    #cont .moderator {
        font-size: 97%;
        word-spacing: -1.5px;
    }
    #img_cont {
        position: absolute;
        left: 649px;
        top: 0;
        display: flex;
        flex-direction: column;
    }
    /* if ban message presented */
    #cont > [style='color: red; text-align: center;'] + div > #img_cont {
        top: 31px;
    }
    /* if new image message presented */
    #cont > [style='color: red;'] + div > #img_cont  {
        top: 73px;
    }
    #cont > [style='color: red;'] .body {
        width: 1290px !important;
    }
    #img_cont > div {
    	width: 640px;
    }
    #img_cont > .post_content {
        order: 3;
    }
    #img_cont > .post_vote_block, #big_preview_cont {
        order: 2;
    }
    #img_cont > .moderator {
        order: 1;
    }
    #big_preview_cont {
    	width: auto;
	}
    #cont > div:last-child /* comment block wripper */ {
    	width: 640px !important;
    }
    .comment_block iframe /* youtube video */ {
        width: 520px;
        height: 292.5px;
    }

    #sidebar {
    	position: relative;
	}
    #tags_sidebar {
        background: none;
        left: -305px;
        top: -2px;
    }

    @media (min-height: 700px) {
        #tags_sidebar > div:last-child {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 110px);
            padding: 4px 0 !important;
        }
        #tags_sidebar > div:last-child br {
            display: none;
        }
    }
}
`;

    const container = document.createElement("div");
    container.setAttribute("id", "img_cont");
    const div = document.querySelector("#cont > div[itemscope] > div:first-child");
    // move blocks starting from second upto "Similar to" block
    do {
        container.appendChild(div.nextElementSibling);
    } while (div.nextElementSibling.lastElementChild.className != "image_body");
    div.parentElement.insertBefore(container, div.nextElementSibling);

    const anim_img = document.querySelector("#big_preview_cont video");
    if (anim_img) { // video stops after moving it in the DOM so start it play
         anim_img.play();
    }

    // hide ban message block
    if (window.is_moderator) {
        const msg = document.querySelector("#content > div.post_content > div.body");
        if (msg) msg.style.display = "none";
    }
})();
// ==UserScript==
// @name         AP no page reload
// @namespace    7nik@anime-pictures.net
// @version      1.0.1
// @description  Now mod actions on a post don't cause page reloading
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {

    function onerror(err) {
        console.error(err);
    }

    function overrideSubmit(query, callback) {
        const form = document.querySelector(query);
        if (!form) return;
        const method = form.method || "POST";
        form.addEventListener("submit", function (ev) {
            let data = new FormData(form);
            let url = form.action;
            if (method.toUpperCase() === "GET") {
                for (let pair of data.entries()) {
                    if (url.indexOf("?") >= 0) {
                        url += "&" + pair[0] + "=" + pair[1];
                    } else {
                        url += "?" + pair[0] + "=" + pair[1];
                    }
                }
                data = null;
            }
            ev.preventDefault();
            fetch(url, { method: method, body: data })
                .then(resp => resp.text())
                .then(html => callback(new DOMParser().parseFromString(html, "text/html")))
                .catch(onerror);
        }, true)
    }

    function updateElement(document2, query) {
        const elem1 = document.querySelector(query);
        if (!elem1) return;
        const elem2 = document2.querySelector(query);
        if (elem2) {
            elem1.parentElement.insertBefore(elem2, elem1);
        }
        elem1.parentElement.removeChild(elem1);
    }

    function updateMessage(dom) { // update message about new/banned image
        const cont = document.getElementById("cont");
        if (cont.firstElementChild.className) {
            cont.removeChild(cont.firstElementChild);
        }
        const elem = dom.querySelector("#cont > .post_content[style]:first-child");
        if (elem) {
            cont.insertBefore(elem, cont.firstChild);
        }
    }

    function updateStars(dom) {
        updateElement(dom, "#cont .post_vote_block");
        const star = document.getElementById("rating_star_it");
        if (star) {
            star.addEventListener("click", function (ev) {
                if (star.classList.contains("star_it")) {
                    AnimePictures.post.voting(9);
                } else {
                    AnimePictures.post.voting(0);
                }
            }, true)
        }
    }

    // on set picture status
    overrideSubmit("form[action^='/pictures/set_post_status/']", function (dom) {
        updateMessage(dom);
        updateElement(dom, "#cont > div > .post_content:first-child");
        updateElement(dom, ".post_content.moderator > div > div");
        updateStars(dom);
        updateElement(dom, "#big_preview_cont + .post_content")
    });
    // on copy tags
    overrideSubmit("form[action^='/pictures/add_tag_from_post/']", function (dom) {
        document.getElementsByName("from_post")[0].value = "";
        updateElement(dom, "meta[itemprop='author'] + div");
        updateElement(dom, ".tags");
    });
    // on move comments and stars
    overrideSubmit("form[action^='/pictures/move_comment_favorites_scores/']", function (dom) {
        document.getElementsByName("from_post")[1].value = "";
        updateStars(dom);
        updateElement(dom, "#comments");
    });
    // on link picture
    overrideSubmit("form[action^='/pictures/add_rel_to_post/']", function (dom) {
        updateElement(dom, "#cont .post_content .body + .body");
    });
    // on unlink picture
    document.addEventListener("click", function (ev) {
        if (ev.target.tagName !== "A" || !ev.target.href.startsWith("https://anime-pictures.net/pictures/del_rel_to_post/")) {
            return;
        }
        ev.preventDefault();
        fetch(ev.target.href)
            .then(resp => resp.text())
            .then(html => {
                const dom = new DOMParser().parseFromString(html, "text/html");
                updateElement(dom, "#cont .post_content .body + .body");
            })
            .catch(onerror);
    }, true);
    // on general page reload
    if (!AnimePictures.hotkeys) return;
    AnimePictures.hotkeys.push({
        descr: "refresh page info",
        hotkey: "Ctrl+R",
        pages: ["/pictures/view_post"],
        selectors: [],
        action: () => fetch(window.location.href)
            .then(resp => resp.text())
            .then(html => {
                const dom = new DOMParser().parseFromString(html, "text/html");
                // message about new/banned image
                updateMessage(dom);
                // post info
                updateElement(dom, "#cont > div > .post_content:first-child");
                // linked pictures
                updateElement(dom, "#cont .post_content .body + .body");
                // status
                updateElement(dom, "#cont .post_content.moderator > div > form");
                setNumType(document.getElementsByName("redirect_id")[0])
                // erotic level, presence of spoilers
                updateElement(dom, "#cont .post_content.moderator > div > div");
                // stars
                updateStars(dom);
                // favorited by
                updateElement(dom, "#big_preview_cont + .post_content")
                // about artist
                updateElement(dom, "meta[itemprop='author'] + div");
                // comments
                updateElement(dom, "#comments");
                // tags
                updateElement(dom, ".tags");
            })
            .catch(onerror),
    });
    // fix field type
    function setNumType(el) {
        if (!el) return;
        el.setAttribute("type", "number");
        el.setAttribute("pattern", "\\d+");
        el.style.color = "black";
    };
    setNumType(document.getElementsByName("redirect_id")[0])
    Array.from(document.getElementsByName("from_post")).forEach(setNumType);
    setNumType(document.getElementsByName("rel_post")[0]);
})();
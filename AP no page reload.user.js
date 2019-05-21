// ==UserScript==
// @name         AP no page reload
// @namespace    7nik@anime-pictures.net
// @version      1.0.2
// @description  Now mod actions on a post don't cause page reloading
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @match        https://anime-pictures.net/pictures/view_posts/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {

    function onerror(err) {
        console.error(err);
        alert("Error: " + err);
    }

    function overrideSubmit(query, callback) {
        const form = document.querySelector(query);
        if (!form) return;
        const method = form.method || "POST";
        form.addEventListener("submit", function (ev) {
            let data = new FormData(form);
            let url = form.action;
            if (method.toUpperCase() === "GET") {
                url += (url.includes("?") ? "&" : "?") +
                    Array.from(data.entries())
                         .map(pair => pair.join("="))
                         .join("&");
                data = null;
            }
            ev.preventDefault();
            fetch(url, { method: method, body: data })
                .then(resp => { if (resp.ok) return resp.text(); else throw resp.status; })
                .then(html => callback(new DOMParser().parseFromString(html, "text/html")))
                .catch(onerror);
        }, true);
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
            }, true);
        }
    }

    function updateArtist(dom) {
        const elem1 = document.querySelector("meta[itemprop='author'] + div");
        if (!elem1) return;
        const isArtist1 = !elem1.lastElementChild.id;
        const elem2 = dom.querySelector("meta[itemprop='author'] + div");
        const isArtist2 = !elem2.lastElementChild.id;
        if (elem2 && isArtist2) {
            elem1.parentElement.insertBefore(elem2, elem1);
        }
        if (isArtist1) {
            elem1.parentElement.removeChild(elem1);
        }
    }

    // multiaction on search page
    if (document.getElementById("multi_add_tags")) {
        const oldBtn = document.getElementById("multi_add_tags");
        const newBtn = document.createElement("input");
        newBtn.type = "button";
        newBtn.value = oldBtn.value;
        newBtn.id = oldBtn.id;
        oldBtn.parentElement.insertBefore(newBtn, oldBtn);
        oldBtn.parentElement.removeChild(oldBtn);

        newBtn.addEventListener("click", function (ev) {
            let data = new FormData();
            data.append("action", "add_tags");
            data.append("text", document.getElementById("multi_tags").value);
            if (!data.get("text")) return;
            Array.from(document.querySelectorAll("#posts input"))
                .filter(checkbox => checkbox.checked)
                .forEach(checkbox => data.append(checkbox.name, checkbox.value));
            fetch("/pictures/multi_action", {body: data, method: "POST"})
                .then(() => AnimePictures.post_list.refresh(window.location, false, false))
                .catch(onerror);
        }, true);
    }

    // on set picture status
    overrideSubmit("form[action^='/pictures/set_post_status/']", function (dom) {
        updateMessage(dom);
        updateElement(dom, "#cont > div > .post_content:first-child"); // post info
        updateElement(dom, ".post_content.moderator > div > div"); // erotic/spoiler/position
        updateStars(dom);
        updateElement(dom, "#big_preview_cont + .post_content"); // favorities
    });
    // on copy tags
    overrideSubmit("form[action^='/pictures/add_tag_from_post/']", function (dom) {
        document.getElementsByName("from_post")[0].value = "";
        updateArtist(dom);
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
        document.getElementsByName("rel_post")[0].value = "";
        updateElement(dom, "#cont .post_content .body + .body"); // linked pictures
    });
    // on unlink picture
    document.addEventListener("click", function (ev) {
        if (ev.target.tagName !== "A" ||
            !ev.target.href.startsWith("https://anime-pictures.net/pictures/del_rel_to_post/")) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        fetch(ev.target.href)
            .then(resp => resp.text())
            .then(html => {
                const dom = new DOMParser().parseFromString(html, "text/html");
                updateElement(dom, "#cont .post_content .body + .body"); // linked pictures
            })
            .catch(onerror);
    }, true);
    // on general page reload
    registerHotkey(
        "refresh page info",
        "Ctrl+R",
        null,
        null,
        () => fetch(window.location.href)
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
                setNumType(document.getElementsByName("redirect_id")[0]);
                // erotic level, presence of spoilers
                updateElement(dom, "#cont .post_content.moderator > div > div");
                // stars
                updateStars(dom);
                // favorited by
                updateElement(dom, "#big_preview_cont + .post_content");
                let el = document.getElementById("favorite_folder_select");
                if (el) el.addEventListener("change", AnimePictures.post.set_favorites);
                // about artist
                updateArtist(dom);
                // comments
                updateElement(dom, "#comments");
                // tags
                updateElement(dom, ".tags");
                // post list
                updateElement(dom, "#posts");
            })
            .catch(onerror),
    );
    // fix field type
    document.head.appendChild(document.createElement("style")).innerHTML =
        "input[type='number']::-webkit-inner-spin-button { display: none; }";
    function setNumType(el) {
        if (!el) return;
        el.setAttribute("type", "number");
        el.setAttribute("pattern", "\\d+");
        if (!el.hasAttribute("placeholder")) {
            el.setAttribute("placeholder", "Source");
        }
        el.style.color = "black";
    }
    setNumType(document.getElementsByName("redirect_id")[0]);
    Array.from(document.getElementsByName("from_post")).forEach(setNumType);
    setNumType(document.getElementsByName("rel_post")[0]);
})();
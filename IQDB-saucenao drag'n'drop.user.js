// ==UserScript==
// @name         IQDB-SauceNAO drag'n'drop
// @namespace    7nik@anime-pictures.net
// @version      1.1.2
// @description  Drag'n'drop support
// @author       7nik
// @match        http://iqdb.org/*
// @match        http://saucenao.com/*
// @grant        none
// ==/UserScript==

(function () {

    const isIQDB = window.location.hostname == "iqdb.org";
    const isSauceNAO = window.location.hostname == "saucenao.com"

    function say(text) {
        let dialog = document.getElementById("dialog");
        if (!dialog) {
            dialog = document.createElement("div");
            dialog.id = "dialog";
            dialog.style.color = "white";
            dialog.style.fontSize = "200%";
            dialog.style.position = "fixed";
            dialog.style.top = "0";
            dialog.style.left = "0";
            dialog.style.margin = "0";
            dialog.style.height = "100%";
            dialog.style.width = "100%";
            dialog.style.display = "flex";
            dialog.style.zIndex = "100";
            dialog.style.background = "rgba(0,0,0,0.75)";
            dialog.innerHTML = `<div style="margin:auto">${text}</div>`;
            document.body.appendChild(dialog);
        }
        if (text) {
            dialog.firstChild.innerHTML = text;
            dialog.style.display = "flex";
        } else {
            dialog.style.display = "none";
        }
    }

    // for IQDB if pic is WebP then redirect to supported format
    if (isIQDB && window.location.href.endsWith(".webp")) {
        window.location.href = window.location.href
            .replace(/(\.jpg|\.jpeg|\.gif|\.png)?\.webp/i, (_,ext)=>ext||".jpg");
    }
    // funcs for SauceNAO
    if (isSauceNAO) {
        window.showHidden = function () {
            document.querySelectorAll("div.hidden img[data-dly='1']").forEach(el => {
                el.setAttribute("src", el.getAttribute("data-src"));
                el.removeAttribute("data-dly");
                el.removeAttribute("data-src");
            });
            document.querySelectorAll("div.hidden")
                .forEach(el => (el.className = el.className.replace("hidden","")));
            document.getElementById("result-hidden-notification").className += " hidden";
        }
        window.togglenao = function () {
            const toggle = (id, css = document.getElementById(id).style) =>
                css.display = (css.display === "none") ? "block" : "none";
            toggle("advanced");
            toggle("nonadvanced");
        }
    }

    // css fix and cetner content
    if (isIQDB) {
        const css = "body{text-align:center;} body>*,form>*{margin-left:auto;margin-right:auto;}ul{display:inline-block}";
        const style = document.createElement("style");
        style.innerHTML = css;
        document.head.appendChild(style);
    } else {
        const css = "#yourimage { margin: 0; } body > div { margin: 0 auto; }";
        const style = document.createElement("style");
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    // saving and restoring results in history
    function savePage() {
        window.history.pushState(
            JSON.stringify(document.body.innerHTML),
            document.title,
            "#localFile");
    }
    window.onpopstate = function (ev) {
        document.body.innerHTML = "";
        const frag = document.createRange().createContextualFragment(JSON.parse(ev.state));
        document.body.appendChild(frag);
        if (isSauceNAO && !window.$) {
            downloadJSAtOnload();
        }
    }
    if (window.history.state) {
        document.body.innerHTML = JSON.parse(window.history.state);
        if (isSauceNAO && !window.$ && window.downloadJSAtOnload) {
            downloadJSAtOnload();
        }
    } else {
        window.history.replaceState(JSON.stringify(document.body.innerHTML), document.title);
    }

    // drag'n'drop
    const dnd = document.createElement("div");
    dnd.id = "dragndrop";
    Object.assign(dnd.style, {
        position: "fixed",
        width: "calc(100% - 60px)",
        margin: "30px",
        bottom: "0",
        top: "0",
        left: "0",
        boxSizing: "border-box",
        display: "flex",
        background: "rgba(128,128,128,0.5)",
        border: "rgba(128,128,128,0.8) 5px solid",
        fontSize: "5em",
        justifyContent: "center",
        textAlign: "center",
        flexDirection: "column",
        opacity: 0,
        transition: "opacity 0.5s",
        pointerEvents: "none",
        zIndex: 11,
    });
    dnd.innerText = "Drag'n'drop files";
    document.body.appendChild(dnd);
    const cont = document.body;
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => cont.addEventListener(
        eventName,
        (ev) => ev.preventDefault() & ev.stopPropagation(),
        false));
    ["dragenter", "dragover"].forEach(eventName => cont.addEventListener(
        eventName,
        () => (document.getElementById("dragndrop").style.opacity = 1),
        false));
    ["dragleave", "drop"].forEach(eventName => cont.addEventListener(
        eventName,
        () => (document.getElementById("dragndrop").style.opacity = 0),
        false));
    cont.addEventListener("drop", function (ev) {
        const file = Array.from(ev.dataTransfer.files).filter(f => f.type.startsWith("image/"))[0];
        if (!file) return;

        if (isIQDB && file.size >= 8388608) {
            alert("Filesize is too big");
            return;
        } else if (isSauceNAO && file.size >= 15728640) {
            alert("Filesize is too big");
            return;
        }

        const form = new FormData(document.forms[0]);
        form.set("file", file);

        say("uploading");
        const xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.hostname == "iqdb.org" ? "/" : "/search.php", true);
        xhr.upload.addEventListener("progress", function(ev) {
            const done = Math.round(ev.loaded / ev.total * 100);
            say(done == 100 ? "processing" : `uploaded ${done}%`);
        }, false);
        xhr.onload = function() {
            if (xhr.status == 200) {
                if (isIQDB) {
                    const dom = new DOMParser().parseFromString(xhr.responseText, "text/html");
                    const h1 = dom.querySelector("body > h1");
                    const form = document.querySelector("body > form");
                    while (form.previousElementSibling.nodeName != "H1") {
                        document.body.removeChild(form.previousElementSibling);
                    }
                    while (h1.nextElementSibling.nodeName != "FORM") {
                        document.body.insertBefore(h1.nextElementSibling, form);
                    }
                } else {
                    const frag = document.createRange().createContextualFragment(xhr.responseText);
                    document.body.innerHTML = "";
                    document.body.appendChild(frag);
                    if (!window.$) downloadJSAtOnload();
                }
            }
            say("");
            savePage();
        };
        xhr.send(form);
    }, false);
})()
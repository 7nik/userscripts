// ==UserScript==
// @name         IQDB-SauceNAO drag'n'drop
// @namespace    7nik@anime-pictures.net
// @version      1.2
// @description  Drag'n'drop support
// @author       7nik
// @match        http://iqdb.org/*
// @match        http://saucenao.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {

    const isIQDB = window.location.hostname == "iqdb.org";
    const isSauceNAO = window.location.hostname == "saucenao.com";

    GM_addStyle(`
        #dialog {
            color: white;
            font-size: 200%;
            position: fixed;
            top: 0%;
            left: 0%;
            margin: 0;
            height: 100%;
            width: 100%;
            display: flex;
            z-index: 100;
            background: rgba(0,0,0,0.75);
        }
        #dialog div {
            margin: auto;
        }
        #dialog.wait div::after {
            content: "";
            display: inline-block;
            width: 20px;
            text-align: left;
            animation: 3s infinite dots;
        }
        @keyframes dots {
            0%  { content: "   "; }
            25%  { content: ".  "; }
            50% { content: ".. "; }
            75% { content: "..."; }
        }

        #dragndrop {
            position: fixed;
            width: calc(100% - 60px);
            margin: 30px;
            bottom: 0;
            top: 0;
            left: 0;
            box-sizing: border-box;
            display: flex;
            background: rgba(128,128,128,0.5);
            border: rgba(128,128,128,0.8) 5px solid;
            font-size: 5em;
            justify-content: center;
            text-align: center;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.5s;
            pointer-events: none;
            z-index: 11;
        }
    `);
    function say(text, wait = false) {
        let dialog = document.getElementById("dialog");
        if (!dialog) {
            dialog = document.createElement("div");
            dialog.id = "dialog";
            dialog.innerHTML = `<div>${text}</div>`;
            document.body.appendChild(dialog);
        }
        if (text) {
            dialog.firstChild.innerHTML = text;
            dialog.style.display = "flex";
        } else {
            dialog.style.display = "none";
        }
        if (wait) {
            dialog.classList.add("wait");
        } else {
            dialog.classList.remove("wait");
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
                .forEach(el => (el.classList.remove("hidden")));
            document.getElementById("result-hidden-notification").classList.add("hidden");
        };
        window.togglenao = function () {
            const toggle = (id, css = document.getElementById(id).style) =>
                css.display = (css.display === "none") ? "block" : "none";
            toggle("advanced");
            toggle("nonadvanced");
        };
    }

    // css fix and cetner content
    if (isIQDB) {
        GM_addStyle("body{text-align:center;} body>*,form>*{margin-left:auto;margin-right:auto;} ul{display:inline-block}");
    } else {
        GM_addStyle("body{text-align:center;} body>div{margin: 0 auto;}");
    }

    // saving and restoring results in history
    function savePage() {
        window.history.pushState(
            JSON.stringify(document.body.innerHTML),
            document.title,
            "#localFile");
    }
    window.addEventListener("popstate", function (ev) {
        document.body.innerHTML = "";
        document.body.appendChild(
            document.createRange().createContextualFragment(
                JSON.parse(ev.state)
            )
        );
        if (isSauceNAO && !window.$) {
            downloadJSAtOnload();
        }
    });

    function sendFile(file) {
        if (!file) return;

        if (isIQDB && file.size < 8388608 || isSauceNAO && file.size < 15728640) {
            uploadFile(file);
            return;
        }

        say("donwsizing", true);
        const img = new Image();
        img.onload = function() {
            let height = img.naturalHeight || img.offsetHeight || img.height,
                width = img.naturalWidth || img.offsetWidth || img.width;

            const canvas = document.createElement("canvas"),
                context = canvas.getContext && canvas.getContext("2d");
            [width, height] = width >= height ? [1000, height/width * 1000] : [width/height * 1000, 1000];

            canvas.height = height;
            canvas.width = width;
            context.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                uploadFile(new File([blob], file.name));
            }, "image/jpeg", 1);
        };
        img.src = URL.createObjectURL(file);
    }

    function uploadFile(file){
        const form = new FormData(document.forms[0]);
        form.set("file", file);

        say("uploading", true);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", isIQDB ? "/" : "/search.php");
        xhr.upload.addEventListener("progress", function(ev) {
            const done = Math.round(ev.loaded / ev.total * 100);
            if (done == 100) {
                say("processing", true);
            } else {
                say(`uploaded ${done}%`);
            }
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
                    document.body.innerHTML = null;
                    document.body.appendChild(
                        document.createRange().createContextualFragment(
                            xhr.responseText
                        )
                    );
                    if (!window.$) downloadJSAtOnload();
                    document.body.appendChild(dnd);
                }
            }
            say(null);
            savePage();
        };
        xhr.send(form);
    }

    // drag'n'drop
    const dnd = document.createElement("div");
    dnd.id = "dragndrop";
    dnd.innerText = "Drag'n'drop files";

    document.addEventListener("DOMContentLoaded", function () {
        if (isSauceNAO) {
            document.querySelector("link").href = "/css/saucenao-new.css";
        }

        if (window.history.state) {
            document.body.innerHTML = JSON.parse(window.history.state);
            if (isSauceNAO && !window.$ && window.downloadJSAtOnload) {
                downloadJSAtOnload();
            }
        } else {
            window.history.replaceState(JSON.stringify(document.body.innerHTML), document.title);
        }

        if (!document.getElementById("dragndrop")) document.body.appendChild(dnd);
        ["dragenter", "dragover"].forEach(eventName => document.body.addEventListener(
            eventName,
            (ev) => {
                document.getElementById("dragndrop").style.opacity = 1;
                ev.preventDefault();
                ev.stopPropagation();
            },
            false));
        ["dragleave", "drop"].forEach(eventName => document.body.addEventListener(
            eventName,
            (ev) => {
                document.getElementById("dragndrop").style.opacity = 0;
                ev.preventDefault();
                ev.stopPropagation();
            },
            false));
        document.body.addEventListener(
            "drop",
            (ev) => sendFile(Array.from(ev.dataTransfer.files)
                                  .filter(f => f.type.startsWith("image/"))[0]),
            true);
        document.body.addEventListener(
            "submit",
            (ev) => {
                sendFile(ev.target.elements.file.files[0]);
                ev.preventDefault();
                ev.stopPropagation();
            },
            true);
    });

})();
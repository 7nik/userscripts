// ==UserScript==
// @name         IQDB-saucenao drag'n'drop
// @namespace    7nik@anime-pictures.net
// @version      1.0
// @description  try to take over the world!
// @author       7nik
// @match        http://iqdb.org/*
// @match        http://saucenao.com/*
// @grant        none
// ==/UserScript==

(function () {

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
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => cont.addEventListener(eventName, (e) => e.preventDefault() & e.stopPropagation(), false));
    ["dragenter", "dragover"].forEach(eventName => cont.addEventListener(eventName, () => (dnd.style.opacity = 1), false));
    ["dragleave", "drop"].forEach(eventName => cont.addEventListener(eventName, () => (dnd.style.opacity = 0), false));
    cont.addEventListener("drop", function (e) {
        const file = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"))[0];
        if (!file) return;
        if (file.size >= 8388608) {
            alert("Filesize is too big");
            return;
        }

        const form = new FormData();
        if (window.location.hostname == "iqdb.org") {
            form.append("file", file);
            if (document.getElementsByName("forcegray")[0].checked) {
                form.append("forcegray", "1");
            }
            document.getElementsByName("service[]").forEach((el) => form.append("service[]", el.value));
        } else {
            form.append("file", file);
            form.append("frame", document.getElementsByName("frame").value);
            form.append("hide", document.getElementsByName("hide").value);
            form.append("database", document.getElementsByName("database").value);
        }

        say("uploading");
        const xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.hostname == "iqdb.org" ? "/" : "/search.php", true);
        xhr.upload.addEventListener("progress", function(e) {
            let done = Math.round(e.loaded / e.total * 100);
            say(done == 100 ? "processing" : `uploaded ${done}%`);
        }, false);
        xhr.onload = function() {
            console.log(xhr);
            if (xhr.status == 200) {
                if (window.location.hostname == "iqdb.org") {
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
        };
        xhr.send(form);
    }, false);
})()
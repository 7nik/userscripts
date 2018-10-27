// ==UserScript==
// @name         AP uploader
// @namespace    7nik@anime-pictures.net
// @version      1.0
// @description  Uploading without reloading the page + drag'n'drop.
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_add_wall*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TEXT = (window.lang == "ru") ?
          {
              reading: "Открытие",
              pending: "Ожидание",
              noSlots: "Нет свободных слотов",
              bigFile: "Файл слишком большой",
              processing: "Обработка",
              dublicate: "Дубликат",
              netError: "Ошибка сети",
              uploading: "Загрузка",
              dragndrop: "Перетащите файлы",
              fileLabel: "Выберите или перещати файлы сюда",
              slots: (n1, n2) => `У вас <span id="usedSlots">${n1}</span> ${n1>11&&n1<20||(n1%10)>4||(n1%10)==0 ? "непроверенных изображний" : (n1%10)==1 ? "непроверенное изображние" : "непроверенных изображния"}, вы можете загрузить ещё <span id="freeSlots">${n2}</span>.`,
          } : {
              reading: "Reading",
              pending: "Pending",
              noSlots: "No free slots",
              bigFile: "File is too big",
              processing: "Processing",
              dublicate: "Dublicate",
              netError: "Network error",
              uploading: "Uploading",
              fileLabel: "Choose files or drag'n'drop them",
              dragndrop: "Drag'n'drop files",
              slots: (n1, n2) => `You have <span id="usedSlots">${n1}</span> unproven ${n1>1 ? "pictures" : "picture"} you can still upload <span id="freeSlots">${n2}</span>.`,
          };

    class Post {
        constructor(file) {
            this.file = file;
            this.post = document.createElement("span");
            this.post.className = "img_block_big";
            this.post.style.boxSizing = "border-box";
            this.post.innerHTML = `
<a>
  <canvas class='img_sp' style='max-height:100%;max-width:100%;' />
</a>
<div class='img_block_text' style='background:rgba(128,128,128,0.7);color:white;visibility:1'>
  <strong></strong>
  <br>
  <span>${TEXT.reading}</span>
  <div style='width:100%;height:100%;position:absolute;bottom:0;z-index:-1;'></div>
</div>`;
            posts.appendChild(this.post);
            this._color = {r: 128, g: 128, b: 128};
            this._status = this.getEl("span");
            this._prog1 = this.getEl(".img_block_text");
            this._prog2 = this.getEl("div > div");
            previewer.run(this);
            uploader.run(this);
        }

        getEl(sel) {
            return this.post.querySelector(sel);
        }

        set color(c) {
            this._color = c;
            this.getEl("canvas").style.borderColor = `rgb(${c.r},${c.g},${c.b})`;
            this.getEl("canvas").style.boxShadow = `0 0 20px rgb(${c.r},${c.g},${c.b})`;
            this._prog1.style.background = `rgba(${c.r},${c.g},${c.b},0.7)`;
            this._prog1.style.color = (c.r + c.g + c.b) > 128*3 ? "black" : "white";
        }
        get status() {
            return this._status.innerText;
        }
        set error(str) {
            this.status = str;
            this._status.style.color = "red";
            this.post.style.border = "red 2px solid";
        }
        set status(str) {
            this._status.innerText = str;
        }
        set imgDim(str) {
            this.getEl("strong").innerText = str;
        }
        set url(url) {
            this.getEl("a").setAttribute("href", url);
        }
        set progress(num) {
            num = Math.floor(Math.min(100, Math.max(0, num)));
            this._prog1.style.background = `linear-gradient(to right, transparent ${num}%, rgba(${this._color.r},${this._color.g},${this._color.b}, 0.7) ${num}%)`;
			this._prog2.style.background = `linear-gradient(to right, rgba(0,150,0,0.7) ${num}%, transparent ${num}%)`;
        }
    }

    const previewer = {
        _order: [],
        _working: false,

        run: function(post) {
            const self = this;
            if (self._working) {
                if (post) self._order.push(post);
                return;
            }
            let p = post || self._order.shift();
            if (!p) return;
            self._working = true;

            let img = new Image();
            img.onload = function() {
                let height = img.naturalHeight || img.offsetHeight || img.height,
                    width = img.naturalWidth || img.offsetWidth || img.width;
                p.imgDim = `${width}x${height}`;
                if (p.status == TEXT.reading) p.status = TEXT.pending;

                let canvas = p.getEl("canvas"),
                    context = canvas.getContext && canvas.getContext("2d");
                [width, height] = width >= height ? [300, height/width * 300] : [width/height * 300, 300];

                canvas.height = height;
                canvas.width = width;
                context.drawImage(img, 0, 0, width, height);

                let data, rgb = {r:0,g:0,b:0}, count = 0;

                data = context.getImageData(0, 0, width, height).data;
                for (let i = 0, len = data.length; i < len; i += 4, count++) {
                    rgb.r += data[i];
                    rgb.g += data[i+1];
                    rgb.b += data[i+2];
                }
                rgb.r = Math.floor(rgb.r/count);
                rgb.g = Math.floor(rgb.g/count);
                rgb.b = Math.floor(rgb.b/count);

                p.color = rgb;

                canvas = context = data = null;

                self._working = false;
                self.run();
            };
            img.src = URL.createObjectURL(p.file);
        },
    }

    const uploader = {
        _order: [],
        _working: false,
        _totalSlots: document.querySelector(".post_content .body").firstChild.textContent.match(/\d+/g).reduce((s,n) => +s + +n),
        _freeSlots: +document.querySelector(".post_content .body").firstChild.textContent.match(/(\d+)\./)[1],

        run: function(post) {
            const self = this;
            if (self._working) {
                if (post) self._order.push(post);
                return;
            }
            let p = post || self._order.shift();
            if (!p) return;
            self._working = true;

            if (self._freeSlots <= 0) {
                p.error = TEXT.noSlots;
                self._working = false;
                self.run();
                return;
            }

            if (p.file.size >= 50*1024*1024) {
                p.error = TEXT.bigFile;
                self._working = false;
                self.run();
                return;
            }

            let xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(e) {
                p.progress = (e.loaded / e.total * 100);
                if (e.loaded == e.total) p.status = TEXT.processing;
            }, false);
            xhr.onload = function(e) {
                if (xhr.status == 200) {
                    let cont = document.createRange().createContextualFragment(xhr.responseText).querySelector(".post_content");
                    p.url = cont.querySelector("a").href;
                    if (cont.querySelector(".body span[style='color: red;']")) {
                        p.error = TEXT.dublicate;
                    } else if (cont.querySelector("form span[style='color: red;']")) {
                        p.error = TEXT.noSlots;
                        self._freeSlots = 0;
                        document.getElementById("usedSlots").innerText = self._totalSlots - self._freeSlots;
                        document.getElementById("freeSlots").innerText = self._freeSlots;
                    } else {
                        p.status = cont.querySelector(".img_block_text").lastChild.textContent;
                        self._freeSlots--;
                        document.getElementById("usedSlots").innerText = self._totalSlots - self._freeSlots;
                        document.getElementById("freeSlots").innerText = self._freeSlots;
                    }
                } else {
                    p.error = TEXT.netError;
                }
                p.progress = 0;
                setTimeout(() => {
                    self._working = false;
                    self.run();
                }, 200);
            };
            xhr.open("POST", "/pictures/view_add_wall", true);
            let form = new FormData();
            form.append("file0", p.file);
            xhr.send(form);
            p.status = TEXT.uploading;
        },
    }

    // replace "You have # unproven pictures you can still upload #." with editable version.
    let b = document.querySelector(".post_content .body");
    b.removeChild(b.firstChild);
    let s = document.createElement("span");
    s.innerHTML = TEXT.slots(uploader._totalSlots - uploader._freeSlots, uploader._freeSlots);
    b.insertBefore(s, b.firstChild);

    // replace old form with new one
    let posts = document.createElement("div");
    posts.id = "posts";
    posts.className = "posts_block";
    let fileField = document.createElement("input");
    fileField.id = "mfiles";
    fileField.type = "file";
    fileField.multiple = true;
    fileField.accept = "image/*";
    fileField.addEventListener("change", function () { Array.from(this.files).forEach(file => new Post(file)); });
    fileField.style.display = "none";
    let ffLabel = document.createElement("label");
    ffLabel.setAttribute("for", "mfiles");
    ffLabel.style.cursor = "pointer";
    ffLabel.style.textDecoration = "underline";
    ffLabel.innerText = TEXT.fileLabel;
    document.forms[1].style.display = "none";
    document.forms[1].parentElement.appendChild(document.createElement("br"));
    document.forms[1].parentElement.appendChild(fileField);
    document.forms[1].parentElement.appendChild(ffLabel);
    document.getElementById("cont").appendChild(posts);

    // drag'n'drop
    let dnd = document.createElement("div");
    dnd.id = "dragndrop";
    Object.assign(dnd.style, {
        position: "fixed",
        width: "calc(100% - 360px)",
        margin: "30px",
        bottom: "0",
        top: "46px",
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
    });
    dnd.innerText = TEXT.dragndrop;
    document.body.appendChild(dnd);
    document.addEventListener("scroll", function (e) {
        dnd.style.top = Math.max(0, 46 - window.scrollY) + "px";
        dnd.style.bottom = Math.max(0, window.scrollY + window.innerHeight - document.body.scrollHeight + 120) + "px";
    }, false);
    let cont = document.getElementById("content");
    cont.style.minHeight = document.getElementById("body_wrapper").offsetHeight - 10 + "px";
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => cont.addEventListener(eventName, (e) => e.preventDefault() & e.stopPropagation(), false));
    ["dragenter", "dragover"].forEach(eventName => cont.addEventListener(eventName, () => (dnd.style.opacity = 1), false));
    ["dragleave", "drop"].forEach(eventName => cont.addEventListener(eventName, () => (dnd.style.opacity = 0), false));
    cont.addEventListener('drop', (e) => Array.from(e.dataTransfer.files).forEach(file => { if (file.type.startsWith("image/")) new Post(file); }), false);

    // warn about leaving the page during uploading
    window.onbeforeunload = () => uploader._working ? true : null;

})();

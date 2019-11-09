// ==UserScript==
// @name         AP uploader
// @namespace    7nik@anime-pictures.net
// @version      1.1.5
// @description  Uploading without reloading the page + drag'n'drop.
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_add_wall*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.head.appendChild(document.createElement("style")).innerHTML =
`
#posts .img_block_big {
    box-sizing: border-box;
}
#posts .img_block_big .img_sp {
    max-height: 100%;
    max-width: 100%;
}
#posts .img_block_big .img_block_text {
    background:rgba(128,128,128,0.7);
    color:white;
}
#posts .img_block_big .img_block_text div {
    width: 100%;
    height: 100%;
    position: absolute;
    bottom: 0;
    z-index: -1;
}
#posts .img_block_big.error {
    border: red 2px solid;
}
#posts .img_block_big.error span {
    color: red;
}
`;

    const TEXT = (window.lang == "ru") ?
        {
            reading: "Открытие",
            pending: "Ожидание",
            noSlots: "Нет свободных слотов",
            bigFile: "Файл слишком большой",
            smallDimension: "Разрешение слишком маленькое",
            processing: "Обработка",
            dublicate: "Дубликат",
            netError: "Ошибка сети",
            uploading: "Загрузка",
            dragndrop: "Перетащите файлы",
            fileLabel: "Выберите или перещати файлы сюда",
            statuses: {"-2": "ПРЕ", 0: "НОВАЯ", 1: "", 2: "ЗАБАНЕНА"},
            interrupted: "Прервано",
            plural: function (n, plurals) {
                if (n>=11&&n<20||(n%10)>4||(n%10)==0) {
                    return plurals[2];
                } else if ((n%10)==1) {
                    return plurals[0];
                } else {
                    return plurals[1];
                }
            },
            slots: function (used, free) {
                const npics = TEXT.plural(
                    used,
                    ["непроверенное изображние",
                     "непроверенных изображния",
                     "непроверенных изображний"]
                 );
                return `У вас ${used} ${npics}, вы можете загрузить ещё ${free}.`;
            },
        } : {
            reading: "Reading",
            pending: "Pending",
            noSlots: "No free slots",
            bigFile: "File is too big",
            smallDimension: "Dimension is too small",
            processing: "Processing",
            dublicate: "Dublicate",
            netError: "Network error",
            uploading: "Uploading",
            fileLabel: "Choose files or drag'n'drop them",
            dragndrop: "Drag'n'drop files",
            statuses: {"-2": "PRE", 0: "NEW", 1: "", 2: "BAN"},
            interrupted: "Interrupted",
            plural: function (n, plurals) {
                return  n == 1 ? plurals[0] : plurals[1];
            },
            slots: function (used, free) {
                const npics = TEXT.plural(used, ["picture", "pictures"]);
                return `You have ${used} unproven ${npics} you can still upload ${free}.`;
            },
        };

    const toRGBA = ({r, g, b, a:_a = 1}, a = _a) => `rgba(${r},${g},${b},${a})`;
    const toContrastColor = ({r, g, b}) => (r+g+b) > 128*3 ? "black" : "white";

    class Post {
        constructor(file, postContainer) {
            this.id = Post.maxID = (Post.maxID || 0) + 1;
            this._filename = file.name;
            this._color = {r: 128, g: 128, b: 128};
            this._status = TEXT.reading;

            this.file = file;
            this.post = document.createElement("span");
            this.post.className = "img_block_big";
            this.post.innerHTML =
                `<a target="_blank">
                  <canvas class="img_sp" title="${this._filename}" alt="${this._filename}"/>
                </a>
                <div class="img_block_text">
                  <strong></strong>
                  <br>
                  <span>${this._status}</span>
                  <div></div>
                </div>`;
            postContainer.appendChild(this.post);
            this._statSpan = this.getEl("span");
            this._prog1 = this.getEl(".img_block_text");
            this._prog2 = this.getEl("div > div");
            previewer.run(this);
            // uploader.run(this);
            this.save();
        }

        save() {
            const post = {};
            ["id", "_filename", "_color", "_status", "_error", "_link", "_imgDim", "_preview"]
                .forEach(k => this[k] ? post[k] = this[k] : false);
            const state = (history.state || []);
            const pos = state.findIndex(p => p.id === post.id);
            if (pos < 0) {
                state.push(post);
            } else {
                state.splice(pos, 1, post);
            }
            history.replaceState(state, null);
        }

        getEl(sel) {
            return this.post.querySelector(sel);
        }

        get color() {return this._color;}
        set color(c) {
            this._color = c;
            this.getEl("canvas").style.borderColor = toRGBA(c, 1);
            this.getEl("canvas").style.boxShadow = "0 0 20px " + toRGBA(c, 1);
            this._prog1.style.background = toRGBA(c, 0.7);
            this._prog1.style.color = toContrastColor(c);
            this.save();
        }
        get preview() {return this._preview;}
        set preview(pr) {
            this._preview = pr;
            this.save();
        }
        get status() {return this._status;}
        set status(str) {
            this._statSpan.innerText = this._status = str;
            this.save();
        }
        get error() {return this._error;}
        set error(str) {
            this._error = true;
            this.post.classList.add("error");
            this.status = str;
        }
        get imgDim() {return this._imgDim;}
        set imgDim(str) {
            this.getEl("strong").innerText = this._imgDim = str;
            this.save();
        }
        get url() {return this._link;}
        set url(url) {
            this._link = url;
            this.getEl("a").setAttribute("href", url);
        }
        get progress() {
            return +(this._prog1.style.background.match(/\d+/) || ["0"])[0];
        }
        set progress(num) {
            num = Math.floor(Math.min(100, Math.max(0, num)));
            this._prog1.style.background = `linear-gradient(to right, transparent ${num}%, ${toRGBA(this._color, 0.7)} ${num}%)`;
			this._prog2.style.background = `linear-gradient(to right, rgba(0,150,0,0.7) ${num}%, transparent ${num}%)`;
        }

        static async restore(p, postContainer) {
            Post.maxID = Math.max(Post.maxID||0, p.id);
            const postInfo = !p._link ? null
                : await fetch(p._link + "&type=json").then(resp => resp.json());
            if (!p._error) {
                p._status = postInfo ? TEXT.statuses[postInfo.status] : TEXT.interrupted;
            }

            const bgcolor = toRGBA(p._color,0.7);
            const color = toContrastColor(p._color);
            const post = document.createElement("span");
            post.className = p._error ? "img_block_big error" : "img_block_big";
            post.innerHTML =
                `<a target="_blank" href="${p._link || ""}">
                  <img class="img_sp"
                       src=${postInfo ? postInfo.medium_preview : p._preview || ""}
                       title="${p._filename}"
                       alt="${p._filename}"
                   />
                </a>
                <div class="img_block_text"
                     style="background:${bgcolor}; color:${color}">
                  <strong>${p._imgDim || ""}</strong>
                  ${p._status ? `<br><span>${p._status}</span>` : ""}
                </div>`;
            postContainer.appendChild(post);
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
            const p = post || self._order.shift();
            if (!p) return;
            self._working = true;

            const img = new Image();
            img.onload = function() {
                let height = img.naturalHeight || img.offsetHeight || img.height,
                    width = img.naturalWidth || img.offsetWidth || img.width;
                p.imgDim = `${width}x${height}`;
                if (p.status == TEXT.reading) p.status = TEXT.pending;

                const canvas = p.getEl("canvas"),
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
                p.preview = canvas.toDataURL("image/jpeg", 0.8);

                uploader.run(p);

                self._working = false;
                self.run();
            };
            img.src = URL.createObjectURL(p.file);
        },
    };

    const uploader = {
        _order: [],
        _working: false,
        _totalSlots: document.querySelector(".post_content .body").firstElementChild.textContent.match(/\d+/g).reduce((s,n) => +s + +n),
        _freeSlots: +document.querySelector(".post_content .body").firstElementChild.textContent.match(/(\d+)\./)[1],

        run: function(post) {
            const self = this;
            if (self._working) {
                if (post) self._order.push(post);
                return;
            }
            const p = post || self._order.shift();
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

            if (p.imgDim.match(/\d+/g).every(size => +size < 800)) {
                p.error = TEXT.smallDimension;
                self._working = false;
                self.run();
                return;
            }

            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(ev) {
                p.progress = (ev.loaded / ev.total * 100);
                if (ev.loaded == ev.total) p.status = TEXT.processing;
            }, false);
            xhr.onload = function(ev) {
                if (xhr.status == 200) {
                    const cont = document.createRange()
                        .createContextualFragment(xhr.responseText)
                        .querySelector(".post_content");
                    if (cont.querySelector(".body span[style='color: red;'] ~ .img_block2")) {
                        p.error = TEXT.dublicate;
                        p.url = cont.querySelector("a").href;
                        p.preview = cont.querySelector("img").src;
                    } else if (cont.querySelector("form span[style='color: red;']")) {
                        p.error = TEXT.noSlots;
                        self._freeSlots = 0;
                        document.getElementById("slot_status").innerText =
                            TEXT.slots(self._totalSlots - self._freeSlots, self._freeSlots);
                    } else {
                        p.status = cont.querySelector(".img_block_text").lastChild.textContent;
                        p.url = cont.querySelector("a").href;
                        p.preview = cont.querySelector("img").src;
                        self._freeSlots--;
                        document.getElementById("slot_status").innerText =
                            TEXT.slots(self._totalSlots - self._freeSlots, self._freeSlots);
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
            const form = new FormData();
            form.append("file0", p.file);
            xhr.send(form);
            p.status = TEXT.uploading;
        },
    };

    // replace "You have # unproven pictures you can still upload #." with editable version.
    const b = document.querySelector(".post_content .body");
    b.removeChild(b.firstElementChild);
    const s = document.createElement("span");
    s.id = "slot_status";
    s.innerHTML = TEXT.slots(uploader._totalSlots - uploader._freeSlots, uploader._freeSlots);
    b.insertBefore(s, b.firstChild);

    // replace old form with new one
    const posts = document.createElement("div");
    posts.id = "posts";
    posts.className = "posts_block";
    const fileField = document.createElement("input");
    fileField.id = "mfiles";
    fileField.type = "file";
    fileField.multiple = true;
    fileField.accept = "image/*";
    fileField.addEventListener("change", function () {
        Array.from(this.files).forEach(file => new Post(file, posts));
    });
    fileField.style.display = "none";
    const ffLabel = document.createElement("label");
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
    const dnd = document.createElement("div");
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
    document.addEventListener("scroll", function (ev) {
        dnd.style.top = Math.max(0, 46 - window.scrollY) + "px";
        dnd.style.bottom = Math.max(0, window.scrollY + window.innerHeight - document.body.scrollHeight + 120) + "px";
    }, false);
    const cont = document.getElementById("content");
    cont.style.minHeight = document.getElementById("body_wrapper").offsetHeight - 10 + "px";
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => cont.addEventListener(
        eventName,
        (ev) => {ev.preventDefault(); ev.stopPropagation();},
        false
    ));
    ["dragenter", "dragover"].forEach(eventName => cont.addEventListener(
        eventName,
        (ev) => {dnd.style.opacity = 1;},
        false
    ));
    ["dragleave", "drop"].forEach(eventName => cont.addEventListener(
        eventName,
        (ev) => {dnd.style.opacity = 0;},
        false
    ));
    cont.addEventListener(
        "drop",
        (ev) => Array.from(ev.dataTransfer.files).forEach(file => {
            if (file.type.startsWith("image/")) new Post(file, posts);
        }),
        false
    );

    // warn about leaving the page during uploading
    window.onbeforeunload = () => uploader._working ? true : null;

    // restore posts
    window.addEventListener("popstate", async function (ev) {
        if (!ev.state || !history.state.length) return;
        for (let post of history.state) {
            await Post.restore(post, posts);
        }
    });
    if (history.state && history.state.length) {
        (async () => {
            for (let post of history.state) {
                await Post.restore(post, posts);
            }
        })();
    }

})();

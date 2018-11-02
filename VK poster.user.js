// ==UserScript==
// @name         VK poster
// @namespace    7nik@anime-pictures.net
// @version      1.0.1
// @description  Make a post with a picture in vk.com/mjvart
// @author       7nik
// @match        https://anime-pictures.net/pictures/view_post/*
// @grant        GM_xmlhttpRequest
// @connect      ip1.anime-pictures.net
// @connect      cdn.anime-pictures.net
// @connect      pu.vk.com
// ==/UserScript==

/* global VK AnimePictures */

const SETTIGNS = {

    // ========== USER SETTINGS ==========

    mainMessage: (post) => (post.artists.length == 1 ? "Художник " : post.artists.length > 1 ? "Художник " : "")
                + post.artists.join(", ") + " 「хорошее качество ↓\n"
                + post.postUrl,
    bonusMessages: [
        "anime-pictures.net/android_app - наше удобное андроид приложение для просмотра аниме картинок",
        "anime-pictures.net/android_app - наше мобильное приложение для сёрфинга по сотням аниме картинок",
        "anime-pictures.net/android_app - андроид приложение для просмотра и скачивания картинок в HD",
        "Ищите классные аниме картинки? Заходите на сайт anime-pictures.net Так же доступно приложение для андроида anime-pictures.net/android_app",
        "Ещё больше на сайте anime-pictures.net и в андроид приложении anime-pictures.net/android_app",
        "Наше мобильное приложение для картинок anime-pictures.net/android_app",
        "Больше картинок в вашем мобильном в приложении anime-pictures.net/android_app",
        "Скачивать и смотреть картинки в HD на андроиде можно через наше приложение anime-pictures.net/android_app это бесплатно и без рекламы",
        "У нас доступно мобильное приложение для картинок anime-pictures.net/android_app",
        "Ищите классные аниме картинки? Заходите на сайт anime-pictures.net Так же доступно приложение для андроида anime-pictures.net/android_app",
        "Лучший источник новых картинок anime-pictures.net и андроид приложение anime-pictures.net/android_app",
        "Пополняйте ваши коллекции в нашем приложении anime-pictures.net/android_app",
        "Смотрите больше картинок на сайте anime-pictures.net и в мобильном приложении anime-pictures.net/android_app",
        "Скачивайте наше мобильное приложение по ссылке anime-pictures.net/android_app что бы смотреть картинки в HD где угодно",
    ],
    bonusMessageOdds: 1/5, // add bounes message into, in average, 1 of 5 posts
    signedPost: 1, // 1 - yes, 0 - no
    stepTime: 60, // minutes; value added to date of the last post to schedule next one
    stepTimeDeviation: 15, // minutes; max deviaion of stepTime; 0 - no randomization
    dayStarts: 5, // "day" starts at 05:00
    dayEnds: 1, // "day" ends at 01:00
    hotkey: "À", // `

    // ========== SYSTEM SETTINGS ==========

    APP_ID: "6733020",
    gid: 15035509,
    vkApiVersion: "5.87",
};

const TEXT = ((langs, lang, def) => langs[lang] || langs[def])({
    "en": {
        plural: (n, plurals) => n == 1 ? plurals[0] : plurals[1],
        monthes: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        days: ["day", "days"],
        hours: ["hour", "hours"],
        minutes: ["minute", "minutes"],
        today: "today",
        tomorrow: "tomorrow",
        beforeLastPost: "before the last post",
        afterLastPost: "after the last post",
        after: "",
        postMakerTitle: "Making a post for VK",
        schedulePost: "schedule the post",
        preparing: "Preparing",
        publishPost: "Publish post",
        alt: "Post this picture in VK",
        error: "Error happens: ",
        err15: "You do not have group administrator rights!",
    },
    "ru": {
        plural: (n, plurals) => n>=11&&n<20||(n%10)>4||(n%10)==0 ? plurals[2] : (n%10)==1 ? plurals[0] : plurals[1],
        monthes: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        days: ["день", "дня", "дней"],
        hours: ["час", "часа", "часов"],
        minutes: ["минуту", "минуты", "минут"],
        today: "сегодня",
        tomorrow: "завтра",
        beforeLastPost: "перед посл. постом",
        afterLastPost: " после посл. поста",
        after: "через",
        postMakerTitle: "Создание поста для Вконтакте",
        schedulePost: "отложенная запись",
        preparing: "Подготовка",
        publishPost: "Опубликовать пост",
        alt: "Сделать пост в ВК с этой картинкой",
        error: "Произошла ошибка: ",
        err15: "У вас нет прав администратора группы!",
    }
}, window.location.search.match(/(lang=(\w\w))/)[2], "en");

(function() {

    const log = (...args) => console.log(...args);
    // promise version of VK.api
    function VKapi(method, options) {
        options.v = SETTIGNS.vkApiVersion;
        return new Promise(function (resolve, reject) {
            VK.api(method, options, function (response) {
                if (response.error) {
                    log(response);
                    if (response.error.error_code == 15) {
                        alert(TEXT.err15);
                    } else if (response.error.error_code == 17) {
                        const a = document.createElement("a");
                        a.target = "_blank";
                        a.href = response.error.redirect_uri;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } else {
                        alert(TEXT.error + response.error.error_msg);
                    }
                    reject(response);
                    (form => form&&form.click())(document.getElementById("post_maker"));
                } else {
                    resolve(response.response);
                }
            })
        });
    }
    // promise version of GM_xmlhttpRequest
    function GM_XHR(options) {
        return new Promise(function (resolve, reject) {
            options.onload = (xhr) => resolve(xhr);
            options.onerror = (xhr) => reject(xhr);
            GM_xmlhttpRequest(options);
        })
    }
    // initialization
    unsafeWindow.vkAsyncInit = function() {
        log("start initing");
        VK.init({
            apiId: SETTIGNS.APP_ID
        });
        VK.Auth.getLoginStatus(function(response) {
            if (response.session) {
                log("logined");
            } else {
                VK.Auth.login(function(response) {
                    log("new login");
                }, 4+8192); // photo + wall
            }
        });
        const a = document.createElement("a");
        a.href = "#";
        a.alt = SETTIGNS.alt;
        a.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 192 192">
                <path fill="${unsafeWindow.site_theme == "second" ? "white" : "black"}" d="M66.56,0 C120.32,0 71.68,0 125.44,0 C179.2,0 192,12.8 192,66.56 C192,120.32 192,71.68 192,125.44 C192,179.2 179.2,192 125.44,192 C71.68,192 120.32,192 66.56,192 C12.8,192 0,179.2 0,125.44 C0,71.68 0,96.580329 0,66.56 C0,12.8 12.8,0 66.56,0 M157.233993,66.1462211 C158.123557,63.1797719 157.233994,61 153.000244,61 L139.000244,61 C135.440505,61 133.799415,62.8830035 132.909356,64.9593945 C132.909356,64.9593945 125.789878,82.3129373 115.704198,93.5851974 C112.441227,96.8481681 110.957879,97.8863636 109.178009,97.8863636 C108.288198,97.8863636 107,96.8481681 107,93.8819658 L107,66.1462211 C107,62.586482 105.96694,61 103.000244,61 L81.0002441,61 C78.7757158,61 77.4378669,62.6521562 77.4378669,64.2179674 C77.4378669,67.5925348 82.4804603,68.3707494 83.0002441,77.8633869 L83.0002441,98.4799003 C83.0002441,103 82.1839388,103.819509 80.4040693,103.819509 C75.6579974,103.819509 64.1131647,86.388441 57.2660122,66.4427426 C55.9241353,62.5659897 54.5782535,61 51.0002441,61 L37.0002441,61 C33.0002441,61 32.2001953,62.8830035 32.2001953,64.9593945 C32.2001953,68.6675178 36.9465141,87.059256 54.2998099,111.383646 C65.8685915,127.995268 82.1682449,137 97.0002441,137 C105.899345,137 107.000244,135 107.000244,131.555007 L107.000244,119 C107.000244,115 107.843292,114.201711 110.661357,114.201711 C112.737749,114.201711 116.297488,115.239906 124.603545,123.249196 C134.095936,132.741586 135.660882,137 141.000244,137 L155.000244,137 C159.000244,137 161.000244,135 159.846475,131.053112 C158.583906,127.119411 154.051802,121.412135 148.038124,114.646617 C144.774906,110.790356 139.88045,106.637574 138.397102,104.560689 C136.320711,101.891255 136.914001,100.704429 138.397102,98.3315162 C138.397102,98.3315162 155.454123,74.3036478 157.233993,66.1462211 M66.56,0 Z"/>
            </svg>`;
        a.style.margin = "0 10px";
        a.onclick = function (event) {
            postPic();
            event.preventDefault();
            event.stopPropagation();
        };
        const ya_share2 = document.getElementById("ya_share2");
        ya_share2.parentNode.insertBefore(a, ya_share2);
        ya_share2.style.minWidth = "0";
        AnimePictures&&AnimePictures.hotkeys&&AnimePictures.hotkeys.push({
            descr: "make post to vk",
            hotkey: SETTIGNS.hotkey,
            pages: ["/pictures/view_post"],
            selectors: [],
            action: postPic,
        }, {
            descr: "decline making of VK post",
            hotkey: "Escape",
            pages: ["/"], // all pages
            selectors: ["#post_maker"],
            action: (element) => document.body.removeChild(element),
        });
        log("inited");
    };

    // Open API is incompatible with strict mode
    const script = document.createElement("script");
    script.src = "https://vk.com/js/api/openapi.js";
    script.type = "text/javascript";
    document.head.appendChild(script);

    async function postPic() {
        log("start");
        // gather info for post
        const post = {
            artists: Array.from(document.querySelectorAll(".tags li.orange a")).map(a => a.innerText),
            postUrl: window.location.href,
            previewUrl: document.getElementById("big_preview").src,
        };
        post.message = SETTIGNS.mainMessage(post);
        if (Math.random() < SETTIGNS.bonusMessageOdds) {
            post.message += "\n\n" + SETTIGNS.bonusMessages[Math.floor(Math.random()*SETTIGNS.bonusMessages.length)];
        }

        // make and show a post form
        const postMaker = document.createElement("div");
        postMaker.innerHTML = `
            <div class="post_content">
                <style>
                    #post_maker {
                        position: fixed;
                        top: 0;
                        margin: 0;
                        height: 100%;
                        width: 100%;
                        display: flex;
                        z-index: 100;
                        background: rgba(0,0,0,0.75);
                    }
                    #post_maker .post_content {
                        margin: auto;
                        position: relative;
                    }
                    #post_maker .body {
                        margin: 0;
                    }
                    #post_maker img {
                        max-width: 200px;
                        max-height: 200px;
                        margin: 10px 5px 0 0;
                    }
                    #post_maker textarea {
                        width: 100%;
                        max-width: 100%;
                        box-sizing: border-box;
                        min-height: 120px;
                    }
                    #publish_date {
                        display: inline-block;
                        vertical-align: top;
                        margin-top: 5px;
                        line-height: 2em;
                    }
                    #publish_date input {
                        color: black;
                    }
                    .contorls {
                        display: inline-block;
                        height: 22px;
                        padding: 1px 0;
                        margin: 2px 0;
                        vertical-align: top;
                    }
                    .contorls svg {
                        width: ${unsafeWindow.site_theme == "second" ? "12px" : "10px"};
                        height: ${unsafeWindow.site_theme == "second" ? "12px" : "10px"};
                        opacity: 0.75;
                        display: block;
                    }
                    .contorls .inc {
                        ${unsafeWindow.site_theme == "second" ? "" : "top:2px;position:relative;"};
                    }
                    .contorls .dec {
                        margin-top: 4px;
                    }
                    .contorls svg:hover {
                        opacity: 1;
                    }
                    #post_maker input[type="button"] {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                    }
                    #post_maker input[disabled] {
                        color: grey;
                    }
                </style>
                <div class="title">${TEXT.postMakerTitle}</div>
                <div class="post_content body">
                    <textarea id="post_message">${post.message}</textarea>
                    <img src="${post.previewUrl}"/>
                    <div id="publish_date">
                        <label>
                            <input type="checkbox" checked="checked" />
                            ${TEXT.schedulePost}
                        </label>
                        <br>
                        <input id="publish_date_input" type="datetime" readonly>
                        <a class="contorls" href="#">
                            <svg class="inc" viewBox="0 0 500 500"><polygon points="250,0 0,430 500,430" fill="${unsafeWindow.site_theme == "second" ? "white" : "black"}"/></svg>
                            <svg class="dec" viewBox="0 0 500 500"><polygon points="250,430 0,0 500,0" fill="${unsafeWindow.site_theme == "second" ? "white" : "black"}"/></svg>
                        </a>
                        <br>
                        <span id="offset_date"></span>
                    </div>
                    <input type="button" value="${TEXT.preparing}" disabled />
                </div>
            </div>`;
        postMaker.id = "post_maker";
        postMaker.onclick = (event) => { if (event.target == postMaker) document.body.removeChild(postMaker); };
        document.body.appendChild(postMaker);
        log("form created")

        // get date of the last scheduled post or now date
        const lastPostDate = (await VKapi("wall.get", {
            owner_id: -SETTIGNS.gid,
            filter: "postponed",
        })).items.reduce((date, post) => Math.max(date, post.date), new Date().getTime()/1000)*1000;
        log("got last date", new Date(lastPostDate));

        // activate datetime input field and generate sheduled date
        const dateInput = postMaker.querySelector("#publish_date_input");
        dateInput.addEventListener("change", function (event) {
            let diff = dateInput.getAttribute("timestamp") - lastPostDate;
            if (diff < 60000) {
                document.getElementById("offset_date").innerText = TEXT.beforeLastPost;
            } else {
                let str = [" ", TEXT.afterLastPost];
                let n;
                diff = Math.round(diff/60000); // to minutes
                n = diff%60;
                if (n && diff) {
                    str = [" ", n, " ", TEXT.plural(n, TEXT.minutes), ...str];
                }
                diff = Math.floor(diff/60); // hours
                n = diff%24;
                if (n) {
                    str = [" ", n, " ", TEXT.plural(n, TEXT.hours), ...str];
                }
                diff = Math.floor(diff/24); // days
                if (diff) {
                    str = [diff, " ", TEXT.plural(diff, TEXT.days), ...str];
                }
                if (TEXT.after) {
                    str = [TEXT.after, " ", ...str];
                }
                document.getElementById("offset_date").innerText = str.join("");
            }
        }, true);
        let date = lastPostDate;
        // add randomized stepTime
        date += (SETTIGNS.stepTime + SETTIGNS.stepTimeDeviation*(Math.random()-Math.random()))*60*1000;
        date = new Date(date);
        let h = date.getHours();
        // if it is "night" and
        // day ends before 00:00
        if (SETTIGNS.dayEnds > SETTIGNS.dayStarts && (h >= SETTIGNS.dayEnds || h < SETTIGNS.dayStarts)) {
            date.setHours(SETTIGNS.dayStarts);
            date.setMinutes(SETTIGNS.stepTimeDeviation*Math.pow(Math.random(),1.5));
            if (h > SETTIGNS.dayEnds) date.setDate(date.getDate()+1);
        // day ends after or at 00:00
        } else if (h >= SETTIGNS.dayEnds && h < SETTIGNS.dayStarts) {
            date.setHours(SETTIGNS.dayStarts);
            date.setMinutes(SETTIGNS.stepTimeDeviation*Math.pow(Math.random(),1.5));
        }
        dateInput.setAttribute("timestamp", date.getTime());
        datatimeInput(dateInput);
        log("datetime inited");

        // get preview picture
        post.picture = new File(
            [(await GM_XHR({
                method: "GET",
                url: post.previewUrl,
                responseType: "arraybuffer",
            })).response],
            "photo.jpg",
        );
        log("got preview");

        // upload the picture
        const form = new FormData();
        form.append("photo", post.picture);
        const photo = JSON.parse((await GM_XHR({
            method: "POST",
            url: (await VKapi("photos.getWallUploadServer", {group_id: SETTIGNS.gid})).upload_url,
            data: form,
        })).responseText);
        log("preview uploaded", photo);

        // save the picture
        const pics = await VKapi("photos.saveWallPhoto", {
            group_id: SETTIGNS.gid,
            server: photo.server,
            photo: photo.photo,
            hash: photo.hash,
        });
        log("preview saved", pics);

        // enable post button
        const postButton = postMaker.querySelector("input[type='button']");
        postButton.removeAttribute("disabled");
        postButton.value = TEXT.publishPost;
        postButton.addEventListener("click", function () {
            // post the message and the picture to vk
            log("posting");
            try {
                VKapi("wall.post",{
                    owner_id: -SETTIGNS.gid,
                    from_group: 1,
                    message: postMaker.querySelector("#post_message").value,
                    signed: SETTIGNS.signedPost,
                    attachments: "photo"+pics[0].owner_id+"_"+pics[0].id,
                    publish_date: postMaker.querySelector("input[type='checkbox']").checked ? dateInput.getAttribute("timestamp")/1000 : 0,
                });
            } catch (error) {
                log(error);
            } finally {
                document.body.removeChild(postMaker);
                log("post is made");
            }
        }, true);
        log("ready to post");
    }

    function datatimeInput(input) {
        let timestamp = new Date().getTime();
        let section = "Hours";

        function setValue(stamp) {
            const date = new Date(stamp);
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24*60*60*1000);
            const dd = (n) => n>=10 ? ""+n : "0"+n;

            timestamp = stamp;
            input.setAttribute("timestamp", stamp);
            let str = [" at ", dd(date.getHours()), ":", dd(date.getMinutes())];
            if (date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
                str.unshift(TEXT.today);
            } else if (date.getMonth() == tomorrow.getMonth() && date.getDate() == tomorrow.getDate()) {
                str.unshift(TEXT.tomorrow);
            } else {
                if (date.getYear() !== now.getYear()) {
                    str = [" ", date.getYear()+1900, ...str];
                }
                str = [dd(date.getDate()), " ", TEXT.monthes[date.getMonth()], ...str];
            }
            input.value = str.join("");
            selSection();
            if (input.fireEvent) {
                input.fireEvent("onchange");
            } else {
                input.dispatchEvent(new Event('change'));
            }
        }
        function selSection(sec = section) {
            const atPos = input.value.indexOf(" at ");
            const spacePos = input.value.indexOf(" ");
            switch(sec) {
                case "Date":
                    input.selectionStart = 0;
                    input.selectionEnd = spacePos;
                    break;
                case "Month":
                    if (atPos > spacePos) {
                        input.selectionStart = 3;
                        input.selectionEnd = 6;
                    } else {
                        sec = "Date";
                        input.selectionStart = 0;
                        input.selectionEnd = spacePos;
                    }
                    break;
                default:
                    sec = "Hours";
                case "Hours":
                    input.selectionStart = atPos + 4;
                    input.selectionEnd = atPos + 6;
                    break;
                case "Minutes":
                    input.selectionStart = atPos + 7;
                    input.selectionEnd = atPos + 9;
                    break;
            }
            section = sec;
        }
        function checkSection() {
            const cursorPos = input.selectionEnd;
            const atPos = input.value.indexOf(" at ");
            const spacePos = input.value.indexOf(" ");

            if (cursorPos <= spacePos) {
                selSection("Date");
            } else if (cursorPos <= atPos) {
                selSection("Month");
            } else if (cursorPos <= input.value.indexOf(":")) {
                selSection("Hours");
            } else {
                selSection("Minutes");
            }
        }
        function add(step) {
            checkSection();
            let date = new Date(timestamp);
            date["set"+section](date["get"+section]() + step);
            setValue(date.getTime());
            input.focus();
        }
        input.onclick = checkSection;
        input.nextElementSibling.addEventListener("click", function (event) {
            if(event.target.nodeName == "polygon") {
                add(event.target.parentNode.classList[0] == "inc" ? 1 : -1);
            }
            event.preventDefault();
            event.stopPropagation();
        }, true);
        input.addEventListener("keydown", function (event) {
            if (event.key == "ArrowUp") {
                add(1);
            } else if (event.key == "ArrowDown") {
                add(-1);
            } else if (event.key == "ArrowLeft") {
                switch(section) {
                    case "Minutes": section = "Hours"; break;
                    case "Hours": section = "Month"; break;
                    case "Month": section = "Date"; break;
                }
                selSection();
            } else if (event.key == "ArrowRight") {
                switch(section) {
                    case "Date":
                        if (input.value.indexOf(" ") == input.value.indexOf(" at ")) {
                            section = "Hours";
                        } else {
                            section = "Month";
                        }
                        break;
                    case "Month": section = "Hours"; break;
                    case "Hours": section = "Minutes"; break;
                }
                selSection();
            } else if (event.key == "Enter") {
                document.querySelector("#post_maker input[type='button']").click();
            } else {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
        }, true);

        new MutationObserver(function (muts) {
            if (input.getAttribute("timestamp") == timestamp) return;
            setValue(+input.getAttribute("timestamp"));
        }).observe(input, {attributes: true});

        setValue(+input.getAttribute("timestamp") || timestamp);
    }

    log("VK poster loaded");
})();
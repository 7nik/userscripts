// ==UserScript==
// @name         VK poster
// @namespace    7nik@anime-pictures.net
// @version      1.0.6
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

    mainMessage: (post) => (post.artists.length == 1 ? "Художник " : post.artists.length > 1 ? "Художники: " : "")
                + post.artists.join(", ") + " 「хорошее качество ↓\n"
                + post.postSimpleUrl,
    bonusMessages: [
        "anime-pictures.net/android_app - наше удобное андроид приложение для просмотра аниме картинок",
        "anime-pictures.net/android_app - наше мобильное приложение для сёрфинга по сотням аниме картинок",
        "anime-pictures.net/android_app - андроид приложение для просмотра и скачивания картинок в HD",
        "Ищите классные аниме картинки? Заходите на сайт anime-pictures.net Так же доступно приложение для андроида anime-pictures.net/android_app",
        "Ещё больше на сайте anime-pictures.net и в андроид приложении anime-pictures.net/android_app",
        "Наше мобильное приложение для картинок anime-pictures.net/android_app",
        "Больше картинок в вашем мобильном приложении anime-pictures.net/android_app",
        "Скачивать и смотреть картинки в HD на андроиде можно через наше приложение anime-pictures.net/android_app это бесплатно и без рекламы",
        "У нас доступно мобильное приложение для картинок anime-pictures.net/android_app",
        "Лучший источник новых картинок anime-pictures.net и андроид приложение anime-pictures.net/android_app",
        "Пополняйте ваши коллекции в нашем приложении anime-pictures.net/android_app",
        "Смотрите больше картинок на сайте anime-pictures.net и в мобильном приложении anime-pictures.net/android_app",
        "Скачивайте наше мобильное приложение по ссылке anime-pictures.net/android_app что бы смотреть картинки в HD где угодно",
        "Доступ к крупнейшей аниме арт библиотеке с вашего телефона anime-pictures.net/android_app",
        "Так же у нас есть приложение для телефона anime-pictures.net/android_app",
    ],
    bonusMessageOdds: 1/3, // add bounes message into, in average, 1 of 3 posts
    signedPost: 1, // 1 - yes, 0 - no
    stepTime: 61, // minutes; value added to date of the last post to schedule next one
    stepTimeDeviation: 0, // minutes; max deviaion of stepTime; 0 - no randomization
    dayStarts: 5.06, // 0.00-23.59; "day" starts at 05:06
    dayEnds: 0.00, // 0.00-23.59; "day" ends at 00:00
    hotkey: "À", // key "`" a.k.a. ё; hotkey to call the post maker, requieres "AP hotkeys"

    // ========== SYSTEM SETTINGS ==========

    APP_ID: "6733020",
    gid: "15035509",
    vkApiVersion: "5.87",
    maxScheduleOffset: 365*24*60*60*1000, // miliseconds; 1 year
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
        at: "at",
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
        at: "в",
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

    const log = ()=>{};//(...args) => console.log(...args);
    // promise version of VK.api
    function VKapi(method, options) {
        options.v = SETTIGNS.vkApiVersion;
        return new Promise(function (resolve, reject) {
            VK.api(method, options, function (response) {
                if (response.error) {
                    log(response);
                    reject(response);
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
        async function onclick(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            try {
                await postPic();
            } catch (resp) {
                if (resp.error.error_code == 15) {
                    alert(TEXT.err15);
                } else if (resp.error.error_code == 17) {
                    const a = document.createElement("a");
                    a.target = "_blank";
                    a.href = resp.error.redirect_uri;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    alert(TEXT.error + resp.error.error_msg);
                }
                (form => form&&form.click())(document.getElementById("post_maker"));
            }
        }

        log("start initing");
        VK.init({
            apiId: SETTIGNS.APP_ID
        });
        VK.Auth.getLoginStatus(function(response) {
            if (response.session) {
                SETTIGNS.uid = response.session.mid;
                log("logined");
            } else {
                VK.Auth.login(function(response) {
                    SETTIGNS.uid = response.session.mid;
                    log("new login");
                }, 4+8192); // photo + wall
            }
        });

        const a = document.createElement("a");
        a.href = "#";
        a.alt = SETTIGNS.alt;
        a.innerHTML =
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <path fill="${unsafeWindow.site_theme == "second" ? "white" : "black"}" d="M11.1,0 C20.1,0 11.9,0 20.9,0 C29.9,0 32,2.1 32,11.1 C32,20.1 32,11.9 32,20.9 C32,29.9 29.9,32 20.9,32 C11.9,32 20.1,32 11.1,32 C2.1,32 0,29.9 0,20.9 C0,11.9 0,16.1 0,11.1 C0,2.1 2.1,0 11.1,0 M26.2,11 C26.4,10.5 26.2,10.2 25.5,10.2 L23.2,10.2 C22.6,10.2 22.3,10.5 22.2,10.8 C22.2,10.8 21,13.7 19.3,15.6 C18.7,16.1 18.5,16.3 18.2,16.3 C18,16.3 17.8,16.1 17.8,15.6 L17.8,11 C17.8,10.4 17.7,10.2 17.2,10.2 L13.5,10.2 C13.1,10.2 12.9,10.4 12.9,10.7 C12.9,11.3 13.7,11.4 13.8,13 L13.8,16.4 C13.8,17.2 13.7,17.3 13.4,17.3 C12.6,17.3 10.7,14.4 9.5,11.1 C9.3,10.4 9.1,10.2 8.5,10.2 L6.2,10.2 C5.5,10.2 5.4,10.5 5.4,10.8 C5.4,11.4 6.2,14.5 9,18.6 C11,21.3 13.7,22.8 16.2,22.8 C17.6,22.8 17.8,22.5 17.8,21.9 L17.8,19.8 C17.8,19.2 18,19 18.4,19 C18.8,19 19.4,19.2 20.8,20.5 C22.3,22.1 22.6,22.8 23.5,22.8 L25.8,22.8 C26.5,22.8 26.8,22.5 26.6,21.8 C26.4,21.2 25.7,20.2 24.7,19.1 C24.1,18.5 23.3,17.8 23.1,17.4 C22.7,17 22.8,16.8 23.1,16.4 C23.1,16.4 25.9,12.4 26.2,11 M11.1,0 Z"/>
            </svg>`;
        a.style.margin = "0 10px";
        a.onclick = onclick;

        const ya_share2 = document.getElementById("ya_share2");
        ya_share2.parentNode.insertBefore(a, ya_share2);
        ya_share2.style.minWidth = "0";
        AnimePictures&&AnimePictures.hotkeys&&AnimePictures.hotkeys.push({
            descr: "make post to vk",
            hotkey: SETTIGNS.hotkey,
            pages: ["/pictures/view_post"],
            selectors: [],
            action: onclick,
        }, {
            descr: "decline making of VK post",
            hotkey: "Escape",
            pages: ["/"], // all pages
            selectors: ["#post_maker"],
            action: (element) => document.body.removeChild(element),
        });
        log("inited");
    };

    // All userscripts are run in strict mode, but Open API is incompatible with it
    const script = document.createElement("script");
    script.src = "https://vk.com/js/api/openapi.js";
    script.type = "text/javascript";
    document.head.appendChild(script);

    async function postPic() {
        log("start");
        // gather info for post
        const post = {
            artists: Array.from(document.querySelectorAll(".tags li.orange a"))
                .map(a => a.innerText)
                .filter(t => t !== "tagme (artist)"),
            postSimpleUrl: (loc => loc.host + loc.pathname + loc.search)(window.location),
            postFullUrl: window.location.href,
            previewUrl: document.getElementById("big_preview").src,
        };
        post.message = SETTIGNS.mainMessage(post);
        if (Math.random() < SETTIGNS.bonusMessageOdds) {
            post.message += "\n\n" + SETTIGNS.bonusMessages[Math.floor(Math.random()*SETTIGNS.bonusMessages.length)];
        }
        post.picture = GM_XHR({
            method: "GET",
            url: post.previewUrl,
            responseType: "arraybuffer",
        }).then(({response}) => new File([response], "photo.jpg"));

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
                    .datatimeContorls svg {
                        width: ${unsafeWindow.site_theme == "second" ? "12px" : "10px"};
                        height: ${unsafeWindow.site_theme == "second" ? "12px" : "10px"};
                        fill: ${unsafeWindow.site_theme == "second" ? "white" : "black"};
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
                        <input id="publish_date_input" type="datetime" />
                        <br>
                        <span id="offset_date"></span>
                    </div>
                    <input type="button" value="${TEXT.preparing}" disabled />
                </div>
            </div>`;
        postMaker.id = "post_maker";
        postMaker.onclick = (event) => { if (event.target == postMaker) document.body.removeChild(postMaker); };
        document.body.appendChild(postMaker);
        postMaker.querySelector("#post_message").focus();
        log("form created")

        // get date of the last scheduled post or now date
        const lastPostDate = (await VKapi("wall.get", {
            owner_id: -SETTIGNS.gid,
            filter: "postponed",
            count: 100,
        })).items.reduce((date, post) => Math.max(date, post.date), new Date().getTime()/1000)*1000;
        log("got last date", new Date(lastPostDate));

        // generate sheduled date
        let date = lastPostDate;
        // add randomized stepTime
        date += (SETTIGNS.stepTime + SETTIGNS.stepTimeDeviation*(Math.random()-Math.random()))*60*1000;
        date = new Date(date);
        let h = date.getHours() + date.getMinutes()/100;
        // if it is "night" and
        // day ends before 00:00
        if (SETTIGNS.dayEnds > SETTIGNS.dayStarts && (h >= SETTIGNS.dayEnds || h < SETTIGNS.dayStarts)) {
            date.setHours(SETTIGNS.dayStarts);
            date.setMinutes(
                Math.round(SETTIGNS.dayStarts*100%100)
                + SETTIGNS.stepTimeDeviation*(Math.random()-Math.random())
            );
            if (h > SETTIGNS.dayEnds) date.setDate(date.getDate()+1);
        // day ends after or at 00:00
        } else if (h >= SETTIGNS.dayEnds && h < SETTIGNS.dayStarts) {
            date.setHours(SETTIGNS.dayStarts);
            date.setMinutes(
                Math.round(SETTIGNS.dayStarts*100%100)
                + SETTIGNS.stepTimeDeviation*(Math.random()-Math.random())
            );
        }

        // init datetime input field
        const dateInput = postMaker.querySelector("#publish_date_input");
        dateInput.setAttribute("timestamp", date.getTime());
        dateInput.setAttribute("min", new Date().getTime() + 45*60*1000); // now + 45 minutes
        dateInput.setAttribute("max", new Date().getTime() + SETTIGNS.maxScheduleOffset);
        dateInput.addEventListener("change", function (event) {
            let diff = dateInput.getAttribute("timestamp") - lastPostDate;
            let str = [" ", TEXT.afterLastPost];
            let n;
            if (diff < 60000) { // less than 1 minute
                document.getElementById("offset_date").innerText = TEXT.beforeLastPost;
                return;
            }
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
        }, true);
        dateInput.addEventListener("keydown", function (event) {
            if (event.key == "Enter") {
                document.querySelector("#post_maker input[type='button']").click();
                event.preventDefault();
                event.stopPropagation();
            }
        });
        datatimeInput(dateInput, TEXT);
        log("datetime inited");

        // upload the picture
        const form = new FormData();
        form.append("photo", await post.picture);
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
            caption: post.postFullUrl,
        });
        log("preview saved", pics);

        // enable post button
        const postButton = postMaker.querySelector("input[type='button']");
        postButton.removeAttribute("disabled");
        postButton.value = TEXT.publishPost;
        postButton.addEventListener("click", async function () {
            // post the message and the picture to vk
            log("posting");
            try {
                await VKapi("wall.post",{
                    owner_id: -SETTIGNS.gid,
                    from_group: 1,
                    message: postMaker.querySelector("#post_message").value,
                    signed: SETTIGNS.signedPost,
                    attachments: "photo"+pics[0].owner_id+"_"+pics[0].id,
                    publish_date: postMaker.querySelector("input[type='checkbox']").checked ?
                        dateInput.getAttribute("timestamp")/1000 : 0,
                });
            } catch (resp) {
                if (resp.error.error_code != 15) throw resp;
            } finally {
                log("post is made");
                document.body.removeChild(postMaker);
            }
        }, true);
        log("ready to post");
    }

    function datatimeInput(input, TEXT = {at: "at", today: "today", tomorrow: "tomorrow", monthes: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}) {
        const hideCurrentYear = true;
        let timestamp = new Date().getTime();
        let section = "Hours";
        let min = null, max = null;

        function setValue(stamp) {
            if (min !== null) stamp = Math.max(stamp, min);
            if (max !== null) stamp = Math.min(stamp, max);
            const date = new Date(stamp);
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24*60*60*1000);
            const dd = (n) => n>=10 ? ""+n : "0"+n;

            timestamp = stamp;
            input.setAttribute("timestamp", stamp);
            let str = [" ", TEXT.at, " ", dd(date.getHours()), ":", dd(date.getMinutes())];
            if (date.getFullYear() === now.getFullYear() &&
                    date.getMonth() == now.getMonth() &&
                    date.getDate() == now.getDate()) {
                str.unshift(TEXT.today);
            } else if (date.getFullYear() === tomorrow.getFullYear() &&
                    date.getMonth() == tomorrow.getMonth() &&
                    date.getDate() == tomorrow.getDate()) {
                str.unshift(TEXT.tomorrow);
            } else {
                if (!hideCurrentYear || date.getFullYear() !== now.getFullYear()) {
                    str = [" ", date.getFullYear(), ...str];
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
            const atPos = input.value.indexOf(" "+TEXT.at+" ");
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
                case "FullYear":
                    const yearPos = input.value.indexOf(new Date(timestamp).getFullYear());
                    if (yearPos >= 0) {
                        input.selectionStart = yearPos;
                        input.selectionEnd = yearPos+4;
                    } else {
                        sec = "Date";
                        input.selectionStart = 0;
                        input.selectionEnd = spacePos;
                    }
                    break;
                default:
                    sec = "Hours";
                case "Hours":
                    input.selectionStart = atPos + 2 + TEXT.at.length;
                    input.selectionEnd = atPos + 4 + TEXT.at.length;
                    break;
                case "Minutes":
                    input.selectionStart = atPos + 5 + TEXT.at.length;
                    input.selectionEnd = atPos + 7 + TEXT.at.length;
                    break;
            }
            section = sec;
        }
        function checkSection() {
            const cursorPos = input.selectionEnd;
            const atPos = input.value.indexOf(" "+TEXT.at+" ");
            const space1Pos = input.value.indexOf(" ");
            const space2Pos = input.value.indexOf(" ", space1Pos+1);

            if (cursorPos <= space1Pos) {
                selSection("Date");
            } else if (cursorPos <= atPos) {
                if (cursorPos > space2Pos) {
                    selSection("FullYear");
                } else {
                    selSection("Month");
                }
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

        input.setAttribute("readonly", true);
        input.onclick = checkSection;
        input.addEventListener("keydown", function (event) {
            if (event.key == "ArrowUp") {
                add(1);
            } else if (event.key == "ArrowDown") {
                add(-1);
            } else if (event.key == "ArrowLeft") {
                switch(section) {
                    case "Minutes": section = "Hours"; break;
                    case "Hours":
                        if (input.value.indexOf(new Date(timestamp).getFullYear()) >= 0) {
                            section = "FullYear";
                        } else {
                            section = "Month";
                        }
                        break;
                    case "FullYear": section = "Month"; break;
                    case "Month": section = "Date"; break;
                }
                selSection();
            } else if (event.key == "ArrowRight") {
                switch(section) {
                    case "Date":
                        if (input.value.indexOf(" ") == input.value.indexOf(" "+TEXT.at+" ")) {
                            section = "Hours";
                        } else {
                            section = "Month";
                        }
                        break;
                    case "Month":
                        if (input.value.indexOf(new Date(timestamp).getFullYear()) >= 0) {
                            section = "FullYear";
                        } else {
                            section = "Hours";
                        }
                        break;
                    case "FullYear": section = "Hours"; break;
                    case "Hours": section = "Minutes"; break;
                }
                selSection();
            } else {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
        }, true);
        input.addEventListener("focus", () => selSection(), true);

        const a = document.createElement("a");
        a.className = "datatimeContorls";
        a.href = "#";
        a.innerHTML =
            `<svg class="inc" viewBox="0 0 10 10"><polygon points="5,0 0,9 10,9"/></svg>
             <svg class="dec" viewBox="0 0 10 10"><polygon points="5,9 0,0 10,0"/></svg>`;
        a.addEventListener("click", function (event) {
            let elem = event.target;
            while (elem.nodeName !== "svg") elem = elem.parentNode;
            if (elem.classList[0] == "inc") add(1);
            if (elem.classList[0] == "dec") add(-1);
            event.preventDefault();
            event.stopPropagation();
            input.focus();
        }, true);
        input.parentNode.insertBefore(a, input.nextElementSibling);
        const style = document.createElement("style");
        style.innerHTML =
            `.datatimeContorls {
                display: inline-block;
                height: 22px;
                padding: 1px 0;
                margin: 2px 0;
                vertical-align: top;
            }
            .datatimeContorls svg {
                width: 10px;
                height: 10px;
                fill: black;
                opacity: 0.75;
                display: block;
            }
            .datatimeContorls .inc {
                top:2px;
                position:relative;;
            }
            .datatimeContorls .dec {
                margin-top: 4px;
            }
            .datatimeContorls svg:hover {
                opacity: 1;
            }`;
        document.head.appendChild(style);

        new MutationObserver(function (muts) {
            muts.forEach(mutation => {
                switch (mutation.attributeName) {
                    case "timestamp":
                        if (input.getAttribute("timestamp") == timestamp) break;
                        setValue(+input.getAttribute("timestamp"));
                        break;
                    case "min":
                        min = input.getAttribute("min");
                        if (min !== null) min = +min || null;
                        setValue(timestamp);
                        break;
                    case "max":
                        max = input.getAttribute("max");
                        if (max !== null) max = +max || null;
                        setValue(timestamp);
                        break;
                }
            });
        }).observe(input, {attributes: true});

        min = input.getAttribute("min");
        if (min !== null) min = +min || null;
        max = input.getAttribute("max");
        if (max !== null) max = +max || null;
        setValue(+input.getAttribute("timestamp") || timestamp);
    }

    log("VK poster loaded");
})();
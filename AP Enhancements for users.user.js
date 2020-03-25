// ==UserScript==
// @name         AP Enhancements for users
// @namespace    7nik@anime-pictures.net
// @version      1.0.2
// @description  Makes everything great!
// @author       7nik
// @homepageURL  https://github.com/7nik/userscripts
// @supportURL   https://github.com/7nik/userscripts/issues
// @updateURL    https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// @downloadURL  https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// @match        https://anime-pictures.net/*
// @exclude      https://anime-pictures.net/chat*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* global lang site_theme post_id ajax_request2 is_moderator AnimePictures */
/* eslint-disable sonarjs/no-duplicate-string, sonarjs/cognitive-complexity */

"use strict";

// dictionary of localized texts
const TEXT = new Proxy(
    {
        /**
         * Returns one of the plural form according to the given number
         * @param  {number} n - The number for plural form
         * @param  {string[]} pluralForms - Arrays of plural forms
         * @return {string} The plural form accortind to the number
         */
        plural:  {
            // no plural form - no reason to use the function
            // jp    (n, [singular]) { return singular; },
            // zh_CH (n, [singular]) { return singular; },

            // only singular and plural forms
            en (n, [singular, plural]) { return  n === 1 ? singular : plural; },
            it (n, [singular, plural]) { return  n === 1 ? singular : plural; },
            de (n, [singular, plural]) { return  n === 1 ? singular : plural; },
            es (n, [singular, plural]) { return  n === 1 ? singular : plural; },
            fr (n, [singular, plural]) { return  n < 2 ? singular : plural; },

            // 3 forms: one, a few, many
            ru (n, [singular, paucal, plural]) {
                if ((n % 10) === 1 && (n % 100) !== 11) {
                    return singular;
                }
                if ((n % 10) >= 2 && (n % 10) <= 4 && (n % 100) < 10 || (n % 100) > 20) {
                    return paucal;
                }
                return plural;
            },
        },
        // parameterized text
        doneOf: {
            en (done, total) {
                return `Done ${done} of ${total}`;
            },
            ru (done, total) {
                return `Сделано ${done} из ${total}`;
            },
        },
        replaceTag: {
            en (add, remove) {
                if (!add) return `remove tag "${remove}"`;
                if (!remove) return `add tag "${add}"`;
                return `replace tag "${remove}" with "${add}"`;
            },
            ru (add, remove) {
                if (!add) return `убрать тег "${remove}"`;
                if (!remove) return `добавить тег "${add}"`;
                return `заменить тег "${remove}" на "${add}"`;
            },
        },
        slots: {
            en (used, free) {
                const npics = TEXT.plural(used, ["picture", "pictures"]);
                return `You have ${used} unproven ${npics} you can still upload ${free}.`;
            },
            ru (used, free) {
                const npics = TEXT.plural(
                    used,
                    [
                        "непроверенное изображние",
                        "непроверенных изображния",
                        "непроверенных изображний",
                    ],
                );
                return `У вас ${used} ${npics}, вы можете загрузить ещё ${free}.`;
            },
        },
        // arrays and maps
        statuses: {
            en: {
                "-2": "PRE",
                0: "NEW",
                1: "",
                2: "BAN",
            },
            ru: {
                "-2": "ПРЕ",
                0: "НОВАЯ",
                1: "",
                2: "ЗАБАНЕНА",
            },
        },
        categories: { // by id order
            en: [
                "unknown",
                "character",
                "reference",
                "copyright (product)",
                "author",
                "game copyright",
                "other copyright",
                "object",
                "meta tags",
                "deleted by moderator",
            ],
            ru: [
                "неизвестно",
                "персонаж",
                "описание",
                "копирайт (продукт)",
                "автор",
                "игровой копирайт",
                "иной копирайт",
                "объект",
                "мета теги",
                "удалено модератором",
            ],
            jp: [
                "不明",
                "キャラクター名",
                "特性、状態",
                "作品名（製品名）",
                "アーティスト名",
                "作品名（ゲーム）",
                "other copyright",
                "物質",
                "meta tags",
                "deleted by moderator",
            ],
        },
        // regular text
        accept: {
            en: "Accept",
            ru: "Принять",
        },
        add: {
            en: "Add",
            ru: "Добавить",
        },
        availableHotkeys: {
            en: "Hotkeys avaible on this page",
            ru: "Горячие клавиши доступные на этой странице",
        },
        bigFile: {
            en: "File is too big",
            ru: "Файл слишком большой",
        },
        by: {
            en: "by",
            ru: "от",
        },
        closeWindow: {
            en: "close tab",
            ru: "закрыть вкладку",
        },
        decline: {
            en: "Decline",
            ru: "Отклонить",
        },
        duplicate: {
            en: "Duplicate",
            ru: "Дубликат",
        },
        done: {
            en: "Done",
            ru: "Сделано",
        },
        dragndrop: {
            en: "Drag'n'drop files",
            ru: "Перетащите сюда файлы",
        },
        editTag: {
            en: "Edit tag",
            ru: "Редактировать тег",
        },
        error: {
            en: "Error",
            ru: "Ошибка",
        },
        errorUknownTagType: {
            en: "You should set the tag type!",
            ru: "Вы должны указать тип тега!",
        },
        fileLabel: {
            en: "Choose files or drag'n'drop them",
            ru: "Выберите или перещати файлы сюда",
        },
        hkAddTagsField: {
            en: "(add) focus on an input field for adding tags",
            ru: "(add) фокус на поле для добавления тегов",
        },
        hkAddUrl: {
            en: "add link to selected text",
            ru: "добавить ссылку к выделенному тексту",
        },
        hkAPEOptions: {
            en: "AP Enhancements settings",
            ru: "Настройки AP Enhancements",
        },
        hkBold: {
            en: "(bold) make selected text bold",
            ru: "(bold) сделать выделенный текст жирным",
        },
        hkCloseMessage: {
            en: "close this message or unfocus element",
            ru: "закрыть это сообщение или убрать фокус с элемента",
        },
        hkCommentField: {
            en: "(comment) focus on the comment/message textarea",
            ru: "(comment) фокус на поля для коментария/сообщения",
        },
        hkDeclineTagChanges: {
            en: "decline changes of a tag and close the window",
            ru: "отклонить изменения тега и закрыть окно",
        },
        hkDownload: {
            en: "(download) download the image",
            ru: "(download) скачать изображние",
        },
        hkFavorite: {
            en: "(favorite) add the image to default favorite",
            ru: "(favorite) добавить изображние в избранные",
        },
        hkHelp: {
            en: "(help) show this message",
            ru: "(help) показать это сообщение",
        },
        hkItalic: {
            en: "(italic) make selected text italic",
            ru: "(italic) сделать выделенный текст курсивным",
        },
        hkLinkToTag: {
            en: "add tag link to the selected text(tag)",
            ru: "добавить ссылку на тег к выделенному тексту(тегу)",
        },
        hkNextPost: {
            en: "go to the next post",
            ru: "перейти на следующий пост",
        },
        hkNextPage: {
            en: "go to the next page",
            ru: "перейти на следующую страницу",
        },
        hkOpenAPEOptions: {
            en: "open AP Enhancements options",
            ru: "открыть настройки AP Enhancements",
        },
        hkOpenFull: {
            en: "(view) open the full image",
            ru: "(view) открыть оригинал изображния",
        },
        hkPasteUrl: {
            en: "Paste URL",
            ru: "Вставьте ссылку",
        },
        hkPicture: {
            en: "(picture) turn the selected URL to picture",
            ru: "(picture) сдеать выделенную ссылку изображнием",
        },
        hkPrevPost: {
            en: "go to the previous post",
            ru: "перейти на предыдущий пост",
        },
        hkPrevPage: {
            en: "go to the previous page",
            ru: "перейти на предыдущую страницу",
        },
        hkSaveTag: {
            en: "save changes of a tag",
            ru: "сохранить изменения тега",
        },
        hkSearchField: {
            en: "(query) focus on an input field for searching",
            ru: "(query) фокус на поисковое поле",
        },
        hkSearchField2: {
            en: "(query) focus on a picture search field",
            ru: "(query) фокус на поле для поиска картинок",
        },
        hkSelectBan: {
            en: "select image status BAN",
            ru: "выбрать статус картинки ЗАБАНЕНА",
        },
        hkSelectNew: {
            en: "select image status NEW",
            ru: "выбрать статус картинки НОВАЯ",
        },
        hkSelectPre: {
            en: "select image status PRE",
            ru: "выбрать статус картинки ПРЕ",
        },
        hkSelectPublic: {
            en: "select image status PUBLIC",
            ru: "выбрать статус картинки ПУБЛИЧНАЯ",
        },
        hkSend: {
            en: "send message/comment",
            ru: "отправить сообщение/коментарий",
        },
        hkStar: {
            en: "(star) star the image",
            ru: "(star) звёзднуть изображние",
        },
        hkUnderline: {
            en: "(underline) make selected text underline",
            ru: "(underline) сделать выделенный текст подчёркнутым",
        },
        hkUnfovarite: {
            en: "(unFavorite) remove the image from favorite",
            ru: "(unFavorite) убрать изображние из избранных",
        },
        hkUnstar: {
            en: "(unStar) unstar the image",
            ru: "(unStar) раззвёздить изображние",
        },
        hotkeys: {
            en: "hotkeys",
            ru: "горячие клавиши",
        },
        interrupted: {
            en: "Interrupted",
            ru: "Прервано",
        },
        netError: {
            en: "Network error",
            ru: "Ошибка сети",
        },
        noSlots: {
            en: "No free slots",
            ru: "Нет свободных слотов",
        },
        nothing: {
            en: "nothing",
            ru: "ничего",
        },
        pending: {
            en: "Pending",
            ru: "Ожидание",
        },
        picsWithTag: {
            en: "Anime pictures with tag",
            ru: "Аниме картинки с тегом",
        },
        pics: {
            en: "Anime pictures",
            ru: "Аниме картинки",
        },
        preparing: {
            en: "Preparing...",
            ru: "Подготовка...",
        },
        processing: {
            en: "Processing",
            ru: "Обработка",
        },
        reading: {
            en: "Reading",
            ru: "Открытие",
        },
        removeTags: {
            en: "Remove tags",
            ru: "Убрать теги",
        },
        smallDimension: {
            en: "Dimension is too small",
            ru: "Разрешение слишком маленькое",
        },
        showImages: {
            en: "Show images",
            ru: "Показать изображния",
        },
        sourceID: {
            en: "Source ID",
            ru: "ID источника",
        },
        sFloatingSidebar: {
            en: "Make the sidebar floating",
            ru: "Сделать сайдбар плавающим",
        },
        sFoldSimilarBlock: {
            en: "Make block of similar pictures folded by default",
            ru: "Сделать блок с похожими картинками свёрнутым по-умолчанию",
        },
        sHideNewPostMessage: {
            en: "Do not show message about new post",
            ru: "Не показать сообщение о нопом посте",
        },
        sMetaTags: {
            en: `"Set" type meta for these tags`,
            ru: `"Задаёт" этим тегам тип мета`,
        },
        sTagReplacingAction: {
            en: "What to do after the tag replacing",
            ru: "Что делать после замены тега",
        },
        sTagReplacingAddButton: {
            en: "Add button to replace tag",
            ru: "Добавить кнопку замены тега",
        },
        sTagReplacingAddTag: {
            en: "Tag to add",
            ru: "Добавляемый тег",
        },
        sTagReplacingRemoveTag: {
            en: "Tag to remove",
            ru: "Убираемый тег",
        },
        sWideLayout: {
            en: "Use alternative wide layout",
            ru: "Использовать широкоформатную вёрстку",
        },
        tagRemoving: {
            en: "Removing tags",
            ru: "Удаление тегов",
        },
        uploading: {
            en: "Uploading",
            ru: "Загрузка",
        },
    },
    {
        lang: new URL(window.location.href).searchParams.get("lang") || GM_setValue("lang", "en"),
        get (dictinary, name) {
            return dictinary[name][this.lang] || dictinary[name].en;
        },
    },
);

/**
 * @typedef {Object} Tag
 * @property {number} id - The tag id
 * @property {?string} preId - Id of recommendation if it's recommended tag
 * @property {string} name - The tag name
 * @property {number} type - The tag type
 * @property {number} count - The number of posts with this tag
 */

// tag with "empty" fields
const NO_TAG = Object.freeze({
    id: 0,
    name: "",
    type: 0,
    count: 0,
});

// list of settings and methods for work with them
const SETTINGS = new Proxy({
    // private settings
    lang: {
        descr: null,
        type: "string",
        defValue: "en",
    },
    isThemeDark: {
        descr: null,
        type: "boolean",
        defValue: false,
    },
    isModerator: {
        descr: null,
        type: "boolean",
        defValue: false,
    },
    tagsCache: {
        descr: null,
        type: "object",
        defValue: {},
    },
    preTagsCache: {
        descr: null,
        type: "object",
        defValue: {},
    },
    // public settings
    wideLayout: {
        descr: TEXT.sWideLayout,
        type: "boolean",
        defValue: true,
    },
    floatingSidebar: {
        descr: TEXT.sFloatingSidebar,
        type: "boolean",
        defValue: true,
    },
    foldSimilarBlock: {
        descr: TEXT.sFoldSimilarBlock,
        type: "boolean",
        defValue: false,
    },
    hideNewPostMessage: {
        descr: TEXT.sHideNewPostMessage,
        type: "boolean",
        defValue: false,
    },
    metaTags: {
        descr: TEXT.sMetaTags,
        type: "tag-list",
        defValue: [
            87,     // scan
            323,    // vector
            639,    // game cg
            4867,   // rendered
            6283,   // official art
            10934,  // cropped
            11309,  // dual persona
            11590,  // spoiler
            18166,  // multiple persona
            20373,  // collaboration
            123331, // revision
            137612, // borrowed character
            171239, // third-party edit
        ],
    },
}, {
    cache: {},
    find (list, name) {
        if (name in list) {
            return {
                ...list[name],
                name,
            };
        }
        console.error(`No setting ${name}`);
        return null;
    },
    isValid (list, name, value) {
        const setting = this.find(list, name);
        if (!setting) return false;
        switch (setting.type) {
            case "string":   return typeof value === "string";
            case "boolean":  return typeof value === "boolean";
            case "object":   return value && typeof value === "object";
            case "tag":      return value && "id" in value && "name" in value;
            case "list":     return value in setting.values;
            case "tag-list": return Array.isArray(value) && value.every(Number.isInteger);
            default:
                console.error(`Unsupported type ${setting.type}`);
                return null;
        }
    },
    append (list, name, setting) {
        if (name in list) {
            console.error(`You cannot overwrite setting "${name}"`);
            return;
        }
        if (!["descr", "type", "defValue"].every((field) => field in setting)
            || setting.type === "list" && !setting.values
        ) {
            console.error(`Setting lacks some field`, setting);
            return;
        }
        if (!this.isValid({ s: setting }, "s", setting.defValue)) {
            console.error(`The default value "${setting.defValue}" isn't valid`);
            return;
        }
        list[name] = setting;
    },
    getAll (list) {
        return Reflect.ownKeys(list).map((name) => this.find(list, name));
    },
    getAsElement (list, name) {
        const setting = this.find(list, name);
        if (!setting) return null;
        const value = this.get(list, name);
        switch (setting.type) {
            case "boolean":
                return newElem("input", {
                    type: "checkbox",
                    checked: value,
                    change: (ev) => this.set(list, name, ev.target.checked),
                });
            case "tag": {
                return newTagInput(value, (tag) => this.set(list, name, tag));
            }
            case "list":
                return newElem("select", {
                    change: (ev) => this.set(list, name, ev.target.value),
                    html: Object
                        .entries(setting.values)
                        .map(([val, descr]) => `
                            <option value="${val}" ${val === value ? "selected" : ""}>
                                ${descr}
                            </option>
                        `)
                        .join(""),
                });
            case "tag-list": {
                const idList = value;
                let newTag;
                let elem;
                const addTagItem = (ev) => {
                    // if empty tag or tag not found
                    if (!newTag.id || elem.firstChild.style.background) return;
                    elem.firstChild.value = "";
                    if (idList.find((id) => id === newTag.id)) return;
                    idList.push(newTag.id);
                    // force update tag value in the tag cache
                    const cache = this.get(list, "tagsCache");
                    delete cache[newTag.name];
                    this.set(list, "tagsCache", cache);
                    this.set(list, name, idList);
                    // display tags as sorted
                    Promise.all(idList.map((id) => getTagInfo(id)))
                        .then((tags) => tags.map((tag) => newTagItem(tag)))
                        .then((tags) => tags.sort((t1, t2) => t2.count - t1.count))
                        .then((items) => {
                            elem.lastChild.innerHTML = "";
                            elem.lastChild.append(...items);
                        });
                };
                elem = newElem("form", {
                    submit: (ev) => {
                        addTagItem(ev);
                        ev.preventDefault();
                        ev.stopPropagation();
                    },
                    children: [
                        newTagInput(NO_TAG, (tag) => { newTag = tag; }),
                        newElem("input", {
                            type: "submit",
                            value: TEXT.add,
                            css: { marginLeft: "5px" },
                            click: addTagItem,
                        }),
                        newElem("br"),
                        newElem("ul", {
                            className: "tags",
                            click: (ev) => {
                                if (!ev.target.matches(".icon_delete")) return;
                                const idDel = +ev.target.parentNode.dataset.tagId;
                                ev.target.closest("li").remove();
                                idList.splice(idList.findIndex((id) => id === idDel), 1);
                                // force update tag value in the tag cache
                                const tags = this.get(list, "tagsCache");
                                const tag = Object.values(tags).find(({ id }) => id === idDel);
                                delete tags[tag.name];
                                this.set(list, "tagsCache", tags);
                                this.set(list, name, idList);
                            },
                        }),
                    ],
                });
                Promise.all(idList.map((id) => getTagInfo(id)))
                    .then((tags) => (tags
                        .sort((t1, t2) => t2.count - t1.count)
                        .map((tag) => newTagItem(tag))
                    ))
                    .then((items) => elem.lastChild.append(...items));
                return elem;
            }

            case "string":
            case "object":
                console.error(`Unimplemented input field for ${setting.type} type`);
                return null;
            default:
                console.error(`Unsupported type ${setting.type}`);
                return null;
        }
    },
    getAsRow (list, name) {
        const setting = this.find(list, name);
        if (!setting) return null;
        const row = newElem("tr", { html: `<td>${setting.descr}</td><td></td>` });
        row.lastChild.append(this.getAsElement(list, name));
        return row;
    },

    get (list, name) {
        if (name in this) return (...args) => this[name](list, ...args);
        if (name in this.cache) return this.cache[name];
        const setting = this.find(list, name);
        if (!setting) return null;
        const value = GM_getValue(name);
        if (!this.isValid(list, name, value)) {
            GM_setValue(name, setting.defValue);
            this.cache[name] = setting.defValue;
            return setting.defValue;
        }
        this.cache[name] = value;
        return value;
    },
    set (list, name, value) {
        const setting = this.find(list, name);
        if (!setting) return false;
        if (this.isValid(list, name, value)) {
            GM_setValue(name, value);
            this.cache[name] = value;
            return true;
        }
        console.error(`The value ${value} cannot be set to ${name}.`);
        return false;
    },
});

const wideLayoutCSS = `
    body {
        overflow-y: scroll;
    }
    div#content {
        margin-top: 0;
    }

    @media screen and (min-width: 1630px) and (max-width: 1899px)  {
        div#content {
            margin: 0;
            width: calc(100% - 300px);
        }
        div#cont.cont_view_post {
            margin: 10px auto;
        }
        #cont > #part2 > div:last-child /* comment block wripper */ {
            width: 680px !important;
        }
    }

    @media screen and (orientation: landscape) and (min-width: 1900px) {
        /* temporal layout */
        #cont.cont_view_post > [itemscope]:not(#part0) {
            grid-area: imgPost;
            display: flex !important;
            flex-direction: column;
        }
        #cont.cont_view_post > [itemscope]:not(#part0) ~  *,
        #cont.cont_view_post > [itemscope]:not(#part0) > :first-child,
        #cont.cont_view_post > [itemscope]:not(#part0) > .post_content:nth-child(2):not(.moderator),
        #cont.cont_view_post > [itemscope]:not(#part0) > .post_content:nth-child(3),
        #cont.cont_view_post > [itemscope]:not(#part0) > #big_preview_cont + .post_content ~ * {
            display: none;
        }
        div#content {
            margin: 0;
            width: calc(1280px + (100vw - 1891px) / 3);
        }
        div#cont.cont_view_post {
            display: grid;
            grid-template-areas:
                "message  message"
                "uploader imgPost"
                "postInfo imgPost"
                "comments imgPost"
                ".        imgPost";
            grid-template-columns: 640px;
            gap: 0 calc((100vw - 1891px) / 3);
            margin: 10px 0;
            padding: 0;
            overflow: initial;
        }
        div#cont:not(.cont_view_post) {
            margin: 10px 0;
        }
        /* ban/new_post message  */
        div#cont.cont_view_post > div:first-child:not([itemscope]):not(#part0) {
            grid-area: message;
            width: 100%;
            text-align: center;
            margin: 0 0 10px 0;
        }
        #cont > #part0 {
            grid-area: uploader;
        }
        #cont > #part1 {
            grid-area: imgPost;
        }
        #cont > #part2 {
            grid-area: postInfo;
        }
        /* comments */
        #cont.cont_view_post > :not([id]):not(:first-child) {
            grid-area: comments;
            width: 640px;
            margin-bottom: 0;
        }
        /* Linked pictures */
        #cont > #part0 .post_content:nth-child(2) {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        #cont > #part0 .post_content:nth-child(2) > .title  {
            align-self: stretch;
        }
        #cont > #part0 .post_content:nth-child(2) > .body[style]  {
            max-width: 100%;
        }
        #cont.cont_view_post > div:not(.post_content) {
            width: 640px !important;
        }
        #cont.cont_view_post > :not(.post_content) > div:not(.body) {
            width: 640px !important;
            margin: 0 0 10px 0;
        }
        #cont :not(#part0) .post_content:last-child {
            margin-bottom: 0;
        }

        #cont .moderator {
            font-size: 97%;
            word-spacing: -1.5px;
        }
        .comments-body iframe /* youtube video */ {
            width: 520px;
            height: 292.5px;
        }
    }

    @media screen and (min-width: 1630px) {
        div#sidebar {
            position: relative;
        }
        div#tags_sidebar {
            position: absolute;
            background: none;
            top: 0;
            left: calc(300px + 15px - 100vw);
            height: 100%;
        }
        div#tags_sidebar > div:last-child {
            display: flex;
            flex-direction: column;
            height: calc(100% - 46px);
            padding: 4px 0 !important;
        }
        div#tags_sidebar > div:last-child br {
            display: none;
        }
    }
    @media screen and (min-width: 1900px) {
        div#tags_sidebar {
            left: auto;
            right: calc((100vw - 1891px) / 3 + 300px);
        }
    }
`;

const floatingSidebarCSS = `
    #body_wrapper {
        min-height: calc(100vh - 186px);
    }
    div#content {
        margin-top: 0;
    }
    @media screen and (min-width: 1630px) {
        #sidebar > div[style] {
            display: none;
        }
        div#sidebar[id] {
            position: fixed;
            right: 0;
            top: 0;
            margin: 0;
            height: calc(100vh - 76px);
            display: flex;
            flex-direction: column;
        }
        div#tags_sidebar[id] {
            position: absolute;
            background: none;
            left: calc(300px + 15px - 100vw);
            top: 0px;
            height: 100%;
        }
        div#tags_sidebar[id] > div:last-child {
            display: flex;
            flex-direction: column;
            height: calc(100% - 36px);
            padding: 4px 0 !important;
        }
        div#tags_sidebar > div:last-child br {
            display: none;
        }
        div#post_tags {
            flex-grow: 1;
        }
        div#sidebar_last_scores {
            overflow: hidden;
            margin: 0;
        }
        div#sidebar_last_scores_body {
            height: calc(100% - 32px);
        }
    }
    @media screen and (min-width: 1900px) {
        div#tags_sidebar[id] {
            left: -305px;
        }
    }
`;

// page names of the pathnames
const PAGES = {
    any:             "/",
    main:            "/",
    chat:            "/chat/view",
    moderatePreTags: "/pictures/moderating_pre_tags/",
    uploadPicture:   "/pictures/view_add_wall",
    comments:        "/pictures/view_all_comments/",
    editTag:         "/pictures/view_edit_tag/",
    post:            "/pictures/view_post/",
    search:          "/pictures/view_posts/",
    PMChat:          "/profile/messages_from_user/",
    PMList:          "/profile/messages_users/",
    settings:        "/profile/view",
    profile:         "/profile/view_ext_profile/",
    withTextarea: [
        "/chat/view",
        "/pictures/view_edit_tag/",
        "/pictures/view_post/",
        "/profile/messages_from_user/",
    ],
    strictComparisonIsRequired: [
        "main",
        "settings",
    ],
};

// list of hotkey available to everybody
const hotkeys = [
    {
        hotkey: "Escape",
        descr: TEXT.hkCloseMessage,
        pages: [PAGES.any],
        selectors: ["#dialog"],
        action: (element) => element.remove(),
    },
    {
        hotkey: "H",
        descr: TEXT.hkHelp,
        pages: [PAGES.any],
        selectors: [],
        action: () => showAvailableHotkeys(),
    },
    {
        hotkey: "A",
        descr: TEXT.hkAddTagsField,
        pages: [PAGES.post],
        selectors: ["#add_tag_input"],
        action: (element) => element.focus(),
    },
    {
        hotkey: "Q",
        descr: TEXT.hkSearchField,
        pages: [PAGES.any],
        selectors: [
            "#search_tag_input",
            "input[name='search_text']",
            "#tag_changes_search_tag",
            "#side_search_tag",
        ],
        action: (element) => element.focus(),
    },
    {
        hotkey: "Shift+Q",
        descr: TEXT.hkSearchField2,
        pages: [PAGES.any],
        selectors: ["#side_search_tag"],
        action: (element) => element.focus(),
    },
    {
        hotkey: "D",
        descr: TEXT.hkDownload,
        pages: [PAGES.post],
        selectors: ["a.download_icon"],
        action: (element) => element.click(),
    },
    {
        hotkey: "S",
        descr: Text.hkStar,
        pages: [PAGES.post],
        selectors: ["span.star_it"],
        action: (element) => element.click(),
    },
    {
        hotkey: "Shift+S",
        descr: TEXT.hkUnstar,
        pages: [PAGES.post],
        selectors: ["span.unstar_it"],
        action: (element) => element.click(),
    },
    {
        hotkey: "V",
        descr: TEXT.hkOpenFull,
        pages: [PAGES.post],
        selectors: ["#big_preview_cont > a"],
        action: (element) => element.click(),
    },
    {
        hotkey: "F",
        descr: TEXT.hkFavorite,
        pages: [PAGES.post],
        selectors: ["select[name='favorite_folder']"],
        action: (el) => {
            el.value = "default"; // eslint-disable-line no-param-reassign
            el.dispatchEvent(new Event("change"));
        },
    },
    {
        hotkey: "Shift+F",
        descr: TEXT.hkUnfovarite,
        pages: [PAGES.post],
        selectors: ["select[name='favorite_folder']"],
        action: (el) => {
            el.value = "default"; // eslint-disable-line no-param-reassign
            el.dispatchEvent(new Event("change"));
        },
    },
    {
        hotkey: "C",
        descr: TEXT.hkCommentField,
        pages: PAGES.withTextarea,
        selectors: ["textarea"],
        action: (element) => element.focus(),
    },
    {
        hotkey: "Ctrl+S",
        descr: TEXT.hkSaveTag,
        pages: [PAGES.editTag],
        selectors: ["#save_tag"],
        action: (element) => element.click(),
    },
    {
        hotkey: "Escape",
        descr: TEXT.hkDeclineTagChanges,
        pages: [PAGES.editTag],
        selectors: ["#save_tag + input"],
        action: (element) => element.click(),
    },
    {
        hotkey: "Ctrl+B",
        descr: TEXT.hkBold,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => (pasteBBTag(element, "B")),
    },
    {
        hotkey: "Ctrl+I",
        descr: TEXT.hkItalic,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => (pasteBBTag(element, "I")),
    },
    {
        hotkey: "Ctrl+U",
        descr: TEXT.hkUnderline,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => (pasteBBTag(element, "U")),
    },
    {
        hotkey: "Ctrl+P",
        descr: TEXT.hkPicture,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => (pasteBBTag(element, "IMG")),
    },
    {
        hotkey: "Ctrl+K",
        descr: TEXT.hkAddUrl,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => (pasteBBTag(element, "URL", TEXT.hkPasteUrl)),
    },
    {
        hotkey: "Ctrl+E",
        descr: TEXT.hkLinkToTag,
        pages: PAGES.withTextarea,
        selectors: ["textarea:focus", "textarea"],
        action: (element) => pasteBBTag(
            element,
            "URL",
            null,
            `https://anime-pictures.net/pictures/view_posts/0?search_tag=${getSelText().replace(/\s/g, "+")}`,
        ),
    },
    {
        hotkey: "Ctrl+Enter",
        descr: TEXT.hkSend,
        pages: [PAGES.PMChat/* , PAGES.post */],
        selectors: ["textarea:focus ~ button", "textarea:focus ~ input", "a.bbcode_tag ~ input"],
        action: (element) => element.click(),
    },
    {
        hotkey: "Z",
        descr: TEXT.hkPrevPost,
        pages: [PAGES.post],
        selectors: ["a.chevron_left"],
        action: (element) => element.click(),
    },
    {
        hotkey: "X",
        descr: TEXT.hkNextPost,
        pages: [PAGES.post],
        selectors: ["a.chevron_right"],
        action: (element) => element.click(),
    },
    {
        hotkey: "O",
        descr: TEXT.hkOpenAPEOptions,
        pages: [PAGES.any],
        selectors: [],
        action: () => say(buildSettings(), TEXT.hkAPEOptions),
    },
];

/**
 * Check weather pathname is/starts with `path`
 * Also you indirectly call it by reading a property with the same name as one of `PAGES`
 * @param  {string}  path - A pathname for comparing
 * @param  {boolean} [strict=false] - True: exact matching; false: pathname starts with `path`
 * @return {boolean} Weather pathname is/starts with `path`
 */
const pageIs = new Proxy((path, strict = false) => {
    if (strict) {
        return window.location.pathname === path;
    }
    return window.location.pathname.startsWith(path);
}, {
    get (pathIs, pageName) {
        if (PAGES.strictComparisonIsRequired.includes(pageName)) {
            return pathIs(PAGES[pageName], true);
        }
        return pathIs(PAGES[pageName]);
    },
});

/**
 * Executes `fn` when DOM is loaded
 * @param  {function} fn - A function to execute
 */
function onready (fn) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn);
        return;
    }
    fn();
}

/**
 * Handles opening of link in new tab to provide them `window.opener`
 * @param  {MouseEvent} ev - Event object
 */
function fixedNewTabLink (ev) {
    if (ev.type === "click" && !ev.ctrlKey) return;
    window.open(ev.target.closest("a").href);
    ev.preventDefault();
    ev.stopPropagation();
}

/**
 * Returns first element matching given `selector`
 * @param  {string} selector - A selector for matching
 * @param  {HTMLElement} [container=document] - Where search the element
 * @return {HTMLElement} The found element or null
 */
function getElem (selector, container = document) {
    return container.querySelector(selector);
}

/**
 * Returns all elements matching given `selector`
 * @param  {string} selector - A selector for matching
 * @param  {HTMLElement} [container=document] - Where search the element
 * @return {HTMLElement[]} List of the found elements
 */
function getAllElems (selector, container = document) {
    return Array.from(container.querySelectorAll(selector));
}

/**
 * Creates new HTMLElement and set given properties.
 * If (sub)property value is `null` it's ignored.
 * Prop `css` - object of CSS properties.
 * Prop `data` - object of the Data attributes.
 * Prop `html`/`text` - HTML or text content of the element.
 * Prop `children` - List of child elements and text nodes.
 * Prop with function as value - event handler wher `prop` is space-separeted list of event names.
 * Other props - regular properties (not attributes).
 * @param  {string} tagName - Name of the element
 * @param  {object=} props - Properties of the element
 * @return {HTMLElement} The created element
 */
function newElem (tagName, props = {}) {
    const elem = document.createElement(tagName);
    Object.entries(props).forEach(([prop, value]) => {
        if (value === null) return;
        switch (prop) {
            case "css":
                Object.entries(value)
                    .forEach(([name, val]) => { if (val !== null) elem.style[name] = val; });
                return;
            case "data":
                Object.entries(value)
                    .forEach(([name, val]) => { if (val !== null) elem.dataset[name] = val; });
                return;
            case "html":
                elem.innerHTML = value;
                return;
            case "text":
                elem.textContent = value;
                return;
            case "children":
                elem.append(...value);
                return;
            default:
                if (typeof value === "function") {
                    prop.split(" ").forEach((evName) => elem.addEventListener(evName, value));
                } else {
                    elem[prop] = value;
                }
        }
    });
    return elem;
}

/**
 * Creates new <input> for typing a tag
 * @param  {Tag} tag - Initial value of the input
 * @param  {function(Tag):void} onTagChange - The function called on value changing
 * @return {HTMLInputElement} The created <input> element
 */
function newTagInput (tag, onTagChange) {
    let oldValue;
    let timer;
    function checkTag ({ target: elem }) {
        if (elem.value === oldValue) return;
        oldValue = elem.value;
        elem.style.background = "#F88"; // eslint-disable-line no-param-reassign

        clearTimeout(timer);
        if (elem.value.trim()) {
            timer = setTimeout(async () => {
                const newTag = await getTagInfo(elem.value);
                if (newTag.id) {
                    elem.style.background = null; // eslint-disable-line no-param-reassign
                    onTagChange(newTag);
                }
            }, 350);
        } else {
            elem.style.background = null; // eslint-disable-line no-param-reassign
            onTagChange(NO_TAG);
        }
    }

    const elem = newElem("input", {
        type: "text",
        value: tag.id ? tag.name : "",
        input: checkTag,
        change: checkTag,
    });
    // temporaly replace get_by_id to allow create
    // the AutoComplete for element which isn't in the DOM
    const origGetById = unsafeWindow.get_by_id;
    unsafeWindow.get_by_id = (el) => el;
    const autocomp = new AnimePictures.AutoComplete(elem, "/pictures/autocomplete_tag", false);
    unsafeWindow.get_by_id = origGetById;
    // trigger tag checking on text inserting by the AutoComplete
    autocomp.set_text = function setText (li) {
        // only one tag in the field allowed
        if (!li) return;
        this.input_tag.value = li.text.replace("<b>", "").replace("</b>", "");
        checkTag({ target: this.input_tag });
    };
    return elem;
}

/**
 * Creates new <li> which represents a tag
 * @param  {Tag} tag - A the to represent
 * @return {HTMLLIElement} The created <li> element
 */
function newTagItem (tag) {
    // eslint-disable-next-line object-curly-newline
    const { id, preId = null, name, type, count, by } = tag;
    const classColor = [
        "", "blue", "", "green", "orange", "green", "green", "", "purple",
    ][type];
    const textColor = [
        "", "character", "", "copyright", "artist", "copyright", "copyright", "", "meta",
    ][type];
    const uploaderName = (getElem(".post_content_avatar a") || {}).textContent;
    return newElem("li", {
        id: `tag_li_${id}`,
        className: `${classColor} ${preId ? "preTag" : ""}`,
        title: by ? `${TEXT.by} ${by}` : null,
        children: [
            newElem("a", {
                href: `/pictures/view_posts/0?search_tag=${encodeURIComponent(name)}`,
                title: `${TEXT.picsWithTag} ${name}`,
                className: `
                    ${textColor}
                    ${textColor ? "big_tag" : ""}
                    ${(by !== uploaderName) ? "not_my_tag_border" : ""}
                    ${preId ? "preTag" : ""}
                `,
                text: name,
            }),
            newElem("span", {
                children: [newElem("span", {
                    className: "edit_tag",
                    data: { tagId: id, preTagId: preId },
                    text: count >= 1000 ? `${Math.floor(count / 1000)}K` : count,
                    children: [
                        " ",
                        newElem("span", {
                            className: "accept",
                            title: TEXT.accept,
                            text: " ✓ ",
                        }),
                        newElem("span", {
                            className: "decline",
                            title: TEXT.decline,
                            text: " ✗ ",
                        }),
                        newElem("span", {
                            id: `delete_span_tag_${id}`,
                            className: "icon_delete",
                        }),
                        newElem("span", {
                            id: `set_span_tag_${id}`,
                            className: "icon_frame",
                        }),
                        newElem("span", {
                            id: `edit_span_tag_${id}`,
                            className: "icon_edit",
                        }),
                    ],
                })],
            }),
        ],
    });
}

/**
 * Executes network request and automatically parses response as HTML or JSON
 * @param  {string}  url - URL of the request
 * @param  {object}  [params=null] - The request params
 * @param  {string}  [method="POST"] - method of request executing
 * @param  {boolean} [sequentially=true] - execute the request in queue (one by one) or immediately
 * @return {Promise<(object|Document)>} - The parsed response
 * @throws {Exception} - Network or parsing exception
 */
function ajax (url, params = null, method = "POST", sequentially = true) {
    let fullUrl = url;
    if (method === "GET") {
        const fullParams = { lang: SETTINGS.lang, ...params };
        fullUrl = url
            + (url.includes("?") ? "&" : "?")
            + Object.entries(fullParams).map(([k, v]) => `${k}=${v}`).join("&");
        params = null; // eslint-disable-line no-param-reassign
    }
    const body = {
        method,
        body: params && Object.entries(params || {})
            .reduce((fd, [k, v]) => { fd.append(k, v); return fd; }, new FormData()),
    };
    const timer = setTimeout(() => document.body.classList.add("waiting"), 500);
    const checkResponse = async (resp) => {
        document.body.classList.remove("waiting");
        clearTimeout(timer);
        if (!resp.ok) throw resp;
        const text = await resp.text();
        if (text[0] === "<") {
            return new DOMParser().parseFromString(text, "text/html");
        }
        return JSON.parse(text);
    };
    if (sequentially) {
        ajax.last = (ajax.last || Promise.resolve())
            .then(() => fetch(fullUrl, body), () => fetch(fullUrl, body))
            .then(checkResponse);
        return ajax.last;
    }
    return fetch(fullUrl, body).then(checkResponse);
}

/**
 * Returns tag by its name or id, uses cache
 * @param  {(string|number)} tagName - The tag name or id
 * @return {Promise<Tag>} Found tag or `NO_TAG`
 */
async function getTagInfo (tagName) {
    // load and update cache
    const now = Date.now();
    const cache = SETTINGS.tagsCache;
    if (cache.lastClean && cache.lastClean + 24 * 3600 * 1000 < now) {
        // remove old items
        Object.entries(cache).forEach(([name, tag]) => {
            if (tag.date + 7 * 24 * 3600 * 1000 < now) delete cache[name];
        });
        cache.lastClean = now;
        SETTINGS.tagsCache = cache;
    }

    if (!tagName) return NO_TAG;
    // if it is tag id
    if (typeof tagName === "number") {
        // check in cache
        const tag = Object.values(cache).find((t) => t.id === tagName);
        if (tag) return { ...tag }; // return copy
        // convert tag id to tag name
        const { success, name } = await ajax(`/pictures/get_tag_name_by_id/${tagName}`);
        if (!success) return NO_TAG;
        tagName = name; // eslint-disable-line no-param-reassign
    }
    // check in cache
    if (tagName in cache) return { ...cache[tagName] }; // return copy
    // get tag info
    const { posts } = await ajax(
        `/pictures/view_posts/0?search_tag=${tagName}&type=json`,
    );
    if (posts.length === 0) return NO_TAG;
    const { tags } = await ajax(
        `/api/v2/posts/${posts[0].id}/tags`,
        null,
        "GET",
    );
    tags.forEach((t) => {
        const tag = {
            id: t.id,
            name: t.name,
            type: t.type,
            count: t.num,
            date: Date.now(),
        };
        if (tag.type !== 2 && tag.type !== 7) { // it's neither a reference nor an object
            tag.date += 1000 * 3600 * 24 * 6.75; // keep only 6 hours
        }
        // overide type for meta tags
        if (tag.name.endsWith(" (cosplay)") && tag.type !== 0
            || SETTINGS.metaTags.includes(tag.id)
        ) {
            tag.type = 8;
        }
        cache[tag.name] = tag;
        // change tagName if it doesn't correspond to the interface language
        if ([t.tag, t.tag_ru, t.tag_jp].includes(tagName) && t.name !== tagName) {
            tagName = t.name; // eslint-disable-line no-param-reassign
        }
    });
    SETTINGS.tagsCache = cache;

    if (tagName in cache) return { ...cache[tagName] }; // return copy
    return NO_TAG;
}

/**
 * Get text selected by user
 * @return {string} The selected by user
 */
function getSelText () {
    if (window.getSelection) {
        return window.getSelection().toString();
    }
    return document.selection.createRange().text;
}

/**
 * Inserts BB tag to the <textarea>
 * 1. It doesn't corrupt history of the field changes
 * 2. It supports asking of a tag param
 * 3. It either folds a selected text with the tag and put the cursor after it
 *    or inserts the empty tag and put the cursor inside it
 * @param  {HTMLTextareaElement} textarea - The textarea for tag inserting
 * @param  {string} bbtag - The tag name
 * @param  {string=} askParam - Text for asking a user type the tag parameter
 * @param  {string=} param - The tag parameter
 */
function pasteBBTag (textarea, bbtag, askParam, param = "") {
    let text = getSelText();
    textarea.focus();
    if (!text) text = getSelText();

    let tagParam = param;
    if (askParam) {
        // eslint-disable-next-line no-alert
        tagParam = prompt(askParam, param);
        if (tagParam === null) return;
    }
    tagParam = tagParam ? `=${tagParam}` : "";

    document.execCommand("insertText", false, `[${bbtag}${tagParam}]${text}[/${bbtag}]`);
    // set the cursor after the bbtag if any text was selected, otherwise - inside the bbtag
    const cursorPos = textarea.selectionStart + (text
        ? 2 * bbtag.length + tagParam.length + text.length + 5
        : bbtag.length + tagParam.length + 2);
    // eslint-disable-next-line no-param-reassign, no-multi-assign
    textarea.selectionStart = textarea.selectionEnd = cursorPos;
}

/**
 * Displays or updates a dialog with given content
 * @param  {string|HTMLElement}  text - Displaying message
 * @param  {string}  title - Title of the dialog
 * @param  {boolean} [modal=false] - Is dialog modal
 */
function say (text, title, modal = false) {
    let dialog = getElem("#dialog");
    if (!dialog) {
        dialog = newElem("div", {
            id: "dialog",
            className: "post_content",
            children: [newElem("div", {
                modal: modal ? "" : null,
                children: [
                    newElem("div", {
                        className: "title",
                        text: title,
                    }),
                    newElem("div", {
                        className: "post_content body",
                        html: typeof text === "string" ? text : null,
                        children: typeof text !== "string" ? [text] : null,
                    }),
                ],
            })],
            click: (ev) => {
                if (ev.target === dialog && !dialog.hasAttribute("modal")) {
                    dialog.remove();
                }
            },
        });
        document.body.append(dialog);

        return;
    }

    if (text) {
        if (text === "string") {
            getElem(".body", dialog).innerHTML = text;
        } else {
            getElem(".body", dialog).innerHTML = "";
            getElem(".body", dialog).append(text);
        }
        dialog.style.display = "flex";
        if (modal === true) {
            dialog.setAttribute("modal", "");
        } else if (modal === false) {
            dialog.removeAttribute("modal");
        }
    } else {
        dialog.style.display = "none";
    }
}

/**
 * Displays a dialog with hotkeys available on current page
 */
function showAvailableHotkeys () {
    say(
        [
            "<table>",
            ...hotkeys
                .filter((hk) => hk.pages.some((url) => pageIs(url)))
                .map((hk) => `<tr><td>${hk.hotkey}&nbsp;</td><td>&nbsp;${hk.descr}</td></tr>`),
            "</table>",
        ].join(""),
        TEXT.availableHotkeys,
    );
}

/**
 * Handler for triggering hotkeys
 * @param  {KeyEvent} ev
 */
function onhotkey (ev) {
    // get hotkey name
    let hotkey = "";
    let controlHotKey = false;
    if (ev.ctrlKey) {
        hotkey += "Ctrl+";
        controlHotKey = true;
    }
    if (ev.altKey) {
        hotkey += "Alt+";
        controlHotKey = true;
    }
    if (ev.shiftKey) {
        hotkey += "Shift+";
    }
    hotkey += (ev.key.length > 1) ? ev.key : String.fromCharCode(ev.which || ev.keyCode);
    const focusElem = document.activeElement;
    // unfocus element on Escape
    if ((hotkey === "Escape") && (focusElem !== document.body)) {
        focusElem.blur();
        ev.preventDefault();
        ev.stopPropagation();
        return;
    }
    // return if it is just text typing
    if (!controlHotKey
        && ((focusElem.tagName === "TEXTAREA")
            || (focusElem.tagName === "INPUT"
                && focusElem.type !== "button"
                && focusElem.type !== "submit"))
    ) {
        return;
    }
    // filter hotkeys by a current url and the hotkey, execute hotkey.func for
    // the first found by selectors an element and cancel KeyEvent if the element was found
    if (hotkeys
        .filter((hk) => hk.hotkey === hotkey)
        .filter((hk) => hk.pages.some((url) => pageIs(url)))
        .some((hk) => {
            const element = getElem(hk.selectors.find((sel) => getElem(sel)));
            if (!element && hk.selectors.length > 0) return false;
            hk.action(element);
            return true;
        })
    ) {
        ev.preventDefault();
        ev.stopPropagation();
    }
}

/**
 * Registers a hotkey
 * @param {string} hotkey - The hotkey, e.g. `Ctrl+Shift+R`
 * @param {string} descr - Description of the hotkey
 * @param {string[]=} pages - List of pages where the hotkey can be triggered
 * @param {string[]=} selectors - List of element selectors, first found will be passed to `action`
 * @param {function(HTMLElement?):void} action - The hotkey handler
 */
function registerHotkey (hotkey, descr, pages, selectors, action) {
    /* eslint-disable no-param-reassign */
    if (typeof pages === "function") [pages, action] = [null, pages];
    if (typeof selectors === "function") [selectors, action] = [null, selectors];
    if (pages && pages[0] && pages[0] !== "/") [pages, selectors] = [selectors, pages];
    /* eslint-enable no-param-reassign */
    hotkeys.push({
        descr,
        hotkey,
        pages: pages || [PAGES.any],
        selectors: selectors || [],
        action,
    });
}

/**
 * Adds hotkeys for pagination if needed,
 * ones for moderating if allowed, and link to the hotkey list
 */
function addOptionalHotkeys () {
    // add a link to show avaible for current page hotkeys
    if (getElem("#footer span")) {
        getElem("#footer span").append(
            ", ",
            newElem("a", {
                id: "show_hotkeys",
                href: "#",
                css: { color: "white" },
                text: TEXT.hotkeys,
                click:  (ev) => {
                    // remove focus from #show_hotkeys
                    // to avoid double pressing Escape to close the message
                    ev.target.blur();
                    ev.preventDefault();
                    ev.stopPropagation();
                    showAvailableHotkeys();
                },
            }),
        );
    }
    // there are too many pages with pagination to list them
    if (pageIs.search || getElem(".numeric_pages a")) {
        hotkeys.push(
            {
                hotkey: "Z",
                descr: TEXT.hkNextPage,
                pages: [PAGES.any],
                selectors: [".numeric_pages a:first-child"],
                action: (element) => element.click(),
            },
            {
                hotkey: "X",
                descr: TEXT.hkPrevPage,
                pages: [PAGES.any],
                selectors: [".numeric_pages a:last-child"],
                action: (element) => element.click(),
            },
        );
    }
}

/**
 * Applies alternative wide layout
 */
function makeLayoutWide () {
    if (getElem("#cont.cont_view_post")) {
        getElem("#cont > [itemscope]").id = "part0";
        let div = getElem("#cont > div[itemscope] > div:first-child");
        const container1 = newElem("div", { id: "part1" });
        const container2 = newElem("div", { id: "part2" });

        do {
            // skip block "Linked pictures"
            if (div.nextElementSibling.matches(".post_content")
                && div.nextElementSibling.children.length === 3) {
                div = div.nextElementSibling;
            } else {
                container1.append(div.nextElementSibling);
            }
        } while (!div.nextElementSibling.lastElementChild.classList.contains("image_body"));

        while (div.nextElementSibling) container2.append(div.nextElementSibling);
        // comments block is added dynamicaly

        getElem("#cont").append(container1, container2);

        const animImg = getElem("#big_preview_cont video");
        if (animImg) { // video stops after moving it in the DOM so start it play
            animImg.play();
        }
    }
}

/**
 * Makes sidebar float, be always visible
 */
function makeSidebarFloating () {
    if (getElem("#sidebar_last_scores_body")) {
        getElem("#sidebar_last_scores_body").parentElement.id = "sidebar_last_scores";
    }

    const sidebar = getElem("#sidebar");
    function alignSidebar (ev) {
        const {
            scrollTop,
            scrollHeight,
            clientHeight,
        } = document.scrollingElement;
        const top = Math.max(0, 76 - scrollTop);
        const bottom = Math.max(0, scrollTop + clientHeight + 130 - scrollHeight);
        sidebar.style.height = `${clientHeight - top - bottom}px`;
        sidebar.style.top = `${top}px`;

        // adjust position of autocomplete if needed
        const field = document.activeElement;
        const autocomplite = getElem(".autocomplite[style*='visibility: visible;']");
        if (autocomplite
            && sidebar.contains(field)
            && field.nodeName === "INPUT"
            && field.type === "text"
        ) {
            autocomplite.style.top = `${field.offsetTop + top + scrollTop + field.offsetHeight}px`;
        }
    }

    document.addEventListener("scroll", alignSidebar, true);
    window.addEventListener("resize", alignSidebar, true);
    window.addEventListener("load", alignSidebar, true);
    alignSidebar();
    setTimeout(alignSidebar, 100);
}

/**
 * Makes block with similar images foldeable and fold it
 */
function makeSimilarBlockFoldable () {
    const block = getElem("#part2>.post_content, #big_preview_cont+.post_content+.post_content");
    getElem(".title a", block).before(newElem("img", {
        src: "/static/styles/icons/menu-icon.png",
        title: TEXT.showImages,
        click: () => getElem(".image_body", block).classList.toggle("hidden"),
    }));
    getElem(".image_body", block).classList.add("hidden");
}

/**
 * Adds support of meta tags
 */
function makeTagsMeta () {
    function tagCount (li) {
        const count = li.lastElementChild.textContent;
        if (count.includes("K")) {
            return parseInt(count, 10) * 1000;
        }
        return parseInt(count, 10);
    }

    let tags = getAllElems(SETTINGS.metaTags.map((id) => `#tag_li_${id}`).join(","));
    tags = getAllElems("#post_tags li[class=' ']")
        .filter((li) => li.textContent.includes("(cosplay)"))
        // filter out tags with unknown type
        .filter((li) => li.lastElementChild.textContent.trim() !== "1"
                || li.previousElementSibling.nodeName === "LI")
        .concat(tags)
        .sort((t1, t2) => tagCount(t2) - tagCount(t1));
    if (tags.length <= 0) return;

    const span = (getElem("#post_tags li[class=' ']") || {}).previousElementSibling;
    if (span) span.insertAdjacentHTML("beforeBegin", `<span>${TEXT.categories[8]}</span>`);
    tags.forEach((tag) => {
        tag.className = "purple"; // eslint-disable-line no-param-reassign
        tag.firstElementChild.className += " big_tag"; // eslint-disable-line no-param-reassign
        if (span) span.before(tag);
    });
}

/**
 * Adds buttons to visit neighbor posts
 */
async function addNeighborPostsButtons () {
    if (getElem(".chevron_left, .chevron_right")) return;

    const toData = (resp, query) => ({
        query,
        page: resp.page_number,
        lastPage: resp.max_pages,
        // eslint-disable-next-line camelcase
        pos: resp.posts.findIndex(({ id }) => id === post_id),
        lastPos: resp.response_posts_count - 1,
        postIds: resp.posts.map(({ id }) => id),
    });
    let data;
    const getPage = (shift) => ajax(`${PAGES.search}${data.page + shift}${data.query}`);

    const sourceUrl = document.referrer ? new URL(document.referrer) : null;
    const to = new URL(window.location).searchParams.get("to");
    // went to previous page
    if (window.history.state) {
        data = window.history.state;
    // opened neighbor post in the same tab
    } else if (to && sessionStorage.neighborPosts) {
        data = JSON.parse(sessionStorage.neighborPosts);
        delete sessionStorage.neighborPosts;

        // eslint-disable-next-line camelcase
        data.pos = data.postIds.indexOf(post_id);
        if (data.pos < 0) {
            if (to === "prev") {
                data = toData(await getPage(-1), data.query);
            } else if (to === "next") {
                data = toData(await getPage(+1), data.query);
            }
        }
    // opened neighbor post in new tab
    } else if (to && sourceUrl && sourceUrl.pathname.startsWith(PAGES.post)) {
        if (window.opener && window.opener.history.state) {
            data = window.opener.history.state;

            // eslint-disable-next-line camelcase
            data.pos = data.postIds.indexOf(post_id);
            if (data.pos < 0) {
                if (to === "prev") {
                    data = toData(await getPage(-1), data.query);
                } else if (to === "next") {
                    data = toData(await getPage(+1), data.query);
                }
            }
        }
    // opened post from the search page
    } else if (sourceUrl && sourceUrl.pathname.startsWith(PAGES.search)) {
        const resp = await ajax(`${sourceUrl}&type=json`);
        data = toData(resp, `${sourceUrl.search}&type=json`);
    }
    if (!data) return;
    if (data.pos < 0) {
        console.warn("Post position was last");
        return;
    }
    window.history.replaceState(data, document.title);
    sessionStorage.neighborPosts = JSON.stringify(data);

    // add button to prev post
    let postId = (data.page === 0 && data.pos === 0)
        ? null
        : (data.pos !== 0
            ? data.postIds[data.pos - 1]
            : (await getPage(-1)).posts.pop().id);
    getElem(".post_vote_block").prepend(newElem("a", {
        className: "chevron_left",
        css: {
            float: "left",
            cursor: postId ? "pointer" : "not-allowed",
        },
        title: TEXT.hkPrevPost,
        href: postId ? `${PAGES.post}${postId}?lang=${SETTINGS.lang}&to=prev` : null,
        "click auxclick": fixedNewTabLink,
    }));
    // add button to next post
    postId = (data.page === data.lastPage && data.pos === data.lastPos)
        ? null
        : (data.pos !== data.lastPos
            ? data.postIds[data.pos + 1]
            : (await getPage(+1)).posts[0].id);
    getElem(".post_vote_block").append(newElem("a", {
        className: "chevron_right",
        css: {
            float: "right",
            cursor: postId ? "pointer" : "not-allowed",
        },
        title: TEXT.hkNextPost,
        href: postId ? `${PAGES.post}${postId}?lang=${SETTINGS.lang}&to=next` : null,
        "click auxclick": fixedNewTabLink,
    }));
}

/**
 * Adds to post preview picture size, tag number, and status (new/pre/ban)
 */
function addPostStatus () {
    const cache = addPostStatus.cahce || (addPostStatus.cache = {});
    async function makeImgBlockTextElem (postId) {
        if (!cache[postId]) {
            cache[postId] = ajax(`${PAGES.post}${postId}?type=json`);
        }
        const {
            color,
            width,
            height,
            erotics,
            tags,
            status,
        } = await cache[postId];
        const bg = `linear-gradient(to left, rgba(${color},0), rgba(${color},1), rgba(${color},0))`;
        const textColor = color.reduce((s, c) => s + c) / 3 > 96 ? "black" : "white";
        const link = `/pictures/view_posts/0?res_x=${width}&res_y=${height}&lang=${SETTINGS.lang}`;
        const eroticBG = ["none", "#F0F", "#F90", "#F00"][erotics];

        return newElem("div", {
            className: "img_block_text",
            css: {
                opacity: 1,
                background: bg,
                color: textColor,
            },
            children: [
                newElem("a", {
                    href: link,
                    title: `${TEXT.pics} ${width}x${height}`,
                    onclick: "this.target='_blank';return true;",
                    css: { background: eroticBG },
                    text: `${width}x${height}`,
                }),
                " ",
                newElem("span", {
                    title: "Tags Num",
                    text: `(${tags.length})`,
                }),
                TEXT.statuses[status] ? newElem("br") : "",
                TEXT.statuses[status],
            ],
        });
    }

    getAllElems("td:nth-child(3) a").forEach(async (a) => {
        const postId = a.href.match(/\d+/)[0];

        a.after(newElem("div", {
            className: "img_block2",
            children: [await makeImgBlockTextElem(postId)],
        }));
        a.nextElementSibling.prepend(a);
    });

    getAllElems(".body + .body > span > a").forEach(async (a) => {
        const postId = a.href.match(/\d+/)[0];

        a.after(await makeImgBlockTextElem(postId));
    });
}

/**
 * Sequentially make preview of file and upload it to the site
 * @param  {File} file - File for uploading
 * @return {Promise<undefined>}
 */
async function uploadFile (file) {
    const trasnparentImage = ( // transparent 1x1 image
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    );
    // eslint-disable-next-line object-curly-newline
    const toRGBA = ({ r, g, b, a = 1 }, a2 = a) => `rgba(${r},${g},${b},${a2})`;
    const toContrastColor = ({ r, g, b }) => ((r + g + b) > 128 * 3 ? "black" : "white");

    const id = (uploadFile.maxID || 0) + 1;
    uploadFile.maxID = id;
    let color = { r: 128, g: 128, b: 128 };

    // make post preview
    const post = newElem("span", {
        data: { id },
        className: "img_block_big pending",
        children: [
            newElem("a", {
                target: "_blank",
                children: [newElem("img", {
                    className: "img_sp",
                    title: file.name,
                    alt: file.name,
                    src: trasnparentImage,
                })],
            }),
            newElem("div", {
                className: "img_block_text",
                children: [
                    newElem("strong", { className: "dim" }),
                    newElem("br"),
                    newElem("span", { className: "status", text: TEXT.pending }),
                    newElem("div", { className: "progress" }),
                ],
            }),
        ],
    });
    getElem("#posts").append(post);
    const status = getElem(".status", post);

    // save the post in history
    function save () {
        const state = (window.history.state || {});
        state[post.dataset.id] = {
            html: post.innerHTML,
            isPending: post.classList.contains("pending"),
            hasError: post.classList.contains("error"),
        };
        window.history.replaceState(state, null);
    }

    save();

    // do only 1 preview at the same time
    uploadFile.previewQueue = (uploadFile.previewQueue || Promise.resolve())
        .then(() => new Promise((resolve) => {
            const img = new Image();
            img.addEventListener("load", () => {
                status.textContent = TEXT.reading;
                // get dimensions
                let height = img.naturalHeight || img.offsetHeight || img.height;
                let width = img.naturalWidth || img.offsetWidth || img.width;
                getElem(".dim", post).textContent = `${width}x${height}`;
                // resize the dimensions
                [width, height] = width >= height
                    ? [300, height / width * 300]
                    : [width / height * 300, 300];
                // resize the image
                const canvas = newElem("canvas");
                const context = canvas.getContext && canvas.getContext("2d");
                canvas.height = height;
                canvas.width = width;
                context.drawImage(img, 0, 0, width, height);
                // calculate average color
                const rgb = { r: 0, g: 0, b: 0 };
                const { data: subpixels } = context.getImageData(0, 0, width, height);
                const pixelCount = subpixels.length / 4;
                for (let i = 0, len = subpixels.length; i < len; i += 4) {
                    rgb.r += subpixels[i];
                    rgb.g += subpixels[i + 1];
                    rgb.b += subpixels[i + 2];
                    // ignore alpha channel
                }
                rgb.r = Math.floor(rgb.r / pixelCount);
                rgb.g = Math.floor(rgb.g / pixelCount);
                rgb.b = Math.floor(rgb.b / pixelCount);

                // save and apply the color and preview
                color = rgb;
                getElem(".img_block_text", post).style.background = toRGBA(color, 0.7);
                getElem(".img_block_text", post).style.color = toContrastColor(color);
                getElem("img", post).style.borderColor = toRGBA(color, 1);
                getElem("img", post).style.boxShadow = `0 0 20px ${toRGBA(color, 1)}`;
                getElem("img", post).src = canvas.toDataURL("image/jpeg", 0.75);

                status.textContent = TEXT.pending;

                save();
                resolve();
            });
            img.src = URL.createObjectURL(file);
        }));

    await uploadFile.previewQueue;

    // upload only 1 file at the same time
    uploadFile.uploadQueue = (uploadFile.uploadQueue || Promise.resolve())
        .then(() => new Promise((resolve) => {
            const slots = getElem("#slot_status");
            const prog1 = getElem(".img_block_text", post);
            const prog2 = getElem(".progress", post);
            // if no free slots
            if (slots.dataset.totalSlots - slots.dataset.usedSlots <= 0) {
                post.classList.add("error");
                status.textContent = TEXT.noSlots;
                resolve();
                return;
            }
            // if file size is over 50 MB
            if (file.size >= 50 * 1024 * 1024) {
                post.classList.add("error");
                status.textContent = TEXT.bigFile;
                resolve();
                return;
            }
            // if bigger side of the image is less 800 px
            if (getElem(".dim", post).textContent.match(/\d+/g).every((size) => +size < 800)) {
                post.classList.add("error");
                status.textContent = TEXT.smallDimension;
                resolve();
                return;
            }

            // use XHR because the fetch doesn't allow create an upload progress bar
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", (ev) => {
                // update progress bar
                const num = Math.floor(Math.min(100, Math.max(0, ev.loaded / ev.total * 100)));
                prog1.style.background = (
                    `linear-gradient(to right, transparent ${num}%, ${toRGBA(color, 0.7)} ${num}%)`
                );
                prog2.style.background = (
                    `linear-gradient(to right, rgba(0,150,0,0.7) ${num}%, transparent ${num}%)`
                );
                if (ev.loaded === ev.total) {
                    status.textContent = TEXT.processing;
                }
            });
            xhr.addEventListener("load", () => {
                if (xhr.status === 200) {
                    // HTML response
                    const cont = document.createRange()
                        .createContextualFragment(xhr.responseText)
                        .querySelector(".post_content");
                    // if it's duplicate
                    if (cont.querySelector(".body span[style='color: red;'] ~ .img_block2")) {
                        status.textContent = TEXT.duplicate;
                        post.classList.add("error");
                        getElem("a", post).href = cont.querySelector("a").href;
                        getElem("img", post).src = cont.querySelector("img").src
                            .replace("_sp.", "_cp.");
                    // if there was no free slots
                    } else if (cont.querySelector("form span[style='color: red;']")) {
                        status.textContent = TEXT.noSlots;
                        post.classList.add("error");
                        slots.dataset.usedSlots = slots.dataset.totalSlots;
                        slots.textContent = TEXT.slots(slots.dataset.usedSlots, 0);
                    // if uploading was successful
                    } else {
                        status.textContent = (
                            cont.querySelector(".img_block_text").lastChild.textContent
                        );
                        getElem("a", post).href = cont.querySelector("a").href;
                        getElem("img", post).src = cont.querySelector("img").src
                            .replace("_sp.", "_cp.");
                        slots.dataset.usedSlots = +slots.dataset.usedSlots + 1;
                        slots.textContent = TEXT.slots(
                            slots.dataset.usedSlots,
                            slots.dataset.totalSlots - slots.dataset.usedSlots,
                        );
                    }
                } else {
                    status.textContent = TEXT.netError;
                    post.classList.add("error");
                }
                // hide progress bar
                prog1.style.background = toRGBA(color, 0.7);
                prog2.style.background = "none";
                post.classList.remove("pending");
                save();
                resolve();
            });
            xhr.open("POST", "/pictures/view_add_wall", true);
            const form = new FormData();
            form.append("file0", file);
            xhr.send(form);
            status.textContent = TEXT.uploading;
        }));
}

/**
 * Replace original upload form with drag'n'drop form
 */
function improveFileUploader () {
    GM_addStyle(`
        #posts .img_block_big {
            box-sizing: border-box;
        }
        #posts .img_sp {
            max-height: 100%;
            max-width: 100%;
        }
        #posts .img_block_text {
            background:rgba(128,128,128,0.7);
            color:white;
        }
        #posts .progress {
            width: 100%;
            height: 100%;
            position: absolute;
            bottom: 0;
            z-index: -1;
        }
        #posts .img_block_big.error {
            border: red 2px solid;
        }
        #posts .img_block_big.error .status {
            color: red;
        }

        #mfiles {
            display: none;
        }
        #mfiles + label {
            cursor: pointer;
            text-cecoration: underline;
        }

        #dragndrop {
            position: fixed;
            width: calc(100% - 360px);
            margin: 30px;
            bottom: 0;
            top: 46px;
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
            z-index: 21;
        }
    `);
    // replace "You have # unproven pictures you can still upload #." with editable version.
    const [usedSlots, freeSlots] = getElem(".post_content .body div").textContent.match(/\d+/g);
    const formBody = getElem(".post_content .body");
    formBody.firstElementChild.remove();
    formBody.prepend(newElem("span", {
        id: "slot_status",
        data: {
            usedSlots,
            totalSlots: +usedSlots + +freeSlots,
        },
        text: TEXT.slots(usedSlots, freeSlots),
    }));

    // replace old form with new one
    const posts = newElem("div", {
        id: "posts",
        className: "posts_block",
    });
    const fileField = newElem("input", {
        id: "mfiles",
        type: "file",
        multiple: true,
        accept: "image/*",
        change () { Array.from(this.files).forEach(uploadFile); },
    });
    const ffLabel = newElem("label", {
        htmlFor: "mfiles",
        text: TEXT.fileLabel,
    });
    document.forms[1].style.display = "none";
    document.forms[1].parentElement.append(newElem("br"), fileField, ffLabel);
    getElem("#cont").append(posts);

    // drag'n'drop label
    const dnd = newElem("div", {
        id: "dragndrop",
        text: TEXT.dragndrop,
    });
    document.body.append(dnd);
    document.addEventListener("scroll", (ev) => {
        const {
            scrollTop,
            scrollHeight,
            clientHeight,
        } = document.scrollingElement;
        const top = Math.max(0, 46 - scrollTop);
        const bottom = Math.max(0, scrollTop + clientHeight + 120 - scrollHeight);
        dnd.style.top = `${top}px`;
        dnd.style.bottom = `${bottom}px`;
    }, false);
    // drag'n'drop events
    const cont = getElem("#content");
    cont.style.minHeight = `${getElem("#body_wrapper").offsetHeight - 10}px`;
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => cont.addEventListener(
        eventName,
        (ev) => { ev.preventDefault(); ev.stopPropagation(); },
    ));
    ["dragenter", "dragover"].forEach((eventName) => cont.addEventListener(
        eventName,
        (ev) => { dnd.style.opacity = 1; },
    ));
    ["dragleave", "drop"].forEach((eventName) => cont.addEventListener(
        eventName,
        (ev) => { dnd.style.opacity = 0; },
    ));
    cont.addEventListener(
        "drop",
        (ev) => Array.from(ev.dataTransfer.files).forEach((file) => {
            if (file.type.startsWith("image/")) uploadFile(file);
        }),
    );

    // warn about leaving the page during uploading
    window.addEventListener("beforeunload", () => (getElem(".pending", posts) ? true : null));

    // restore posts
    const { state } = window.history;
    if (!state) return;
    Object.entries(state).forEach(([postId, { html, isPending, hasError }]) => {
        uploadFile.maxID = Math.max(uploadFile.maxID || 0, postId);
        // create post
        const post = newElem("span", {
            data: { id: postId },
            className: "img_block_big",
            html,
        });
        posts.append(post);
        // update post status
        if (isPending || !getElem("a", post).href) {
            getElem(".status", post).textContent = TEXT.interrupted;
            post.classList.add("error");
        } else if (hasError) {
            post.classList.add("error");
        } else {
            ajax(`${getElem("a", post).href}&type=json`).then((postInfo) => {
                const status = TEXT.statuses[postInfo.status];
                getElem(".status", post).textContent = status;
                if (!status) {
                    getElem("br").style.display = "none";
                }
            });
        }
    });
}

/**
 * Creates table with AP Enhancements settings
 * @return {HTMLTableElement} Table with settings
 */
function buildSettings () {
    return newElem("table", {
        id: "AP_Enhancements",
        className: "form_table",
        children: [
            ...SETTINGS
                .getAll()
                .filter(({ descr }) => descr !== null)
                .map(({ name }) => SETTINGS.getAsRow(name)),
        ],
    });
}

// TODO list
// support of aliases
// tag name accorting to user language
// SPA
// display hidden search options
// show who deleted the tag
// style the scrollbar
// open all links in new tab

// =============================================================================
//                         Program execution start
// =============================================================================

GM_addStyle(`
    .hidden {
        display: none;
    }
    /* some general fixes */
    .title {
        height: 32px;
    }
    .sidebar_login img {
        vertical-align: top;
    }
    .title > img {
        vertical-align: middle;
        cursor: pointer;
    }

    /* for say() */
    ul.autocomplite:not(#id) {
        z-index: 130;
    }
    #dialog {
        position: fixed;
        top: 0;
        margin: 0;
        height: 100%;
        width: 100%;
        display: flex;
        z-index: 100;
        background: rgba(0,0,0,0.75);
    }
    #dialog > div {
        margin: auto;
    }
    #dialog .body {
        margin: 0;
    }

    /* comments on post page */
    #cont.cont_view_post > :not([id]):not(:first-child) {
        width: 680px;
        min-width: auto;
    }

    /* for long request and actions */
    body.wait *,
    body.waiting * {
        cursor: wait;
    }
    body.wait a, body.wait a *,
    body.waiting a, body.waiting a * {
        cursor: progress;
    }

    /* for meta tags */
    .tags .purple a {
        color: #870fff;
    }
    .tags .purple a + span {
        border-color: #9c60d7 #9658d5 #8f4bd2;
        background-image: linear-gradient(to bottom, #bd95e4, #a36cda);
    }
    .messages td>div.img_block2 {
        width: 150px;
    }

    /* for recommended tags */
    .tags li.preTag a {
        border-left: 2px solid aqua;
    }
    #AP_Enhancements .tags .icon_frame,
    .tags li.preTag .icon_delete,
    .tags li.preTag .icon_frame,
    .tags li:not(.preTag) .accept,
    .tags li:not(.preTag) .decline {
        display: none;
    }

    /* for post status */
    .body + .body .img_block_text + .img_block_text {
        display: none;
    }
    .body + .body .img_block2:hover .img_block_text:not(:last-child) {
        display: none;
    }
    .body + .body .img_block2:hover .img_block_text + .img_block_text {
        display: block;
    }

    /* hide the spin buttons */
    input[type='number']::-webkit-inner-spin-button { display: none; }
`);
if (SETTINGS.isThemeDark) {
    GM_addStyle(`
        textarea {
            border-color: #666;
        }
        ul.autocomplite li {
            border-color: #666;
        }
    `);
}
if (SETTINGS.hideNewPostMessage) {
    GM_addStyle(`
        #cont > .post_content:first-child[style="color: red;"] {
            display: none;
        }
    `);
}

document.addEventListener("keydown", onhotkey);
unsafeWindow.registerHotkey = registerHotkey;

// make sidebar floating
if (!pageIs.editTag && SETTINGS.floatingSidebar) {
    GM_addStyle(floatingSidebarCSS);
    onready(makeSidebarFloating);
}

// make layout wide
if (pageIs.post && SETTINGS.wideLayout) {
    GM_addStyle(wideLayoutCSS);
    onready(makeLayoutWide);
}

onready(() => {
    /* eslint-disable camelcase */
    // update some settings
    if (!pageIs.editTag) {
        if (lang !== SETTINGS.lang) SETTINGS.lang = lang;
        if (is_moderator !== SETTINGS.isModerator) SETTINGS.isModerator = is_moderator;
        if ((site_theme === "second") !== SETTINGS.isThemeDark) {
            SETTINGS.isThemeDark = site_theme === "second";
        }
    }

    // show waiting cursor if some network request executes over 500ms
    // let timer;
    const origAjax = ajax_request2;
    unsafeWindow.ajax_request2 = function newAjaxRequest2 (url, params, handler, method) {
        // if (timer) clearTimeout(timer);
        const timer = setTimeout(() => document.body.classList.add("waiting"), 500);
        const newHandler = (...args) => {
            /* if (timer) timer = */ clearTimeout(timer);
            document.body.classList.remove("waiting");
            handler(...args);
        };
        origAjax(url, params, newHandler, method);
    };
    /* eslint-enable camelcase */

    addOptionalHotkeys();

    if (pageIs.post) {
        addNeighborPostsButtons();

        if (SETTINGS.foldSimilarBlock) makeSimilarBlockFoldable();
    }

    // show AP Enhancements settings on the profile settings page
    if (pageIs.settings) {
        getElem("#cont").append(
            newElem("h2", { text: TEXT.hkAPEOptions, css: { textAlign: "center" } }),
            buildSettings(),
        );
    }

    if (pageIs.comments || pageIs.moderatePreTags || pageIs.post) {
        addPostStatus();
    }

    if (pageIs.uploadPicture) {
        improveFileUploader();
    }

    // on tag list change
    if (pageIs.post) {
        new MutationObserver(() => {
            makeTagsMeta();
        }).observe(getElem("#post_tags"), { childList: true });
        makeTagsMeta();
    }
});

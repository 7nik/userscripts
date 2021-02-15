// ==UserScript==
// @name         AP Enhancements for users
// @namespace    7nik@anime-pictures.net
// @version      1.3.0
// @description  Makes everything great!
// @author       7nik
// @homepageURL  https://github.com/7nik/userscripts
// @supportURL   https://github.com/7nik/userscripts/issues
// @updateURL    https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// @downloadURL  https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// @match        https://anime-pictures.net/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM.xmlHttpRequest
// @connect      donmai.us
// ==/UserScript==

/* global lang site_theme post_id ajax_request2 is_login is_moderator AnimePictures */
/* eslint-disable sonarjs/no-duplicate-string, sonarjs/cognitive-complexity, max-classes-per-file */

"use strict";

// dictionary of localized texts
const TEXT = new Proxy(
    {
        /**
         * Returns one of the plural form according to the given number
         * @param  {number} n - The number for plural form
         * @param  {string[]} pluralForms - Array of plural forms
         * @return {string} The plural form according to the number
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
                        "непроверенное изображение",
                        "непроверенных изображения",
                        "непроверенных изображений",
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
            zh_CH: [
                "未知",
                "字符",
                "参考",
                "版权 (产品)",
                "作者",
                "游戏版权",
                "其他版权",
                "对象",
                "meta tags",
                "deleted by moderator",
            ],
            es: [
                "unknown",
                "personaje",
                "referencia",
                "copyright(producto)",
                "autor",
                "copyright del juego",
                "otros copyright",
                "object",
                "meta tags",
                "deleted by moderator",
            ],
            it: [
                "sconosciuto",
                "character",
                "riferimento",
                "copyright (prodotto)",
                "autore",
                "game copyright",
                "altro copyright",
                "oggetto",
                "meta tags",
                "deleted by moderator",
            ],
            de: [
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
            fr: [
                "Inconnu",
                "Personnages",
                "Référence",
                "Droit d’auteur du produit",
                "Auteur",
                "Droit d’auteur du jeu",
                "Autre droit d’auteur",
                "Objets",
                "Meta tags",
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
        aliasesTags: {
            en: "Aliases tags",
            ru: "Теги синонимы",
            zh_CH: "标签别名",
            it: "Tag alias",
        },
        availableHotkeys: {
            en: "Hotkeys available on this page",
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
            ru: "Выберите или перетащите файлы сюда",
        },
        hkAddTagsField: {
            en: "(add) focus on an input field for adding/recommending tags",
            ru: "(add) фокус на поле для добавления/рекомендации тегов",
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
            ru: "(comment) фокус на поле для коментария/сообщения",
        },
        hkDeclineTagChanges: {
            en: "decline changes of a tag and close the window",
            ru: "отклонить изменения тега и закрыть окно",
        },
        hkDownload: {
            en: "(download) download the image",
            ru: "(download) скачать изображение",
        },
        hkFavorite: {
            en: "(favorite) add the image to default favorite",
            ru: "(favorite) добавить изображение в избранные",
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
            ru: "(view) открыть оригинал изображения",
        },
        hkPasteUrl: {
            en: "Paste URL",
            ru: "Вставьте ссылку",
        },
        hkPicture: {
            en: "(picture) turn the selected URL to picture",
            ru: "(picture) сделать выделенную ссылку изображением",
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
            ru: "(star) звёзднуть изображение",
        },
        hkUnderline: {
            en: "(underline) make selected text underline",
            ru: "(underline) сделать выделенный текст подчёркнутым",
        },
        hkUnfovarite: {
            en: "(unFavorite) remove the image from favorite",
            ru: "(unFavorite) убрать изображение из избранных",
        },
        hkUnstar: {
            en: "(unStar) unstar the image",
            ru: "(unStar) раззвездить изображение",
        },
        hotkeys: {
            en: "hotkeys",
            ru: "горячие клавиши",
        },
        interrupted: {
            en: "Interrupted",
            ru: "Прервано",
        },
        isntLogined: {
            en: "You must login for correct work of the userscript",
            ru: "Вы должны авторизоватся для правильной работы юзерскрипта",
        },
        isntModerator: {
            en: "You don't have moderator rights!",
            ru: "У вас нет прав модератора!",
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
        pPicsAfter: {
            en: "Pictures published since ",
            ru: "Изображения опубликованные после ",
        },
        pPrePics: {
            en: "Pictures with PRE status only",
            ru: "Изображения только со статусом ПРЕ",
        },
        pUserAllFav: {
            en: "All pictures favorited by ",
            ru: "Все изображения добавленные в избранные пользователем ",
        },
        pUserFavorited: {
            // Pictures favorited as "Nice pics" by SomeUserName
            en: `Pictures favorited as "%s" by `,
            ru: `Изображения добавленные в избранное "%s" пользователем `,
        },
        pUserPics: {
            en: "Pictures uploaded by ", // + SomeUserName
            ru: "Изображения загруженные пользователем ",
        },
        pUserStars: {
            en: "Pictures starred by ", // + SomeUserName
            ru: "Изображения звёзднутые пользователем ",
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
            ru: "Показать изображения",
        },
        sourceID: {
            en: "Source ID",
            ru: "ID источника",
        },
        sAlwaysLoadPreTags: {
            en: "Always load recommended tags",
            ru: "Всегда загружать рекомендованные теги",
        },
        sEnablePermRecTags: {
            en: "Add to post the permanently recommended tags",
            ru: "Добавлять к посту постоянно рекомендуемые теги",
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
            ru: "Не показать сообщение о новом посте",
        },
        sMetaTags: {
            en: `"Set" type meta for these tags`,
            ru: `"Задать" этим тегам тип мета`,
        },
        sOpenLinkInNewTab: {
            en: "Open all links in new tab",
            ru: "Открывать все ссылки в новой вкладке",
        },
        sPermRecTags: {
            en: "Permanently recommended tags",
            ru: "Постоянно рекомендуемые теги",
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
        lang: new URL(window.location.href).searchParams.get("lang")
            || localStorage.AP_Enhancements_lang
            || "en",
        get (dictinary, name) {
            return dictinary[name][this.lang] || dictinary[name].en;
        },
    },
);

/**
 * Raw tag - site's object that descripes a tag
 * @typedef {Object} RawTag
 * @property {number} id - The tag id
 * @property {string} tag - The English tag name
 * @property {string} tag_ru - The Russian tag name
 * @property {string} tag_jp - The Japanese tag name
 * @property {number} num - The number of posts with this tag
 * @property {number} num_pub - The number of published posts with this tag
 * @property {number} type - The tag type
 * @property {string} description_en - The English description of the tag
 * @property {string} description_ru - The Russian description of the tag
 * @property {string} description_jp - The Japanese description of the tag
 * @property {number} alias - Id of the aliased tag or null
 * @property {number} parent - Id of the parent tag or null
 * @property {number} views - How many users viewed this tag (now counting is stopped)
 */
/**
 * Presented tag - site's object that descripes a tag added to a post
 * @typedef {RawTag} PresentedTag
 * @property {Date} addtime - When the tag was added
 * @property {Date} removetime - When the tag was removed or null
 * @property {number} user_id - Who added the tag
 */
/**
 * Advenced tag object that should be used when possible
 * @typedef {Object} Tag
 * @property {number} id - The tag id
 * @property {?string} preId - Id of recommendation if it's a recommended tag
 * @property {?string} by - Name of a user which added/recommended the tag
 * @property {string} name - The localized tag name
 * @property {string} enName - The English tag name
 * @property {?string} ruName - The Russian tag name
 * @property {?string} jpName - The Japanese tag name
 * @property {?number} alias - If it's an alias, id of the aliased tag
 * @property {?number} parent - If it's an child, id of the parent tag
 * @property {number} type - The tag type
 * @property {number} count - The number of posts with this tag
 * @property {string} countStr - The number of posts with this tag
 */
/**
 * Info about a user
 * @typedef {Object} User
 * @property {number} id - The user id
 * @property {string} name - The user name
 * @property {number} level - The level of user's rights
 */

// full tag with "empty" fields
const NO_TAG = Object.freeze({
    id: 0,
    preId: null,
    by: null,
    name: "",
    enName: "",
    ruName: null,
    jpName: null,
    alias: null,
    type: 0,
    count: 0,
    countStr: "0",
});

// list of settings and methods for work with them
const SETTINGS = new Proxy({
    // private settings
    isFirstRun: {
        descr: null,
        type: "boolean",
        defValue: true,
    },
    lang: {
        descr: null,
        type: "string",
        defValue: "en",
    },
    themeName: {
        descr: null,
        type: "string",
        defValue: "first",
    },
    isModerator: {
        descr: null,
        type: "boolean",
        defValue: false,
    },
    tagsCache: {
        descr: null,
        type: "cache",
        defValue: {
            levels: [{}, {}, {}, {}],
            lifetime: 30 * 24 * 60 * 60 * 1000, // 1 month
            lastUpdate: 0,
        },
    },
    userCache: {
        descr: null,
        type: "cache",
        defValue: {
            levels: [{}, {}, {}, {}],
            lifetime: 30 * 24 * 60 * 60 * 1000, // 1 month
            lastUpdate: 0,
        },
    },
    preTagsCache: {
        descr: null,
        type: "cache",
        defValue: {
            levels: [{}],
            lifetime: 24 * 60 * 60 * 1000, // 1 day
            lastUpdate: 0,
        },
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
    openLinkInNewTab: {
        descr: TEXT.sOpenLinkInNewTab,
        type: "boolean",
        defValue: false,
    },
    alwaysLoadPreTags: {
        descr: TEXT.sAlwaysLoadPreTags,
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
    prefix: "AP_Enhancements_",
    cache: (() => {
        const cache = {};
        window.addEventListener("storage", ({ key, storageArea }) => {
            const name = key.slice(16);
            if (storageArea === localStorage && name in cache) delete cache[name];
        });
        return cache;
    })(),
    // find a setting object, not a setting value
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
    // whether a setting value is valid
    isValid (list, name, value) {
        const setting = this.find(list, name);
        if (!setting) return false;
        switch (setting.type) {
            case "string":   return typeof value === "string";
            case "boolean":  return typeof value === "boolean";
            case "object":   return value && typeof value === "object";
            case "list":     return value in setting.values;
            case "tag-list": return Array.isArray(value) && value.every((n) => Number.isFinite(n));
            case "tag":      return value
                                && typeof value === "object"
                                && "id" in value
                                && "enName" in value;
            case "cache":    return value
                                && typeof value === "object"
                                && Array.isArray(value.levels)
                                && value.levels.every((obj) => typeof obj === "object")
                                && typeof value.lifetime === "number"
                                && typeof value.lastUpdate === "number";
            default:
                console.error(`Unsupported type ${setting.type}`);
                return null;
        }
    },
    // append new setting object
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
        if (
            setting.type === "cache"
                ? !(Number.isFinite(setting.lifetime)
                    && setting.defValue
                    && typeof setting.defValue === "object"
                    && "data" in setting.defValue
                    && "lastUpdate" in setting.defValue)
                : !this.isValid({ s: setting }, "s", setting.defValue)
        ) {
            console.error(`The default value "${setting.defValue}" isn't valid`);
            return;
        }
        list[name] = setting;
    },
    // get all setting objects
    getAll (list) {
        return Reflect.ownKeys(list).map((name) => this.find(list, name));
    },
    // get HTMLElement to edit a setting value
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
                    // force update tag value in the tag cache to update its type
                    const cache = this.get(list, "tagsCache");
                    cache.remove(newTag.id);
                    this.set(list, "tagsCache", cache);
                    this.set(list, name, idList);
                    // display tags as sorted
                    Promise.all(idList.map((id) => getTagInfo(id)))
                        .then((tags) => tags.sort((t1, t2) => t2 - t1))
                        .then((tags) => tags.map((tag) => newTagItem(tag)))
                        .then((items) => {
                            elem.lastChild.lastChild.innerHTML = "";
                            elem.lastChild.lastChild.append(...items);
                        });
                };
                const removeTagItem = (ev) => {
                    if (!ev.target.matches(".icon_delete")) return;
                    const idDel = +ev.target.parentNode.dataset.tagId;
                    ev.target.closest("li").remove();
                    idList.splice(idList.findIndex((id) => id === idDel), 1);
                    // force update tag value in the tag cache to update its type
                    const cache = this.get(list, "tagsCache");
                    cache.remove(idDel);
                    this.set(list, "tagsCache", cache);
                    this.set(list, name, idList);
                };
                elem = newElem(
                    "form",
                    {
                        submit: (ev) => {
                            addTagItem(ev);
                            ev.preventDefault();
                            ev.stopPropagation();
                        },
                    },
                    newTagInput(NO_TAG, (tag) => { newTag = tag; }),
                    newElem("input", {
                        type: "submit",
                        value: TEXT.add,
                        css: { marginLeft: "5px" },
                        click: addTagItem,
                    }),
                    newElem(
                        "div",
                        { css: { paddingRight: "100px" } },
                        newElem("ul", {
                            className: "tags",
                            click: removeTagItem,
                        }),
                    ),
                );
                Promise.all(idList.map((id) => getTagInfo(id)))
                    .then((tags) => tags.sort((t1, t2) => t2 - t1))
                    .then((tags) => tags.map((tag) => newTagItem(tag)))
                    .then((items) => elem.lastChild.lastChild.append(...items));
                return elem;
            }

            case "string":
            case "object":
            case "cache":
                console.error(`Unimplemented input field for ${setting.type} type`);
                return null;
            default:
                console.error(`Unsupported type ${setting.type}`);
                return null;
        }
    },
    // get <tr> to edit a setting value
    getAsRow (list, name) {
        const setting = this.find(list, name);
        if (!setting) return null;
        const row = newElem("tr", { html: `<td>${setting.descr}</td><td></td>` });
        row.lastChild.append(this.getAsElement(list, name));
        return row;
    },
    // reset value to defaul one
    reset (list, name) {
        const setting = this.find(list, name);
        if (!setting) return;
        this.set(list, name, setting.defValue);
        delete this.cache[name]; // due to cache
    },

    // get a setting value
    get (list, name) {
        // if is's method of SETTINGS
        if (name in this) return (...args) => this[name](list, ...args);
        if (name in this.cache) return this.cache[name];

        const setting = this.find(list, name);
        if (!setting) return null;

        let value = JSON.parse(localStorage.getItem(this.prefix + name) ?? "null");
        if (!this.isValid(list, name, value)) {
            localStorage.setItem(this.prefix + name, JSON.stringify(setting.defValue));
            value = setting.defValue;
        }

        if (setting.type === "cache") {
            // eslint-disable-next-line no-use-before-define
            value = new Cache(value.levels, value.lifetime, value.lastUpdate);
        }

        this.cache[name] = value;
        return value;
    },
    // set a setting value
    set (list, name, value) {
        const setting = this.find(list, name);
        if (!setting) return false;

        if (this.isValid(list, name, value)) {
            localStorage.setItem(this.prefix + name, JSON.stringify(value));
            this.cache[name] = value;
            return true;
        }
        console.error(`The value ${value} cannot be set to ${name}.`);
        return false;
    },
});

// page names of the pathnames
const PAGES = {
    origin:          "https://anime-pictures.net",
    any:             "/",
    main:            "/",
    api:             "/api/",
    chat:            "/chat/view",
    about:           "/index/about",
    moderatePreTags: "/pictures/moderating_pre_tags/",
    yourPreTags:     "/pictures/pre_tags/",
    uploadPicture:   "/pictures/view_add_wall",
    comments:        "/pictures/view_all_comments/",
    editTag:         "/pictures/view_edit_tag/",
    post:            "/pictures/view_post/",
    searchPosts:     "/pictures/view_posts/",
    PMChat:          "/profile/messages/",
    PMList:          "/profile/messages",
    settings:        "/profile/view",
    profile:         "/profile/view_ext_profile/",
    withTextarea: [
        "/chat/view",
        "/pictures/view_edit_tag/",
        "/pictures/view_post/",
        "/profile/messages",
    ],
    strictComparisonIsRequired: [
        "main",
        "settings",
        "PMList",
    ],
};

// list of network methods and the site API
const API = {
    /**
     * Wrapper for `fetch` to execute queries consequentially and show loading cursor for long ones.
     * @param  {string} url - URL of the request
     * @param  {object} options - The options of the query (method, body, etc)
     * @return {Promise<Response>} - The Response object
     */
    ajax (url, body) {
        const timer = setTimeout(() => document.body.classList.add("waiting"), 500);
        const clearTimer = async (resp) => {
            document.body.classList.remove("waiting");
            clearTimeout(timer);
        };
        this.lastAjax = (this.lastAjax || Promise.resolve())
            .then(() => fetch(url, body), () => fetch(url, body));
        this.lastAjax.then(clearTimer);
        return this.lastAjax;
    },
    /**
     * Get and parse HTML page
     * @param  {string} url - URL of the page
     * @return {Promise<Document>} - The parsed page
     */
    html (url) {
        const link = url.includes("lang=")
            ? url
            : url.concat(`${url.includes("?") ? "&" : "?"}lang=${SETTINGS.lang}`);
        return this.ajax(link).then((resp) => {
            if (!resp.ok) throw resp;
            return resp.text().then((text) => new DOMParser().parseFromString(text, "text/html"));
        });
    },
    /**
     * Execute GET query with JSON response
     * @param  {string} url - URL of query
     * @param  {?Object} params - Parameters of the query
     * @return {Promise<Object>} - The parsed JSON response
     */
    get (url, params = null) {
        const fullParams = { ...params, lang: SETTINGS.lang };
        const fullUrl = url
            + (url.includes("?") ? "&" : "?")
            + Object.entries(fullParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
        return this.ajax(fullUrl, { method: "GET" }).then((resp) => {
            if (!resp.ok) throw resp;
            return resp.json();
        });
    },
    /**
     * Execute POST query with JSON response
     * @param  {string} url - URL of query
     * @param  {?Object} params - Parameters of the query
     * @return {Promise<Object>} - The parsed JSON response
     */
    post (url, params = null) {
        const body = { method: "POST" };
        if (params) {
            const fdata = new FormData();
            Object.entries(params).forEach(([key, value]) => fdata.append(key, value));
            body.body = fdata;
        }
        return this.ajax(url, body).then((resp) => {
            if (!resp.ok) throw resp;
            return resp.json();
        });
    },
    /**
     * Extract GET params from the URL
     * @param  {(URL|string)} link - URL with the params
     * @return {Object} - Extracted params
     */
    extractParams (link) {
        const url = "searchParams" in link ? link : new URL(link);
        const params = {};
        [...url.searchParams.entries()].forEach(([key, value]) => { params[key] = value; });
        return params;
    },

    /**
     * Accept recommended tag, requires moderator rights
     * @param  {(number|string)} preTagId - Id of recommendation
     * @return {Promise<Object>} - JSON response
     */
    acceptPreTag: (preTagId) => API.post(`/pictures/accept_pre_tag/${preTagId}`),
    /**
     * Add tags to a post
     * @param  {string} tagNames - List of `||`-separated tags
     * @param  {(number|string)} postId - Id of the post
     * @param  {Boolean} createTags - Allow creating of new tags, requires moderator rights
     * @return {Promise<Object>} - JSON response
     */
    addTags: (tagNames, postId, createTags = false) => API.post(
        `/pictures/add_tag_to_post/${postId}`,
        { text: tagNames, add_new_tag: createTags.toString() },
    ),
    /**
     * Edit tag info, requires moderator rights
     * @param  {RawTag} rawTag - updated tag info
     * @return {Promise<Object>} - JSON response
     */
    editTag: (rawTag) => API.post(
        `/pictures/edit_tag/${rawTag.id}`,
        {
            tag_type: rawTag.type,
            alias: rawTag.alias ?? "",
            parent: rawTag.parent ?? "",
            name_en: rawTag.tag,
            name_ru: rawTag.tag_ru ?? "",
            name_jp: rawTag.tag_jp ?? "",
            description_en: rawTag.description_en ?? "",
            description_ru: rawTag.description_ru ?? "",
            description_jp: rawTag.description_jp ?? "",
        },
    ),
    /**
     * Decline recommended tag, requires moderator rights or being creator of the recommendation
     * @param  {(number|string)} preTagId - Id of the recommendation
     * @return {Promise<Object>} - JSON response
     */
    declinePreTag: (preTagId) => API.post(`/pictures/del_pre_tag/${preTagId}`),
    /**
     * Get description of a post
     * @param  {(number|string)} postId - Id of the post
     * @return {Promise<Object>} - JSON response
     */
    getPostInfo: (postId) => API.get(`${PAGES.post}${postId}?type=json`),
    /**
     * Get tags on a post
     * @param  {(number|string)} postId - Id of the post
     * @return {Promise<Object>} - JSON response
     */
    getPostTags: (postId) => API.get(`/api/v2/posts/${postId}/tags`),
    /**
     * Get tag info by its Id
     * @param  {(number|string)} tagId - Id of the tag
     * @return {Promise<RawTag>} - JSON response
     */
    getTagById: (tagId) => API.get(`/api/v3/tags/${tagId}`),
    /**
     * Get tag info by its full name in any language
     * Here is 4 possible params: `tag`, `tag_ru`, `tag_jp`, and `tag:smart`.
     * @param  {string} tagName - The tag name
     * @return {Promise<Object>} - JSON response
     */
    getTagsByName: (tagName) => (
        API.get(`/api/v3/tags?tag:smart=${encodeURIComponent(tagName.toLowerCase())}`)
    ),
    /**
     * Get user info by its Id
     * @param  {(number|string)} userId - User If
     * @return {Promise<Object>} - JSON response
     */
    getUserInfo: (userId) => API.get(`${PAGES.profile}${userId}?type=json`),
    /**
     * Delete a tag from a post, requires rights base on post status:
     * NEW - uploader of moderator;
     * PRE - any active member;
     * Public, Banned - moderator only.
     * @param  {(number|string)} tagId - Tag Id to remove
     * @param  {(number|string)} postId - Post Id
     * @return {Promise<Object>} - JSON response
     */
    removeTag: (tagId, postId) => API.post(
        `/pictures/del_tag_from_post/${postId}`,
        { tag_id: tagId },
    ),
    /**
     * Search posts
     * @param  {(number|string)} pageNum - Number of a page result
     * @param  {Object} searchParams - Option of the search
     * @return {Promise<Object>} - JSON response
     */
    searchPosts (pageNum, searchParams = {}) {
        const params = { type: "json" };
        [
            "search_tag",
            "denied_tags",
            "favorite_by",
            "favorite_folder",
            "res_x",
            "res_y",
            "res_x_n", // if set: 1: >=res_x, 0: <=res_x
            "res_y_n", // if set: 1: >=res_y, 0: <=res_y
            "aspect", // double or like 3:4
            "order_by", // date|date_r|rating|views|size|tag_num
            "ldate", // 0-7: off, 1 week, 1 month, 1 day, 6 month,year, 2 years, 3 years
            "small_prev",
            "dmi", // disable moderators images
            "ext_jpg", // only jpeg
            "ext_png", // only png
            "ext_gif", // only gif
            "color", // RR_GG_BB_DD, rgb color + deviation
            "view_after", // timestamp
            "user", // filter by uploader
            "status", // `pre` or nothing
            "stars_by",
        ].forEach((name) => {
            if (name in searchParams) params[name] = searchParams[name];
        });
        return API.get(`${PAGES.searchPosts}${pageNum}`, params);
    },
};

// color-related stuff
const COLORS = {
    tagTypeColor: [
        "", "blue", "", "green", "orange", "green", "green", "", "purple",
    ],
    tagTypeClass: [
        "", "character", "", "copyright", "artist", "copyright", "copyright", "", "meta",
    ],
    eroticLevel: [null, "#F0F", "#F90", "#F00"],
    userName: [null, "#00C", "#0A0", "#F00"],
    tagAdder: {
        curr: "green", // current user
        0: "#888", // regular user
        1: "#00C", // commiter
        2: "#F00", // moderator
        3: "#F00", // admin
    },
    themeColors: {
        first:  ["#066dab", "#f1bf48"],
        second: ["#5d1600", "#210800"],
        third:  ["#3a408b", "#0688d5"],
        fourth: ["#6e0837", "#1a0f1a"],
    },
};

const generalCSS = `
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
        max-height: 100%;
        overflow-y: auto;
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
    .body + .body .img_block2 a.hidden_img {
        position: relative;
    }
    .body + .body .img_block2 a.hidden_img div {
        height: 150px !important;
        width: 150px !important;
        position: absolute;
    }
    .body + .body .img_block2 a.hidden_img img {
        opacity: 0;
        transition: opacity 0.5s;
    }
    .body + .body .img_block2:hover a.hidden_img img {
        opacity: 1;
        transition: opacity 1.5s 0.5s;
    }

    /* hide the spin buttons */
    input[type='number']::-webkit-inner-spin-button { display: none; }

    /* style scrollbars */
    ::-webkit-scrollbar {
        width: 8px;
        height: 10px;
    }
    ::-webkit-scrollbar {
        background: ${SETTINGS.themeName === "second" ? "#6663" : "#4444"};
    }
    ::-webkit-scrollbar-thumb {
        background: ${SETTINGS.themeName === "second" ? "#4446" : "#8888"};
    }
    #content ::-webkit-scrollbar {
        background: ${COLORS.themeColors[SETTINGS.themeName][1]};
    }
    #content ::-webkit-scrollbar-thumb {
        background: ${COLORS.themeColors[SETTINGS.themeName][0]};
    }
    #sidebar:not(#id) {
        margin-right: 1px;
    }

    /* for recommended tags */
    #post_tags .tags li.waiting a,
    #post_tags .tags li.preTag a {
        border-left: 2px solid black;
    }
    .tags li.preTag .icon_delete,
    .tags li.preTag .icon_frame,
    .tags li.waiting .icon_delete,
    .tags li.waiting .icon_frame,
    .tags li.waiting .accept,
    .tags li.waiting .decline,
    .tags li:not(.preTag) .accept,
    .tags li:not(.preTag) .decline {
        display: none;
    }

    /* for APE settings */
    #AP_Enhancements .tags .icon_frame {
        display: none;
    }
    #AP_Enhancements .tags a {
        border-left: none;
    }
`;

const darkThemeCSS = `
    textarea {
        border-color: #666;
    }
    ul.autocomplite li {
        border-color: #666;
    }
    #post_tags .tags li.waiting a,
    #post_tags .tags li.preTag a {
        border-left: 2px solid aqua;
    }
`;

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
        }
        div#cont.cont_view_post {
            margin: 10px auto;
        }
        #cont > #part2 > div:last-child /* comment block wripper */ {
            width: 680px !important;
        }
    }

    @media screen and (orientation: landscape) and (min-width: 1900px) {
        #body_wrapper:not(#id) {
            grid-template-columns: 0 auto 300px;
        }
        /* temporal layout */
        #content > [itemscope]:not(#part0) {
            grid-area: imgPost;
            display: flex !important;
            flex-direction: column;
        }
        #content > [itemscope]:not(#part0) ~  *,
        #content > [itemscope]:not(#part0) > :first-child,
        #content > [itemscope]:not(#part0) > .post_content:nth-child(2):not(.moderator),
        #content > [itemscope]:not(#part0) > .post_content:nth-child(3),
        #content > [itemscope]:not(#part0) > #big_preview_cont + .post_content ~ * {
            display: none;
        }

        div#content {
            width: calc(1280px + (100vw - 1884px) / 3);
            display: grid;
            grid-template-areas:
                "message  message"
                "uploader imgPost"
                "postInfo imgPost"
                "comments imgPost"
                ".        imgPost";
            grid-template-columns: 640px;
            grid-template-rows: repeat(5, min-content);
            gap: 0 calc((100vw - 1884px) / 3);
            margin: 10px 0;
            padding: 0;
            overflow: initial;
        }
        /* ban/new_post message  */
        div#content > div:first-child:not([itemscope]):not(#part0) {
            grid-area: message;
            width: 100%;
            text-align: center;
            margin: 0 0 10px 0;
        }
        #content > #part0 {
            grid-area: uploader;
        }
        #content > #part1 {
            grid-area: imgPost;
        }
        #content > #part2 {
            grid-area: postInfo;
        }
        /* comments */
        #content > :not([id]):not(:first-child) {
            grid-area: comments;
            width: 640px;
            margin-bottom: 0;
        }
        /* Linked pictures */
        #content > #part0 .post_content:nth-child(2) {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        #content > #part0 .post_content:nth-child(2) > .title  {
            align-self: stretch;
        }
        #content > #part0 .post_content:nth-child(2) > .body[style]  {
            max-width: 100%;
        }
        #content > div:not(.post_content) {
            width: 640px !important;
        }
        #content > :not(.post_content) > div:not(.body) {
            width: 640px !important;
            margin: 0 0 10px 0;
        }
        #content :not(#part0) .post_content:last-child {
            margin-bottom: 0;
        }

        #content .moderator {
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
            left: calc(300px + 10px - 100vw);
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
            right: calc((100vw - 1884px) / 3 + 296px);
        }
    }
`;

const floatingSidebarCSS = `
    header > nav {
        box-sizing: border-box;
    }
    #body_wrapper {
        min-height: calc(100vh - 50px);
        margin: 10px 0 0 0;
    }
    div#content[id] {
        margin: 0 10px 10px 0;
    }
    .index-title {
        margin-top: 10px;
    }
    #content > .full_size {
        margin: 0 10px;
    }
    @media screen and (min-width: 1630px) {
        #sidebar > div[style] {
            display: none;
        }
        div#sidebar[id] {
            position: sticky;
            right: 0;
            top: 0;
            margin: 0;
            padding: 0;
            height: calc(100vh - 50px);
            display: flex;
            flex-direction: column;
        }
        div#tags_sidebar[id] {
            position: absolute;
            background: none;
            left: calc(300px + 10px - 100vw);
            top: 0px;
            margin: 0;
            height: 100%;
        }
        div#tags_sidebar[id] > div:last-child {
            display: flex;
            flex-direction: column;
            height: calc(100% - 36px);
            padding: 4px 0 0 0 !important;
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
            left: calc((1884px - 100vw) / 3 - 296px);
        }
    }
`;

// order of tag types in the tag list
const tagTypePosition = {
    3: 0,
    5: 1,
    6: 2,
    1: 3,
    4: 4,
    8: 5,
    2: 6,
    7: 7,
    0: 8,
    9: 9,
};

// list of hotkeys available to everybody
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
        selectors: ["#add_tag_input", "#add_pre_tag_input"],
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
        descr: TEXT.hkStar,
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
            el.value = "Null"; // eslint-disable-line no-param-reassign
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
            `${PAGES.origin}${PAGES.searchPosts}0?search_tag=${getSelText().replace(/\s/g, "+")}`,
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
 * Check whether pathname of url is/starts with `path`
 * Also you indirectly call it by reading a property with the same name as one of `PAGES`
 * @param  {string}  path - A pathname for comparing
 * @param  {boolean} [strict=false] - True: exact matching; false: pathname starts with `path`
 * @param  {(URL|Location|string)} [strict=window.location] - Url for comparing
 * @return {boolean} Whether pathname is/starts with `path`
 */
const pageIs = new Proxy((path, strict = false, url = window.location) => {
    if (!url) return false;
    if (!url.href) {
        try {
            url = new URL(url);
        } catch (ex) {
            console.error(ex);
            return false;
        }
    }
    return strict
        ? url.pathname === path
        : url.pathname.startsWith(path);
}, {
    get (pathIs, pageName) {
        if (PAGES.strictComparisonIsRequired.includes(pageName)) {
            return pathIs(PAGES[pageName], true);
        }
        return pathIs(PAGES[pageName]);
    },
});

/**
 * Collection that automatically removes objects which weren't retrieved during `lifetime` time.
 * The collection uses given levels (maps of objects).
 * At creating collection the data can be moved from one level to next and remove from the last one.
 * When an object get retrived it moves back to the first level.
 */
class Cache {
    /**
     * Creates a collection with given data and removes outdated objects
     * @param  {Object[]} levels - Maps of data
     * @param  {number} lifetime - Time after which obect will be removed if not used
     * @param  {number} lastUpdate - When were last cleanin of the data
     * @return {Cache}
     */
    constructor (levels, lifetime, lastUpdate) {
        this.levels = levels;
        this.lifetime = lifetime;
        this.lastUpdate = lastUpdate;

        if (lastUpdate + lifetime / levels.length < Date.now()) {
            this.levels.pop();
            this.levels.unshift({});
            this.lastUpdate = Date.now();
        }
    }

    get (id) {
        for (let i = 0; i < this.levels.length; i++) {
            const data = this.levels[i][id];
            if (data) {
                if (i > 0) {
                    this.levels[0][id] = data;
                    delete this.levels[i][id];
                }
                return data;
            }
        }
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
    }

    getAll () {
        return this.levels.flatMap((lvl) => Object.values(lvl));
    }

    find (fields, value) {
        const finder = Array.isArray(fields)
            ? (data) => fields.some((field) => data[field] === value)
            : (data) => data[fields] === value;
        for (let i = 0; i < this.levels.length; i++) {
            // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
            const data = Object.values(this.levels[i]).find(finder);
            if (data) {
                if (i > 0) {
                    this.levels[0][data.id] = this.levels[i][data.id];
                    delete this.levels[i][data.id];
                }
                return data;
            }
        }
        // eslint-disable-next-line unicorn/no-useless-undefined
        return undefined;
    }

    findAll (fields, value) {
        const finder = Array.isArray(fields)
            ? (data) => fields.some((field) => data[field] === value)
            : (data) => data[fields] === value;
        const results = [];
        for (let i = 0; i < this.levels.length; i++) {
            // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
            const data = Object.values(this.levels[i]).filter(finder);
            results.push(...data);
            if (data.length > 0 && i > 0) {
                data.forEach(({ id }) => {
                    this.levels[0][id] = this.levels[i][id];
                    delete this.levels[i][id];
                });
            }
        }
        return results;
    }

    remove (id) {
        for (let i = 0; i < this.levels.length; i++) {
            if (id in this.levels[i]) {
                delete this.levels[i][id];
                return true;
            }
        }
        return false;
    }

    add (value, life = 1) {
        if (!("id" in value)) {
            throw new TypeError("The value doesn't have property `id`");
        }
        if (typeof value.id !== "number" && typeof value.id !== "string") {
            throw new TypeError("`id` of the value must be number or string");
        }
        this.remove(value.id);
        this.levels[Math.round((1 - life) * (this.levels.length - 1))][value.id] = value;
    }

    clear () {
        this.levels = this.levels.map(() => ({}));
        this.lastUpdate = Date.now();
    }
}

/**
 * Wrapper for tag that adds some additional methods and protects from modifying
 */
class Tag {
    /**
     * Creates an advanced tag object
     * @param  {(RawTag|Tag)} tag - Raw tag object
     * @return {Tag} Advenced tag
     */
    constructor (tag) {
        if (!tag) return NO_TAG;
        if (!new.target) return new Tag(tag);

        const isRawTag = "tag" in tag;
        this.data = {
            id: tag.id,
            type: tag.type,
            alias: tag.alias,
            parent: tag.parent,
            enName: isRawTag ? tag.tag : tag.enName,
            ruName: isRawTag ? tag.tag_ru : tag.ruName,
            jpName: isRawTag ? tag.tag_jp : tag.jpName,
            count: isRawTag ? tag.num : tag.count,
        };
        if (tag.preId) this.data.preId = tag.preId;
        if (tag.by) this.data.by = tag.by;

        if (this.data.enName.endsWith("(cosplay)") && this.data.type !== 0
            || SETTINGS.metaTags.includes(this.data.id)
        ) {
            this.data.type = 8;
        }
    }

    get id () { return this.data.id; }

    get enName () { return this.data.enName; }

    get ruName () { return this.data.ruName; }

    get jpName () { return this.data.jpName; }

    get alias () { return this.data.alias; }

    get parent () { return this.data.parent; }

    get type () { return this.data.type; }

    // writable properties

    get preId () { return this.data.preId; }

    set preId (val) { this.data.preId = val; }

    get by () { return this.data.by; }

    set by (val) { this.data.by = val; }

    // added properties and methods

    get name () {
        if (SETTINGS.lang === "ru") return this.data.ruName || this.data.enName;
        if (SETTINGS.lang === "jp") return this.data.jpName || this.data.enName;
        return this.data.enName;
    }

    get count () {
        return this.data.preId ? this.data.count + 1 : this.data.count;
    }

    get countStr () {
        return this.data.count < 1000
            ? this.data.count.toString()
            : `${Math.floor(this.data.count / 1000)}K`;
    }

    toJSON () { return this.data; }

    toString () {
        return this.data.preId ? `${this.data.enName}#${this.data.preId}` : this.data.enName;
    }

    // allows to sort and compare tags by number of usage
    [Symbol.toPrimitive] (hint) {
        return hint === "number" ? this.data.count : this.toString();
    }

    /**
     * Remove this tag from the list of recommended and from page of recommede tags
     * @return {Promise<undefined>}
     */
    async resolve () {
        const tags = await getRecommendedTags();
        const preTagIndex = tags.findIndex(({ preId }) => preId === this.preId);
        if (preTagIndex < 0) return;
        tags.splice(preTagIndex, 1);
        if (tags.length === 0) {
            const cache = SETTINGS.preTagsCache;
            cache.remove(post_id);
            SETTINGS.preTagsCache = cache;
        }

        if (window.opener) {
            // remove the recommended tag in opener (if it's the moderate recommended tags page)
            window.opener.postMessage({ cmd: "resolve_pretag", preTagId: this.preId });
        }
    }

    /**
     * Accept this recommeded tag
     * @return {Promise<boolean>} - whether tag item should be removed from the page
     */
    async accept () {
        if (!this.preId) {
            console.error(`${this} isn't a recommended tags`);
            return true;
        }
        this.pending = true;
        this.resolve();
        const { success, msg } = await API.acceptPreTag(this.preId);
        this.pending = false;
        if (!success) {
            console.error(`Error of accepting of pretag ${this}:`, msg);
            return true;
        }
        return false;
    }

    /**
     * Decline this recommeded tag
     * @return {Promise<boolean>} - whether tag item should be removed from the page
     */
    async decline () {
        if (!this.preId) {
            console.error(`${this} isn't a recommended tags`);
            return true;
        }
        this.pending = true;
        this.resolve();
        const { success, msg } = await API.declinePreTag(this.preId);
        this.pending = false;
        if (!success) {
            console.error(`Error of removing of pretag ${this}:`, msg);
        }
        return true;
    }
}

/**
 * On post search page, adds Danbooru links to tags and
 * exports Danbooru wiki if a tag doesn't have descriontion.
 * @return {Promise<undefined>}
 */
async function addDanbooruTagDescription () {
    if (!getElem(".posts_body_head h2")) return;
    if (getElem(".posts_body_head.danboored")) return; // no self-triggering
    getElem(".posts_body_head")?.classList.add("danboored");

    const tagNodes = [getElem(".posts_body_head h2").firstChild];
    const aliasesTextNode = [...getElem(".posts_body_head").childNodes]
        .find((node) => node.textContent.startsWith(TEXT.aliasesTags));
    if (aliasesTextNode) {
        let node = aliasesTextNode.nextSibling;
        while (node && node.nodeName !== "BR") {
            if (node.nodeName === "A") {
                tagNodes.push(node);
            }
            node = node.nextElementSibling;
        }
    }

    if (tagNodes.length === 0) return;

    const tags = await Promise.all(tagNodes.map((node) => getTagInfo(node.textContent)));

    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < tags.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const tag = (await GM.xmlHttpRequest({
            url: `https://danbooru.donmai.us/tags.json?search[name_or_alias_matches]=${tags[i].name}&only=name,wiki_page,artist,artist[urls[url]]`,
            responseType: "json",
        })).response[0];
        // eslint-disable-next-line no-continue
        if (!tag) continue;

        tagNodes[i].after(newElem(
            "a",
            {
                href: `https://danbooru.donmai.us/wiki_pages/${tag.name}`,
                css: {
                    verticalAlign: "middle",
                    marginLeft: "0.25ch",
                },
            },
            newElem("img", { src: "https://danbooru.donmai.us/favicon.ico" }),
        ));

        // if no description yet
        if (!getElem(".posts_body_head .description").textContent.trim()) {
            if (tag.artist) {
                getElem(".posts_body_head .description").append(newElem(
                    "details",
                    {},
                    newElem("summary", { css: { outline: "none", cursor: "pointer" } }, "Danbooru's links"),
                    ...tag.artist.urls
                        .flatMap(({ url }) => [newElem("a", { href: url }, url), newElem("br")]),
                ));
            }

            if (tag.wiki_page?.body.length) {
                getElem(".posts_body_head .description").append(newElem(
                    "details",
                    {},
                    newElem("summary", { css: { outline: "none", cursor: "pointer" } }, "Danbooru's description"),
                    ...tag.wiki_page.body.split("\n").flatMap((s) => [s, newElem("br")]),
                ));
            }
        }
    }
}

/**
 * Adds buttons to visit neighbor posts
 */
async function addNeighborPostsButtons (postsData) {
    if (getElem(".chevron_left, .chevron_right")) return;

    let data;
    const toData = (resp, query) => ({
        query,
        page: resp.page_number,
        lastPage: resp.max_pages,
        // eslint-disable-next-line camelcase
        pos: resp.posts.findIndex(({ id }) => id === post_id),
        lastPos: resp.response_posts_count - 1,
        postIds: resp.posts.map(({ id }) => id),
    });
    const getPage = (shift) => API.searchPosts(data.page + shift, data.query);

    const sourceUrl = document.referrer ? new URL(document.referrer) : null;
    const to = new URL(window.location).searchParams.get("to");

    if (postsData) {
        data = postsData;
        data.pos = data.postIds.indexOf(post_id);
        console.log(data);
    // went to previous page
    } else if (window.history.state) {
        data = window.history.state;
    // opened neighbor post in the same tab
    } else if (sessionStorage.neighborPosts) {
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
    } else if (to && pageIs(PAGES.post, false, sourceUrl)) {
        if (window.opener?.history.state) {
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
    } else if (pageIs(PAGES.searchPosts, false, sourceUrl)
            || pageIs(PAGES.moderatePreTags, false, sourceUrl)
            || pageIs(PAGES.uploadPicture, false, sourceUrl)
            || pageIs(PAGES.comments, false, sourceUrl)
    ) {
        window.opener?.postMessage({ cmd: "get_posts_data" }, PAGES.origin);
        return;
    }
    if (!data) return;
    if (data.pos < 0) {
        console.warn("Post position was last", data, post_id);
        return;
    }
    window.history.replaceState(data, document.title);
    sessionStorage.neighborPosts = JSON.stringify(data);

    // add button to prev post
    let postId;
    if (data.page === 0 && data.pos === 0) {
        postId = null;
    } else if (data.pos !== 0) {
        postId = data.postIds[data.pos - 1];
    } else {
        const { posts } = await getPage(-1);
        const pos = posts.indexOf(data.postIds[data.pos]) - 1;
        postId = posts[pos >= 0 ? pos : posts.length - 1].id;
    }
    getElem(".post_vote_block").prepend(newElem("a", {
        className: "chevron_left",
        css: {
            float: "left",
            cursor: postId ? null : "not-allowed",
        },
        title: TEXT.hkPrevPost,
        href: postId ? `${PAGES.post}${postId}?lang=${SETTINGS.lang}&to=prev` : null,
        "click auxclick": onNewTabLinkClick,
    }));
    // add button to next post
    if (data.page === data.lastPage && data.pos === data.lastPos) {
        postId = null;
    } else if (data.pos !== data.lastPos) {
        postId = data.postIds[data.pos + 1];
    } else {
        const { posts } = await getPage(+1);
        const pos = posts.indexOf(data.postIds[data.pos]) + 1;
        postId = posts[pos < posts.length ? pos : 0].id;
    }
    getElem(".post_vote_block").append(newElem("a", {
        className: "chevron_right",
        css: {
            float: "right",
            cursor: postId ? null : "not-allowed",
        },
        title: TEXT.hkNextPost,
        href: postId ? `${PAGES.post}${postId}?lang=${SETTINGS.lang}&to=next` : null,
        "click auxclick": onNewTabLinkClick,
    }));
}

/**
 * Adds hotkeys for pagination if needed
 */
function addPaginationHotkeys () {
    // there are too many pages with pagination to list them
    if (pageIs.searchPosts || getElem(".numeric_pages a")) {
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
 * Adds to post preview picture size, tag number, and status (new/pre/ban)
 */
function addPostStatus () {
    const cache = addPostStatus.cahce || (addPostStatus.cache = {});
    async function makeImgBlockTextElem (postId) {
        if (!cache[postId]) {
            cache[postId] = API.getPostInfo(postId);
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
        // eslint-disable-next-line unicorn/no-reduce
        const textColor = color.reduce((sum, col) => sum + col) / 3 > 96 ? "black" : "white";
        const link = `/pictures/view_posts/0?res_x=${width}&res_y=${height}&lang=${SETTINGS.lang}`;

        return newElem(
            "div",
            {
                className: "img_block_text",
                css: {
                    opacity: 1,
                    background: bg,
                    color: textColor,
                },
            },
            newElem("a", {
                href: link,
                title: `${TEXT.pics} ${width}x${height}`,
                onclick: "this.target='_blank';return true;",
                css: { background: SETTINGS.isModerator ? COLORS.eroticLevel[erotics] : null },
                text: `${width}x${height}`,
            }),
            " ",
            newElem("span", {
                title: "Tags Num",
                text: `(${tags.length})`,
            }),
            TEXT.statuses[status] ? newElem("br") : "",
            TEXT.statuses[status],
        );
    }

    getAllElems("td:nth-child(3) a").forEach(async (a) => {
        getElem("img", a).style.maxHeight = "150px";
        const postId = a.href.match(/\d+/)[0];

        a.after(newElem(
            "div",
            { className: "img_block2" },
            await makeImgBlockTextElem(postId),
        ));
        a.nextElementSibling.prepend(a);
    });

    getAllElems(".body + .body > span > a").forEach(async (a) => {
        let img = getElem("img", a);
        if (img) img.style.maxHeight = "150px";
        const postId = a.href.match(/\d+/)[0];

        a.after(await makeImgBlockTextElem(postId));
        if (img) return;
        img = newElem("img", {
            className: "img_sp",
            src: (await cache[postId]).small_preview,
        });
        a.classList.add("hidden_img");
        a.append(img);
    });
}

/**
 * Adds given recommended tags to post
 * @param {Tags[]} recommendedTags - tags to add
 * @return {Promise<undefined>}
 */
async function addRecommendedTags (recommendedTags) {
    if (recommendedTags.length <= 0 || getElem(".tags li span.accept")) {
        document.body.classList.remove("wait");
        return;
    }

    getAllElems(".tags li.preTag").forEach((li) => li.remove());
    const presentedTags = new Set(getAllElems(".tags .edit_tag").map((el) => +el.dataset.tagId));

    const tagsToAdd = recommendedTags.filter((tag, i, tags) => {
        // decline presented tags and duplicated tags
        if (presentedTags.has(tag.id) || tags.findIndex((t) => t.id === tag.id) < i) {
            tag.decline();
            return false;
        }
        return true;
    });
    if (tagsToAdd.length === 0) {
        document.body.classList.remove("wait");
        return;
    }

    const getTagTypeByPosition = (pos) => Object.keys(tagTypePosition)
        .find((k) => tagTypePosition[k] === pos);
    const getTagName = (tagItem) => (tagItem?.nodeName === "LI"
        ? tagItem.firstElementChild.textContent.trim()
        : null);

    const types = new Set(tagsToAdd.map(({ type }) => type));
    // eslint-disable-next-line no-restricted-syntax
    for (const type of types) {
        // find tag block of tags of current type
        const spanText = TEXT.categories[type];
        let span = getAllElems(".tags > span").find((el) => el.textContent === spanText);
        // create tag block if there is no tags of current type
        if (!span) {
            const typeCount = TEXT.categories.length; // also includes "deleted by moderator"
            let nextSpan;
            for (let pos = tagTypePosition[type] + 1; !nextSpan && pos < typeCount; pos++) {
                const nextSpanText = TEXT.categories[getTagTypeByPosition(pos)];
                nextSpan = getAllElems(".tags > span")
                    .find((el) => el.textContent === nextSpanText);
            }
            span = newElem("span", { text: TEXT.categories[type] });
            if (nextSpan) {
                nextSpan.before(span);
            } else if (getElem(".tags > span")) {
                getElem(".tags").append(span);
            } else {
                // site bug: no categories if there is only "tagme" tag
                // also includes case when no tags at all
                getElem(".tags").prepend(span, newElem("span", { text: TEXT.categories[9] }));
            }
        }
        // get the recommended tags of the current type in order of usage count
        const tags = tagsToAdd
            .filter((tag) => tag.type === type)
            .sort((t1, t2) => t2 - t1);
        let currentElem = span.nextElementSibling;
        let currentText = getTagName(currentElem);
        // eslint-disable-next-line no-restricted-syntax
        for (const tag of tags) {
            // find a presented tag which has usage count bigger then the recommended tag
            // eslint-disable-next-line no-await-in-loop
            while (currentText && await getTagInfo(currentText, post_id) > tag) {
                currentElem = currentElem.nextElementSibling;
                currentText = getTagName(currentElem);
            }
            if (currentElem) {
                // eslint-disable-next-line no-await-in-loop
                if (currentText && await getTagInfo(currentText, post_id) > tag) {
                    currentElem.after(newTagItem(tag));
                } else {
                    currentElem.before(newTagItem(tag));
                }
            } else {
                getElem(".tags").append(newTagItem(tag));
            }
        }
    }

    document.body.classList.remove("wait");
}

/**
 * Creates table with AP Enhancements settings
 * @return {HTMLTableElement} Table with settings
 */
function buildSettings () {
    return newElem(
        "table",
        {
            id: "AP_Enhancements",
            className: "form_table",
        },
        ...SETTINGS
            .getAll()
            .filter(({ descr }) => descr !== null)
            .map(({ name }) => SETTINGS.getAsRow(name)),
        newElem(
            "tr",
            {},
            newElem(
                "td",
                {
                    colSpan: "2",
                    css: { textAlign: "center" },
                },
                newElem("input", {
                    type: "button",
                    value: "Clear all cache",
                    click: () => {
                        SETTINGS.getAll()
                            .filter(({ type }) => type === "cache")
                            .forEach(({ name }) => SETTINGS.reset(name));
                        window.location.reload();
                    },
                }),
                " ",
                newElem("input", {
                    type: "button",
                    value: "Clear recommended tags cache",
                    click: () => SETTINGS.reset("preTagsCache"),
                }),
            ),
        ),
    );
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
 * Returns first element matching given `selector`
 * @param  {string} selector - A selector for matching
 * @param  {HTMLElement} [container=document] - Where search the element
 * @return {HTMLElement} The found element or null
 */
function getElem (selector, container = document) {
    return container.querySelector(selector);
}

/**
 * Get list of tags recommended to current post
 * @param {boolean} mayUpdatePreTags - whether the list of recommended tags may be updated
 * @return {Promise<Array<Tag>>} Recommended tags
 */
function getRecommendedTags (mayUpdatePreTags = false) {
    if (getRecommendedTags.result) return getRecommendedTags.result;
    getRecommendedTags.result = (async () => {
        const cache = SETTINGS.preTagsCache;
        // return from cache
        if (cache.getAll().length > 0) {
            let tags = cache.get(unsafeWindow.post_id)?.tags ?? [];
            // convert tags to advanced if needed
            if (tags.length > 0 && !("name" in tags[0])) {
                tags = tags.map((t) => new Tag(t));
            }
            return tags;
        }

        if (!mayUpdatePreTags) return [];

        cache.clear();
        document.body.classList.add("wait");
        const { isModerator } = SETTINGS;
        // get recommended tag from <tr>
        const addPreTag = async (tr) => {
            const tag = await getTagInfo(tr.children[isModerator ? 1 : 0].textContent.trim());
            [tag.preId] = tr.id.match(/\d+/);
            tag.by = isModerator
                ? tr.children[0].querySelector("a").textContent
                : getElem(".sidebar_login .title a").textContent;

            const postId = tr.children[isModerator ? 2 : 1].querySelector("a").href.match(/\d+/)[0];
            const post = cache.get(postId) || { id: postId, tags: [] };
            post.tags.push(tag);

            cache.add(post);
        };

        // get recommended tags from the first page
        const page = isModerator ? PAGES.moderatePreTags : PAGES.yourPreTags;
        const dom = await API.html(`${page}0`);
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        await Promise.all(getAllElems(".messages tr", dom).map(addPreTag));
        // get recommended tags from other pages
        const lastPage = getElem("table + div .numeric_pages a:nth-last-child(2)", dom);
        if (lastPage) {
            await Promise.all(
                new Array(+lastPage.textContent)
                    .fill(1)
                    .map((_, i) => `${page}${i + 1}`)
                    .map(async (link) => {
                        const dom2 = await API.html(link);
                        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
                        await Promise.all(getAllElems(".messages tr", dom2).map(addPreTag));
                    }),
            );
        }

        // ensure that cache won't empty until timeout
        cache.add({ id: -1, tags: [] });

        // save cache and return
        SETTINGS.preTagsCache = cache;
        document.body.classList.remove("wait");
        return cache.get(unsafeWindow.post_id)?.tags || [];
    })();
    return getRecommendedTags.result;
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
 * Returns tag by its name or id
 * @param  {(string|number)} tagName - The tag name (string) or id (number)
 * @param  {(string|number)} [postId] - ID of a post where the will be search in the first order.
 *                                    Use it if you going to get multiple tags from this post.
 * @return {Promise<Tag>} Found tag or `NO_TAG`
 */
async function getTagInfo (tagName, postId) {
    if (!tagName) return NO_TAG;
    const cache = SETTINGS.tagsCache;

    // cast raw tag to advanced one and cache it
    // if the tag is alias, returns aliased tag
    // the cache must be saved manually
    const cacheTag = (rawTag) => {
        if (!rawTag) return NO_TAG;
        const tag = new Tag(rawTag);
        // if it's artist keep less time
        cache.add(tag, tag.type === 4 ? 0.1 : 1);
        return tag.alias ? getTagInfo(tag.alias) : tag;
    };
    let tag;

    // check in cache
    if (typeof tagName === "number") {
        const tagId = tagName;
        tag = cache.get(tagId);
    } else {
        tag = cache.find(["enName", "ruName", "jpName"], tagName);
    }

    // if not tag then get it from post if it provided
    if (!tag && postId) {
        await Promise.all(
            // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
            (await API.getPostTags(postId)).tags.map(cacheTag),
        );
        SETTINGS.tagsCache = cache;
        return getTagInfo(tagName);
    }

    // if still no tag
    if (!tag) {
        if (typeof tagName === "number") {
            const tagId = tagName;
            tag = await cacheTag((await API.getTagById(tagId)).tag);
        } else {
            const { success, tags } = await API.getTagsByName(tagName);
            if (!success || tags.length === 0) return NO_TAG;
            if (tags.length > 2) {
                console.warn("Name colision:", tags);
            }
            // eslint-disable-next-line no-restricted-syntax
            for (const rawTag of tags) {
                tag = await cacheTag(rawTag); // eslint-disable-line no-await-in-loop
            }
        }
    }

    SETTINGS.tagsCache = cache;
    return new Tag(tag); // return copy
}

/**
 * Returns user info by its name or id
 * Search by name correctly works only for non-regular users.
 * @param  {(string|number)} userName - The user name (string) or id (number)
 * @return {Promise<Object>} Found user or null
 */
async function getUserInfo (userName) {
    const cache = SETTINGS.userCache;
    if (!userName) return null;
    if (typeof userName === "string") {
        // no site search by user name, + user names aren't unique
        let userInfo = cache.find("name", userName);
        if (userInfo === undefined) {
            const dom = await API.html(PAGES.about);
            getAllElems("a.user_link span", dom).forEach((span) => cache.add({
                id: +span.parentNode.href.match(/\d+/)[0],
                name: span.textContent,
                level: span.style.color === "rgb(0, 0, 204)" ? 1 : 2,
            }));
            userInfo = cache.find("name", userName);
            if (!userInfo) {
                userInfo = { id: userName, name: userName, level: 0 };
                cache.add(userInfo);
            }
            SETTINGS.userCache = cache;
        }
        return userInfo;
    }

    const userId = +userName;
    let user = cache.get(userId);
    if (!user) {
        let userInfo;
        try {
            userInfo = await API.getUserInfo(userId);
        } catch {
            return null;
        }
        const userLvl = Math.max(
            ...userInfo.groups.map((gr) => ["user", "commiter", "moderator", "admin"].indexOf(gr)),
        );
        user = {
            id: userInfo.id,
            name: userInfo.name,
            level: userLvl,
        };
        cache.add(user);
        SETTINGS.userCache = cache;
    }
    return user;
}

/**
 * Highlights level of the tag adder and shows username of the tag remover
 * @return {Promise<undefined>}
 */
async function highlightTagger () {
    // change border color according to adder level
    if (!highlightTagger.wasCssAdded) {
        highlightTagger.wasCssAdded = true;
        await getUserInfo(getElem(".sidebar_login .title a").textContent);

        const makeCSS = (level) => SETTINGS.userCache
            .findAll("level", level)
            .map(({ name }) => `li[title="by ${name}"] a.not_my_tag_border`)
            .join(",\n")
            .concat(`\n{ border-left-color: ${COLORS.tagAdder[level]}; }`);

        const css = [
            `.tags a.not_my_tag_border { border-left-color: ${COLORS.tagAdder[0]}; }`,
            makeCSS(1), // commiter
            makeCSS(2), // moderator
            `li[title="by ${getElem(".sidebar_login .title a").textContent}"]
                a.not_my_tag_border { border-left-color: ${COLORS.tagAdder.curr}; }`,
        ].join("\n");

        GM_addStyle(css);
    }

    // replace remover id with name
    getAllElems("#post_tags a.removed").forEach(async (a) => {
        const tagRemoverId = a.title.match(/\d+$/);
        if (!tagRemoverId) return;
        const tagRemover = await getUserInfo(+tagRemoverId[0]);
        if (!tagRemover) {
            console.warn(`User with id ${tagRemoverId} was not found`);
            return;
        }
        a.title = a.title.replace(/\d+$/, tagRemover.name);
    });
}

/**
 * Replace original upload form with drag'n'drop form
 */
function improveFileUploader () {
    GM_addStyle(`
        div#content[id] {
            overflow: initial;
        }

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
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        change () { Array.from(this.files).forEach(uploadFile); },
    });
    const ffLabel = newElem("label", {
        htmlFor: "mfiles",
        text: TEXT.fileLabel,
    });
    document.forms[1].style.display = "none";
    document.forms[1].parentElement.append(newElem("br"), fileField, ffLabel);
    getElem("#content").append(posts);

    // drag'n'drop label
    const dnd = newElem("div", {
        id: "dragndrop",
        text: TEXT.dragndrop,
    });
    document.body.append(dnd);
    document.addEventListener("scroll", (ev) => {
        dnd.style.top = `${Math.max(0, 46 - document.scrollingElement.scrollTop)}px`;
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
        uploadFile.maxID = Math.max(uploadFile.maxID ?? 0, postId);
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
            API.getPostInfo(getElem("a", post).href.match(/\d+/)[0]).then((postInfo) => {
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
 * Applies alternative wide layout
 */
function makeLayoutWide () {
    getElem("#content > [itemscope]").id = "part0";
    let div = getElem("#content > div[itemscope] > div:first-child");
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
    // comments block is added dynamically

    getElem("#content").append(container1, container2);

    const animImg = getElem("#big_preview_cont video");
    if (animImg) { // video stops after moving it in the DOM so start it play
        animImg.play();
    }
}

/**
 * Shows waiting cursor if some network request executes over 500ms
 */
function makeLoadingCursor () {
    const origAjax = ajax_request2; // eslint-disable-line camelcase
    unsafeWindow.ajax_request2 = function newAjaxRequest2 (url, params, handler, method) {
        const timer = setTimeout(() => document.body.classList.add("waiting"), 500);
        const newHandler = (...args) => {
            clearTimeout(timer);
            document.body.classList.remove("waiting");
            handler(...args);
        };
        origAjax(url, params, newHandler, method);
    };
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
            clientHeight,
        } = document.scrollingElement;
        const top = Math.max(0, 50 - scrollTop);
        const maxHeight = sidebar.parentElement.clientHeight;
        sidebar.style.height = `${Math.min(maxHeight, clientHeight - top)}px`;

        // adjust position of the Autocomplete if needed
        const field = document.activeElement;
        const autocomplite = getElem(".autocomplite[style*='visibility: visible;']");
        if (autocomplite
            && sidebar.contains(field)
            && field.nodeName === "INPUT"
            && (field.type === "text" || field.type === "search")
        ) {
            autocomplite.style.top = `${field.offsetTop + top + scrollTop + field.offsetHeight}px`;
        }
    }

    document.addEventListener("scroll", alignSidebar);
    window.addEventListener("resize", alignSidebar);
    window.addEventListener("load", alignSidebar);
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
            return Number.parseInt(count, 10) * 1000;
        }
        return Number.parseInt(count, 10);
    }

    let tags = getAllElems(SETTINGS.metaTags.map((id) => `#tag_li_${id}`).join(","));
    tags = getAllElems("#post_tags li[class=' ']")
        .filter((li) => li.textContent.includes("(cosplay)"))
        // filter out tags with unknown type
        .filter((li) => li.lastElementChild.textContent.trim() !== "1"
                || li.previousElementSibling.nodeName === "LI")
        .concat(tags)
        .filter((li) => {
            li.classList.add("purple"); // eslint-disable-line no-param-reassign
            li.firstElementChild.classList.add("big_tag"); // eslint-disable-line no-param-reassign
            return !li.firstElementChild.classList.contains("removed");
        })
        .sort((t1, t2) => tagCount(t2) - tagCount(t1));
    if (tags.length <= 0) return;

    const span = getElem("#post_tags li[class=' ']")?.previousElementSibling;
    if (!span) return;
    span.insertAdjacentHTML("beforeBegin", `<span>${TEXT.categories[8]}</span>`);
    tags.forEach((tag) => span.before(tag));
}

/**
 * Creates new HTMLElement and set given properties.
 * If (sub)property value is `null` it's ignored.
 * Prop `css` - object of CSS properties.
 * Prop `data` - object of the Data attributes.
 * Prop `html`/`text` - HTML or text content of the element.
 * Prop `children` - List of child elements and text nodes.
 * Prop with function as value - event handler where `prop` is space-separated list of event names.
 * Other props - regular properties (not attributes).
 * @param  {string} tagName - Name of the element
 * @param  {object=} props - Properties of the element
 * @param  {HTMLElement} children - Child elements
 * @return {HTMLElement} The created element
 */
function newElem (tagName, props = {}, ...children) {
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
    elem.append(...children);
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
        value: new Tag(tag).name,
        "input change": checkTag,
    });
    // temporally replace `get_by_id` to allow create
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
    const { id, preId, name, type, countStr, by, pending } = new Tag(tag);
    const uploaderName = (getElem(".post_content_avatar a") || {}).textContent;
    const ownPost = by === uploaderName;
    const buttons = [];

    if (preId && SETTINGS.isModerator) {
        buttons.push(newElem("span", { className: "accept", title: TEXT.accept, text: " ✓ " }));
    }
    if (preId) {
        buttons.push(newElem("span", { className: "decline", title: TEXT.decline, text: " ✗ " }));
    }
    if (ownPost || SETTINGS.isModerator) {
        buttons.push(
            newElem("span", { id: `delete_span_tag_${id}`, className: "icon_delete" }),
            newElem("span", { id: `set_span_tag_${id}`, className: "icon_frame" }),
        );
    }
    if (SETTINGS.isModerator) {
        buttons.push(newElem("span", { id: `edit_span_tag_${id}`, className: "icon_edit" }));
    }

    // remove all buttons
    if (pending) {
        buttons.splice(0, buttons.length);
    }

    return newElem(
        "li",
        {
            id: `tag_li_${id}`,
            className: `${COLORS.tagTypeColor[type]} ${preId ? "preTag" : ""}`,
            title: by ? `${TEXT.by} ${by}` : null,
            click: preId ? onPreTagClick : null,
        },
        newElem("a", {
            href: `/pictures/view_posts/0?search_tag=${encodeURIComponent(name)}`,
            title: `${TEXT.picsWithTag} ${name}`,
            className: `
                ${COLORS.tagTypeClass[type]}
                ${COLORS.tagTypeClass[type] ? "big_tag" : ""}
                ${ownPost ? "" : "not_my_tag_border"}
            `,
            text: name,
        }),
        newElem(
            "span",
            {},
            newElem(
                "span",
                {
                    className: "edit_tag",
                    data: { tagId: id, preTagId: preId },
                    text: countStr,
                },
                " ",
                ...buttons,
            ),
        ),
    );
}

/**
 * Handler for triggering hotkeys
 * @param  {KeyEvent} ev
 */
function onHotkeyPress (ev) {
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
    hotkey += (ev.key.length > 1) ? ev.key : String.fromCharCode(ev.which);
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
        && ((focusElem?.tagName === "TEXTAREA")
            || (focusElem.tagName === "INPUT"
                && focusElem.type !== "button"
                && focusElem.type !== "submit"))
    ) {
        return;
    }
    // filter hotkeys by a current url and the hotkey, execute `hotkey.func` with
    // the first element found by selectors and cancel KeyEvent if the element was found
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
 * Handles opening of link in new tab to provide them `window.opener`
 * @param  {MouseEvent} ev - Event object
 */
function onNewTabLinkClick (ev) {
    if (ev.type === "click" && !ev.ctrlKey) return;
    window.open(ev.target.closest("a").href);
    ev.preventDefault();
    ev.stopPropagation();
}

/**
 * Handler for when moderator clicks accept or decline recommended tag
 * @param  {Event} ev - Event object
 * @return {Promise<undefined>}
 */
async function onPreTagClick (ev) {
    const tagElem = ev.target.closest("li");
    const { preTagId } = ev.target.parentNode.dataset;
    if (!tagElem || !preTagId) return;
    // -1 - temporal preId => force update preTags and re-add them to the page
    if (preTagId === "-1") {
        SETTINGS.reset("preTagsCache");
        getRecommendedTags(true).then(addRecommendedTags);
        return;
    }
    const preTag = (preTagId < -1
        // eslint-disable-next-line no-undef
        ? await getPermanentlyRecommendedTags?.()
        : await getRecommendedTags()
    ).find((tag) => tag.preId === preTagId);
    if (!preTag) return;

    let removeItem = false;
    document.body.classList.add("wait");

    if (ev.target.classList.contains("accept")) {
        tagElem.classList.replace("preTag", "waiting");
        removeItem = await preTag.accept();
        if (preTag.parent) {
            AnimePictures.post.refresh_tags();
        } else {
            document.body.classList.remove("wait");
        }
    } else if (ev.target.classList.contains("decline")) {
        tagElem.classList.replace("preTag", "waiting");
        removeItem = await preTag.decline();
        document.body.classList.remove("wait");
    }

    if (removeItem) {
        // if it's last tag of this type
        if (tagElem.previousElementSibling.nodeName === "SPAN"
            && (tagElem.nextElementSibling == null
                || tagElem.nextElementSibling.nodeName === "SPAN")
        ) {
            tagElem.previousElementSibling.remove();
        }
        tagElem.remove();
    } else {
        tagElem.classList.remove("waiting");
    }
}

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
 * Handler to immediately display recommended tags on the post page
 * @param  {Event} ev - Event object
 * @return {Promise<undefined>}
 */
async function onTagRecommended (ev) {
    const by = getElem(".sidebar_login .title a").textContent;
    // get recommended tags
    const tags = (await Promise.all(
        getElem("#add_pre_tag_input").value
            .split("||")
            .map((tagName) => getTagInfo(tagName.trim())),
    ))
        .filter(({ id }) => id);
    tags.forEach((tag) => {
        tag.by = by;
        tag.preId = -1; // no way to get preId without (re)parsing pages with recommended tags
    });

    const cache = SETTINGS.preTagsCache;
    cache.set({ id: unsafeWindow.post_id, tags });
    SETTINGS.preTagsCache = cache;
    addRecommendedTags();
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

    // set the cursor after the bbtag if any text was selected, otherwise - inside the bbtag
    const cursorPos = textarea.selectionStart + (text
        ? 2 * bbtag.length + tagParam.length + text.length + 5
        : bbtag.length + tagParam.length + 2);
    document.execCommand("insertText", false, `[${bbtag}${tagParam}]${text}[/${bbtag}]`);
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
        dialog = newElem(
            "div",
            {
                id: "dialog",
                className: "post_content",
                click: (ev) => {
                    if (ev.target === dialog && !dialog.hasAttribute("modal")) {
                        dialog.remove();
                    }
                },
            },
            newElem(
                "div",
                { modal: modal ? "" : null },
                newElem("div", {
                    className: "title",
                    text: title,
                }),
                newElem("div", { className: "post_content body" }, text),
            ),
        );
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
        newElem(
            "table",
            {
                innerHTML: hotkeys.filter((hk) => hk.pages.some((url) => pageIs(url)))
                    .map((hk) => `<tr><td>${hk.hotkey}&nbsp;</td><td>&nbsp;${hk.descr}</td></tr>`)
                    .join(""),
            },
        ),
        TEXT.availableHotkeys,
    );
}

/**
 * Adds text about applying some "hidden" search option
 */
function showHiddenSearchProps () {
    if (getElem(".hidden_search_props")) return; // no self-triggering
    const urlParams = new URL(window.location).searchParams;

    const showParam = async (param, text) => {
        if (!urlParams.has(param)) return;
        const user = await getUserInfo(+urlParams.get(param));
        getElem("#posts > [style]").before(newElem(
            "div",
            { className: "posts_body_head hidden_search_props" },
            text,
            newElem("a", {
                href: `${PAGES.profile}${user.id}`,
                css: {
                    color: COLORS.userName[user.level],
                    fontWeight: user.level === 2 ? "bold" : null,
                },
                text: user.name,
            }),
        ));
    };

    showParam("user", TEXT.pUserPics);
    showParam("stars_by", TEXT.pUserStars);
    showParam(
        "favorite_by",
        urlParams.has("favorite_folder")
            ? TEXT.pUserFavorited.replace("%s", urlParams.get("favorite_folder"))
            : TEXT.pUserAllFav,
    );

    if (urlParams.has("view_after")) {
        const date = new Date(urlParams.get("view_after") * 1000).toLocaleString(SETTINGS.lang);
        getElem("#posts > [style]").before(newElem("div", {
            className: "posts_body_head hidden_search_props",
            text: `${TEXT.pPicsAfter}${date}`,
        }));
    }
    if (urlParams.has("status")) {
        getElem("#posts > [style]").before(newElem("div", {
            className: "posts_body_head hidden_search_props",
            text: TEXT.pPrePics,
        }));
    }
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

    const id = (uploadFile.maxID ?? 0) + 1;
    uploadFile.maxID = id;
    let color = { r: 128, g: 128, b: 128 };

    // make post preview
    const post = newElem(
        "span",
        {
            data: { id },
            className: "img_block_big pending",
        },
        newElem(
            "a",
            { target: "_blank" },
            newElem("img", {
                className: "img_sp",
                title: file.name,
                alt: file.name,
                src: trasnparentImage,
            }),
        ),
        newElem(
            "div",
            { className: "img_block_text" },
            newElem("strong", { className: "dim" }),
            newElem("br"),
            newElem("span", { className: "status", text: TEXT.reading }),
            newElem("div", { className: "progress" }),
        ),
    );
    getElem("#posts").append(post);

    // save the post in history
    function save () {
        const state = window.history.state ?? {};
        state[post.dataset.id] = {
            html: post.innerHTML,
            isPending: post.classList.contains("pending"),
            hasError: post.classList.contains("error"),
        };
        window.history.replaceState(state, null);
    }

    save();

    // do only 1 preview at the same time
    uploadFile.previewQueue = (uploadFile.previewQueue ?? Promise.resolve())
        .then(() => new Promise((resolve) => {
            const img = new Image();
            img.addEventListener("load", () => {
                // get dimensions
                let height = img.naturalHeight;
                let width = img.naturalWidth;
                getElem(".dim", post).textContent = `${width}x${height}`;
                // resize the dimensions
                [width, height] = width >= height
                    ? [300, height / width * 300]
                    : [width / height * 300, 300];
                // resize the image
                const canvas = newElem("canvas");
                const context = canvas.getContext("2d");
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

                getElem(".status", post).textContent = TEXT.pending;

                save();
                resolve();
            });
            img.src = URL.createObjectURL(file);
        }));

    await uploadFile.previewQueue;

    // upload only 1 file at the same time
    uploadFile.uploadQueue = (uploadFile.uploadQueue ?? Promise.resolve())
        .then(() => new Promise((resolve) => {
            const status = getElem(".status", post);
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
                    const resp = document.createRange()
                        .createContextualFragment(xhr.responseText)
                        .querySelector(".post_content");
                    // if it's duplicate
                    if (getElem(".body span[style='color: red;'] ~ .img_block2", resp)) {
                        status.textContent = TEXT.duplicate;
                        post.classList.add("error");
                        getElem("a", post).href = getElem("a", resp).href;
                        getElem("img", post).src = getElem("img", resp).src.replace("_sp.", "_cp.");
                    // if there was no free slots
                    } else if (getElem("form span[style='color: red;']", resp)) {
                        status.textContent = TEXT.noSlots;
                        post.classList.add("error");
                        slots.dataset.usedSlots = slots.dataset.totalSlots;
                        slots.textContent = TEXT.slots(slots.dataset.usedSlots, 0);
                    // if uploading was successful
                    } else {
                        status.textContent = getElem(".img_block_text", resp).lastChild.textContent;
                        getElem("a", post).href = getElem("a", resp).href;
                        getElem("img", post).src = getElem("img", resp).src.replace("_sp.", "_cp.");
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

// TODO list
// SPA

// =============================================================================
//                         Program execution start
// =============================================================================

if (pageIs.api || new URL(window.location).searchParams.get("type")) return;

GM_addStyle(generalCSS);

// if theme is dark
if (SETTINGS.themeName === "second") {
    GM_addStyle(darkThemeCSS);
}
if (SETTINGS.hideNewPostMessage) {
    GM_addStyle(`
        #content > .post_content:first-child[style="color: red;"] {
            display: none;
        }
    `);
}

document.addEventListener("keydown", onHotkeyPress);

if (pageIs.chat) return;

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

if (SETTINGS.openLinkInNewTab) {
    document.addEventListener("click", (ev) => {
        if (ev.target.nodeName !== "IMG") return;
        const a = ev.target.closest("a");
        if (!a || a.onclick) return;
        window.open(a.href);
        ev.preventDefault();
    });
}

window.addEventListener("message", ({ data, source }) => {
    switch (data.cmd) {
        case "resolve_pretag":
            getElem(`#pre_tag_${data.preTagId}`)?.remove();
            break;
        case "get_posts_data": {
            delete sessionStorage.neighborPosts;
            let postsData = null;
            if (pageIs.searchPosts) {
                postsData = {
                    query: API.extractParams(window.location),
                    page: +window.location.pathname.match(/\d+/)[0],
                    lastPage: +getAllElems("#posts .numeric_pages :nth-last-child(-n+2)")
                        .filter((elem) => elem.textContent !== ">")
                        .reverse()[0]?.textContent ?? 0,
                    postIds: getAllElems("#posts > div > span > a")
                        .map((a) => +a.href.match(/\d+/)[0]),
                };
            } else if (pageIs.moderatePreTags || pageIs.yourPreTags) {
                postsData = {
                    query: null,
                    page: 0,
                    lastPage: 0,
                    postIds: SETTINGS.preTagsCache
                        .getAll()
                        .map(({ id }) => +id)
                        .sort((a, b) => b - a),
                };
            } else if (pageIs.uploadPicture) {
                postsData = {
                    query: null,
                    page: 0,
                    lastPage: 0,
                    postIds: getAllElems("#posts > span > a")
                        .map((a) => +a.href.match(/\d+/)[0]),
                };
            } else if (pageIs.comments) {
                postsData = {
                    query: null,
                    page: 0,
                    lastPage: 0,
                    postIds: getAllElems("#comments td:last-child a:not([title])")
                        .map((a) => +a.href.match(/\d+/)[0]),
                };
            }
            postsData.lastPost = postsData.postIds.length - 1;
            source.postMessage({ cmd: "posts_data", postsData }, PAGES.origin);
            break;
        }
        case "posts_data":
            addNeighborPostsButtons(data.postsData);
            break;
        default: break;
    }
});

onready(() => {
    /* eslint-disable camelcase */
    // if user isn't logined, except edit tag page because there is no is_login variable
    if (!pageIs.editTag) {
        if (!is_login) {
            say(TEXT.isntLogined, "AP Enhancements for users");
            return;
        }
        // update `lang` and `themeName` settings immediately on change
        getElem("#form_global_params").addEventListener("change", (ev) => {
            SETTINGS.lang = ev.currentTarget.elements.language.value;
            SETTINGS.themeName = ev.currentTarget.elements.theme.value;
        });
    }

    // update some settings
    if (!pageIs.editTag) {
        if (SETTINGS.lang !== lang) SETTINGS.lang = lang;
        if (SETTINGS.isModerator !== is_moderator) SETTINGS.isModerator = is_moderator;
        if (SETTINGS.themeName !== site_theme) SETTINGS.themeName = site_theme;
    }
    /* eslint-enable camelcase */

    if (SETTINGS.isFirstRun) {
        SETTINGS.isFirstRun = false;
        // import settings
        if (GM_getValue("isFirstRun", false)) {
            SETTINGS.getAll().forEach(({ name }) => {
                const value = GM_getValue(name);
                if (value) SETTINGS[name] = value;
            });
        }
        window.location.reload();
    }

    addPaginationHotkeys();
    makeLoadingCursor();
    if (SETTINGS.alwaysLoadPreTags && !pageIs.editTag
        || pageIs.yourPreTags
        || pageIs.moderatePreTags
    ) {
        getRecommendedTags(true);
    }

    if (pageIs.post) {
        addNeighborPostsButtons();

        if (SETTINGS.foldSimilarBlock) makeSimilarBlockFoldable();
        if (getElem("#add_pre_tag_form")) {
            getElem("#add_pre_tag_form").addEventListener("submit", onTagRecommended);
        }

        // on tag list change
        const updatePreTags = SETTINGS.alwaysLoadPreTags
            || pageIs(PAGES.yourPreTags, false, document.referrer)
            || pageIs(PAGES.moderatePreTags, false, document.referrer)
            || pageIs(PAGES.yourPreTags, false, window.opener?.location)
            || pageIs(PAGES.moderatePreTags, false, window.opener?.location);

        new MutationObserver(() => {
            makeTagsMeta();
            highlightTagger();
            getRecommendedTags(updatePreTags).then(addRecommendedTags);
        }).observe(getElem("#post_tags"), { childList: true });
        makeTagsMeta();
        highlightTagger();
        getRecommendedTags(updatePreTags).then(addRecommendedTags);
    }

    if (pageIs.searchPosts) {
        showHiddenSearchProps();
        addDanbooruTagDescription();
        new MutationObserver(() => {
            showHiddenSearchProps();
            addDanbooruTagDescription();
        }).observe(getElem("#posts"), { childList: true });
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

    // highlight comment language filter
    if (pageIs.comments) {
        const all = new URLSearchParams(window.location.search).get("clang") === "all";
        getElem(`#content .title a${all ? "[href*='clang=all']" : ""}`).style.fontWeight = "bold";
    }

    if (pageIs.uploadPicture) {
        improveFileUploader();
    }
});

// ==UserScript==
// @name         AP Enhancements for moderators
// @namespace    7nik@anime-pictures.net
// @version      1.4.2
// @description  Makes everything great! Moderator edition
// @author       7nik
// @homepageURL  https://github.com/7nik/userscripts
// @supportURL   https://github.com/7nik/userscripts/issues
// @updateURL    https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20moderators.user.js
// @downloadURL  https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20moderators.user.js
// @match        https://anime-pictures.net/*
// @exclude      https://anime-pictures.net/chat*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM.xmlHttpRequest
// @connect      donmai.us
// @require      https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// ==/UserScript==

// site's variables
/* global post_id AnimePictures */

// variables of the AP Enhancements for users
/* global NO_TAG PAGES SETTINGS TEXT API hotkeys pageIs Tag
    getElem getAllElems getTagInfo newElem newTagInput
    onNewTabLinkClick onready say addRecommendedTags */

/* eslint-disable sonarjs/no-duplicate-string, sonarjs/cognitive-complexity */

"use strict";

// moderator only settings
const MOD_SETTIGNS = {
    enablePermRecTags: {
        descr: TEXT.sEnablePermRecTags,
        type: "boolean",
        defValue: false,
    },
    permRecTags: {
        descr: TEXT.sPermRecTags,
        type: "tag-list",
        defValue: [],
    },
    tagReplacingAddButton: {
        descr: TEXT.sTagReplacingAddButton,
        type: "boolean",
        defValue: false,
    },
    tagReplacingRemoveTag: {
        descr: TEXT.sTagReplacingRemoveTag,
        type: "tag",
        defValue: NO_TAG,
    },
    tagReplacingAddTag: {
        descr: TEXT.sTagReplacingAddTag,
        type: "tag",
        defValue: NO_TAG,
    },
    tagReplacingAction: {
        descr: TEXT.sTagReplacingAction,
        type: "list",
        defValue: "nothing",
        values: {
            nothing:  TEXT.nothing,
            next:     TEXT.hkNextPost,
            prev:     TEXT.hkPrevPost,
            close:    TEXT.closeWindow,
        },
    },
};

/**
 * Special class that allows create recommeded tags that aren't in the site's DB
 */
class PermanentlyRecommendedTag extends Tag {
    constructor (tag) {
        super(tag);
        // preId -1 already reserved
        PermanentlyRecommendedTag.maxPreId = (PermanentlyRecommendedTag.maxPreId || -1) - 1;
        this.data.preId = PermanentlyRecommendedTag.maxPreId.toString();
        this.data.by = getElem(".sidebar_login .title a")?.textContent;
    }

    // eslint-disable-next-line class-methods-use-this
    async resolve () {
        const tags = await getPermanentlyRecommendedTags();
        const preTagIndex = tags.findIndex(({ preId }) => preId === this.preId);
        if (preTagIndex < 0) return;
        tags.splice(preTagIndex, 1);
        sessionStorage[post_id] = tags.map(({ id }) => id);
    }

    // eslint-disable-next-line class-methods-use-this
    async accept () {
        const res = await addTag(this, post_id);
        await this.resolve();
        return !res;
    }

    // eslint-disable-next-line class-methods-use-this
    async decline () {
        await this.resolve();
        return true;
    }
}

/**
 * Adds hotkeys for pagination if needed,
 * ones for moderating if allowed, and link to the hotkey list
 */
function addModeratorHotkeys () {
    hotkeys.push(
        {
            hotkey: "1",
            descr: TEXT.hkSelectNew,
            pages: [PAGES.post],
            selectors: ["form[action*='set_post_status']"],
            action: (el) => {
                el.querySelector("select").value = 0; // eslint-disable-line no-param-reassign
                el.querySelector("[type=submit]").focus();
            },
        },
        {
            hotkey: "2",
            descr: TEXT.hkSelectPre,
            pages: [PAGES.post],
            selectors: ["form[action*='set_post_status']"],
            action: (el) => {
                el.querySelector("select").value = -2; // eslint-disable-line no-param-reassign
                el.querySelector("[type=submit]").focus();
            },
        },
        {
            hotkey: "3",
            descr: TEXT.hkSelectPublic,
            pages: [PAGES.post],
            selectors: ["form[action*='set_post_status']"],
            action: (el) => {
                el.querySelector("select").value = 1; // eslint-disable-line no-param-reassign
                el.querySelector("[type=submit]").focus();
            },
        },
        {
            hotkey: "4",
            descr: TEXT.hkSelectBan,
            pages: [PAGES.post],
            selectors: ["form[action*='set_post_status']"],
            action: (el) => {
                el.querySelector("select").value = 2; // eslint-disable-line no-param-reassign
                el.querySelector("[name=status_type]").focus();
            },
        },
    );
}

/**
 * Adds edit tag buttons to the search page
 */
async function addEditTagButton () {
    if (!getElem(".posts_body_head h2")) return;
    if (getElem(".posts_body_head.edit_tags")) return; // no self-triggering
    getElem(".posts_body_head")?.classList.add("edit_tags");

    GM_addStyle(`
        .posts_body_head .icon_edit {
            margin-left: 1ch;
            cursor: pointer;
            zoom: 80%;
            filter: ${
                SETTINGS.themeName === "second"
                    ? "brightness(0.87);"
                    : "invert(0.72);"
            }
        }
        .posts_body_head strong ~ .icon_edit {
            zoom: 60%;
            ${SETTINGS.themeName === "second" ? "" : "vertical-align: middle;"}
        }
    `);

    const tagNodes = [getElem(".posts_body_head h2").firstChild];
    const aliasesTextNode = getAllElems(".posts_body_head .extra_stuff strong")
        .find((node) => node.textContent.startsWith(TEXT.aliasesTags));
    if (aliasesTextNode) {
        let node = aliasesTextNode.nextSibling;
        while (node) {
            if (node.nodeName === "A") {
                tagNodes.push(node);
            }
            node = node.nextElementSibling;
        }
    }

    if (tagNodes.length === 0) return;

    const tags = await Promise.all(
        tagNodes.map((node) => getTagInfo(node.textContent, { resolveAlias: false })),
    );
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < tags.length; i++) {
        tagNodes[i].after(newElem("span", {
            className: "icon_edit",
            click: () => window.open(
                `${PAGES.editTag}${tags[i].id}`,
                `${TEXT.editTag} ${tags[i].name}`,
                "width=500,height=700",
            ),
        }));
    }
}

/**
 * Adds button and field to remove tags from multiple posts
 */
function addRemoveTagsButton () {
    async function start () {
        const postCount = getAllElems("#posts input[type=checkbox]:checked").length;
        let doneCounter = 0;
        const updateCounter = () => {
            doneCounter += 1;
            say(TEXT.doneOf(doneCounter, postCount));
        };

        say(TEXT.preparing, TEXT.tagRemoving, true);
        const tags = await Promise
            .all(getElem("#multi_tags").value
                .toLowerCase()
                .split("||")
                .map((tagName) => getTagInfo(tagName.trim())))
            .then((allTags) => allTags.filter((tag) => tag.id));
        const checkboxes = getAllElems("#posts input[type=checkbox]:checked");
        await Promise.all(checkboxes.map((checkbox) => {
            const postId = checkbox.name.slice(6);
            return Promise
                .all(tags.map((tag) => removeTag(tag, postId)))
                .then(updateCounter);
        }));
        say(TEXT.done);
        setTimeout(() => {
            AnimePictures.post_list.refresh(window.location.pathname + window.location.search);
            say(null);
        }, 500);
    }

    getElem("#multi_add_tags").after(newElem("input", {
        type: "button",
        value: TEXT.removeTags,
        click: start,
        css: {
            marginLeft: "3px",
            padding: "1px 4px",
        },
    }));
}

/**
 * Adds button to replace (or only add/remove) a one tag with anther
 * Also adds hotkey. It's setups via AP Enhancements settings.
 */
function addReplaceTagButton () {
    function finish () {
        getElem("#replace_tag").style.display = "none";
        switch (SETTINGS.tagReplacingAction) {
            case "nothing":
                AnimePictures.post.refresh_tags();
                break;
            case "next":
                if (getElem(".chevron_right")) {
                    getElem(".chevron_right").click();
                } else {
                    AnimePictures.post.refresh_tags();
                }
                break;
            case "prev":
                if (getElem(".chevron_left")) {
                    getElem(".chevron_left").click();
                } else {
                    AnimePictures.post.refresh_tags();
                }
                break;
            case "close":
                window.close();
                break;
            default:
                console.error(`Unsupported method ${SETTINGS.tagReplacingAction}`);
        }
    }

    let tagToRemove = new Tag(SETTINGS.tagReplacingRemoveTag);
    let tagToAdd = new Tag(SETTINGS.tagReplacingAddTag);
    const replaceTag = () => addTag(tagToAdd, post_id)
        .then(() => removeTag(tagToRemove, post_id))
        .then(finish);

    // if the tag is already removed
    if (!getElem(`#tag_li_${tagToRemove.id}:not(.preTag):not(.removed)`)) {
        tagToRemove = NO_TAG;
    }
    // if the tag is already added
    if (getElem(`#tag_li_${tagToAdd.id}:not(.preTag)`)) {
        tagToAdd = NO_TAG;
    }
    // if nothing to add or remove
    if (!tagToRemove.id && !tagToAdd.id) return;

    getElem("#add_tag_submit").before(newElem("input", {
        type: "button",
        id: "replace_tag",
        className: "button-one",
        css: { margin: "3px 3px 3px 0" },
        value: !tagToRemove.name
            ? `+${tagToAdd.name}`
            : (!tagToAdd.name
                ? `-${tagToRemove.name}`
                : `${tagToRemove.name} → ${tagToAdd.name}`),
        click: replaceTag,
    }));

    hotkeys.push({
        hotkey: "R",
        descr: TEXT.replaceTag(tagToRemove.name, tagToAdd.name),
        pages: [PAGES.any],
        selectors: [],
        action: replaceTag,
    });
}

/**
 * Requests adding a tags to a post
 * @param {Tag} tag - The tag to add
 * @param {(number|string)} postId - The post id to which add the tag
 * @return {Promise<boolean>} - Whether tag was added to the post
 */
async function addTag (tag, postId) {
    if (!tag.id) return false;
    const { success, errormsg } = await API.addTags(tag.enName, postId);
    if (!success) {
        getElem("#add_tag_status").innerHTML = errormsg;
        console.log("Error:", errormsg, tag, postId);
    }
    return success;
}

/**
 * Returns list of permanently recommended tags
 * @return {Promise<PermanentlyRecommendedTags[]>}
 */
function getPermanentlyRecommendedTags () {
    if (getPermanentlyRecommendedTags.result) return getPermanentlyRecommendedTags.result;
    getPermanentlyRecommendedTags.result = (async () => {
        const tags = await Promise.all(
            (sessionStorage[post_id]?.split(",").filter((id) => id) ?? SETTINGS.permRecTags)
                .map((id) => getTagInfo(+id)),
        );
        return tags.map((tag) => new PermanentlyRecommendedTag(tag));
    })();
    return getPermanentlyRecommendedTags.result;
}

/**
 * Adds following changes to tag editor:
 * - allows to type parent/alias tag by name instead of id;
 * - allows drop link to tag in the field;
 * - makes additional checks before tag saving;
 * - protects from accidential closing of the editor;
 * - automatically set tag type or parent tag in some cases.
 */
function improveTagEditor () {
    let changed = false; // whether some data on the form was changed
    // add link to description and format it
    function addLink (ev) {
        if (!ev.dataTransfer.types.includes("text/uri-list")) return;
        const newLink = ev.dataTransfer.getData("text/uri-list");
        const text = ev.target.value;
        const getLink = /(?:\[url=([^\]]+)][\w-]+\[\/url])|http.*/gi;
        const siteNames = {
            "www.animenewsnetwork.com": "ANN",
            "anidb.net": "aniDB",
            "anidb.info": "aniDB",
            "myanimelist.net": "MAL",
            "www.world-art.ru": "World-Art",
            "shikimori.one": "Shikimori",
            "vndb.org": "VNDB",
            "www.mangaupdates.com": "Baka-Updates",
            "www.doujinshi.org": "Doujinshi DB",
            "www.imdb.com": "IMDb",
            "en.wikipedia.org": "eng",
            "ru.wikipedia.org": "rus",
            "ja.wikipedia.org": "jap",
        };
        const siteOrder = [
            "animenewsnetwork.com",
            "anidb.net",
            "anidb.info",
            "myanimelist.net",
            "world-art.ru",
            "shikimori.one",
            "vndb.org",
            "mangaupdates.com",
            "doujinshi.org",
            "imdb.com",
            "en.wikipedia.org",
            "ru.wikipedia.org",
            "ja.wikipedia.org",
            "atwiki.jp",

            "pixiv.net",
            "deviantart.com",
            "artstation.com",
            "twitter.com",
            "instagram.com",
            "tinami.com",
            "nicovideo.jp",
            "piapro.jp",
            "pawoo.net",
            "tumblr.com",
        ];

        const links = [];
        let match;
        // eslint-disable-next-line no-cond-assign
        while (match = getLink.exec(text)) links.push(match[1] ?? match[0]);
        const pureText = text.replace(getLink, "").replace(/^[ (),.adeikpw]*\s*/i, "");
        links.push(newLink);

        const urls = links
            .filter((link, i) => links.indexOf(link) === i)
            .map((link) => new URL(link))
            .map((url) => {
                if (url.host === "www.pixiv.net" && !pageIs("/users/", false, url)) {
                    return new URL(`https://www.pixiv.net/users/${url.href.match(/\d+/)[0]}`);
                }
                if (url.host === "vndb.org") {
                    return new URL(`https://vndb.org/${url.href.match(/v\d+/)[0]}`);
                }
                return url;
            })
            // sort by site order > domain name > href (ignore protocol)
            .sort((u1, u2) => {
                const p1 = siteOrder.findIndex((domain) => u1.host.endsWith(domain));
                const p2 = siteOrder.findIndex((domain) => u2.host.endsWith(domain));
                if (p1 >= 0 && p2 >= 0 && p1 !== p2) return p1 - p2;
                if (p1 >= 0 && p2 < 0) return -1;
                if (p1 < 0 && p2 >= 0) return 1;
                if (u1.host > u2.host) return 1;
                if (u1.host < u2.host) return -1;
                if (u1.pathname + u1.search > u2.pathname + u2.search) return 1;
                return -1;
            });
        // console.log(urls);
        let hasWiki = false;
        const newText = [
            pureText,
            urls
                .filter((url) => url.host in siteNames)
                .map((url, i, arr) => {
                    let t = `[URL=${url}]${siteNames[url.host]}[/URL]`;
                    if (url.host.endsWith("wikipedia.org") && !hasWiki) {
                        t = `Wikipedia (${t}`;
                        hasWiki = true;
                    }
                    if (i === arr.length - 1) {
                        t += hasWiki ? ")." : ".";
                    }
                    return t;
                })
                .join(", "),
            ...urls.filter((url) => !(url.host in siteNames)),
        ].filter((t) => t);
        // insert with keeping the change in the edit history
        ev.target.selectionStart = 0;
        ev.target.selectionEnd = text.length;
        ev.target.focus();
        document.execCommand("insertText", false, newText.join("\n"));
        changed = true;
        ev.preventDefault();
        ev.stopPropagation();
    }

    // convert dropped link to tag name
    function link2tag (ev) {
        let text;
        // get selected text or link title
        if (ev.dataTransfer.types.includes("text/html")) {
            text = document.createRange()
                .createContextualFragment(ev.dataTransfer.getData("text/html"))
                .textContent;
        // extract tag from URL parameter
        } else if (ev.dataTransfer.types.includes("text/uri-list")) {
            const match = ev.dataTransfer
                .getData("text/uri-list")
                .match(/(?:search_tag|tags|word|name|title|search%5bany_name_matches%5d)=([^&]+)/i);
            if (match) text = decodeURIComponent(match[1]);
        // if it's just a text
        } else {
            text = ev.dataTransfer.getData("text/plain");
        }
        if (!text) return;
        // insert with keeping the change in the edit history
        ev.target.selectionStart = 0;
        ev.target.selectionEnd = ev.target.value.length;
        ev.target.focus();
        document.execCommand("insertText", false, text.replace(/[+_]/g, " ").trim().toLowerCase());
        changed = true;
        ev.preventDefault();
        ev.stopPropagation();
    }

    // replace field for tag id with advanced tag field
    async function replaceField (field) {
        const replacer = newTagInput(await getTagInfo(+field.value), ({ id, type }) => {
            if (!id) {
                field.value = ""; // eslint-disable-line no-param-reassign
                return;
            }
            field.value = id; // eslint-disable-line no-param-reassign
            if (field.id === "parent") {
                const tagtype = getElem("#tag_type");
                if (tagtype.value === "0" && [3, 5, 6].includes(type)) {
                    tagtype.value = 1; // set character type;
                }
            }
            if (field.id === "alias") {
                getElem("#tag_type").value = type;
            }
        });
        // put the the replacer after the field
        field.after(replacer);
        replacer.style.width = field.style.width;
        field.style.display = "none"; // eslint-disable-line no-param-reassign

        replacer.addEventListener("drop", (ev) => {
            link2tag(ev);
            replacer.dispatchEvent(new Event("change"));
        });
    }

    // validate fields before saving
    async function saveTag (ev) {
        if (getElem("#tag_type").value === "0") {
            getElem("#edit_error").innerHTML = TEXT.errorUknownTagType;
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        const tagId = window.location.pathname.match(/\d+/)[0];
        const { success, errormsg } = await API.editTag({
            id: tagId,
            type: getElem("#tag_type").value,
            alias: getElem("#alias").value,
            parent: getElem("#parent").value,
            tag: getElem("#name_en").value,
            tag_ru: getElem("#name_ru").value,
            tag_jp: getElem("#name_jp").value,
            description_en: getElem("#description_en").value,
            description_ru: getElem("#description_ru").value,
            description_jp: getElem("#description_jp").value,
        });

        if (success) {
            changed = false;
            if (window.opener) {
                window.opener.postMessage({ cmd: "update_tags" }, PAGES.origin);
            }
            // update this tag in the cache if needed
            const cache = SETTINGS.tagsCache;
            if (cache.remove(tagId)) SETTINGS.tagsCache = cache;
            window.close();
        } else {
            getElem("#edit_error").innerHTML = errormsg;
        }
    }

    // make some deley before the handler replacement to ensure that the original one was added
    setTimeout(() => {
        getElem("#save_tag").removeEventListener("click", unsafeWindow.edit_tag);
        getElem("#save_tag").addEventListener("click", saveTag);
    }, 100);

    // protection from closing the window with unsaved changes
    getAllElems("select, input, textarea")
        .forEach((el) => el.addEventListener("input", () => { changed = true; }));
    window.addEventListener("beforeunload", (ev) => {
        if (!changed) return;
        // legal way
        ev.preventDefault(); // no effect on chrome
        // deprecated ways
        // for chrome:
        ev.returnValue = "Some data were changed"; // eslint-disable-line no-param-reassign
        // return "Some data were changed";
    });

    // support of dropping links to tag to the field names
    getAllElems("#name_en, #name_ru, #name_jp")
        .forEach((ev) => ev.addEventListener("drop", link2tag));
    getElem("#description_en").addEventListener("drop", addLink);

    // auto-setting tag type
    const tagtype = getElem("#tag_type");
    getElem("#description_en").addEventListener("input", (ev) => {
        if (tagtype.value !== "0") return;
        if (ev.target.value.startsWith("http")) tagtype.value = 4; // type author
    });

    replaceField(getElem("#to_tag"));
    replaceField(getElem("#alias"));
    const parent = replaceField(getElem("#parent"));

    // prediction of parent tag
    const parentTag = getElem("#name_en").value.match(/\(([^)]+)\)$/);
    if (getElem("#tag_type").value === "0" && parentTag && !getElem("#parent").value) {
        parent.then(() => {
            getElem("#parent ~ input").value = parentTag[parentTag.length - 1];
            getElem("#parent ~ input").dispatchEvent(new Event("change"));
        });
    }
}

/**
 * Opens tag editor of tags created just now
 */
function openNewTags () {
    const tabs = openNewTags.tabs ?? (openNewTags.tabs = {});
    // get span for unknow tags
    const span = getAllElems("#post_tags span")
        .find((sp) => sp.textContent === TEXT.categories[0]);
    if (!span) return;

    for (let li = span.nextElementSibling; li && li.nodeName === "LI"; li = li.nextElementSibling) {
        const { tagId } = li.lastElementChild.firstElementChild.dataset;
        if (li.lastElementChild.textContent.trim() === "1"
            && (!tabs[tagId] || tabs[tagId].closed)
        ) {
            tabs[tagId] = window.open(
                `${PAGES.editTag}${tagId}`,
                `${TEXT.editTag} ${li.firstElementChild.textContent}`,
                "width=500,height=700",
            );
        }
    }
}

/**
 * Requests removing a tag from a post
 * @param  {Tag} tag - The tag to remove
 * @param  {(number|string)} postId - The post id from which remove the tag
 * @return {Promise<boolean>} - Whether tag was removed from the post
 */
async function removeTag (tag, postId) {
    if (!tag.id) return false;
    const { success, errormsg } = await API.removeTag(tag.id, postId);
    if (!success) {
        say(errormsg, TEXT.error);
        console.error("Error:", errormsg, tag, postId);
    }
    return success;
}

/**
 * Sets to the field number type and int pattern
 * @param {HTMLElement} el - <input> to set type number
 */
function setNumType (el) {
    if (!el) return;
    el.setAttribute("type", "number");
    el.setAttribute("pattern", "\\d+");
    if (el.name === "from_post" || el.name === "rel_post") {
        el.setAttribute("required", "");
    }
    if (!el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", TEXT.sourceID);
    }
}

// TODO list
// related posts editor

// =============================================================================
//                         Program execution start
// =============================================================================

if (!SETTINGS.isModerator) {
    say(TEXT.isntModerator, "AP Enhancements for moderators");
    return;
}

// add moderator settings
Object.entries(MOD_SETTIGNS).forEach(([name, setting]) => SETTINGS.append(name, setting));

onready(() => {
    addModeratorHotkeys();

    if (pageIs.post) {
        const addPermRecTags = SETTINGS.enablePermRecTags;
        // fix fields that accept a post ID
        setNumType(getElem("[name=redirect_id]"));
        getAllElems("[name=from_post]").forEach((el) => setNumType(el));
        // on tag list change
        new MutationObserver(() => {
            openNewTags();
            if (addPermRecTags) getPermanentlyRecommendedTags().then(addRecommendedTags);
        }).observe(getElem("#post_tags"), { childList: true });
        if (addPermRecTags) getPermanentlyRecommendedTags().then(addRecommendedTags);

        if (SETTINGS.tagReplacingAddButton) addReplaceTagButton();
    }

    if (pageIs.moderatePreTags) {
        // fix lack of window.opener for links opened in new tab
        getAllElems(".messages td:nth-child(3) a").forEach((a) => {
            a.addEventListener("auxclick", onNewTabLinkClick);
            a.addEventListener("click", onNewTabLinkClick);
        });
    }

    if (pageIs.searchPosts) {
        addRemoveTagsButton();
        addEditTagButton();
        new MutationObserver(() => {
            addEditTagButton();
        }).observe(getElem("#posts"), { childList: true });
    }
    if (pageIs.editTag) improveTagEditor();
});

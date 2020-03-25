// ==UserScript==
// @name         AP Enhancements for moderators
// @namespace    7nik@anime-pictures.net
// @version      1.0.1
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
// @grant        GM_setValue
// @require      https://github.com/7nik/userscripts/raw/master/AP%20Enhancements%20for%20users.user.js
// ==/UserScript==

// site's variables
/* global post_id AnimePictures */

// variables of the AP Enhancements for users
/* global NO_TAG PAGES SETTINGS TEXT hotkeys pageIs
    ajax fixedNewTabLink getElem getAllElems getTagInfo newElem newTagInput
    newTagItem onready say */

/* eslint-disable sonarjs/no-duplicate-string, sonarjs/cognitive-complexity */

"use strict";

// moderator only settings
const MOD_SETTIGNS = {
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

/**
 * Requests adding a tags to a post
 * @param {Tag} tag - The tag to add
 * @param {(number|string)} postId - The post id to which add the tag
 * @return {Promise<undefined>}
 */
async function addTag (tag, postId) {
    if (!tag.id) return;
    const { success, errormsg } = await ajax(
        `/pictures/add_tag_to_post/${postId}`,
        { text: tag.name, add_new_tag: "false" },
    );
    if (!success) {
        getElem("#add_tag_status").innerHTML = errormsg;
        console.log("Error:", errormsg, tag, postId);
    }
}

/**
 * Requests removing a tag from a post
 * @param  {Tag} tag - The tag to remove
 * @param  {(number|string)} postId - The post id from which remove the tag
 * @return {Promise<undefined>}
 */
async function removeTag (tag, postId) {
    if (!tag.id) return;
    const { success, errormsg } = await ajax(
        `/pictures/del_tag_from_post/${postId}`,
        { tag_id: tag.id },
    );
    if (!success) {
        say(errormsg, TEXT.error);
        console.error("Error:", errormsg, tag, postId);
    }
}

/**
 * Removes recommended tag from cache and moderating page
 * @param  {string} preId - Id of recommendation
 * @return {Promise<undefined>}
 */
async function resolvePreTag (preId) {
    const tags = await getRecommendedTags();
    const preTagIndex = tags.findIndex((tag) => tag.preId === preId);
    if (preTagIndex < 0) return;
    tags.splice(preTagIndex, 1);
    // if it was the last tag then update cache
    if (tags.length === 0) {
        const allTags = SETTINGS.preTagsCache;
        delete allTags[post_id];
        SETTINGS.preTagsCache = allTags;
    }

    if (window.opener) {
        // remove the recommended tag in opener (if it's moderate recommeded tags page)
        window.opener.postMessage({ cmd: "resolve_pretag", preTagId: preId });
    }
}

/**
 * Accept the precomended tag
 * @param  {Tag} preTag - Recommend tag (with `preId`)
 * @return {Promise<undefined>}
 */
async function acceptPreTag ({ preId, name }) {
    resolvePreTag(preId);
    const { success, msg } = await ajax(`/pictures/accept_pre_tag/${preId}`);
    if (!success) {
        console.error(`Error of accepting of pretag ${name}#${preId}:`, msg);
        const editTag = getElem(`span[data-pre-tag-id="${preId}"]`);
        if (editTag) { // the pretag presented on the page
            const li = editTag.parentNode.parentNode;
            // if it's last tag of this type
            if (li.previousElementSibling.nodeName === "SPAN"
                && (li.nextElementSibling == null
                    || li.nextElementSibling.nodeName === "SPAN")) {
                li.previousElementSibling.remove();
            }
            li.remove();
        }
    } else {
        const editTag = getElem(`span[data-pre-tag-id="${preId}"]`);
        if (!editTag) return; // no pretag on the page
        editTag.closest("li").classList.remove("preTag");
    }
}

/**
 * Decline the precomended tag
 * @param  {Tag} preTag - Recommend tag (with `preId`)
 * @return {Promise<undefined>}
 */
async function declinePreTag ({ preId, name }) {
    resolvePreTag(preId);
    const { success, msg } = await ajax(`/pictures/del_pre_tag/${preId}`);
    if (!success) {
        console.error(`Error of removing of pretag ${name}#${preId}:`, msg);
    }
    const editTag = getElem(`span[data-pre-tag-id="${preId}"]`);
    if (!editTag) return; // no pretag on the page
    const li = editTag.closest("li");
    // if it's last tag of this type
    if (li.previousElementSibling.nodeName === "SPAN"
        && (li.nextElementSibling == null
            || li.nextElementSibling.nodeName === "SPAN")
    ) {
        li.previousElementSibling.remove();
    }
    li.remove();
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
            case "nothing": break;
            case "next":
                getElem(".chevron_right").click();
                break;
            case "prev":
                getElem(".chevron_left").click();
                break;
            case "close":
                window.close();
                break;
            default:
                console.error(`Unsupported method ${SETTINGS.tagReplacingAction}`);
        }
    }

    let tagToRemove = SETTINGS.tagReplacingRemoveTag;
    let tagToAdd = SETTINGS.tagReplacingAddTag;
    const replaceTag = () => addTag(tagToAdd, post_id)
        .then(() => removeTag(tagToRemove, post_id))
        .then(finish);

    if (!getElem(`#tag_li_${tagToRemove.id}`)) { // the tag already removed
        tagToRemove = NO_TAG;
    }
    if (getElem(`#tag_li_${tagToAdd.id}`)) { // the tag already added
        tagToAdd = NO_TAG;
    }
    if (!tagToRemove.id && !tagToAdd.id) return; // nothing to add or remove

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
 * Opens tag editor of tags created just now
 */
function openNewTags () {
    const tabs = openNewTags.tabs || (openNewTags.tabs = {});
    // open only new tags
    const lis = getAllElems("#post_tags li").filter((li) => (
        li.classList.length === 0
        && (
            li.lastElementChild.textContent.trim() === "1"
            || li.firstElementChild.textContent === "tagme"
            || li.firstElementChild.textContent === "протегируй меня"
        )
    ));
    if (lis.length > 0 && lis[0].previousElementSibling.nodeName === "SPAN") {
        lis.forEach((li) => {
            const tagName = li.firstElementChild.textContent;
            if (tagName === "tagme" || tagName === "протегируй меня") return;
            const { tagId } = li.lastElementChild.firstElementChild.dataset;
            if (tabs[tagId] && !tabs[tagId].closed) return;
            tabs[tagId] = window.open(
                `/pictures/view_edit_tag/${tagId}`,
                `${TEXT.editTag} ${tagName}`,
                "width=500,height=700,alwaysRaised=yes",
            );
        });
    }
}

/**
 * Get list of tags recommended to current post
 * @return {Promise<array<Tag>>} Recommended tags
 */
async function getRecommendedTags () {
    const now = Date.now();
    let pics = SETTINGS.preTagsCache;
    // return from cache if it's less 30 minutes
    if (pics.lastCheck && pics.lastCheck + 30 * 60 * 1000 > now) {
        return pics[post_id] || [];
    }

    pics = {};
    document.body.classList.add("wait");
    // get recommended tag from <tr>
    const getPreTag = async (tr) => {
        const tag = await getTagInfo(tr.children[1].textContent.trim());
        [tag.preId] = tr.id.match(/\d+/);
        tag.by = tr.children[0].querySelector("a").textContent;
        [tag.postId] = tr.children[2].querySelector("a").href.match(/\d+/);
        tag.count += 1;
        if (!pics[tag.postId]) {
            pics[tag.postId] = [tag];
        } else {
            pics[tag.postId].push(tag);
        }
    };

    // get recommended tags from 1st page
    const dom = await ajax("/pictures/moderating_pre_tags/0", null, "GET");
    await Promise.all(getAllElems(".messages tr", dom).map(getPreTag));
    // get recommended tags from other pages
    await Promise.all(
        getAllElems("table + div .numeric_pages a:not(:last-child)", dom)
            .map(async (a) => {
                const dom2 = await ajax(a.href, null, "GET");
                await Promise.all(getAllElems(".messages tr", dom2).map(getPreTag));
            }),
    );

    // save to cache and return
    pics.lastCheck = now;
    SETTINGS.preTagsCache = pics;
    document.body.classList.remove("wait");
    return pics[post_id] || [];
}

/**
 * Adds recommended tags to post
 * @return {Promise<undefined>}
 */
async function addRecommendedTags () {
    let pretags = await getRecommendedTags();
    if (pretags.length <= 0 || getElem(".tags li span.accept")) return;

    // add accept/decline handler if it wasn't added yet
    if (!addRecommendedTags.wasHandlersAdded) {
        addRecommendedTags.wasHandlersAdded = true;
        getElem("#post_tags").addEventListener("click", async (event) => {
            const tagElem = event.target.closest("li");
            const { preTagId } = event.target.parentNode.dataset;
            if (!tagElem || !preTagId) return;
            const preTag = (await getRecommendedTags()).find((tag) => tag.preId === preTagId);
            if (!preTag) return;

            if (event.target.classList.contains("accept")) {
                tagElem.classList.remove("preTag");
                acceptPreTag(preTag).then(() => {
                    console.log(`${preTag.name}#${preTag.preId} %caccepted`, "color: green;");
                    // scrollTop = document.getElementById("post_tags").scrollTop;
                    AnimePictures.post.refresh_tags();
                });
            } else if (event.target.classList.contains("decline")) {
                tagElem.classList.remove("preTag");
                declinePreTag(preTag).then(() => {
                    console.log(`${preTag.name}#${preTag.preId} %cdeclined`, "color: orange;");
                });
            }
        });
    }

    const presentedTags = getAllElems(".tags a").map((a) => a.textContent);

    console.log("presented tags:", presentedTags);
    console.log("recommended tags:", pretags.map(({ name, preId }) => `${name}:${preId}`));

    pretags = pretags.filter((tag, i, tags) => {
        // accepted presented tags
        if (presentedTags.includes(tag.name)) {
            acceptPreTag(tag).then(() => {
                console.log(`${tag.name}#${tag.preId} %cautoaccepted`, "color: mediumseagreen;");
            });
            return false;
        }
        // decline double tags
        if (tags.findIndex((t) => t.name === tag.name) < i) {
            declinePreTag(tag).then(() => {
                console.log(`${tag.name}#${tag.preId} %cautodeclined`, "color: brown;");
            });
            return false;
        }
        return true;
    });
    if (pretags.length === 0) return;

    const getTagTypeByPosition = (pos) => Object.keys(tagTypePosition)
        .find((k) => tagTypePosition[k] === pos);
    const getTagName = (tagItem) => (tagItem && tagItem.nodeName === "LI"
        ? tagItem.firstElementChild.textContent.trim()
        : null);

    const types = pretags.reduce((set, { type }) => set.add(type), new Set());
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
                const prevSpanText = TEXT.categories[getTagTypeByPosition(pos)];
                nextSpan = getAllElems(".tags > span")
                    .find((el) => el.textContent === prevSpanText);
            }
            span = newElem("span", { text: TEXT.categories[type] });
            if (nextSpan) {
                nextSpan.before(span);
            } else {
                getElem(".tags").append(span);
            }
        }
        // get the recommended tags of the current type in order of usage count
        const tags = pretags
            .filter((tag) => tag.type === type)
            .sort((t1, t2) => t2.count - t1.count);
        let currentElem = span.nextElementSibling;
        let currentText = getTagName(currentElem);
        // eslint-disable-next-line no-restricted-syntax
        for (const tag of tags) {
            // find a presented tag which has usage count bigger then the recommended tag
            // eslint-disable-next-line no-await-in-loop
            while (currentText && (await getTagInfo(currentText)).count > tag.count) {
                currentElem = currentElem.nextElementSibling;
                currentText = getTagName(currentElem);
            }
            if (currentElem) {
                // eslint-disable-next-line no-await-in-loop
                if (currentText && (await getTagInfo(currentText)).count > tag.count) {
                    currentElem.after(newTagItem(tag));
                } else {
                    currentElem.before(newTagItem(tag));
                }
            } else {
                getElem(".tags").append(newTagItem(tag));
            }
        }
    }

    // ul.parentNode.scrollTop = scrollTop;
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
    // convert dropped link to tag name
    function link2tag (ev) {
        const link = ev.dataTransfer.getData("text");
        if (!link) return;
        const tagname = link.match(/\?.*(?:search_tag|tags|word|name|title)=([^&]+)/i);
        if (!tagname) return;
        ev.preventDefault();
        ev.stopPropagation();
        // eslint-disable-next-line no-param-reassign
        ev.target.value = decodeURIComponent(tagname[1].replace(/[+_]/g, " ")).trim().toLowerCase();
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

    let changed = false;
    // validate fields before saving
    async function saveTag (ev) {
        if (getElem("#tag_type").value === "0") {
            getElem("#edit_error").innerHTML = TEXT.errorUknownTagType;
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }

        const { success, errormsg } = await ajax(
            `/pictures/edit_tag/${window.location.pathname.match(/\d+/)[0]}`,
            {
                tag_type: getElem("#tag_type").value,
                alias: getElem("#alias").value,
                parent: getElem("#parent").value,
                name_en: getElem("#name_en").value,
                name_ru: getElem("#name_ru").value,
                name_jp: getElem("#name_jp").value,
                description_en: getElem("#description_en").value,
                description_ru: getElem("#description_ru").value,
                description_jp: getElem("#description_jp").value,
            },
        );

        if (success) {
            changed = false;
            if (window.opener) {
                window.opener.postMessage({ cmd: "update_tags" }, "https://anime-pictures.net");
            }
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
        // depricated ways
        // for chrome:
        ev.returnValue = "Some data were changed"; // eslint-disable-line no-param-reassign
        // return "Some data were changed";
    });

    // support of droping links to tag to the field names
    getAllElems("#name_en, #name_ru, #name_jp")
        .forEach((ev) => ev.addEventListener("drop", link2tag));

    // autosetting tag type
    const tagtype = getElem("#tag_type");
    getElem("#description_en").addEventListener("input", (ev) => {
        if (tagtype.value !== "0") return;
        if (ev.target.value.startsWith("http")) tagtype.value = 4;
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

// TODO list
// highlight post props
// improve detecting of tags with unknown type for openNewTags and makeTagsMeta
// related posts editor

// =============================================================================
//                         Program execution start
// =============================================================================

if (!SETTINGS.isModerator) {
    throw new Error("You don't have moderator rights!");
}

GM_addStyle(`
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
`);

// add moderator settings
Object.entries(MOD_SETTIGNS).forEach(([name, setting]) => SETTINGS.append(name, setting));

onready(() => {
    addModeratorHotkeys();

    if (pageIs.post) {
        // fix fields that accept a post ID
        setNumType(getElem("[name=redirect_id]"));
        getAllElems("[name=from_post]").forEach(setNumType);
    }

    if (pageIs.moderatePreTags) {
        // fix lack of window.opener for links opened in new tab
        getAllElems(".messages td:nth-child(3) a").forEach((a) => {
            a.addEventListener("auxclick", fixedNewTabLink);
            a.addEventListener("click", fixedNewTabLink);
        });
        // remove resolved recommended tags
        window.addEventListener("message", ({ data: { cmd, preTagId } }) => {
            if (cmd === "resolve_pretag") {
                const elem = getElem(`#pre_tag_${preTagId}`);
                if (elem) elem.remove();
            }
        });
    }

    // on tag list change
    if (pageIs.post) {
        new MutationObserver(() => {
            openNewTags();
            addRecommendedTags();
        }).observe(getElem("#post_tags"), { childList: true });
        addRecommendedTags();
    }

    if (pageIs.search) addRemoveTagsButton();
    if (pageIs.post && SETTINGS.tagReplacingAddButton) addReplaceTagButton();
    if (pageIs.editTag) improveTagEditor();
});

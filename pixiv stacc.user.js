// ==UserScript==
// @name         pixiv stacc
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Turn an username on profile page to link on pixiv.me/nickname
// @author       7nik
// @match        https://www.pixiv.net/member.php?id=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let getStaccName = () => new Promise((resolve, reject) => {
        let f = () => {
            let pic = document.querySelector("a[href^='/member_illust.php?mode=medium&illust_id=']");
            if (!pic) {
                setTimeout(f, 300);
                return;
            }
            let xhr = new XMLHttpRequest();
            xhr.open("GET", "/ajax/illust/" + pic.href.match(/\d+/)[0]);
            xhr.onloadend = () => resolve(JSON.parse(xhr.responseText).body.userAccount);
            xhr.onerror = () => reject({status: xhr.status, statusText: xhr.statusText});
            xhr.send();
        };
        f();
    });

    getStaccName().then(staccName => {
        let userName = document.getElementsByClassName("_2VLnXNk")[0];
        userName.innerHTML = `<a href="https://pixiv.me/${staccName}" style="color:black">${userName.innerText}</a>`;
    });

})();
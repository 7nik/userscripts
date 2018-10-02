// ==UserScript==
// @name         pixiv autojump
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Skip pixiv site leaving confirmation
// @author       7nik
// @match        https://www.pixiv.net/jump.php*
// @grant        none
// ==/UserScript==

document.getElementsByTagName("a")[0].click();
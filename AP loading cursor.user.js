// ==UserScript==
// @name         AP loading cursor
// @namespace    7nik@anime-pictures.net
// @version      0.1.3
// @description  Set "progress" cursor during executing long queries to the server
// @author       7nik
// @match        https://anime-pictures.net/*
// @grant        none
// ==/UserScript==

/* global ajax_request2:true */

(function() {
    'use strict';

    document.head.appendChild(document.createElement("style")).innerHTML =
        "body.waiting * {cursor: wait;} body.waiting a, body.waiting a * { cursor: progress; }";

    let timer = null;
    ajax_request2 = function(url, params, handler, type_r) {
        if (timer) timer = clearTimeout(timer);
        timer = setTimeout(() => document.body.classList.add("waiting"), 500);
        if (type_r == null) {
            type_r = "POST";
        }
        var form_data = new FormData();
        for (var key in params) {
            form_data.append(key, params[key]);
        }
        var request = new XMLHttpRequest();
        request.open(type_r, url);
        request.onreadystatechange = function() {
            if (timer) timer = clearTimeout(timer);
            document.body.classList.remove("waiting");
            handler(request);
        };
        request.send(form_data);
    };

})();
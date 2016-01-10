﻿/*!
    loadCSS: load a CSS file asynchronously.
    [c]2014 @scottjehl, Filament Group, Inc.
    Licensed MIT
*/

loadCSS('fonts/fonts.css');

function loadCSS(href, before, media, callback) {
    "use strict";
    var ss = window.document.createElement("link");
    var ref = before || window.document.getElementsByTagName("script")[0];
    var sheets = window.document.styleSheets;
    ss.rel = "stylesheet";
    ss.href = href;
    ss.media = "only x";

    if (callback) {
        ss.onload = callback;
    }
    ref.parentNode.insertBefore(ss, ref);
    ss.onloadcssdefined = function (cb) {
        var defined;
        for (var i = 0; i < sheets.length; i++) {
            if (sheets[i].href && sheets[i].href === ss.href) {
                defined = true;
            }
        }
        if (defined) {
            cb();
        } else {
            setTimeout(function () {
                ss.onloadcssdefined(cb);
            });
        }
    };
    ss.onloadcssdefined(function () {
        ss.media = media || "all";
    });
    return ss;
}

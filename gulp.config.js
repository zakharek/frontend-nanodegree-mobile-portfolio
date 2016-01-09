/* jshint node: true */
"use strict";

module.exports = {
    buildDir: "build/",
    urlsToInspect: [
        '/',
        '/project-2048.html',
        '/project-mobile.html',
        '/project-webperf.html',
        //'/views/pizza.html'
    ],
    jsToInspect: [
        'js/**/*.js',
        'views/js/**/*.js',
        'gulp.config.js',
        'gulpfile.js'
    ],
    htmlFiles: [
        '*.html',
        'views/*.html'
        //'!./node_modules/**'
    ],
    images: [
        'img/**/*.*',
        'views/images/**/*.*'
    ],
    css: [
        'css/**/*.css'
    ],
    fonts: 'fonts/**/*.*',
    viewHtmls: 'views/*.html',
    mainHtml: '*.html',
    js: [
        'js/**/*.js',
        'views/js/**/*.js'
    ],
    port: 8000,
    pageSpeedThreshold: 90
};

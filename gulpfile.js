"use strict";

//https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
//http://www.hongkiat.com/blog/access-localhost-public-address/
//http://una.im/gulp-local-psi/
var gulp = require('gulp'),
    connect = require('gulp-connect'),
    ngrok = require('ngrok'), //https://github.com/bubenshchykov/ngrok/issues/34#issuecomment-155420006
    psi = require('psi'),
    sequence = require('run-sequence'),
    PORT = 8000,
    site;

gulp.task('webserver', function () {
    connect.server({
        port: PORT
    });

    console.log('Started local server: http://localhost:' + PORT);
});

gulp.task('ngrok-url', function (cb) {
    return ngrok.connect({ port: PORT, nokey: true }, function (err, url) {
        console.log('started ngrok tunnel: ' + url);
        site = url;
        cb(err);
    });
});

gulp.task('psi-desktop', function (cb) {
    psi(site, {
        nokey: 'true',
        strategy: 'desktop'
    }, cb);
});

gulp.task('psi-mobile', function (cb) {
    psi(site, {
        nokey: 'true',
        strategy: 'mobile'
    }, cb);
});

gulp.task('psi-seq', function (cb) {
    return sequence(
      'webserver',
      'ngrok-url',
      'psi-desktop',
      'psi-mobile',
      cb
    );
});

gulp.task('psi', ['psi-seq'], function () {
    console.log('Woohoo! Check out your page speed scores!')
    process.exit();
});

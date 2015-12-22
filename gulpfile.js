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
    PAGE_SPEED_THRESHOLD = 90,
    site;

gulp.task('connect', function () {
    connect.server({
        port: PORT
    });

    console.log('Started local server: http://localhost:' + PORT);
});

gulp.task('ngrok', function (cb) {
    return ngrok.connect({ port: PORT, nokey: true }, function (err, url) {
        console.log('started ngrok tunnel: ' + url);
        site = url;
        cb(err);
    });
});

gulp.task('psi-desktop', function (cb) {
    console.log("target psi threshold is " + PAGE_SPEED_THRESHOLD);

    psi(site, {
        nokey: 'true',
        strategy: 'desktop',
        threshold: PAGE_SPEED_THRESHOLD
    }).then(function (data) {
        var speed = data.ruleGroups.SPEED.score,
            speedIsOk = speed >= PAGE_SPEED_THRESHOLD;

        console.log("page speed " + speed + " does" + (speedIsOk ? "" : " not") + " meet threshold " + PAGE_SPEED_THRESHOLD);
        console.log(data.pageStats);

        process.exit(speedIsOk ? 0 : 1);
        cb();
    });
});

gulp.task('psi', function (cb) {
    return sequence(
      'connect',
      'ngrok',
      'psi-desktop',
      cb
    );
});

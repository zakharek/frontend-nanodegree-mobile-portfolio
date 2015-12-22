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
    site,
    desktopPsiData,
    mobilePsiData;

function runPsi(strategy, doneCallback) {
    console.log("running psi for strategy " + strategy);
    console.log("target psi threshold is " + PAGE_SPEED_THRESHOLD);

    psi(site, {
        nokey: 'true',
        strategy: strategy,
        threshold: PAGE_SPEED_THRESHOLD
    }).then(doneCallback);
}

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
    runPsi('desktop', function (data) {
        desktopPsiData = data;
        cb();
    });
});

gulp.task('psi-mobile', function (cb) {
    runPsi('mobile', function (data) {
        mobilePsiData = data;
        cb();
    });
});

gulp.task('psi-seq', function (cb) {
    return sequence(
      'connect',
      'ngrok',
      'psi-desktop',
      'psi-mobile',
      cb
    );
});

gulp.task('psi', ['psi-seq'], function () {

    var desktopSpeed = desktopPsiData.ruleGroups.SPEED.score,
        desktopSpeedIsOk = desktopSpeed >= PAGE_SPEED_THRESHOLD,
        mobileSpeed = mobilePsiData.ruleGroups.SPEED.score,
        mobileSpeedIsOk = mobileSpeed >= PAGE_SPEED_THRESHOLD;

    console.log("desktop page speed " + desktopSpeed + " does" + (desktopSpeedIsOk ? "" : " not") + " meet threshold " + PAGE_SPEED_THRESHOLD);
    console.log("mobile page speed " + mobileSpeed + " does" + (mobileSpeedIsOk ? "" : " not") + " meet threshold " + PAGE_SPEED_THRESHOLD);

    console.log(desktopPsiData.pageStats);
    console.log(JSON.stringify(desktopPsiData, null, 4));

    process.exit(desktopSpeedIsOk && mobileSpeedIsOk ? 0 : 1);
});

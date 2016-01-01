"use strict";

//https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
//http://www.hongkiat.com/blog/access-localhost-public-address/
//http://una.im/gulp-local-psi/
var config = require('./gulp.config')(),
    gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    connect = require('gulp-connect'),
    ngrok = require('ngrok'), //https://github.com/bubenshchykov/ngrok/issues/34#issuecomment-155420006
    psi = require('psi'),
    sequence = require('run-sequence'),
    site,
    desktopPsiData,
    mobilePsiData;

gulp.task('codecheck', function () {
    return gulp
    .src(config.allJs)
   // .pipe(jscs({ fix: false }));
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish', { verbose: true }));
});

function runPsi(strategy, doneCallback) {
    console.log("running psi for strategy " + strategy);
    console.log("target psi threshold is " + config.pageSpeedThreshold);

    psi(site, {
        nokey: 'true',
        strategy: strategy,
        threshold: config.pageSpeedThreshold
    }).then(doneCallback);
}

gulp.task('connect', function () {
    connect.server({
        port: config.port
    });

    console.log('Started local server: http://localhost:' + config.port);
});

gulp.task('ngrok', function (cb) {
    return ngrok.connect({ port: config.port, nokey: true }, function (err, url) {
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
        desktopSpeedIsOk = desktopSpeed >= config.pageSpeedThreshold,
        mobileSpeed = mobilePsiData.ruleGroups.SPEED.score,
        mobileSpeedIsOk = mobileSpeed >= config.pageSpeedThreshold;

    console.log("desktop page speed " + desktopSpeed + " does" + (desktopSpeedIsOk ? "" : " not") + " meet threshold " + config.pageSpeedThreshold);
    console.log("mobile page speed " + mobileSpeed + " does" + (mobileSpeedIsOk ? "" : " not") + " meet threshold " + config.pageSpeedThreshold);

    console.log("Stats for desktop:");
    console.log(desktopPsiData.pageStats);
    console.log(JSON.stringify(desktopPsiData, null, 4));

    console.log("Stats for mobile:");
    console.log(mobilePsiData.pageStats);
    console.log(JSON.stringify(mobilePsiData, null, 4));

    process.exit(desktopSpeedIsOk && mobileSpeedIsOk ? 0 : 1);
});

/* jshint node: true */
"use strict";

//https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
//http://www.hongkiat.com/blog/access-localhost-public-address/
//http://una.im/gulp-local-psi/
var config = require('./gulp.config')(),
    gulp = require('gulp'),
    jshint = require('gulp-jshint'), //https://github.com/spalger/gulp-jshint
    jscs = require('gulp-jscs'), //https://github.com/jscs-dev/gulp-jscs
    imagemin = require('gulp-imagemin'), //https://github.com/sindresorhus/gulp-imagemin
    del = require('del'), //https://www.npmjs.com/package/del
    connect = require('gulp-connect'), //https://www.npmjs.com/package/gulp-connect
    ngrok = require('ngrok'), //https://github.com/bubenshchykov/ngrok/issues/34#issuecomment-155420006
    psi = require('psi'), //https://github.com/addyosmani/psi
    gulpSequence = require('gulp-sequence'), //https://www.npmjs.com/package/gulp-sequence
    async = require('async'), //https://github.com/caolan/async,
    util = require('gulp-util'), //https://github.com/gulpjs/gulp-util
    colors = util.colors,
    site,
    desktopPsiData = {},
    mobilePsiData = {};

gulp.task('vet', function () {
    return gulp
        .src(config.jsToInspect)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task('build', gulpSequence(
    'clean',
    ['html', 'images', 'css', 'js']));

gulp.task('clean', function (cb) {
    clean(config.buildDir, cb);
});

gulp.task('html', function () {
    info('Copying html files');

    return gulp
        .src(config.htmlFiles, { base: './' })
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('images', function () {
    info('Copying and compressing images');

    return gulp
        .src(config.images, { base: './' })
        .pipe(imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.buildDir));
});

//TODO: concat and minify
gulp.task('css', function () {
    info('Copying and optimising css');

    return gulp
        .src(config.css, { base: './' })
        .pipe(gulp.dest(config.buildDir));
});

//TODO: concat and minify
gulp.task('js', function () {
    info('Copying and optimising js');

    return gulp
        .src(config.js, { base: './' })
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('psi', gulpSequence(
    'connect',
    'ngrok',
    ['psi-desktop', 'psi-mobile'],
    'psi-result'));

gulp.task('connect', function (cb) {
    connect.server({
        port: config.port,
        root: config.buildDir
    });

    info('Serving from "' + config.buildDir + '"');
    cb();
});

gulp.task('ngrok', function (cb) {
    return ngrok
        .connect({ port: config.port, nokey: true }, function (err, url) {
            info('Started ngrok tunnel "' + url + '"');
            site = url;
            cb(err);
        });
});

gulp.task('psi-desktop', function (cb) {
    runPsi(site,
        config.urlsToInspect,
        'desktop',
        config.pageSpeedThreshold,
        function (psiResult) {
            desktopPsiData = psiResult;
            cb();
        });
});

gulp.task('psi-mobile', function (cb) {
    runPsi(site,
        config.urlsToInspect,
        'mobile',
        config.pageSpeedThreshold,
        function (psiResult) {
            mobilePsiData = psiResult;
            cb();
        });
});

gulp.task('psi-result', function () {
    var desktopSpeedIsOk = processPsiResult('desktop', desktopPsiData, config.pageSpeedThreshold),
        mobileSpeedIsOk = processPsiResult('mobile', mobilePsiData, config.pageSpeedThreshold),
        underThreshold = desktopSpeedIsOk && mobileSpeedIsOk;

    if (underThreshold) {
        info('\nEverything is under threshold');
    }
    else {
        error('\nSome pages are over threshold');
    }

    process.exit(underThreshold ? 0 : 1);
});

function runPsi(host, paths, strategy, threshold, allDoneCallback) {
    var urls = paths.map(function (path) { return host + path; }),
        psiResult = {};

    //Run psi tasks for all paths in parallel
    //https://github.com/caolan/async#user-content-eacharr-iterator-callback
    async.each(urls, function (url, callback) {
        info('Starting psi for "' + url + '" on ' + strategy);

        psi(url, {
            nokey: 'true',
            strategy: strategy,
            threshold: threshold
        }).then(function (data) {
            info('Finished psi for "' + url + '" on ' + strategy);
            psiResult[url] = data;
            callback();
        });
    }, function (err) {
        info('All pages processed for ' + strategy);
        allDoneCallback(psiResult);
    });
}

function processPsiResult(strategy, psiData, threshold, verbose) {
    var speedIsOk = true,
        logFunc = info;

    for (var url in psiData) {
        var speedScore = psiData[url].ruleGroups.SPEED.score,
            meetsThreshold = speedScore >= threshold;

        if (!meetsThreshold) {
            speedIsOk = false;
            logFunc = error;
        }

        logFunc('\nPage "' + url + '" has speed ' + speedScore +
            ', which ' + (speedIsOk ? " meets" : " doesn't meet") +
            ' threshold ' + threshold + ' on ' + strategy);

        log(psiData[url].pageStats);

        if (verbose) {
            log(JSON.stringify(psiData[url], null, 4));
        }
    }

    return speedIsOk;
}

function clean(path, cb) {
    info('Cleaning ' + path);

    del(path).then(function (p) {
        info('Cleaned  ' + path);
        cb();
    });
}

function info(msg) {
    log(colors.green(msg));
}

function error(msg) {
    log(colors.red(msg));
}

function log(msg) {
    console.log(msg);
}

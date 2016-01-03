"use strict";

//https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
//http://www.hongkiat.com/blog/access-localhost-public-address/
//http://una.im/gulp-local-psi/
var config = require('./gulp.config')(),
    gulp = require('gulp'),
    //plumber = require('gulp-plumber'),
    jshint = require('gulp-jshint'), //https://github.com/spalger/gulp-jshint
    jscs = require('gulp-jscs'), //https://github.com/jscs-dev/gulp-jscs
    imagemin = require('gulp-imagemin'),
    del = require('del'),
    connect = require('gulp-connect'), //https://www.npmjs.com/package/gulp-connect
    ngrok = require('ngrok'), //https://github.com/bubenshchykov/ngrok/issues/34#issuecomment-155420006
    psi = require('psi'), //https://github.com/addyosmani/psi
    sequence = require('run-sequence'), //https://www.npmjs.com/package/run-sequence
    async = require('async'), //https://github.com/caolan/async
    site,
    desktopPsiData = {},
    mobilePsiData = {};

gulp.task('vet', function () {
    return gulp
    .src(config.allJs)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish', { verbose: true }))
    .pipe(jscs())
    .pipe(jscs.reporter());
});

gulp.task('optimise', function (cb) {
    return sequence(
      'clean',
      'all-optimisation-tasks',
      cb
    );
});

gulp.task('clean', function (cb) {
    clean(config.buildDir, cb);
});

gulp.task('all-optimisation-tasks', ['images', 'copy_static_files'], function (cb) {
    log('Finished optimisation');
    cb();
});

gulp.task('images', function () {
    log('Copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe(imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.buildDir + 'img'));
});

gulp.task('copy_static_files', function () {
    return gulp.src('index.html')
    .pipe(gulp.dest(config.buildDir))
});

gulp.task('psi', ['psi-seq'], function () {
    var desktopSpeedIsOk = processPsiResult('desktop', desktopPsiData, config.pageSpeedThreshold);
    var mobileSpeedIsOk = processPsiResult('mobile', mobilePsiData, config.pageSpeedThreshold);
    var underThreshold = desktopSpeedIsOk && mobileSpeedIsOk;

    log(underThreshold ? 'Everything is under threshold' : 'Some pages are over threshold');
    process.exit(underThreshold ? 0 : 1);
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

gulp.task('connect', function (cb) {
    connect.server({
        port: config.port,
        root: config.buildDir
    });

    log('Started local server from directory: ' + config.buildDir + '/');
    log('Url: http://localhost:' + config.port);

    cb();
});

gulp.task('ngrok', function (cb) {
    return ngrok.connect({ port: config.port, nokey: true }, function (err, url) {
        log('Started ngrok tunnel: ' + url);
        site = url;
        cb(err);
    });
});

gulp.task('psi-desktop', function (cb) {
    runPsi(site,
        ['/', '/views/pizza.html'],
        'desktop',
        config.pageSpeedThreshold,
        function (psiResult) {
            desktopPsiData = psiResult;
            cb();
        });
});

gulp.task('psi-mobile', function (cb) {
    runPsi(site,
        ['/', '/views/pizza.html'],
        'mobile',
        config.pageSpeedThreshold,
        function (psiResult) {
            mobilePsiData = psiResult;
            cb();
        });
});

function runPsi(host, paths, strategy, threshold, allDoneCallback) {
    var urls = paths.map(function (path) { return host + path; }),
        psiResult = {};

    //https://github.com/caolan/async#user-content-eacharr-iterator-callback
    async.each(urls, function (url, callback) {
        log('Running psi for "' + url + '" on ' + strategy + ' (threshold ' + threshold + ')');

        psi(url, {
            nokey: 'true',
            strategy: strategy,
            threshold: threshold
        }).then(function (data) {
            log('Page "' + url + '" processed for ' + strategy);
            psiResult[url] = data;
            callback();
        });
    }, function (err) {
        log('All pages processed for ' + strategy)
        allDoneCallback(psiResult);
    });
}

function processPsiResult(strategy, psiData, threshold, verbose) {
    var speedIsOk = true;

    for (var url in psiData) {
        var speedScore = psiData[url].ruleGroups.SPEED.score;

        if (speedScore < threshold) {
            speedIsOk = false;
        }

        log('\nStats for "' + url + '" ' + strategy + ':' + '\n' +
            strategy + " page speed " + speedScore +
            " does" + (speedIsOk ? "" : " not") +
            " meet threshold " + threshold);
        log(psiData[url].pageStats)
        log('')

        if (verbose) {
            log(JSON.stringify(psiData[url], null, 4));
        }
    }

    return speedIsOk;
}

function clean(path, cb) {
    log('Cleaning: ' + path);

    del(path).then(function (p) {
        cb();
    });
}

function log(msg) {
    console.log(msg);
}
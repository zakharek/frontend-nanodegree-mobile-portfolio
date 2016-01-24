/* jshint node: true */
"use strict";

//How to debug gulp tasks: https://github.com/node-inspector/node-inspector#user-content-how-do-i-debug-gulp-tasks
//NB: debugger is super slow for projects with many modules
//node-debug --no-preload --hidden node_modules/ -p 8081  %appdata%\npm\node_modules\gulp\bin\gulp.js --gulpfile path-to-project\gulpfile.js myTask

//https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md
//http://www.hongkiat.com/blog/access-localhost-public-address/
//http://una.im/gulp-local-psi/
var config = require('./gulp.config'),
    gulp = require('gulp'),

    gulpSequence = require('gulp-sequence'),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs'),
    imagemin = require('gulp-imagemin'),
    util = require('gulp-util'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    csso = require('gulp-csso'),
    googleWebFonts = require('gulp-google-webfonts'),
    express = require('express'),
    compression = require('compression'),
    replace = require('gulp-replace'),
    fs = require('fs'),

    del = require('del'),
    ngrok = require('ngrok'), //https://github.com/bubenshchykov/ngrok/issues/34#issuecomment-155420006
    psi = require('psi'),
    async = require('async'),
    colors = util.colors,
    site,
    desktopPsiData = {},
    mobilePsiData = {};

gulp.task('default', ['psi']);

gulp.task('lint', function () {
    return gulp
        .src(config.jsToInspect)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe(jscs())
        .pipe(jscs.reporter());
});

gulp.task('build', gulpSequence(
    'clean',
    ['html', 'images', 'fonts'],
    ['optimise-view-css-js', 'optimise-main-css-js'],
    ['inline-css']));

gulp.task('clean', function (cb) {
    clean(config.buildDir, cb);
});

gulp.task('fonts', function () {
    info('Copying font files');

    return gulp
        .src(config.fonts, { base: './' })
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('donwload-fonts', function () {
    info('Downloading Google fonts locally');

    return gulp.src('./fonts.list')
        .pipe(googleWebFonts({ cssFilename: config.fontsCss }))
        .pipe(gulp.dest('fonts'));
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

gulp.task('optimise-view-css-js', function () {
    info('Optimising view css js');

    return gulp
        .src(config.viewHtmls)
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', csso()))
        .pipe(gulp.dest(config.buildDir + 'views/'));
});

gulp.task('optimise-main-css-js', function () {
    info('Copying and optimising main css js');

    return gulp
        .src(config.mainHtml)
        .pipe(useref())
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', csso()))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('inline-css', function () {
    info('Inlining css');

    return gulp.src(config.buildDir + "index.html")
        .pipe(replace(/[<]link .*?href=["']css\/styles\.css["'].*?[\/]{0,1}\>/, function(s) {
            var style = fs.readFileSync(config.buildDir + "css/styles.css", 'utf8');
            return '<style>\n' + style + '\n</style>';
        }))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('psi', gulpSequence(
    'express',
    'ngrok',
    ['psi-desktop', 'psi-mobile'],
    'psi-result'));

gulp.task('express', ['build'], function (cb) {
    var app = express();
    app.use(compression());
    app.use(express.static(config.buildDir));

    app.listen(config.port, function () {
        info('Serving from "' + config.buildDir + '"');
        info('Listening on port ' + config.port + '...');
        cb();
    });
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
    var desktopSpeedIsOk = processPsiResult(
            'desktop',
            desktopPsiData,
            config.pageSpeedThreshold,
            config.psiVerbose),
        mobileSpeedIsOk = processPsiResult(
            'mobile',
            mobilePsiData,
            config.pageSpeedThreshold,
            config.psiVerbose),
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

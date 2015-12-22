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
    PAGE_SPEED_THRESHOLD = 99,
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
        strategy: 'desktop',
        threshold: PAGE_SPEED_THRESHOLD
    }).then(function (data) {
        var speed = data.ruleGroups.SPEED.score,
            speedIsOk = speed >= PAGE_SPEED_THRESHOLD;

        console.log("page speed does " + speed + (speedIsOk ? "" : " not") + " meet threshold " + PAGE_SPEED_THRESHOLD);
        process.exit(speedIsOk ? 0 : 1);
        cb();
    });
});

//gulp.task('psi-mobile', function (cb) {
//    psi(site, {
//        nokey: 'true',
//        strategy: 'mobile'
//    }, cb);
//});

//gulp.task('run-psi', function (cb) {
//    return ngrok.connect({
//        port: PORT,
//        nokey: true
//    }, function (err_ngrok, url) {
//        console.log("serving site from: " + url);

//        // Run PageSpeed once the tunnel is up.
//        psi.output(url, {
//            strategy: 'mobile',
//            threshold: 80
//        }, function (err_psi, data) {
//            // Log any potential errors and return a FAILURE.
//            if (err_psi) {
//                log(err_psi);
//                process.exit(1);
//            }

//            // Kill the ngrok tunnel and return SUCCESS.
//            process.exit(0);
//            cb(err_psi);
//        });
//    });
//});

gulp.task('psi', function (cb) {
    return sequence(
      'webserver',
      'ngrok-url',
      'psi-desktop',
      //'psi-mobile',
      //'run-psi',
      cb
    );
});

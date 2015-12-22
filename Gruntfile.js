//module.exports = function(grunt) {

//  // Project configuration.
//  grunt.initConfig({
//    pkg: grunt.file.readJSON('package.json'),
    
//    pagespeed: {
//      options: {
//        nokey: true,
//        url: "https://developers.google.com"
//      }
//	  ,
//      prod: {
//        options: 
//          url: "https://developers.google.com/speed/docs/insights/v1/getting_started",
//          locale: "en_GB",
//          strategy: "desktop",
//          threshold: 99
//        }
//      },
//      paths: {
//        options: {
//          paths: ["/speed/docs/insights/v1/getting_started", "/speed/docs/about"],
//          locale: "en_GB",
//          strategy: "desktop",
//          threshold: 99
//        }
//      }
//    }


//  });

//  // Load the plugin that provides the "pagespeed" task.
//  grunt.loadNpmTasks('grunt-pagespeed');

//  // Default task(s).
//  grunt.registerTask('default', ['pagespeed']);

//};

'use strict'

var ngrok = require('ngrok');

module.exports = function (grunt) {

    // Load grunt tasks
    require('load-grunt-tasks')(grunt);

    // Grunt configuration
    grunt.initConfig({
        pagespeed: {
            options: {
                nokey: true,
                locale: "en_GB",
                threshold: 40
            },
            local: {
                options: {
                    strategy: "desktop"
                }
            },
            mobile: {
                options: {
                    strategy: "mobile"
                }
            }
        }
    });

    // Register customer task for ngrok
    grunt.registerTask('psi-ngrok', 'Run pagespeed with ngrok', function () {
        var done = this.async();
        var port = 9292;

        ngrok.connect(port, function (err, url) {
            if (err !== null) {
                grunt.fail.fatal(err);
                return done();
            }
            grunt.config.set('pagespeed.options.url', url);
            grunt.task.run('pagespeed');
            done();
        });
    });

    // Register default tasks
    grunt.registerTask('default', ['psi-ngrok']);
}
module.exports = function () {
    var config = {
        buildDir: "build/",
        allJs: [
            './js/**/*.js'//,
            //'./*.js'
        ],
        port: 8000,
        pageSpeedThreshold: 90,
        images: 'img/**/*.*'
    };

    return config;
};
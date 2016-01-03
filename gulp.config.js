module.exports = function () {
    var config = {
        buildDir: "",
        allJs: [
            './js/**/*.js'//,
            //'./*.js'
        ],
        port: 8000,
        pageSpeedThreshold: 90
    };

    return config;
};
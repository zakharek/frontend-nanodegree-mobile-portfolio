module.exports = function () {
    var config = {
        allJs: [
            './js/**/*.js'//,
            //'./*.js'
        ],
        port: 8000,
        pageSpeedThreshold: 90
    };

    return config;
};
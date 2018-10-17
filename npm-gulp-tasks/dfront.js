var fs = require('fs');
var gulp = require('gulp-help')(require('gulp'));
var sass = require('gulp-sass');
var gcmq = require('gulp-group-css-media-queries');
var g = require('gulp-load-plugins')();

var runSequence = require('run-sequence');
var bs = require('browser-sync');

module.exports = function(gulp, projectConfigurations, gulpConfig, config) {

    var paths = gulpConfig;
    var srcPaths = config.paths;

    gulp.task('dfront-sass', function () {
        return gulp.src('scss/**/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(gcmq())
            .pipe(gulp.dest('./css'))
            .pipe(bs.stream());
    });

    gulp.task('dfront-sass-old', function () {
        return gulp.src('scss-old/**/ib-style-modules-old.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(gcmq())
            .pipe(gulp.dest('./css'))
            .pipe(bs.stream());
    });

    gulp.task('dfront-sass-iframe', function () {
        return gulp.src('scss-iframe/**/*.scss')
            .pipe(sass().on('error', sass.logError))
            .pipe(gcmq())
            .pipe(gulp.dest('./css-iframe'))
            .pipe(bs.stream());
    });

    gulp.task('dfront-server', function() {
        bs.init({
            server: './',
            port: '8281',
            startPath: './src',
            directory: false,
            ui: false,
            reloadOnRestart: false
        });
    });

    gulp.task('dfront-watch', function () {
        gulp.watch('**/*.scss', ['dfront-sass', 'dfront-sass-iframe']);
    });

    gulp.task('dfront-cssmin', function () {
        gulp.src(paths.css_src)
            .pipe(g.cssmin())
            .pipe(g.rename({
                suffix: '.min'
            }))
            .pipe(gulp.dest(paths.dist));
    });



    gulp.task('front-live', 'Builds the code and runs unit tests. Assuming both these tasks are successful the server will be started locally and a watch set up to allow live reload', ['dfront-sass', 'dfront-server', 'dfront-watch']);

    gulp.task('front-live-iframe', 'scss iframe run', ['dfront-sass', 'dfront-sass-iframe', 'dfront-server', 'dfront-watch']);
};
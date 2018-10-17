(function () {

    var fs = require('fs');
    var plugins = require('gulp-load-plugins')();
    var mainBowerFiles = require('main-bower-files');
    var del = require('del');
    var gutil = require('gulp-util');
    var validate = require('html-angular-validate');
    var runSequence = require('run-sequence');
    var common = require('./common-fn.js');
    var argv = require('yargs').argv;
    var rename = require('gulp-rename');
    var reporter = require('eslint-html-reporter'); // eslint-html-reporter required to export report to human readable file
    var debug = require('gulp-debug');


    module.exports = function (gulp, projectConfigurations, gulpConfig, config) {

        var paths = gulpConfig;
        var pkg = projectConfigurations;
        var buildPaths = config.paths;

        gulp.task('cpd', function () {
            return gulp.src(buildPaths.js_src)
                .pipe(plugins.jscpd({
                    output: './' + paths.reports + 'cpd.xml',
                    silent: true
                }));
        });

        gulp.task('sass', false, function () {
            return gulp.src(paths.sass_src)

                .pipe(plugins.sass({outputStyle: 'expanded', sourceComments: 'normal'}))
                .pipe(gulp.dest(paths.css));
        });

        gulp.task('sass-wcs', false, function () {
            return gulp.src(paths.sass_wcs_src)
                .pipe(plugins.sass({outputStyle: 'expanded', sourceComments: 'normal'}))
                .pipe(gulp.dest(paths.css));
        });

        gulp.task('sass-old', false, function () {
            return gulp.src(paths.sass_old_src)
                .pipe(plugins.sass({outputStyle: 'expanded', sourceComments: 'normal'}))
                .pipe(gulp.dest(paths.css));
        });

        gulp.task('css', false, function () {
            return gulp.src(paths.css_src_mv)
            // Dump all files into build folder
                .pipe(gulp.dest(paths.dist));
        });

        gulp.task('css-iframe', false, function () {
            return gulp.src(paths.css_src_iframe)
            // Dump all files into build folder
                .pipe(gulp.dest(paths.dist_iframe));
        });

        gulp.task('css-minified-iframe', false, function () {
            return gulp.src(paths.css_src_iframe)
            // Concatenate all files into one big one
                .pipe(plugins.concat('ib-style-integration.css'))
                //   .pipe(debug())
                // Minify and rename to module.min.js
                .pipe(plugins.cssmin())
                .pipe(plugins.rename({suffix: '.min'}))
                // Dump all files into build folder
                .pipe(gulp.dest(paths.dist_iframe))
                .pipe(gulp.dest(paths.build));
        });

        //
        // gulp.task('css-minified', false, function () {
        //     return gulp.src(paths.css_src)
        //     // Concatenate all files into one big one
        //         .pipe(plugins.concat(pkg.name + '.css'))
        //         //   .pipe(debug())
        //         // Minify and rename to module.min.js
        //         .pipe(plugins.cssmin())
        //         .pipe(plugins.rename({extname: '.min.css'}))
        //         // Dump all files into build folder
        //         .pipe(gulp.dest(paths.dist));
        // });
        //
        //
        // gulp.task('css-minified-wcs', false, function () {
        //     return gulp.src(paths.css_src_wcs)
        //     // Concatenate all files into one big one
        //         .pipe(plugins.concat(pkg.name + '-wcs.css'))
        //         // .pipe(debug())
        //         // Minify and rename to module.min.js
        //         .pipe(plugins.cssmin())
        //         .pipe(plugins.rename({extname: '.min.css'}))
        //         // Dump all files into build folder
        //         .pipe(gulp.dest(paths.dist));
        // });

        gulp.task('sass-lint', 'Lint Your SASS', function () {
            var options = {
                'configFile': 'config/sass.yml',
                'formatter': 'checkstyle',
                'output-file': paths.lintReports + 'sass.xml'
            };
            if (!fs.existsSync(paths.reports)) {
                fs.mkdirSync(paths.reports);
            }

            if (!fs.existsSync(paths.lintReports)) {
                fs.mkdirSync(paths.lintReports);
            }

            return gulp.src(paths.sass_src)
                .pipe(plugins.sassLint({options: options}))
                .pipe(plugins.sassLint.format())
                .pipe(plugins.sassLint.failOnError());
        });

        gulp.task('lint', 'ESLint Your Code and Tests', function () {
            // Create reports directory if it doesn't already exist
            if (!fs.existsSync(paths.reports)) {
                fs.mkdirSync(paths.reports);
            }
            // Create lint reports directory if it doesn't already exist
            if (!fs.existsSync(paths.lintReports)) {
                fs.mkdirSync(paths.lintReports);
            }
            // Create checkstyle.xml lint report output
            var output = fs.createWriteStream(paths.lintReports + 'checkstyle.xml');

            return gulp.src(buildPaths.js_src.concat(paths.all_tests_src))
            // Tell the eslint plugin where to look for the rules
                .pipe(plugins.eslint({
                    rulePaths: ['config/lint/'],
                    configFile: 'config/lint/.eslintrc',
                    extends: ['angular']
                }))
                // Run eslint and return the results to the console screen
                .pipe(plugins.eslint.format())
                // Run eslint and put the results into the checkstyle.xml created above
                .pipe(plugins.eslint.format('checkstyle', output))
                // Run eslint, format the report into html file and export to lint reports directory
                .pipe(plugins.eslint.format(reporter, function (results) {
                        fs.writeFileSync(paths.lintReports + 'report-results.html', results);
                    })
                );
        });

        gulp.task('lint-all', false, ['lint', 'sass-lint']);

        gulp.task('clean', 'Deletes the build', function (cb) {
            return del([paths.dist], cb);
        });

        gulp.task('scripts', false, ['lint-all'], function () {
            return gulp.src(buildPaths.js_src)
            // Apply AngularJS annotations to module definitions
                .pipe(plugins.ngAnnotate())
                // Concatenate all the files into one big one, defined by the order of the files specified in paths.app_src
                .pipe(plugins.concat(pkg.name + '.min.js'))
                // Uglify
                .pipe(plugins.uglify())
                // Output the minified file
                .pipe(gulp.dest(paths.build));
        });

        gulp.task('scripts-dev', false, ['lint-all'], function () {
            return gulp.src(buildPaths.js_src)
            // Initialize the sourcemap tooling
                .pipe(plugins.sourcemaps.init())
                // Apply AngularJS annotations to module definitions
                .pipe(plugins.ngAnnotate())
                // Concatenate all the files into one big one, defined by the order of the files specified in paths.app_src
                .pipe(plugins.concat(pkg.name + '.min.js'))
                // Output the Source map
                .pipe(plugins.sourcemaps.write('.'))
                // Output the minified file
                .pipe(gulp.dest(paths.build));
        });

        gulp.task('dependencies', false, function () {
            //filter out minified javascript
            var removeMinJSFilter = plugins.filter(['*', '!**/*.min.js', '!**/modernizr.js'], {restore: true});
            var onlyJSFiles = plugins.filter('**/*.js');

            //mainBowerFiles returns the minified files found in bower components
            return gulp.src(mainBowerFiles())
            //filter out all minified files, map files, and CSS leaving only unminified JS
                .pipe(onlyJSFiles)
                .pipe(removeMinJSFilter)
                //add back all the pre-minified JS
                .pipe(removeMinJSFilter.restore)
                // Concatenate all the files into one big one
                .pipe(plugins.concat(pkg.name + '.dependencies.min.js'))
                // Uglify
                .pipe(plugins.uglify())
                // Output the file
                .pipe(gulp.dest(paths.build));
        });

        gulp.task('build', function (done) {
            runSequence(
                'clean',
                'lint-all',
                'scripts-dev',
                'dependencies',
                'sass',
                'sass-wcs',
                'sass-old',
                'css',
                'css-iframe',
                // 'css-minified',
                // 'css-minified-wcs',
                'css-minified-iframe',
                'cpd',
                function (error) {
                    if (error) {
                        console.log(error.message);
                        return process.exit(2);
                    } else {
                        console.log('BUILD SUCCESS');
                        done();
                    }
                }
            )
        });
    };
})();
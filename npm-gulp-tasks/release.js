(function () {

    var plugins = require('gulp-load-plugins')();
    var runSequence = require('run-sequence');
    var deployer = require('web-nexus-deployer');
    var git = require('./git-fn.js');
    var common = require('./common-fn.js');

    module.exports = function (gulp, projectConfigurations, gulpConfig, config) {

        var knownOptions = {
            string: ['release-type', 'version']
        };

        var argv = require('minimist')(process.argv.slice(2), knownOptions);

        // gulp.task('release-start', function (done) {
        //     var releaseType = argv['release-type'];
        //     if (!releaseType) {
        //         console.log('Tell me the release-type param');
        //         process.exit(1)
        //     }
        //     runSequence(
        //         'checkout-develop',
        //         'commit-changes-develop',
        //         'pull-develop',
        //         'bump',
        //         'update-version-file',
        //         'build',
        //         'commit-changes-develop',
        //         'push-develop',
        //         'checkout-master',
        //         'merge-develop',
        //         'push-master',
        //         'create-new-tag',
        //         function (error) {
        //             common.statusTask(error, 'COMPONENT SUCCESSFULLY REGISTERED: ' + releaseType, done);
        //         }
        //     )
        // });
        gulp.task('release-start', function (done) {
            var releaseType = argv['release-type'];
            if (!releaseType) {
                console.log('Tell me the release-type param');
                process.exit(1)
            }
            runSequence(
                'checkout-develop',
                'commit-changes-develop',
                'pull-develop',
                'bump',
                'update-version-file',
                'build',
                'commit-changes-develop',
                'push-develop',
                'checkout-master',
                'merge-develop',
                'push-master',
                'create-new-tag',
                'generate-dist',
                'deploy-nexus',
                'clean-temp',
                function (error) {
                    common.statusTask(error, 'COMPONENT SUCCESSFULLY REGISTERED: ' + releaseType, done);
                }
            )
        });

        gulp.task('generate-new-version', function () {
            var release_Type = argv['release-type'];
            var oldeVersion = common.packageJson().version;
            var versionParts = oldeVersion.split('.');
            var vArray = {
                'vMajor': versionParts[0],
                'vMinor': versionParts[1],
                'vPatch': versionParts[2]
            };
            if (/^(major)$/.test(release_Type)) {
                vArray.vMajor = parseInt(vArray.vMajor) + 1;
                vArray.vMinor = 0;
                vArray.vPatch = 0;
            } else if (/^(minor)$/.test(release_Type)) {
                vArray.vMinor = parseInt(vArray.vMinor) + 1;
                vArray.vPatch = 0;
            } else if (/^(patch)$/.test(release_Type)) {
                vArray.vPatch = parseInt(vArray.vPatch) + 1;
            }
            version = vArray.vMajor + '.' + vArray.vMinor + '.' + vArray.vPatch;
            console.log('new version: ' + version);
        });

        gulp.task('release-info', function () {
            if (!/^(major|minor|patch|\d{1,2}\.\d{1,4}\.\d{1,4})$/.test(argv['release-type'])) {
                console.log('\nINVALID PARAMETER:\n');
                console.log('\nrelease-type should be \'patch\', \'minor\', \'major\' for automatic version number increments, or an explicit version number specified in xx.yyyy.zzzz format.\n\nThe default (if not supplied) is \'patch\'.');
                process.exit(1);
            }
        });

        gulp.task('bump', ['release-info'], function () {
            var bumpType = /^(major|minor|patch)$/.test(argv['release-type'])
                ? { 'type': argv['release-type'] }
                : { 'version': argv['release-type'] };
            return gulp.src(['package.json'])
                .pipe(plugins.bump(bumpType))
                .pipe(gulp.dest('./'));
        });

        gulp.task('create-new-tag', function (cb) {
            var version = common.packageJson().version;
            git.createTag(version, 'Created Tag for version: ' + version, cb)
        });

        gulp.task('create-branch-release', function (cb) {
            git.createBranch('release/' + version, cb)
        });

        gulp.task('checkout-release', function (cb) {
            git.checkout('release/' + version, cb)
        });

        gulp.task('push-release', function (cb) {
            git.push('release/' + version, cb);
        });

        gulp.task('update-release', function (cb) {
            git.commitChanges('Start release version ' + common.packageJson().version, cb);
        });

        gulp.task('generate-dist', function (cb) {
            var version = common.packageJson().version;
            return gulp.src('build/**')
                .pipe(plugins.zip(version + '.zip'))
                .pipe(gulp.dest('temp'))
        });

        gulp.task('deploy-nexus', function (cb) {
            var argv = require('minimist')(process.argv.slice(2), { 'string': ['version'] });
            var version = argv['version'];
            if (!version) {
                version = common.packageJson().version;
            }

            info = config.nexus;
            info.version = version;
            info.artifact = 'temp/' + version + '.zip';

            deployer.deploy(info, function (err) {
                if (err) {
                    console.log(err);
                }
                cb();
            })

        });

        gulp.task('commit-changes-develop', function (cb) {
            git.commitChanges('Changes on develop in release', cb);
        });

        gulp.task('merge-develop', function (cb) {
            git.merge('develop', cb)
        });

    };
})();
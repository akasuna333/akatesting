var gulp = require('gulp-help')(require('gulp'));
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence')
var git = require('./git-fn.js');
var common = require('./common-fn.js');

module.exports = function (gulp, projectConfigurations, gulpConfig, config) {

    var knownOptions = {
        string: 'hotfix'
    };

    var argv = require('minimist')(process.argv.slice(2), knownOptions);

    var hotfix = argv['hotfix'];
    if (hotfix) {
        hotfix = 'hotfix/' + hotfix;
    }

    gulp.task('create-branch-hotfix', function (cb) {
        git.createBranch(hotfix, cb)
    });

    gulp.task('pull-hotfix', function (cb) {
        git.pull(hotfix, cb);
    })

    gulp.task('push-hotfix', function (cb) {
        git.push(hotfix, cb);
    });

    gulp.task('update-hotfix', function (cb) {
        git.commitChanges('Start hotfix ' + common.packageJson().version, cb);
    });

    gulp.task('commit-changes-hotfix', function (cb) {
        git.commitChanges('Hotfix version: ' + common.packageJson().version, cb);
    });

    gulp.task('remove-hotfix-local', function (cb) {
        git.removeLocal(hotfix, cb);
    });

    gulp.task('remove-hotfix-remote', function (cb) {
        git.removeRemote(hotfix, cb);
    });

    gulp.task('checkout-hotfix', function (cb) {
        git.checkout(hotfix, cb);
    });

    gulp.task('create-new-tag-hotfix', function (cb) {
        var version = common.packageJson().version;
        git.createTag(version, 'Created Tag for version: ' + version, cb)
    });

    gulp.task('merge-hotfix', function (cb) {
        plugins.git.merge(hotfix, function (err) {
            if (err) {
                throw err
            } else {
                cb();
            }
        })
    });

    gulp.task('bump-hotfix', function () {
        return gulp.src(['package.json'])
            .pipe(plugins.bump({ 'type': config.release_types.patch }))
            .pipe(gulp.dest('./'));
    });

    gulp.task('hotfix-start', function (done) {
        if (!argv['hotfix']) {
            console.log('Tell me the hotfix param');
            process.exit(1);
        }
        runSequence(
            'checkout-master',
            'pull-master',
            'create-branch-hotfix',
            'checkout-hotfix',
            'bump-hotfix',
            'update-version-file',
            'update-hotfix',
            'push-hotfix',
            function (error) {
                if (error) {
                    console.log(error.message);
                    return process.exit(2);
                } else {
                    console.log('HOTFIX BRANCH CREATED: ' + hotfix);
                    done();
                }
            }
        )
    });

    gulp.task('hotfix-finish', function (callback) {
        if (!argv['hotfix']) {
            console.log('Tell me the hotfix param');
            process.exit(1);
        }
        runSequence(
            'checkout-hotfix',
            'build',
            'commit-changes-hotfix',
            'pull-hotfix',
            'push-hotfix',
            'create-new-tag-hotfix',
            'checkout-master',
            'pull-master',
            'merge-hotfix',
            'push-master',
            'checkout-develop',
            'pull-develop',
            'merge-hotfix',
            'push-develop',
            'remove-hotfix-local',
            'remove-hotfix-remote',
            function (error) {
                if (error) {
                    console.log(error.message)
                    return process.exit(2)
                } else {
                    console.log('HOTFIX FINISHED SUCCESSFULLY: ' + hotfix)
                }
            }
        )
    });

};

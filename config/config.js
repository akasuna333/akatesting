var config = {
    paths : {
        context_path: '',
        index: 'src/index.html',
        js_src: ['src/*-lib.js','src/**/*-module.js', 'src/**/*-constant.js', 'src/**/*-constant-*.js','src/components/**/*-decorator.js','src/*-app.js','src/!(*-app.js)*js','src/components/**/!(*-module.js)*.js']
    },
    branches: {
        develop: 'develop',
        master: 'master'
    },
    release_types: {
        major: 'major',
        minor: 'minor',
        patch: 'patch'
    },
    nexus: {
        groupId: 'com.ib.front',
        artifactId: 'web-style-modules',
        packaging: 'zip',
        auth: {
            username: 'admin',
            password: '12jnd34'
        },
        pomDir: 'temp/pom',
        url: 'http://nexus.corp.iberia.es/repository/releases',
        quiet: true,
        insecure: true
    }
};

module.exports = config;

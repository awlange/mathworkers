module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                separator: "\n\n"
            },
            main: {
                src: [
                    'src/main/intro.js',
                    'src/main/core/communication.js',
                    'src/main/core/coordinator.js',
                    'src/main/outro.js'
                ],
                dest: 'dist/<%= pkg.name.replace(".js", "") %>.js'
            },
            worker: {
                src: [
                    'src/worker/intro.js',
                    'src/worker/core/communication.js',
                    'src/worker/core/mathworker.js',
                    'src/worker/outro.js'
                ],
                dest: 'dist/<%= pkg.name.replace(".js", "") %>.worker.js'
            }
        },

        //uglify: {
        //  options: {
        //    banner: '/*! <%= pkg.name.replace(".js", "") %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        //  },
        //  dist: {
        //    files: {
        //      'dist/<%= pkg.name.replace(".js", "") %>.min.js': ['<%= concat.dist.dest %>']
        //    }
        //  }
        //},
        //
        //qunit: {
        //  files: ['test/*.html']
        //},

        jshint: {
            files: ['dist/mathworkers.js'],
            options: {
                globals: {
                    console: true,
                    module: true,
                    document: true
                },
                jshintrc: '.jshintrc'
            }
        },

        watch: {
            files: ['<%= jshint.files %>'],
            //tasks: ['concat', 'jshint', 'qunit']
            tasks: ['concat', 'jshint']
        }

    });

    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    //grunt.registerTask('test', ['jshint', 'qunit']);
    //grunt.registerTask('default', ['concat', 'jshint', 'qunit', 'uglify']);
    grunt.registerTask('default', ['concat']);

};

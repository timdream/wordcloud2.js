'use strict';

module.exports = function(grunt) {

  var HTTPD_PORT = 28080 + Math.floor(Math.random() * 10);
  var TEST_URL = 'http://localhost:' + HTTPD_PORT + '/test/';

  var BASE_COMMIT = grunt.option('base-commit') ||
    process.env.TRAVIS_BRANCH ||
    '';

  grunt.initConfig({
    shell: {
      'qunit-slimerjs': {
        command: './test/run-slimerjs.sh ' + TEST_URL + '?allownoref=true',
        options: {
          stdout: true,
          stderr: true,
          failOnError: true,
          execOptions: {
            maxBuffer: Infinity
          }
        }
      },
      'compare-slimerjs': {
        command: './test/run-slimerjs-compare.sh ' +
          TEST_URL + ' ' + BASE_COMMIT,
        options: {
          stdout: true,
          stderr: true,
          failOnError: true,
          execOptions: {
            maxBuffer: Infinity
          }
        }
      }
    },
    connect: {
      test: {
        options: {
          port: HTTPD_PORT
        }
      }
    },
    jshint: {
      options: {
        jshintrc: true,
        reporterOutput: "" // Workaround jshint/jshint#2922
      },
      all: ['src/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('test', ['jshint','test-slimerjs']);
  grunt.registerTask('compare', ['compare-slimerjs']);

  // Run the test suite with QUnit on SlimerJS
  grunt.registerTask('test-slimerjs', ['connect', 'shell:qunit-slimerjs']);

  // Run the test suite with QUnit on SlimerJS
  grunt.registerTask('compare-slimerjs',
    ['connect', 'shell:compare-slimerjs']);

  grunt.registerTask('travis-ci', function() {
    if (process.env.TRAVIS_PULL_REQUEST === 'false') {
      // Not working on pull requests -- simply run test job.
      grunt.task.run(['test']);
    } else {
      // Running on pull requests -- check linting, and compare the images with
      // the branch to merge.
      grunt.task.run(['jshint', 'compare']);
    }
  });
};

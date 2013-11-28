
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-es6-module-transpiler');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    transpile: {
      main: {
        type: "cjs", // or "amd"
        files: [{
          expand: true,
          cwd: 'shared/js/libgaia',
          src: ['**/*.js'],
          dest: 'shared/js/modules'
        }]
      }
    }
  });

  grunt.registerTask('default', ['transpile']);
};

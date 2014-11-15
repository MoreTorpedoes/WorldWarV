'use strict'

module.exports = (grunt) ->

  require('load-grunt-tasks')(grunt)
  require('time-grunt')(grunt)

  grunt.initConfig {

    watch: 
      options:
        livereload: true
      client: 
        files: [
          './client/**/*'
        ]
        tasks: []
        options: 
          livereload: '<%= connect.options.livereload %>'

    connect: 
      options:
        port: 9000
        hostname: 'localhost'
        livereload: 35729
      
      livereload:
        options: 
          open: true
          middleware: (connect) ->
            return [
              connect.static '.tmp'
              connect().use '/bower_components', connect.static('./bower_components')
              connect.static 'client'
            ]
  }

  grunt.registerTask 'serve', 'Compile and then start the connect web server.', (target) ->

    grunt.task.run [
      'connect:livereload'
      'watch'
    ]
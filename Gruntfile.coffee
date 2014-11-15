'use strict'

module.exports = (grunt) ->

  require('load-grunt-tasks')(grunt)
  require('time-grunt')(grunt)

  grunt.initConfig {

    watch: 
      options:
        livereload: '<%= connect.options.livereload %>'
      
      client: 
        files: [
          './client/**/*'
        ]
      
      server: 
        files: [
          './server/**/*'
        ]
      
      bower: 
        files: [
          './bower_components/**/*'
        ]
    # end watch

    connect: 
      options:
        port: 9000
        hostname: 'localhost'
        livereload: 35729
      
      client:
        options: 
          open: true
          middleware: (connect) ->
            return [
              connect.static '.tmp'
              connect().use '/bower_components', connect.static('./bower_components')
              connect.static './client'
            ]

      server:
        options:
          open: true
          middleware: (connect) ->
            return [
              connect.static '.tmp'
              connect().use '/bower_components', connect.static('./bower_components')
              connect.static './client'
              connect.static './server'
            ]
    # end connect
  }

  grunt.registerTask 'serve', 'Compile and then start the connect web server.', (target) ->

    grunt.task.run [
      "connect:#{target}"
      'watch'
    ]
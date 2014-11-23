
gulp  = require 'gulp'
lrs   = require('tiny-lr')()

CLIENT_DIR = "#{__dirname}/client"

gulp.task 'default', ->
  express = require('express')
  app = express()

  app.use require('connect-livereload')()

  # static dirs
  app.use express.static(CLIENT_DIR)
  app.use express.static(__dirname + '/.tmp')
  app.use express.static(__dirname + '/bower_components/**')

  app.listen 9000
  lrs.listen 35729

  gulp.watch "#{CLIENT_DIR}/**/*", (event) ->
    #console.log event
    lrs.changed
      body:
        files: [event.path]

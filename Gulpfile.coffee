
gulp  = require 'gulp'
lrs   = require('tiny-lr')()

gulp.task 'default', ->
  express = require('express')
  app = express()

  app.use require('connect-livereload')()

  # static dirs
  app.use express.static(__dirname + '/client')
  app.use express.static(__dirname + '/.tmp')
  app.use express.static(__dirname + '/bower_components/**')

  app.listen 9000
  lrs.listen 35729

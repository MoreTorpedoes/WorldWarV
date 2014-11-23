
gulp  = require 'gulp'
lrs   = require('tiny-lr')()
browserify = require 'gulp-browserify'

CLIENT_DIR = "#{__dirname}/client"
TMP_DIR = "#{__dirname}/.tmp"

notifyLivereload = (event) ->
  #console.log event
  lrs.changed
  body:
    files: [event.path]

# compile our js via browserify
gulp.task 'jsScripts', ->
  gulp.src "#{CLIENT_DIR}/js/engine.js"
    .pipe browserify
      insertGlobals: true
      debug : !gulp.env.production
    .pipe gulp.dest "#{TMP_DIR}/js"

# compile files
gulp.task 'build', [
  'jsScripts'
]

# watch files and execute appropriate tasks
gulp.task 'watch', ->
  # client directory watches
  gulp.watch "#{CLIENT_DIR}/**/*.html", notifyLivereload
  gulp.watch "#{CLIENT_DIR}/ng/**/*.js", notifyLivereload
  gulp.watch "#{CLIENT_DIR}/style/**/*.css", notifyLivereload
  # temp directory watches
  gulp.watch "#{TMP_DIR}/js/engine.js", notifyLivereload
  # build files
  gulp.watch "#{CLIENT_DIR}/js/**/*.js", ['jsScripts'], notifyLivereload

# serve the appropriate files and dirs
gulp.task 'serve', ->
  express = require('express')
  app = express()
  app.use require('connect-livereload')()
  # static dirs
  app.use express.static(TMP_DIR)
  app.use express.static(CLIENT_DIR)
  app.use express.static("#{__dirname}/bower_components/**")
  # run app and livereload servers
  app.listen 9000
  lrs.listen 35729

gulp.task 'default', [
  'build',
  'serve',
  'watch'
]

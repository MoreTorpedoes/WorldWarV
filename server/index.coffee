'use strict'

Router = require 'router'

SERVER_PORT = 8080

CREATE_ROOM = 'Create Room'
JOIN_ROOM = 'Join Room'
LIST_ROOM = 'List Room'
SET_ALIAS = 'Set Alias'

user = {}
room = {}

module.exports = ->
  # main
  console.log 'World War V has begun >:o)'

  Primus = require 'primus'
  http = require 'http'

  server = http.createServer()
  primus = new Primus server, {
    # config options go here
  }

  # save the client side library 
  primus.save("./client/primus.js");

  primus.on 'connection', (spark) ->
    # initialise a new user
    user[spark.id] = {
      alias: spark.id   
    }
    # use our router class to route named events
    router = new Router(spark)
    spark.on 'data', router.route

    # --------------------
    # define our routing

    router.on SET_ALIAS, (data) ->
      # set the users alias
      user[spark.id].alias = data.alias 

    router.on CREATE_ROOM, (data) ->
      console.log "#{spark.id} recieved from #{data}"
      room[data.name] = {
        name: data.name
        users: [spark.id]
      }

    router.on JOIN_ROOM, (data) ->
      room[data.name].users.push(data.userId)

  server SERVER_PORT, ->
    console.log "Serving from localhost:#{SERVER_PORT}"
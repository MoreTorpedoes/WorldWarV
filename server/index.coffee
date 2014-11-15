'use strict'

Router = require 'router'

SERVER_PORT = 8080

# events recievable
RECIEVE_CREATE_ROOM = 'Create Room'
RECIEVE_JOIN_ROOM = 'Join Room'
RECIEVE_ROOM_ROOM = 'List Room'
RECIEVE_SET_ALIAS = 'Set Alias'

# events transmittable
TRANSMIT_ROOM_CREATED = 'Room Created'
TRANSMIT_ROOM_CREATE_FAILED = 'Room Creation Failed'

users = {}
rooms = {}

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

  # a new connection has been recieved
  primus.on 'connection', (spark) ->
    # initialise a new user
    users[spark.id] = {
      id: spark.id
      alias: spark.id
      router: new Router(spark)
    }
    # use our router class to route named events
    spark.on 'data', user.router.route

    # --------------------
    # define our routing

    # sets the alias field of the users
    router.on RECIEVE_SET_ALIAS, (data) ->
      # set the users alias
      users[spark.id].alias = data.alias 

    # creates a room and ads the user that created
    # the room to the room. 
    router.on RECIEVE_CREATE_ROOM, (data) ->
      console.log "#{spark.id} recieved from #{data}"
      
      user = users[spark.id]
      room = rooms[data.name] = { # create the room
        name: data.name
        users: [user]
      }
      user.room = room # assign the room to the user
      # emit an event stating the room has been created
      user.router.transmit(TRANSMIT_ROOM_CREATED)

    # ads a user to a room and notifies all users in
    # the room the new user has joined the room
    router.on RECIEVE_JOIN_ROOM, (data) ->
      user = users[spark.id]
      rooms[data.name].users.push(user)

  # handle disconnect
  primus.on 'disconnection', (spark) ->
    room = users[spark.id].room
    delete users[spark.id]

  server SERVER_PORT, ->
    console.log "Serving from localhost:#{SERVER_PORT}"
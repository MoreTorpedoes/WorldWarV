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
TRANSMIT_ROOM_CREATE_FAILED = 'Room Create Failed'
TRANSMIT_ROOM_UPDATED = 'Room Updated'
TRANSMIT_ROOM_JOINED = 'Room Joined'
TRANSMIT_ROOM_JOIN_FAILED = 'Room Join Failed'
TRANSMIT_ALIAS_SET = 'Alias Set'

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
      users[spark.id].router.transmit(TRANSMIT_ALIAS_SET, users[spark.id])

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
      room = rooms[data.name] # room joining
      room.users.push(users[spark.id])
      room.users.forEach (user) -> # push current state of room
        if user.id != spark.id
          user.router.transmit(TRANSMIT_ROOM_UPDATED, room)
      # inform the requesting user they have joined the room
      users[spark.id].router.transmit(TRANSMIT_ROOM_JOINED, room)

  # handle disconnect
  primus.on 'disconnection', (spark) ->
    room = users[spark.id].room
    delete users[spark.id]

  server SERVER_PORT, ->
    console.log "Serving from localhost:#{SERVER_PORT}"
'use strict'

http    = require 'http'
Primus  = require 'primus'

SERVER_PORT = 8080

# events recievable
RECIEVE_CREATE_ROOM = 'Create Room'
RECIEVE_JOIN_ROOM = 'Join Room'
#RECIEVE_LIST_ROOM = 'List Room'
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

module.exports = -> # main

  server = http.createServer()
  primus = new Primus server, {
    # config options go here
  }
  primus.use('emit', require('primus-emit'))

  # save the client side library 
  primus.save "client/primus/primus.js"

  # a new connection has been recieved
  primus.on 'connection', (spark) ->
    console.log "Connection recieved from #{spark.id}"

    # initialise a new user
    user = users[spark.id] = {
      id: spark.id
      alias: spark.id
      spark: spark # keep so users may push to users
    }

    # --------------------
    # define our routing

    # sets the alias field of the users
    spark.on RECIEVE_SET_ALIAS, (data) ->
      console.log "RECIEVE_SET_ALIAS"
      
      user.alias = data.alias # set the users alias
      spark.emit(TRANSMIT_ALIAS_SET, user)

    # creates a room and ads the user that created
    # the room to the room. 
    spark.on RECIEVE_CREATE_ROOM, (data) ->
      console.log "RECIEVE_CREATE_ROOM"
      
      user.room = room = rooms[data.name] = { # create the room
        name: data.name
        users: [user]
      }
      # emit an event stating the room has been created
      spark.emit(TRANSMIT_ROOM_CREATED)

    # ads a user to a room and notifies all users in
    # the room the new user has joined the room
    spark.on RECIEVE_JOIN_ROOM, (data) ->
      room = user.room = rooms[data.name] # room joining

      room.users.push(users[spark.id])
      room.users.forEach (user) -> # push current state of room
        if user.id != spark.id
          user.spark.emit(TRANSMIT_ROOM_UPDATED, room)
      # inform the requesting user they have joined the room
      spark.emit(TRANSMIT_ROOM_JOINED, room)

  # handle disconnect
  primus.on 'disconnection', (spark) ->
    room = users[spark.id].room
    delete users[spark.id]

  server.listen SERVER_PORT, ->
    console.log "World War V has begun on port #{SERVER_PORT} >:o)"

{EventEmitter} = require 'events'

CREATE_ROOM = 'Create Room'
JOIN_ROOM = 'Join Room'
LIST_ROOM = 'List Room'
SET_ALIAS = 'Set Alias'

module.exports = 
  class Router extends EventEmitter

    constructor: (@spark) -> 

    route: (data) ->
      @emit data.event, data.data
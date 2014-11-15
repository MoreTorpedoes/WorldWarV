
{EventEmitter} = require 'events'

module.exports = 
  class Router extends EventEmitter

    constructor: (@spark) -> 

    route: (data) ->
      @emit data.event, data.data
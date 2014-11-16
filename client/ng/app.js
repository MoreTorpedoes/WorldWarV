'use strict';

var WWVEvents = {
  TRANSMIT_CREATE_ROOM: 'Create Room',
  TRANSMIT_JOIN_ROOM: 'Join Room',
  TRANSMIT_SET_ALIAS: 'Set Alias',
  TRANSMIT_LEAVE_ROOM: 'Leave Room',

  // events recievable
  RECIEVE_ROOM_CREATED: 'Room Created',
  RECIEVE_ROOM_CREATE_FAILED: 'Room Create Failed',
  RECIEVE_ROOM_UPDATED: 'Room Updated',
  RECIEVE_ROOM_JOINED: 'Room Joined',
  RECIEVE_ROOM_JOIN_FAILED: 'Room Join Failed',
  RECIEVE_ALIAS_SET: 'Alias Set',
  RECIEVE_ROOM_LEFT: 'Left Room',
  RECIEVE_LEAVE_ROOM_ERROR: 'Leave Room Error'
};
var primus = new Primus("http://localhost:8080");

angular
  .module('WorldWarV', [
    'ui.bootstrap',
    'ui.router'
  ])

  .constant('primus', primus)

  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('join', {
        url: '/',
        controller: 'RoomCtrl',
        templateUrl: 'ng/views/join.html'
      })
      .state('game', {
        url: '/:room',
        controller: 'GameCtrl',
        templateUrl: 'ng/views/gameMenu.html'
      });
  })

  .run(function ($log) {
    $log.log('World War V has began!');
  });

angular.module('WorldWarV').directive('wwvMenu', function ($log, $window, $timeout) {

  return {
    restrict: 'A', // only as an attribute

    link: function postLink(scope, element, attrs) {

      function setElementSize (element) {
        $log.log('setElementSize');
        element.width($(window).width() - $('canvas').width() - 40);
        element.height($(window).height());
      }

      // this is dirty but it works
      $timeout(function () {
        setElementSize(element);
      }, 200);

      angular.element($window).bind('resize', function () {
        setElementSize(element);
      });

      angular.element($('#game-container')).bind('resize', function () {
        $log.log($(window).width());
        $log.log($('#game-container').width());
        setElementSize(element);
      });
    }
  };
});

angular.module('WorldWarV').controller('RoomCtrl', function ($log, $scope, $rootScope, $location, primus) {
  $scope.room = {};
  $scope.error = null;

  $scope.createRoom = function () {
    $log.log('create room : ' + $scope.room.name);
    primus.emit(WWVEvents.TRANSMIT_CREATE_ROOM, {
      name: $scope.room.name
    });
  };
  // listen for the responce on creating a room
  primus.on(WWVEvents.RECIEVE_ROOM_CREATED, function (data) {
    $log.log('room created : ' + data.name);
    $rootScope.room = data;

    $location.path('/' + data.name);
    $scope.$apply();
  });
  primus.on(WWVEvents.RECIEVE_ROOM_CREATE_FAILED, function (error) {
    $log.log('room error');
    $scope.error = error;
    $scope.$apply();
  });

  $scope.joinRoom = function () {
    $log.log('join room : ' + $scope.room.name);
  };
  // listen for response on joining a room

});

angular.module('WorldWarV').controller('GameCtrl', function ($log, $scope, $rootScope, $location, primus) {
  
  $scope.leaveRoom = function () {
    $log.log('leave room');
    primus.emit(WWVEvents.TRANSMIT_LEAVE_ROOM);
  };
  // listen for a response leaving the room
  primus.on(WWVEvents.RECIEVE_ROOM_LEFT, function () {
    $log.log('room left');
    $location.path('/');
    $scope.$apply();
  });
  primus.on(WWVEvents.RECIEVE_LEAVE_ROOM_ERROR, function (error) {
    $log.log('leave room error : ' + error.message);
    delete $rootScope.room;
    $location.path('/');
    $scope.$apply();
  });
});
'use strict';

var WWVEvents = {
  CREATE_ROOM: 'create room',
  ROOM_CREATED: 'room created',
  ROOM_CREATE_FAILED: 'room create failed',

  JOIN_ROOM: 'join room',
  ROOM_JOINED: 'room joined',
  ROOM_JOIN_FAILED: 'room join failed',

  SET_ALIAS: 'set alias',
  ALIAS_SET: 'alias set',

  LEAVE_ROOM: 'leave room',
  ROOM_LEFT: 'left room',
  LEAVE_ROOM_ERROR: 'leave room error',

  GET_USER: 'get user',
  USER: 'send user',

  ROOM_UPDATED: 'room updated',
  USER_NUKE: 'user nuke',
  BLOW_SHIT_UP: 'blow shit up'
};
var primus = new Primus("http://7bd09d1e.ngrok.com");

angular
  .module('WorldWarV', [
    'ui.bootstrap',
    'ui.router'
  ])

  .constant('primus', primus)
  .constant('STATE_IN_GAME', 'game')

  .constant('wwv', wwv) // World War V game engine

  .config(function ($stateProvider, $urlRouterProvider, STATE_IN_GAME) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('join', {
        url: '/',
        controller: 'RoomCtrl',
        templateUrl: 'ng/views/join.html'
      })
      .state(STATE_IN_GAME, {
        url: '/:room',
        controller: 'GameCtrl',
        templateUrl: 'ng/views/gameMenu.html'
      });
  })

  .run(function ($log, $rootScope, STATE_IN_GAME, $location, primus) {
    $log.log('World War V has began!');

    primus.emit(WWVEvents.GET_USER);
    primus.on(WWVEvents.USER, function (user) {
      $log.log('user recieved : ' + user.alias);
      $rootScope.user = user;
      $rootScope.$apply();
    });

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      $log.log(toState);
      if (toState.name == STATE_IN_GAME) {
        if (!$rootScope.room) { // attempting to hit room state without a room
          $location.path('/');
        }
      }
    });
  });

/*
Dynamically resize the menu to fit the screen width.
*/
angular.module('WorldWarV').directive('wwvMenu', function ($log, $window, $timeout) {

  return {
    restrict: 'A', // only as an attribute

    link: function postLink(scope, element, attrs) {

      function setElementSize (element) {
        $log.log('setElementSize');
        element.width($(window).width() - $('canvas').width() - 30);
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

angular.module('WorldWarV').controller('RoomCtrl', function ($log, $scope, $rootScope, $location, primus, wwv) {
  $scope.user = {};
  $scope.room = {};
  $scope.error = null;

  wwv.game_state.picking = false;

  $scope.setAlias = function () {
    $log.log('set alias');
    primus.emit(WWVEvents.SET_ALIAS, $scope.user);
  };
  primus.on(WWVEvents.ALIAS_SET, function (user) {
    $log.log('alias set : ' + user.alias);
    $rootScope.user = user;
    $rootScope.$apply();
  });

  $scope.createRoom = function () {
    $log.log('create room : ' + $scope.room.name);

    // this should be retrieved from the server
    // when the game starts
    wwv.map = wwv.mapgen.create_map(2, 800, 800);
    wwv.clouds = wwv.mapgen.generate_clouds(800, 800);

    console.log(wwv.map);

    wwv.atr = wwv.mapgen.calc_all_tr(wwv.map, wwv.clouds);

    primus.emit(WWVEvents.CREATE_ROOM, {
      name: $scope.room.name,

      map: wwv.map,
      clouds: wwv.clouds,
      atr: wwv.atr
    });
  };
  // listen for the responce on creating a room
  primus.on(WWVEvents.ROOM_CREATED, function (data) {
    $log.log('room created : ' + data.name);

    wwv.mapImg = wwv.mapgen.render_map(data.map);
    wwv.cityImage = wwv.mapgen.render_cities(data.map);
    wwv.prtImage = wwv.particle.render_particles();
    wwv.cloudImg = wwv.mapgen.render_clouds(data.clouds);

    $rootScope.room = data;
    $location.path('/' + data.name);
    $scope.$apply();
  });
  primus.on(WWVEvents.ROOM_CREATE_FAILED, function (error) {
    $log.log('room create error');
    $scope.error = error;
    $scope.$apply();
  });

  $scope.joinRoom = function () {
    $log.log('join room : ' + $scope.room.name);
    primus.emit(WWVEvents.JOIN_ROOM, {
      name: $scope.room.name
    });
  };
  // listen for response on joining a room
  primus.on(WWVEvents.ROOM_JOINED, function (data) {
    $log.log('room joined');

    var room = data.room;

    wwv.game_state.myTeam = data.teamNumber;

    wwv.map = room.map;
    wwv.clouds = room.clouds;
    wwv.atr = room.atr;

    wwv.mapImg = wwv.mapgen.render_map(room.map);
    wwv.cityImage = wwv.mapgen.render_cities(room.map);
    wwv.prtImage = wwv.particle.render_particles();
    wwv.cloudImg = wwv.mapgen.render_clouds(room.clouds);

    $rootScope.room = room;
    $location.path('/' + room.name);
    $scope.$apply();
  });
  primus.on(WWVEvents.ROOM_JOIN_FAILED, function (error) {
    console.log('room join error');
    $scope.error = error;
    $scope.$apply();
  });
});

angular.module('WorldWarV').controller('GameCtrl', function ($log, $scope, $rootScope, $location, primus, wwv) {

  primus.emit(WWVEvents.GET_USER);
  primus.on(WWVEvents.USER, function (user) {
    $log.log('user recieved : ' + user.alias);
    $rootScope.user = user;
    $rootScope.$apply();
  });

  // listen for user to join the room
  primus.on(WWVEvents.ROOM_UPDATED, function (data) {
    $rootScope.room = data.room;
    $scope.$apply();
  })

  function setPicking () {
    $scope.state = 'picking';
    wwv.game_state.picking = true;
  }
  setPicking();
  wwv.game_state.inLobby = true;

  $scope.leaveRoom = function () {
    $log.log('leave room');
    primus.emit(WWVEvents.LEAVE_ROOM);
  };
  // listen for a response leaving the room
  primus.on(WWVEvents.ROOM_LEFT, function () {
    $log.log('room left');
    $location.path('/');
    $scope.$apply();
  });
  primus.on(WWVEvents.LEAVE_ROOM_ERROR, function (error) {
    $log.log('leave room error : ' + error.message);
    delete $rootScope.room;
    $location.path('/');
    $scope.$apply();
  });

  $scope.aim = function () {
    $log.log('start aiming');

    var GS = wwv.game_state;
    var M = wwv.map;
    if (GS.selMine && GS.selOther) {
        if (!wwv.fireInfo) {
            $scope.state = 'aiming';
            wwv.fireInfo = {
                t: 0.0,
                maxT: Math.random() * 0.5 + 0.5,
                dir: 3
            };
        }
    }
  };

  $scope.fire = function () {
    $log.log('user ready');
    $scope.state = 'waiting';

    var nuke;
    var GS = wwv.game_state;
    var M = wwv.map;

    console.log(GS);
    console.log(wwv.fireInfo);

    if (GS.selMine && GS.selOther) {
        if (wwv.fireInfo) {
            var p1 = M.C[GS.selMine[0]].CIT[GS.selMine[1]];
            var dmg = Math.random() * wwv.atr[GS.selMine[0]][GS.selMine[1]][GS.selOther[0]][GS.selOther[1]] * (1.0 - wwv.fireInfo.t);
            var p2 =
                wwv.mapgen.rp_radius_offset(
                    M.C[GS.selOther[0]].CIT[GS.selOther[1]],
                    dmg
                );
            nuke = {
              p1: p1,
              p2: p2,
              x: p1.x, y: p1.y,
              a: 0,
              z: 0.0,
              lp: {
                  x: p1.x,
                  y: p1.y + 0.1
              },
              'dmg': 2500000 / (Math.max(10, Math.pow(dmg,2)/25)-10+1),
              dmgC: GS.selOther
            };
            // hack to assert a building is destroyed on all computers
            if ((M.C[GS.selOther[0]].CIT[GS.selOther[1]].cpop - nuke.dmg) <= 10.0)
                nuke.dmg = 1000000000;
            GS.picking = false;
            wwv.game_state.waiting = true;

            var exData = null;
            if (GS.myTeam === 0)
            {
              wwv.new_clouds = wwv.mapgen.generate_clouds(800, 800);
              wwv.new_atr = wwv.mapgen.calc_all_tr(wwv.map, wwv.clouds);
              exData = {
                clouds: wwv.new_clouds,
                atr: wwv.new_atr
              };
            }

            primus.emit(WWVEvents.USER_NUKE, {
              nuke: nuke,
              exData: exData
            });
        }
    }
  };
  primus.on(WWVEvents.BLOW_SHIT_UP, function (data) {
    var nukes = data.nukes;
    wwv.new_clouds = data.exData.clouds;
    wwv.new_atr = data.exData.atr;
    var GS = wwv.game_state;
    var M = wwv.map;
    GS.picking = false;
    GS.waiting = false;
    GS.nukes = nukes;
    GS.nukeStart = wwv.game.time.now / 1000.0;
    GS.selMine = null;
    GS.selOther = null;
    GS.selTraj = null;
    wwv.fireInfo = null;
    wwv.__scope = $scope;
  });
});

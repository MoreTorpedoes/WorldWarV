'use strict';

angular
  .module('WorldWarV', [
    'ui.bootstrap',
    'ui.router'
  ])

  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('join', {
        url: '/',
        //controller: 'LoginCtrl',
        templateUrl: 'ng/views/join.html'
      })
      .state('in-game', {
        url: '/:room',
        //controller: 'RegistrationCtrl',
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
        console.log('setElementSize');
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
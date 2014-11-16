'use strict';

angular
  .module('WorldWarV', [
  ])

  .config(function () {

  })

  .run(function ($log) {
    $log.log('World War V has began!');
  });

angular.module('WorldWarV').directive('wwvMenu', function ($log, $window, $timeout) {

  return {
    restrict: 'A', // only as an attribute

    link: function postLink(scope, element, attrs) {

      function setElementSize (element) {
        element.width($(window).width() - $('canvas').width() - 50);
        //element.height($(window).height());
      }

      // this is dirty but it works
      $timeout(function () {
        setElementSize(element);
      }, 100);

      angular.element($window).bind('resize', function () {
        setElementSize(element);
      });

      angular.element($('canvas')).bind('resize', function () {
        $log.log($(window).width());
        $log.log($('#canvas').width());
        setElementSize(element);
      });
    }
  };
});
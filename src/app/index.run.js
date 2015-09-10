(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log, $rootScope) {
    /*  ui-router debug logging */
    function message(to, toP, from, fromP) {
      return from.name + angular.toJson(fromP) + ' -> ' + to.name + angular.toJson(toP);
    }

    $rootScope.$on('$stateChangeStart', function (evt, to, toP, from, fromP) {
      console.log('Start:   ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeSuccess', function (evt, to, toP, from, fromP) {
      console.log('Success: ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeError', function (evt, to, toP, from, fromP, err) {
      console.error('Error:   ' + message(to, toP, from, fromP), err);
    });
    $log.debug('runBlock end');
  }

})();

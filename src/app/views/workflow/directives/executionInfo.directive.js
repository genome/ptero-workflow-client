(function() {
  'use strict';
  angular.module('pteroWorkflowClient.views')
    .directive('executionInfo', executionInfo)
    .controller('ExecutionInfoController', ExecutionInfoController);

  /* @ngInject */
  function executionInfo() {
    return {
      restrict: 'E',
      scope: {
        started: '=',
        duration: '=',
        status: '='
      },
      bindToController: true,
      controller: 'ExecutionInfoController',
      controllerAs: 'vm',
      templateUrl: 'app/views/workflow/directives/executionInfo.html'

    }
  }

  /* @ngInject */
  function ExecutionInfoController() {

  }

})();

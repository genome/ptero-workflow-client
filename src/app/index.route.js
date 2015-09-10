(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main'
      })
      .state('workflow', {
        url: '/workflow/:workflowId',
        templateUrl: 'app/workflow/workflow.html',
        controller: 'WorkflowController',
        controllerAs: 'workflow'
      });

    $urlRouterProvider.otherwise('/');
  }

})();

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
        templateUrl: 'app/views/main/main.html',
        controller: 'MainController',
        controllerAs: 'vm'
      })
      .state('workflow', {
        url: '/workflow/:workflowId',
        templateUrl: 'app/views/workflow/workflow.html',
        controller: 'WorkflowController',
        controllerAs: 'vm'
      });

    $urlRouterProvider.otherwise('/');
  }

})();

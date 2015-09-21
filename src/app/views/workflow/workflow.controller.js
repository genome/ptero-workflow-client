(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($scope, moment, workflow, executions) {
    var vm = this;
    vm.report = [];

    vm.workflow = workflow;
    vm.executions = executions;

    $scope.$watch(function() {return vm.workflow; }, function(workflow) {
      vm.report = _.map(workflow.executions, function(execution) {
        return {
          id: execution.id,
          title: 'workflow',
          status: execution.status,
          nodes: [

          ]
        };
      });
    });

  }
})();

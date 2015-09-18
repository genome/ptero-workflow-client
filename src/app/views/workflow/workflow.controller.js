(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController(workflow, executions) {
    var vm = this;
    vm.workflow = workflow;
    vm.executions = executions;
  }
})();

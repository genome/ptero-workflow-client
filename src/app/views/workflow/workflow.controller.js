(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController(workflow) {
    var vm = this;
    vm.workflow = workflow;
  }
})();

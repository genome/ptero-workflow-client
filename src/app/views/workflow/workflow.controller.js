(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($stateParams) {
    var vm = this;
    vm.workflowId = $stateParams.workflowId;
  }
})();

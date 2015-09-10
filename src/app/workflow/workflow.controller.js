(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($state, $stateParams) {
    var workflow = this;
    workflow.test = 'testing 1 2 3';
    workflow.wfId = $stateParams.workflowId;
  }
})();

(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, Reports) {
    var workflow = {};

    var factory = {
      workflow: workflow,
      get: get
    };

    return factory;

    ////////////

    function get(workflowId) {
      return $q.all({
        skeleton: Reports.get({reportType: 'workflow-skeleton', workflow_id: workflowId}),
        details: Reports.get({reportType: 'workflow-details', workflow_id: workflowId}),
        outputs: Reports.get({reportType: 'workflow-outputs', workflow_id: workflowId}),
        executions: Reports.get({reportType: 'workflow-executions', workflow_id: workflowId}),
        status: Reports.get({reportType: 'workflow-status', workflow_id: workflowId}),
        submissionData: Reports.get({reportType: 'workflow-submission-data', workflow_id: workflowId})
      }).then(function(result) {
        console.log('Workflow Service $q.all complete.');
        return result;
      });
    }
  }

})();

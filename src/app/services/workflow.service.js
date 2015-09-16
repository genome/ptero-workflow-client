(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, _, Reports) {
    var workflow = {};

    var factory = {
      workflow: workflow,
      get: get
    };

    return factory;

    ////////////

    function get(workflowId) {
      var deferred = $q.defer();
      $q.all({
        skeleton: Reports.get({reportType: 'workflow-skeleton', workflow_id: workflowId}),
        details: Reports.get({reportType: 'workflow-details', workflow_id: workflowId}),
        outputs: Reports.get({reportType: 'workflow-outputs', workflow_id: workflowId}),
        executions: Reports.get({reportType: 'workflow-executions', workflow_id: workflowId}),
        status: Reports.get({reportType: 'workflow-status', workflow_id: workflowId}),
        submissionData: Reports.get({reportType: 'workflow-submission-data', workflow_id: workflowId})
      })
        .then(function(result) {
          console.log('Workflow Service $q.all complete.');
          deferred.resolve(parseWorkflow(result));
        })
        .catch(function(error) {
          console.error('Error fetching details for workflow.');
          deferred.reject('Error fetching details for workflow.');
        });

      return deferred.promise;
    }

    function parseWorkflow(result) {
      var skeleton = result.skeleton;
      var executions = indexExecutions(result.executions.executions);
      var rootExecution = executions.tasks[skeleton.rootTaskId][0];
      var workflow = {
        info: {
          name: skeleton.name,
          status: skeleton.status,
          timeStamp: new Date(getTimestampForStatusAndHistory(skeleton.status, rootExecution.statusHistory)).toISOString()
        },
        tree: [

        ]
      };

      return workflow;
    }

    function indexExecutions(executions) {
      var indexedExecutions = { methods: {}, tasks: {} }

      executions.forEach(function (element, index, array) {
        var executionType;
        var id;
        if (element.hasOwnProperty("taskId")) {
          executionType = 'tasks';
          id = element.taskId;
        } else if (element.hasOwnProperty("methodId")) {
          executionType = 'methods';
          id = element.methodId;
        } else {
          console.error("Unknown key!");
        }

        if (!indexedExecutions[executionType].hasOwnProperty(id)) {
          indexedExecutions[executionType][id] = []
        }
        indexedExecutions[executionType][id].push(element);
      });

      return indexedExecutions;
    }

    function getTimestampForStatusAndHistory(status, history) {
      var statuses = history.filter(function (statusUpdate) {
        return statusUpdate.status == status;
      });
      return statuses[0].timestamp;
    }

  }

})();

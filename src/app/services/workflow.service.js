(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, $log, _, Reports) {
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
          $log.info('Workflow Service $q.all complete.');
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
      var workflow = [{
        id: 1,
        type: 'workflow',
        name: skeleton.name,
        status: skeleton.status,
        timeStamp: new Date(getTimestampForStatusAndHistory(skeleton.status, rootExecution.statusHistory)).toISOString(),
        nodes: parseTasks(skeleton.tasks, executions, 0, null)
      }];

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

    function parseTasks(tasks, executions, nestingLevel, color) {
      var taskNodes = [];
      var sortedTaskKeys = getSortedTaskKeys(tasks);
      sortedTaskKeys.forEach(function (taskKey, index, array) {
        var task = tasks[taskKey];
        var taskExecutions = executions.tasks[task.id];
        taskExecutions.forEach(function(taskExecution, index, array) {
          if (taskExecution.parentColor == color) {
            taskNodes = getStatusInfoRowsForTaskExecution(taskKey, task, taskExecution, executions, nestingLevel);
          }
        });
      });
      return taskNodes;
    }

    function getStatusInfoRowsForTaskExecution(name, task, taskExecution, executions, nestingLevel) {
      var taskNodes = [];
      taskNodes.push({
        name: name,
        status: taskExecution.status,
        timestamp: getTimestampForStatusAndHistory(taskExecution.status, taskExecution.statusHistory),
        nestingLevel: nestingLevel,
        type: 'task',
        methods: parseMethods(task, taskExecution, executions, nestingLevel + 1)
      });
      return taskNodes;
    }

    function parseMethods(task, execution, indexedExecutions, nestingLevel) {
      return _.map(task.methods, function(method) {
        $log.info(['parsing method: ', JSON.stringify(method)].join(' '));
        return getStatusInfoRowsForMethod(method, execution.color, indexedExecutions, nestingLevel);
      });
    }

    function getStatusInfoRowsForMethod(method, color, indexedExecutions, nestingLevel) {
      var statusInfo = {},
        executions = indexedExecutions.methods[method.id];
//      $log.info(['getting status info for method: ', JSON.stringify(method)].join(' '));
      executions
        .filter(function (e) {
          return e.parentColor == color;
        })
        .forEach(function (execution, index, executions) {
          if (statusInfo === undefined) { var statusInfo = {}; }
          statusInfo = {
            name: method.name,
            status: execution.status,
            timestamp: getTimestampForStatusAndHistory(execution.status, execution.statusHistory),
            nestingLevel: nestingLevel,
            type: method.service,
          };
          if (method.service == "workflow") {
            statusInfo.nodes = parseTasks(method.parameters.tasks, indexedExecutions, nestingLevel + 1, execution.color);
          }
        });
      return statusInfo;
    }

    function getSortedTaskKeys(tasks) {
      return Object.keys(tasks).sort(function(a, b) {
        return tasks[a].topologicalIndex - tasks[b].topologicalIndex;
      });
    }

    function getTimestampForStatusAndHistory(status, history) {
      var statuses = history.filter(function (statusUpdate) {
        return statusUpdate.status == status;
      });
      return statuses[0].timestamp;
    }

  }

})();

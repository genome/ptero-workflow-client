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
      var executions = parseExecutions(result.executions.executions);
      var rootExecution = _.find(executions.tasks, 'id', skeleton.rootTaskId);
      var workflow = [{
        id: 0,
        type: 'workflow',
        name: skeleton.name,
        status: skeleton.status,
        timeStamp: new Date(getTimestampForStatusAndHistory(skeleton.status, rootExecution.statusHistory)).toISOString(),
        nodes: parseTasks(skeleton.tasks, executions, 0, null)
      }];

      return workflow;
    }

    function parseTasks(tasks, executions, nestingLevel, parentColor) {
      tasks = _.sortBy(tasks, 'topologicalIndex');
      var taskNodes = _.map(tasks, function(task) {
        // for each task node, return an array of task execution status objects.
        var taskExecutions = _.select(executions.tasks, { id: task.id, parentColor: parentColor });
        return _.map(taskExecutions, function(execution, index, array) {
          return getTaskNodes(execution, task, nestingLevel, index)
        });
      });
      return taskNodes;
      //return _.chain(tasks)
      //  .sort(function(taskA, taskB) { taskA.topologicalIndex = taskB.topologicalIndex })
      //  .map(function(task) {
      //    $log.info('parsing task ' + task.id);
      //    $log.info(task);
      //
      //    return _.compact(_.map(_.filter(executions.tasks, 'id', task.id), function(taskExecution) {
      //      $log.info('getting status info for task execution: ' + taskExecution.id);
      //      $log.info(taskExecution);
      //      if(taskExecution.parentColor == color) {
      //        return getTaskNodes()
      //        return taskExecution;
      //      } else { return null; }
      //    }))
      //  })
      //  .value();
      //
      //
      //
      //var taskNodes = [];
      //var sortedTaskKeys = getSortedTaskKeys(tasks);
      //sortedTaskKeys.forEach(function (taskKey, index, array) {
      //  var task = tasks[taskKey];
      //  var taskExecutions = executions.tasks[task.id];
      //  taskExecutions.forEach(function(taskExecution, index, array) {
      //    if (taskExecution.parentColor == color) {
      //      taskNodes = getStatusInfoRowsForTaskExecution(taskKey, task, taskExecution, executions, nestingLevel, index);
      //    }
      //  });
      //});
      //return taskNodes;
    }

    function getTaskNodes(execution, task, nestingLevel, index) {
      var taskNodes = [];
      taskNodes.push({
        id: String(String(nestingLevel) + String(index)),
        name: name,
        status: execution.status,
        timestamp: getTimestampForStatusAndHistory(execution.status, execution.statusHistory),
        nestingLevel: nestingLevel,
        type: 'task',
        methods: ['methods']
      });
      return taskNodes;
    }

    function getStatusInfoRowsForTaskExecution(name, task, taskExecution, executions, nestingLevel, index) {
      var taskNodes = [];
      taskNodes.push({
        id: String(String(nestingLevel) + String(index)),
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
      var methods = _.map(task.methods, function(method) {
        $log.info(['parsing method: ', JSON.stringify(method)].join(' '));
        return getStatusInfoRowsForMethod(method, execution.color, indexedExecutions, nestingLevel);
      });
      return methods;
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
      $log.info('sorting keys for tasks: '+ JSON.stringify(tasks));
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

    function parseExecutions(executions) {
      var indexedExecutions = { methods: [], tasks: [] };
      _.each(executions, function(execution) {
        if(_.has(execution, 'taskId')) {
          execution.type = 'task';
          execution.id = execution.taskId;
          indexedExecutions.tasks.push(execution)}
        else if(_.has(execution, 'methodId')) {
          execution.type = 'method';
          execution.id = execution.methodId;
          indexedExecutions.methods.push(execution)
        }
        else { console.error('indexExecutions encountered unknown execution type "' + JSON.stringify(execution)); }
      });

      return indexedExecutions;
    }

  }

})();

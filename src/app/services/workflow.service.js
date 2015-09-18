(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, $log, _, Reports) {
    var workflow = {};
    var executions = [];
    var updateUrl = '';

    var factory = {
      workflow: workflow,
      executions: executions,
      updateUrl: updateUrl,

      get: get,
      getExecutions: getExecutions
    };

    return factory;

    ////////////

    function get(workflowId) {
      var deferred = $q.defer();
      $q.all({
        skeleton: Reports.get({reportType: 'workflow-skeleton', workflow_id: workflowId}),
        // details: Reports.get({reportType: 'workflow-details', workflow_id: workflowId}),
        //outputs: Reports.get({reportType: 'workflow-outputs', workflow_id: workflowId}),
        executions: Reports.get({reportType: 'workflow-executions', workflow_id: workflowId}),
        //status: Reports.get({reportType: 'workflow-status', workflow_id: workflowId}),
        //submissionData: Reports.get({reportType: 'workflow-submission-data', workflow_id: workflowId})
      })
        .then(function(result) {
          $log.info('Workflow Service $q.all complete.');
          deferred.resolve(parseResult(result));
        })
        .catch(function(error) {
          console.error('Error fetching details for workflow.');
          deferred.reject('Error fetching details for workflow.');
        });

      return deferred.promise;
    }

    function getExecutions() {
      var deferred = $q.defer();
      $q.when(executions)
        .then(function(result) {
          deferred.resolve(result)
        });
      return deferred.promise;
    }

    //////////

    function parseResult(result) {
      updateUrl = result.executions.updateUrl;
      parseSkeleton(result.skeleton);
      parseExecutions(result.executions);
      return workflow;
    }

    function parseSkeleton(skeleton) {
      $log.debug('- parsing skeleton');
      $log.debug(skeleton);
        //$self->{id} = $hashref->{id};
        //$self->{root_task_id} = $hashref->{rootTaskId};
        //$self->{name} = $hashref->{name};
        //$self->{status} = $hashref->{status};
        //$self->{method_index} = {};
        //$self->{task_index} = {};

      workflow = {
        id: skeleton.id,
        rootTaskId: skeleton.rootTaskId,
        name: skeleton.name,
        status: skeleton.status,
        started: skeleton.begins,
        tasks: parseTasks(skeleton.tasks)
      };
    }

    function parseTasks(tasks) {
      return _.map(tasks, function(task, taskName) {
        $log.debug('--- parsing task');
        $log.debug(task);
        return {
          id: task.id,
          name: taskName,
          parallelBy: task.parallelBy,
          topologicalIndex: task.topologicalIndex,
          executions: [],
          methods: parseMethods(task.methods)
        }
      });
    }

    function parseMethods(methods) {
      return _.map(methods, function(method) {
        $log.debug('----- parsing method');
        $log.debug(method);
        return {
          id: method.id,
          name: method.name,
          service: method.service,
          serviceUrl: method.serviceUrl ? method.serviceUrl : null,
          executions: []
        };
      });
    }

    function parseExecutions(exec) {
      _.each(exec.executions, function (execution) {
        $log.debug('------- parsing execution');
        $log.debug(execution);
        execution.type = getType(execution);

        executions.push(execution);

        function getType(execution) {
          var type;
          if (_.has(execution, 'taskId')) { return 'task' }
          else if (_.has(execution, 'methodId')) { return 'method' }
          else { console.error('parseExecutions received unknown execution type.'); return null; }
        }
      });
    }
  }
})();

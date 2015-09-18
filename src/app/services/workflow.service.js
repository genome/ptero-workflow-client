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
      linkExecutions(parseExecutions(result.executions));
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
        tasks: parseTasks(skeleton.tasks),
        executions: [],
        methods: []
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

        executions.push({
          id: execution.id,
          parentId: getParentId(execution),
          parentType: getParentType(execution),
          status: execution.status,
          statusHistory: execution.statusHistory,
          begins: execution.begins,
          color: execution.color,
          colors: execution.colors,
          parentColor: execution.parentColor,
          detailsUrl: execution.detailsUrl,
          childWorkflowUrls: _.has(execution, 'childWorkflowUrls') ? execution.childWorkflowUrls : [],
          details: _.has(execution, 'data') ? { data: execution.data, name: execution.name, inputs: execution.inputs } : {}
        });

        function getParentId(execution) {
          if (_.has(execution, 'taskId')) { return execution.taskId }
          else if (_.has(execution, 'methodId')) { return execution.methodId }
          else { console.error('Could not set parentId for unknown execution type.'); return null; }
        }

        function getParentType(execution) {
          if (_.has(execution, 'taskId')) { return 'task' }
          else if (_.has(execution, 'methodId')) { return 'method' }
          else { console.error('Could not set parentType for unknown execution type.'); return null; }
        }
      });
      return executions;
    }

    function linkExecutions(exec) {
      _.each(exec, function (execution){
        if(execution.parentId === workflow.rootTaskId && execution.parentType === 'task') {
          workflow.executions.push(execution);
        } else {
          $log.debug('found non-workflow execution -----');
          $log.debug(execution);
        }
      });

      //for my $hashref (@{$execution_hashrefs}) {
      //  my $execution = Ptero::Concrete::Workflow::Execution->new($hashref);
      //
      //  if ($execution->{parent_id} == $self->{root_task_id} && $execution->{parent_type} eq 'task') {
      //      $self->{executions}{$execution->{color}} = $execution
      //  } else {
      //    my $parent_index = sprintf("%s_index", $execution->{parent_type});
      //    my $parent = $self->{$parent_index}{$execution->{parent_id}};
      //    next unless $parent;
      //      $parent->{executions}->{$execution->{color}} = $execution;
      //  }
      //
      //}
    }
  }
})();

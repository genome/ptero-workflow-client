(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .constant('TERMINAL_STATUSES', ['errored', 'failed', 'succeeded', 'canceled'])
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, $log, _, moment, TERMINAL_STATUSES, Reports) {
    // PUBLIC ATTRIBUTES
    ////////////
    var workflow = {};
    var executions = [];

    // PUBLIC FUNCTIONS
    ////////////
    function get(workflowId) {
      var deferred = $q.defer();
      $q.all({
        skeleton: Reports.get({reportType: 'workflow-skeleton', workflow_id: workflowId}),
        // details: Reports.get({reportType: 'workflow-details', workflow_id: workflowId}),
        //outputs: Reports.get({reportType: 'workflow-outputs', workflow_id: workflowId}),
        executions: Reports.get({reportType: 'workflow-executions', workflow_id: workflowId})
        //,status: Reports.get({reportType: 'workflow-status', workflow_id: workflowId}),
        //submissionData: Reports.get({reportType: 'workflow-submission-data', workflow_id: workflowId})
      })
        .then(function(result) {
          deferred.resolve(parseResult(result));
        })
        .catch(function(error) {
          $log.error('Error fetching details for workflow.');
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

    // FACTORY MODULE
    ////////////
    var factory = {
      workflow: workflow,
      executions: executions,

      get: get,
      getExecutions: getExecutions
    };

    return factory;

    // PRIVATE FUNCTIONS
    //////////

    // Ptero::Proxy::Workflow->_concrete_workflow()
    function parseResult(result) {
      workflow = newWorkflow(result.skeleton);
      //createExecutions(result.executions);
      return workflow;
    }

    // Ptero::Concrete::Workflow->new()
    function newWorkflow(sk) {
      var wf = {
        id: sk.id,
        rootTaskId: sk.rootTaskId,
        name: sk.name,
        status: sk.status,
        started: sk.begins,
        methodIndex: {},
        taskIndex: {},
        tasks: _.map(sk.tasks, newTask)
      };

      // REGISTER WORKFLOW COMPONENTS (Ptero::Concrete::Workflow->register_components()

      // Ptero::Concrete::Workflow::Task->register_with_workflow()
      _.each(wf.tasks, function(task) {
        wf.taskIndex[task.id] = task;
        // Ptero::Concrete::Workflow::Method->register_with_workflow()
        _.each(task.methods, function(method){
          wf.methodIndex[method.id] = task;
        });
      });

      return wf;
    }

    // Ptero::Concrete::Workflow::Task->new()
    function newTask(task, name) {
      //$log.debug('--- creating Task: ' + taskName);
      //$log.debug(task);
      // get each task's methods

      return {
        id: task.id,
        name: name,
        parallelBy: task.parallelBy,
        topologicalIndex: task.topologicalIndex,
        methods: getTaskMethods(task),
        executions: {}
      };

      function getTaskMethods(task) {

        var parseMethod = {
          'job': newMethod,
          'workflow': newDag,
          'workflow-block': newMethod,
          'workflow-converge': newMethod
        };

        return _.map(task.methods, function(method) {
          return parseMethod[method.service](method);
        });

        // Ptero::Concrete::Workflow::Method->new()
        function newMethod(method) {
          $log.debug('----- parsing method: ' + method.name);
          $log.debug(method);
          return {
            id: method.id,
            name: method.name,
            service: method.service,
            serviceUrl: method.serviceUrl ? method.serviceUrl : null, // only job methods have serviceUrls
            executions: {}
          };
        }
        // corresponds to Ptero::Concrete::Workflow::DAG->new()
        function newDag(dag) {
          $log.debug('----- parsing dag: ' + dag.name);
          $log.debug(dag);
          return {
            id: dag.id,
            name: dag.name,
            service: dag.service,
            tasks: _.map(dag.parameters.tasks, newTask),
            executions: {}
          };
        }
      }

    }


    function createExecutions(workflow, exec) { // corresponds to Ptero::Concrete::Workflow->create_executions()
      _.each(exec.executions, function (exec, name, execs) {
        var execution = newExecution(exec, name);
        // $log.debug('------ Execution.parentType: ' + execution.parentType);

        if(execution.parentId === workflow.rootTaskId && execution.parentType === 'task') {
          // this is a root execution so drop it into this.executions
          workflow.executions.push(execution);
        } else {
          var parent;

          if (execution.parentType === 'method') {
            parent = _.find(workflow.methodIndex, { id: execution.parentId });
          } else if (execution.parentType === 'task') {
            parent = _.find(workflow.taskIndex, { id: execution.parentId });
          } else {
            console.error('createExecutions() received execution with unknown parentType: ' + execution.parentType);
            return;
          }

          if(parent !== undefined) {
            $log.debug('found parent for execution');
            $log.debug(execution);
            parent.executions.push(execution);
            //executions.push(execution);
          } else {
            executions.push(execution);
          }
        }

        return workflow;

        //if ($execution->{parent_id} == $self->{root_task_id} && $execution->{parent_type} eq 'task') {
        //  $self->{executions}{$execution->{color}} = $execution
        //} else {
        //  my $parent_index = sprintf("%s_index", $execution->{parent_type});
        //  my $parent = $self->{$parent_index}{$execution->{parent_id}};
        //  next unless $parent;
        //  $parent->{executions}->{$execution->{color}} = $execution;
        //}

      });
    }

    function newExecution(exec, name) { // corresponds to Ptero::Concrete::Workflow::Execution->new()
      return {
        id: exec.id,
        name: name,
        parentId: getParentId(exec),
        parentType: getParentType(exec),
        timeStarted: getTimeStarted(exec),
        timeEnded: getTimeEnded(exec),
        duration: getDuration(exec),
        status: exec.status,
        statusHistory: exec.statusHistory,
        isTerminal: isTerminal(exec),
        isSuccess: isSuccess(exec),
        isAbnormal: isAbnormal(exec),
        isRunning: isRunning(exec),
        begins: exec.begins,
        color: exec.color,
        colors: exec.colors,
        parallelIndexes: getParallelIndexes(exec),
        parentColor: exec.parentColor,
        detailsUrl: exec.detailsUrl,
        childWorkflowUrls: _.has(exec, 'childWorkflowUrls') ? exec.childWorkflowUrls : [],
        details: _.has(exec, 'data') ? { data: exec.data, name: exec.name, inputs: exec.inputs } : {}
      };

      function getTimestamp(status, statusHistory) {
        var ts = _.find(statusHistory, { status: status });
        return ts != undefined ? ts.timestamp : false;
      }

      function getParentId(e) {
        if (_.has(e, 'taskId')) { return e.taskId }
        else if (_.has(e, 'methodId')) { return e.methodId }
        else { console.error('Could not set parentId for unknown execution type.'); return null; }
      }

      function getParentType(e) {
        if (_.has(e, 'taskId')) { return 'task' }
        else if (_.has(e, 'methodId')) { return 'method' }
        else { console.error('Could not set parentType for unknown execution type.'); return null; }
      }

      function isTerminal(e) {
        return _.contains(TERMINAL_STATUSES, e.status);
      }

      function isSuccess(e) {
        return e.status === 'succeeded';
      }

      function isAbnormal(e) {
        return isTerminal(e) && !isSuccess(e);
      }

      function isRunning(e) {
        return e.status === 'running';
      }

      function getTimeStarted(e) {
        if(getTimestamp('running', e.statusHistory)) { return getTimestamp('running', e.statusHistory); }
        else if(getTimestamp('errored', e.statusHistory)) { return getTimestamp('errored', e.statusHistory); }
        else { return getTimestamp('new', e.statusHistory); }
      }

      function getTimeEnded(e) {
        if(isTerminal(e)){
          return getTimestamp(e.status, e.statusHistory)
        } else {
          return new Date();
        }
      }

      function getDuration(e) {
        return moment.duration(moment(getTimeEnded(e)).diff(moment(getTimeStarted(e)))).asMilliseconds();
      }

      function getParallelIndexes(e) {
        return _.map(_.rest(e.colors), function(color, index) {
          return color - e.begins[index+1];
        });
      }
    }

  }
})();

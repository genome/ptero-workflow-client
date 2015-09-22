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
    var updateUrl = '';

    // PUBLIC FUNCTIONS
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

    // FACTORY MODULE
    ////////////
    var factory = {
      workflow: workflow,
      executions: executions,
      updateUrl: updateUrl,

      get: get,
      getExecutions: getExecutions
    };

    return factory;

    // PRIVATE FUNCTIONS
    //////////

    function parseResult(result) {
      updateUrl = result.executions.updateUrl;
      createWorkflow(result.skeleton);
      registerComponents(workflow.tasks);
      createExecutions(result.executions);
      return workflow;
    }

    function createWorkflow(skeleton) { // corresponds to Ptero::Concrete::Workflow->new()
      //$log.debug('- parsing skeleton');
      //$log.debug(skeleton);
      workflow = newWorkflow(skeleton);
    }

    function newWorkflow(skeleton) {
      return {
        id: skeleton.id,
        rootTaskId: skeleton.rootTaskId,
        name: skeleton.name,
        status: skeleton.status,
        started: skeleton.begins,
        tasks: _.map(skeleton.tasks, newTask), // create root workflow tasks
        methods: _.flatten(_.map(skeleton.tasks, getMethods)),
        executions: []
      };
    }

    //
    // corresponds to Ptero::Concrete::Workflow::Task->new()
    function newTask(task, taskName, tasks) {
      //$log.debug('--- creating Task: ' + taskName);
      //$log.debug(task);
      // get each task's methods

      return {
        id: task.id,
        name: taskName,
        parallelBy: task.parallelBy,
        topologicalIndex: task.topologicalIndex,
        executions: []
      }
    }

    function getExecutionsWithParentColor(task, color) {


    }

    // corresponds to Ptero::Concrete::Workflow::Method->new()
    function getMethods(task, index, tasks) {
      //$log.debug('----- parsing method: ' + method.name);
      //$log.debug(method);
      return _.map(task.methods, function (method) {
        return {
          id: method.id,
          name: method.name,
          service: method.service,
          serviceUrl: method.serviceUrl ? method.serviceUrl : null,
          executions: []
        };
      });
    }

    // corresponds with [Entity]->register_with_workflow()
    // TODO: remove if unecessary (since we're just using arrays on workflow, and they've already been generated in newTask)
    function registerComponents(tasks) {
      _.each(tasks, function(task) {
        registerTask(task);
      });

      function registerTask(task) {
        //$log.debug('registering task :' + task.name);
        //$log.debug(task);
        _.each(task.methods, function(method){
          registerMethod(method);
        });
      }

      function registerMethod(method) {
        //$log.debug('registering method:' + method.name);
        //$log.debug(method);
      }
    }

    function createExecutions(exec) { // corresponds to Ptero::Concrete::Workflow->create_executions()
      _.each(exec.executions, function (exec, name, execs) {
        var execution = newExecution(exec, name);
        $log.debug('------ Execution.parentType: ' + execution.parentType);

        if(execution.parentId === workflow.rootTaskId && execution.parentType === 'task') {
          // this is a root execution so drop it into this.executions
          workflow.executions.push(execution);
        } else {
          var parent;

          if (execution.parentType === 'method') {
            parent = _.find(workflow.methods, { id: execution.parentId });
          } else if (execution.parentType === 'task') {
            parent = _.find(workflow.methods, { id: execution.parentId });
          } else {
            console.error('createExecutions() received execution with unknown parentType: ' + execution.parentType);
            return;
          }

          if(parent !== undefined) {
            $log.debug('found parent for execution');
            $log.debug(execution);
            parent.executions.push(execution);
            executions.push(execution);
          } else {
            executions.push(execution);
          }
        }

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
        console.log('getTimeStarted called.');
        if(getTimestamp('running', e.statusHistory)) { return getTimestamp('running', e.statusHistory); }
        else if(getTimestamp('errored', e.statusHistory)) { return getTimestamp('errored', e.statusHistory); }
        else { return getTimestamp('new', e.statusHistory); }
      }

      function getTimeEnded(e) {
        console.log('getTimeStarted called.');
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

(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($scope, moment, workflow, executions) {
    var vm = this;
    vm.report = [];
    vm.abnormal = [];

    vm.workflow = workflow;
    vm.executions = executions;

    $scope.$watch(function() { return vm.workflow; }, workflowReport);

    vm.report = [workflowReport(workflow)];

    function workflowReport(workflow, color) {
      color = typeof color !== 'undefined' ? color : 0;
      var execution = _.find(workflow.executions, 'color', color );

      var tasksPredicate = _.partial(taskReport, 0, 0); // set color and parallelBy before the _.map
      var tasks = _.map(_.sortBy(workflow.tasks, 'topologicalIndex'), tasksPredicate);
      if(execution !== undefined) {
        return {
          type: 'workflow',
          name: workflow.name,
          status: execution.status,
          timeStart: execution.timeStarted,
          duration: execution.duration,
          tasks: tasks
        }
      } else {
        return {
          type: 'workflow',
          name: workflow.name,
          status: workflow.status,
          tasks: tasks
        }
      }
    }

    function taskReport(color, parallelBy, task) {
      var execution = _.find(task.executions, { color: color } );
      var parallelInfo;

      if(parallelBy !== undefined && _.has(execution, 'parallelIndexes')) {
        parallelInfo = "[" + execution.parallelIndexes.join(', ') + "]";
      } else {
        parallelInfo = "[parallel by: " + task.parallelBy + "]";
      }

      var childTasks = [];
      var childExecutions = _.select(task.executions, { parentId: task.id, parentColor: color });

      _.each(childExecutions, function(exec) {
        var childReport = taskReport(exec.color, 1, exec);
        childTasks.push(childReport);
      });

      if(execution !== undefined) {
        return {
          type: 'task',
          name: task.name,
          status: execution.status,
          timeStarted: execution.timeStarted,
          duration: execution.duration,
          parallelInfo: parallelInfo,
          methods: methodsReport(task.methods, color),
          tasks: childTasks
        }
      } else {
        return {
          type: 'task',
          name: task.name,
          parallelInfo: parallelInfo,
          methods: methodsReport(task.methods, color)
        }
      }
    }


    function methodsReport(m) {
      return m;
    }

  }
})();

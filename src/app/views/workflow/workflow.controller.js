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
      if(execution !== undefined) {
        return {
          type: 'workflow',
          name: workflow.name,
          status: execution.status,
          timeStart: execution.timeStarted,
          duration: execution.duration,
          tasks: tasksReport(_.sortBy(workflow.tasks, 'topologicalIndex'), 0, 0)
        }
      } else {
        return {
          type: 'workflow',
          name: workflow.name,
          status: workflow.status,
          tasks: tasksReport(_.sortBy(workflow.tasks, 'topologicalIndex'), 0, 0)
        }
      }
    }

    function tasksReport(tasks, color, parallelBy) {
      return _.map(tasks, function(task) {
        var execution = _.find(task.executions, 'color', color);
        var parallelInfo;

        if(parallelBy !== undefined && _.has(execution, 'parallelIndexes')) {
          parallelInfo = "[" + execution.parallelIndexes.join(', ') + "]";
        } else {
          parallelInfo = "[parallel by: " + task.parallelBy + "]";
        }
        if(execution !== undefined) {
          return {
            type: 'task',
            name: task.name,
            status: execution.status,
            timeStarted: execution.timeStarted,
            duration: execution.duration,
            parallelInfo: parallelInfo
          }
        } else {
          return {
            type: 'task',
            name: task.name,
            parallelInfo: parallelInfo
          }
        }
      });
    }


    function methodReport(m) {
      return m;
    }

  }
})();

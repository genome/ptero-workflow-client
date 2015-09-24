(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController($scope, $log, workflow, executions) {
    var vm = this;
    vm.report = [];
    vm.abnormal = [];

    vm.workflow = workflow;
    vm.executions = executions;

    $scope.$watch(function() { return vm.workflow; }, generateReport);

    vm.report = [generateReport(workflow)];

    function generateReport(workflow) {
      return reportOnWorkflow(workflow);
    }
    // Ptero::Concrete::Workflow::ReportWriter->report_on_workflow()
    function reportOnWorkflow(wf, color) {
      color = angular.isUndefined(color) ? 0 : color; // set color to 0 if unspecified
      var execution = wf.executions[color];
      var tasks = [];
      _.each(_.sortBy(wf.tasks, 'topologicalIndex'), function(task) {
        tasks.push(reportOnTask(task, color, 0));
      });
      if(angular.isUndefined(execution)) {
        return {
          type: 'workflow',
          name: wf.name,
          status: wf.status,
          tasks: tasks,
          methods: reportOnMethods()
        }
      } else {
        return {
          type: 'workflow',
          name: wf.name,
          status: execution.status,
          timeStart: execution.timeStarted,
          duration: execution.duration,
          tasks: tasks
        }
      }
    }

    // Ptero::Concrete::Workflow::ReportWriter->report_on_task()
    function reportOnTask(task, color, parallelBy) {
      $log.debug('reportOnTask: ' + task.name);
      $log.debug('-- color: ' + color);
      $log.debug('-- parallelBy: ' + parallelBy);
      var parallelInfo,
        execution = task.executions[color];

      if(parallelBy !== undefined && _.has(execution, 'parallelIndexes')) {
        parallelInfo = "[" + execution.parallelIndexes.join(', ') + "]";
      } else {
        parallelInfo = "[parallel by: " + task.parallelBy + "]";
      }

      var methods = [];
      _.each(task.methods, function(method) {
        methods.push(reportOnMethod(method, color));
      });

      // TODO: report on child executions
      if(!angular.isUndefined(execution)) {
        return {
          type: 'task',
          name: task.name,
          parallelInfo: parallelInfo,
          methods: methods
        };
      } else {
        return {
          type: 'task',
          name: task.name,
          status: execution.status,
          timeStarted: execution.timeStarted,
          duration: execution.duration,
          parallelInfo: parallelInfo,
          methods: methods
        };
      }
    }


    function reportOnMethod(method, color) {
      $log.debug('reportOnMethod: ' + method.name);
      $log.debug('-- color: ' + color);
      $log.debug('-- service: ' + method.service);
      return method;
    }

  }
})();

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

    vm.report = [generateReport(workflow)];

    $scope.$watch(function() { return vm.workflow; }, generateReport);

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
          id: wf.id,
          name: wf.name,
          status: wf.status,
          tasks: tasks,
          methods: reportOnMethods()
        }
      } else {
        return {
          type: 'workflow',
          id: wf.id,
          name: wf.name,
          status: execution.status,
          timeStart: execution.timeStarted,
          duration: execution.duration,
          tasks: tasks,
          execution: execution
        }
      }
    }

    //// Ptero::Concrete::Workflow::ReportWriter->report_on_task()
    function reportOnTask(task, color, parallelBy) {
      //$log.debug('reportOnTask: ' + task.name);
      //$log.debug('-- color: ' + color);
      //$log.debug('-- parallelBy: ' + parallelBy);
      var execution = task.executions[color];

      var methods = [];
      _.each(task.methods, function(method) {
        methods.push(reportOnMethod(method, color));
      });

      var tasks = [];
      tasks = _.map(_.select(task.executions, 'parentColor', color), function(exec) {
        return reportOnTask(task, exec.color, 1);
      });

      var parallelByInfo;

      if(parallelBy) {
        parallelByInfo = '[' + execution.parallelIndexes.join(',') + ']';
      } else if(task.parallelBy) {
        parallelByInfo = '[parallel-by: ' + task.parallelBy + ']';
      }

      if(_.isUndefined(execution)) {
        return {
          type: 'task',
          id: task.id,
          name: task.name,
          parallelBy: task.parallelBy,
          parallelByInfo: parallelByInfo,
          tasks: tasks,
          methods: methods
        };
      } else {
        return {
          type: 'task',
          name: task.name,
          id: task.id,
          status: execution.status,
          timeStarted: execution.timeStarted,
          duration: execution.duration,
          parallelBy: task.parallelBy,
          parallelByInfo: parallelByInfo,
          tasks: tasks,
          methods: methods
        };
      }

      function additionalColors(task, color) {
        return _.chain(task.executions)
          .map(function(execution, eColor) {
            if (execution.parentColor === color) {
              $log.debug('found execution with parent color ' + color);
              $log.debug(execution)
            }
            return execution.parentColor === color ? execution : null;
          })
          .compact()
          .sortBy('color')
          .value();
      }

    }

    function reportOnMethod(method, color) {
      //$log.debug('reportOnMethod: ' + method.name);
      //$log.debug('-- color: ' + color);
      //$log.debug('-- service: ' + method.service);
      var execution = method.executions[color];
      var tasks = [];
      _.each(_.sortBy(method.tasks, 'topologicalIndex'), function(task) {
        tasks.push(reportOnTask(task, color, 0));
      });

      if(_.isUndefined(execution)) {
        return {
          id: method.id,
          name: method.name,
          service: method.service,
          tasks: tasks,
          executions: method.executions
        };
      } else {
        return {
          id: method.id,
          name: method.name,
          service: method.service,
          status: execution.status,
          started: execution.started,
          duration: execution.duration,
          childWorkflowProxies: execution.childWorkflowProxies,
          tasks: tasks,
          executions: method.executions
        }
      }


    }

  }
})();

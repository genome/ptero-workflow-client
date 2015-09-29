(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .directive('workflowReport', workflowReport)
    .directive('methodReport', methodReport)
    .directive('taskReport', taskReport);

  /* @ngInject */
  function workflowReport () {
    // Usage:
    //
    // Creates:
    //
    var directive = {
      bindToController: true,
      controller: workflowReportController,
      controllerAs: 'vm',
      link: link,
      restrict: 'E',
      scope: {
        workflow: '=',
        executions: '='
      },
      templateUrl: 'app/views/workflow/directives/workflowReport.html'
    };
    return directive;

    function link(scope, element, attrs) {
    }
  }

  /* @ngInject */
  function workflowReportController ($log, _) {
    var vm = this;
    vm.report = [generateReport(vm.workflow)];

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
          // methods: reportOnMethods()
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
          methods: methods,
          executions: task.executions
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
          methods: methods,
          executions: task.executions
        };
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

  /* @ngInject */
  function taskReport () {
    // Usage:
    //
    // Creates:
    //
    var directive = {
      bindToController: true,
      controller: taskReportController,
      controllerAs: 'vm',
      link: link,
      restrict: 'E',
      scope: {
        tasks: '=',
        color: '=',
        parallelBy: '='
      },
      templateUrl: 'app/views/workflow/directives/taskReport.html'
    };
    return directive;

    function link(scope, element, attrs) {
    }
  }

  /* @ngInject */
  function taskReportController ($log, _) {
    $log.debug('taskReportController loaded.');
  }

  /* @ngInject */
  function methodReport () {
    // Usage:
    //
    // Creates:
    //
    var directive = {
      bindToController: true,
      controller: methodReportController,
      controllerAs: 'vm',
      link: link,
      restrict: 'E',
      scope: {
        method: '=',
        color: '='
      },
      templateUrl: 'app/views/workflow/directives/methodReport.html'
    };
    return directive;

    function link(scope, element, attrs) {
    }
  }

  /* @ngInject */
  function methodReportController ($log, _) {
    $log.debug('methodReportController loaded.');
  }



})();

(function() {
  'use strict';
  angular.module('pteroWorkflowClient.views')
    .directive('reportTree', reportTree)
    .controller('ReportTreeController', ReportTreeController);

  /* @ngInject */
  function reportTree($compile, $templateCache, $log, _) {
    return {
      restrict: 'E',
      scope: {
        entity: '=',
        params: '='
      },
      bindToController: true,
      controller: 'ReportTreeController',
      controllerAs: 'vm',
      templateUrl: 'app/views/workflow/directives/reportTree.html',
      link: function(scope, el, attrs) {
        var vm = scope.vm,
          template = '';
        if(vm.entity.type === 'workflow') {
          vm.workflow = vm.parseWorkflow(vm.entity);
          template = 'workflowTree.html';
        } else if (vm.entity.type === 'task') {
          vm.task = vm.parseTask(vm.entity, vm.params.color, vm.params.parallelBy);
          template = 'taskTree.html';
        } else if (vm.entity.type === 'method') {
          vm.method = vm.parseMethod(vm.entity, vm.params.color);
          template = 'methodTree.html';
        }

        scope.$watch(function() { return scope.vm.entity; }, function(entity) {
          el.replaceWith(
            $compile($templateCache.get(template))(scope)
          );
        });
      }
    };
  }

  /* @ngInject */
  function ReportTreeController($log) {
    var vm = this;
    vm.parseWorkflow = function(wf, color) {
      color = angular.isUndefined(color) ? 0 : color; // set color to 0 if unspecified
      var execution = wf.executions[color];
      if(angular.isUndefined(execution)) {
        return {
          id: wf.id,
          name: wf.name,
          type: wf.type,
          status: wf.status,
          tasks: wf.tasks
          // methods: reportOnMethods()
        }
      } else {
        return {
          id: wf.id,
          name: wf.name,
          type: wf.type,
          status: execution.status,
          started: execution.timeStarted,
          duration: execution.duration,
          tasks: wf.tasks,
          execution: execution
        }
      }
    };

    vm.parseTask = function parseTask(task, color, parallelBy) {
      //$log.debug('reportOnTask: ' + task.name);
      //$log.debug('-- color: ' + color);
      //$log.debug('-- parallelBy: ' + parallelBy);
      var execution = task.executions[color];

      vm.relevantMethods = _.select(task.methods, function(method) {
        return !_.isUndefined(method.executions[color]);
      });

      vm.relevantExecutionColors = _.map(_.select(task.executions, 'parentColor', color), function(exec, color) {
        return exec.color;
      });

      var parallelByInfo;

      if(parallelBy) {
        parallelByInfo = '[' + execution.parallelIndexes.join(',') + ']';
      } else if(task.parallelBy) {
        parallelByInfo = '[parallel-by: ' + task.parallelBy + ']';
      }

      if(_.isUndefined(execution)) {
        return {
          id: task.id,
          name: task.name,
          type: task.type,
          parallelBy: task.parallelBy,
          parallelByInfo: parallelByInfo,
          executions: task.executions,
          methods: task.methods
        };
      } else {
        return {
          name: task.name,
          type: task.type,
          id: task.id,
          status: execution.status,
          started: execution.timeStarted,
          duration: execution.duration,
          parallelBy: task.parallelBy,
          parallelByInfo: parallelByInfo,
          executions: task.executions,
          methods: task.methods
        };
      }
    };

    vm.parseMethod = function parseMethod(method, color) {
      //$log.debug('reportOnMethod: ' + method.name);
      //$log.debug('-- color: ' + color);
      //$log.debug('-- service: ' + method.service);
      var execution = method.executions[color];
      //_.each(_.sortBy(method.tasks, 'topologicalIndex'), function(task) {
      //  tasks.push(vm.parseTask(task, color, 0));
      //});

      if(_.isUndefined(execution)) {
        return {
          id: method.id,
          name: method.name,
          type: method.type,
          service: method.service,
          tasks: method.tasks,
          executions: method.executions
        };
      } else {
        return {
          id: method.id,
          name: method.name,
          type: method.service === 'job' ? 'job' : 'DAG',
          service: method.service,
          status: execution.status,
          started: execution.timeStarted,
          duration: execution.duration,
          childWorkflowProxies: execution.childWorkflowProxies,
          tasks: method.tasks,
          executions: method.executions
        }
      }
    }
  }
})();

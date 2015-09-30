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
          vm.isParent = !_.isEmpty(vm.entity.tasks);
          template = 'workflowNode.html';
        } else if (vm.entity.type === 'task') {
          vm.isParent =!_.isEmpty(vm.entity.methods) || !_.isEmpty(vm.entity.tasks.executions[vm.params.color]);
          template = 'taskNode.html';
        } else if (vm.entity.type === 'method') {
          vm.isParent = !_.isEmpty(vm.entity.tasks);
          template = 'methodNode.html';
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
    $log.debug('ReportTreeController loaded.');
    var vm = this;
    vm.parseWorkflow = function(wf, color) {
      color = angular.isUndefined(color) ? 0 : color; // set color to 0 if unspecified
      var execution = wf.executions[color];
      if(angular.isUndefined(execution)) {
        return {
          type: 'workflow',
          id: wf.id,
          name: wf.name,
          status: wf.status,
          tasks: wf.tasks
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
          tasks: wf.tasks,
          execution: execution
        }
      }
    };
  }
})();

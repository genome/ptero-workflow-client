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
        scope.vm.isParent = _.isArray(scope.vm.workflow.tasks);

        scope.$watch(function() { return scope.vm.workflow; }, function(workflow) {
          el.replaceWith(
            $compile($templateCache.get('workflowNode.html'))(scope)
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
    }
  }
})();

(function() {
  'use strict';
  angular.module('pteroWorkflowClient.views')
    .directive('reportTree', reportTree)
    .controller('ReportTreeController', ReportTreeController);

  /* @ngInject */
  function reportTree($compile, $templateCache) {
    return {
      restrict: 'E',
      scope: {
        val: '=',
        parentData: '='
      },
      bindToController: true,
      controller: 'ReportTreeController',
      controllerAs: 'vm',
      templateUrl: 'app/views/workflow/directives/reportTree.html',
      link: function(scope, el, attrs) {
        scope.vm.isParent = angular.isArray(scope.vm.val.items);
        scope.vm.delSubtree = function() {
          if(scope.vm.parentData) {
            scope.vm.parentData.splice(
              scope.vm.parentData.indexOf(scope.vm.val),
              1
            );
          }
          scope.vm.val={};
        };
        el.replaceWith(
          $compile($templateCache.get('recursive.html'))(scope)
        );
      }
    };
  }

  /* @ngInject */
  function ReportTreeController($log) {
    $log.debug('ReportTreeController loaded.');
    var vm = this;
  }
})();

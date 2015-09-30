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
        val: '=',
        parentData: '='
      },
      bindToController: true,
      controller: 'ReportTreeController',
      controllerAs: 'vm',
      templateUrl: 'app/views/workflow/directives/reportTree.html',
      link: function(scope, el, attrs) {
        scope.vm.isParent = _.isArray(scope.vm.val.items);

        el.replaceWith(
          $compile($templateCache.get('recursive.html'))(scope)
        );
        scope.$on('$destroy', function() {
          $log.debug('reportTree element destroyed.');
        });
      }
    };
  }

  /* @ngInject */
  function ReportTreeController($log) {
    $log.debug('ReportTreeController loaded.');
    var vm = this;
  }
})();

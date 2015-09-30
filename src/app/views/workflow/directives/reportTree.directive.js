(function() {
  angular.module('pteroWorkflowClient.views')
    .directive('reportTree', function($compile, $templateCache) {
      return {
        restrict: 'E',
        scope: {
          val: '=',
          parentData: '='
        },
        templateUrl: 'app/views/workflow/directives/reportTree.html',
        link: function(scope, el, attrs) {
          scope.isParent = angular.isArray(scope.val.items);
          scope.delSubtree = function() {
            if(scope.parentData) {
              scope.parentData.splice(
                scope.parentData.indexOf(scope.val),
                1
              );
            }
            scope.val={};
          };
          el.replaceWith(
            $compile(
              $templateCache.get('recursive.html')
            )(scope)
          );
        }
      };
    });
})();

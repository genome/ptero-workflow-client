(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .directive('acmeNavbar', acmeNavbar);

  /** @ngInject */
  function acmeNavbar() {
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/navbar/navbar.html',
      scope: {
          creationDate: '='
      },
      controller: NavbarController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function NavbarController($state, $stateParams, moment) {
      var vm = this;

      // "vm.creation" is avaible by directive option "bindToController: true"
      vm.relativeDate = moment(vm.creationDate).fromNow();

      vm.viewWorkflow = function(dir) {
        if(dir === 'previous') {
          if($stateParams.workflowId -1 <=0) { return; }
          $state.go('workflow', {workflowId: Number($stateParams.workflowId) - 1})
        } else if(dir === 'next') {
          $state.go('workflow', {workflowId: Number($stateParams.workflowId) + 1})
        }
      }

    }
  }

})();

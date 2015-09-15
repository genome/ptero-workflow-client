(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($state) {
    var vm = this;
    vm.viewWorkflow = function(id) {
      $state.go('workflow', { workflowId: id });
    }
  }
})();

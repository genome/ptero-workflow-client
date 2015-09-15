(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($state) {
    var vm = this;
    vm.viewWorkflow = function(id) {
      $state.go('workflow', { workflowId: id });
    }
  }
})();

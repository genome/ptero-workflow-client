(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($state) {
    var main = this;
    main.viewWorkflow = function(id) {
      $state.go('workflow', { workflowId: id });
    }
  }
})();

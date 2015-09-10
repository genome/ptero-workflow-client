(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($timeout) {
    var vm = this;
    vm.testMsg = 'testing 1 2 3';
  }
})();

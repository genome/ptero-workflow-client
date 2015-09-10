(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .config(config);

  /** @ngInject */
  function config($logProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

  }

})();

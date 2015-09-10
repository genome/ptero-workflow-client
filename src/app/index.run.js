(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();

(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient', [
      'ngMessages',
      'ngResource',
      'ui.router',
      'ui.bootstrap',
      'angularMoment',
      'pteroWorkflowClient.services',
      'pteroWorkflowClient.views',
      'jsonFormatter'
    ]);

})();

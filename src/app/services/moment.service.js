(function() {
  'use strict';
  angular.module('pteroWorkflowClient.services')
    .factory('moment', function ($window) {
      return $window.moment;
    });
})();

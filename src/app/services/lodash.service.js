(function() {
  'use strict';
  angular.module('pteroWorkflowClient.services')
    .factory('_', function ($window) {
      return $window._;
    });
})();

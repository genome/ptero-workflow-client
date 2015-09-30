(function() {
  'use strict';
  angular.module('pteroWorkflowClient.services')
    .factory('d3', function ($window) {
      return $window.d3;
    });
})();

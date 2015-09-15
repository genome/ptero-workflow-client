(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient')
    .factory('WorkflowResource',  WorkflowResource)
    .factory('WorkflowService',  WorkflowService);

  /* @ngInject */
  function WorkflowResource($resource, $cacheFactory) {
    var cache = $cacheFactory.get('$http');

    var cacheInterceptor = function(response) {
      cache.remove(response.config.url);
      return response.$promise;
    };

    return $resource('/ptero/v1/workflows/:workflowId',
      {
        workflowId: '@workflowId'
      },
      {
        // Base Gene Resources
        query: {
          method: 'GET',
          isArray: true,
          cache: cache
        },
        getDetails: { // get a single gene
          url: '/ptero/v1/reports/workflow-details',
          params: {

          },
          method: 'GET',
          isArray: false,
          cache: cache
        },
        getName: { // get a single gene's name and entrez_id
          url: '/api/genes/:geneId',
          params: {detailed: 'false'},
          method: 'GET',
          isArray: false,
          cache: cache
        }
      }
    );
  }

  /* @ngInject */
  function WorkflowService() {
    var someValue = '';
    var factory = {
      save: save,
      someValue: someValue,
      validate: validate
    };
    return factory;

    ////////////

    function save() {
      /* */
    }

    function validate() {
      /* */
    }
  }

})();

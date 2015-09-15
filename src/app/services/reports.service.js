(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('ReportsResource',  ReportsResource)
    .factory('Reports',  ReportsService);

  /* @ngInject */
  function ReportsResource($resource, $cacheFactory) {
    var cache = $cacheFactory.get('$http');

    var cacheInterceptor = function(response) {
      cache.remove(response.config.url);
      return response.$promise;
    };

    // NOTE: in addition to reportType, workflow_id must be specified,
    // which ngResource will automatically append as a query parameter
    // e.g., getReport expects a reqObj that looks like this:
    // {
    //   workflow_id: 7
    //   reportType: 'submission-details',
    // }
    //
    // ngResource will then construct a request URL that looks like:
    //
    // http://[...host...]/api/v1/reports/submission-details?workflow_id=7
    //
    return $resource('/api/v1/reports/:reportType',
      {
        reportType: '@reportType'
      },
      {
        get: {
          method: 'GET',
          isArray: false,
          cache: cache
        }
      },
      {
        getLinks: {
          url: '/api/v1/workflows/:workflowId',
          params: {
            workflowId: '@workflowId'
          },
          method: 'GET',
          isArray: false,
          cache: cache
        }
      }
    );
  }

  /* @ngInject */
  function ReportsService(ReportsResource) {
    var links = {},
      skeleton = {},
      details = {},
      outputs = {},
      executions = {},
      status = {},
      submissionDetails = {};

    var reports = {};

    var factory = {
      links: links,
      skeleton: skeleton,
      details: details,
      outputs: outputs,
      executions: executions,
      status: status,
      submissionDetails: submissionDetails,

      getReportLinks: getLinks,
      get: get
    };

    return factory;

    ////////////

    function getLinks(reqObj) {
      return ReportsResource.getLinks(reqObj).$promise
        .then(function(response) {
          angular.copy(response, reportLinks);
          return response.$promise;
        });
    }


    function get(reqObj) {
      return ReportsResource.get(reqObj).$promise
        .then(function(response) {
          angular.copy(response, reports);
          return response.$promise;
        });
    }
  }

})();

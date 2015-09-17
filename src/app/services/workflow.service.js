(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.services')
    .factory('Workflow',  WorkflowService);

  /* @ngInject */
  function WorkflowService($q, $log, _, Reports) {
    var workflow = {};

    var factory = {
      workflow: workflow,
      get: get
    };

    return factory;

    ////////////

    function get(workflowId) {
      var deferred = $q.defer();
      $q.all({
        skeleton: Reports.get({reportType: 'workflow-skeleton', workflow_id: workflowId}),
        // details: Reports.get({reportType: 'workflow-details', workflow_id: workflowId}),
        //outputs: Reports.get({reportType: 'workflow-outputs', workflow_id: workflowId}),
        executions: Reports.get({reportType: 'workflow-executions', workflow_id: workflowId}),
        //status: Reports.get({reportType: 'workflow-status', workflow_id: workflowId}),
        //submissionData: Reports.get({reportType: 'workflow-submission-data', workflow_id: workflowId})
      })
        .then(function(result) {
          $log.info('Workflow Service $q.all complete.');
          deferred.resolve(parseWorkflow(result));
        })
        .catch(function(error) {
          console.error('Error fetching details for workflow.');
          deferred.reject('Error fetching details for workflow.');
        });

      return deferred.promise;
    }

    function parseWorkflow(result) {
      var workflow = result.skeleton;
      var executions = result.executions;
      return {
        id: workflow.id,
        name: workflow.name,
        rootTaskId: workflow.rootTaskId,
        begins: workflow.begins,
        status: workflow.status,
        //executions: parseExecutions(workflow, executions),
        //methods: parseMethods(workflow, executions),
        tasks: parseTasks(workflow.tasks, executions)
      };
    }

    function parseTasks(tasks, executions) {
      return _.map(tasks, function(task, key) {
        $log.debug('parsing task');
        $log.debug(task);

        return {
          id: task.id,
          name: key,
          parallelBy: task.parallelBy,
          topologicalIndex: task.topologicalIndex,
          executions: [],
          methods: parseMethods(task.methods, executions)
        };
      });
    }

    function parseMethods(methods, executions) {
      return _.map(methods, function(method) {
        $log.debug('parsing method');
        $log.debug(method);
        // there exists four method types that are either Methods or DAGs:
        // job: Method,
        // workflow: DAG,
        // workflow-block: Method,
        // workflow-converge Method

        return {
          id: method.id,
          name: method.name,
          service: method.service,
          serviceUrl: method.serviceUrl ? method.serviceUrl : null,
          executions: []
        };
      });
    }
  }
//  my ($class, $hashref) = @_;
//
//  my $self = bless {}, $class;
//    $self->{id} = $hashref->{id};
//    $self->{root_task_id} = $hashref->{rootTaskId};
//    $self->{name} = $hashref->{name};
//    $self->{status} = $hashref->{status};
//    $self->{method_index} = {};
//    $self->{task_index} = {};
//
//  while (my ($key, $val) = each %{$hashref->{tasks}}) {
//    $self->{tasks}{$key} = Ptero::Concrete::Workflow::Task->new(
//    $val, $key);
//}
//
//  $self->register_components();
//
//return $self;
})();

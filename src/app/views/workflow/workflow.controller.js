(function() {
  'use strict';

  angular
    .module('pteroWorkflowClient.views')
    .controller('WorkflowController', WorkflowController);

  /** @ngInject */
  function WorkflowController(workflow, executions) {
    var vm = this;
    vm.report = [];
    vm.abnormal = [];

    vm.workflow = workflow;
    vm.executions = executions;
    vm.data = {
      text: 'Primates',
      items: [
        {
          text: 'Anthropoidea',
          items: [
            {
              text: 'New World Anthropoids'
            },
            {
              text: 'Old World Anthropoids',
              items: [
                {
                  text: 'Apes',
                  items: [
                    {
                      text: 'Lesser Apes'
                    },
                    {
                      text: 'Greater Apes'
                    }
                  ]
                },
                {
                  text: 'Monkeys'
                }
              ]
            }
          ]
        },
        {
          text: 'Prosimii'
        }
      ]
    };
  }
})();

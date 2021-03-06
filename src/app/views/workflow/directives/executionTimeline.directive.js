(function() {
  'use strict';
  angular.module('pteroWorkflowClient.views')
    .directive('executionTimeline', executionTimeline)
    .controller('ExecutionTimelineController', ExecutionTimelineController);

  /* @ngInject */
  function executionTimeline() {
    return {
      restrict: 'E',
      scope: {
        workflow: '=',
        executions: '=',
        params: '=',
      },
      bindToController: true,
      controller: 'ExecutionTimelineController',
      controllerAs: 'vm',
      templateUrl: 'app/views/workflow/directives/executionTimeline.html',
      link: function(scope, elem, attr) {
        scope.vm.elem = elem;
      }

    }
  }

  /* @ngInject */
  function ExecutionTimelineController($log, $scope, $element, moment, d3) {
    var vm = this;
    var target = $element[0].querySelector('#timeline');
    var data = generateLanes(vm.executions);
    var params = vm.params;

    $scope.$watchGroup([
      function() {return target;},
      function() {return data;}
    ], function(group) {
      renderTimeline(group[0], group[1]);
    });

    function generateLanes(executions){
      var lanes = [],
        items = [];
      executions = _.sortBy(executions, function (exec) {
        return new Date(exec.timeStarted);
      });

      var laneId = 0;
      _.each(executions, function (exec, index, collection) {
        if(_.isEmpty(lanes)){
          lanes.push(newLane(laneId, laneId, exec.timeStarted, exec.timeEnded));
          items.push(newItem(
            exec.status,
            exec.parentType,
            exec.parentId,
            laneId,
            index,
            exec.timeStarted,
            exec.timeEnded
          ));
          laneId++;
        } else {
          var openLane = _.find(lanes, function (lane) {
            return !isBetween(exec.timeStarted, lane.firstExecutionStarted, lane.lastExecutionEnded);
          });

          if(_.isUndefined(openLane)) {
            lanes.push(newLane(laneId, laneId, exec.timeStarted, exec.timeEnded));
            items.push(newItem(
              exec.status,
              exec.parentType,
              exec.parentId,
              laneId,
              index,
              exec.timeStarted,
              exec.timeEnded
            ));
            laneId++;
          } else {
            items.push(newItem(
              exec.status,
              exec.parentType,
              exec.parentId,
              openLane.id,
              index,
              exec.timeStarted,
              exec.timeEnded
            ));
            openLane.lastExecutionEnded = new Date(exec.timeEnded);
          }
        }

        function isBetween(time, start, end) {
          return moment(time).isBetween(start, end);
        }

        function newLane(id, label, timeStarted, timeEnded) {
          return {
            id: id,
            label: label,
            firstExecutionStarted: new Date(timeStarted),
            lastExecutionEnded: new Date(timeEnded)
          }
        }

        function newItem(status, parentType, parentId, lane, id, timeStarted, timeEnded) {
          return {
            //class: status + ' ' + parentType,
            class: parentType,
            desc: parentType + ' ' + parentId + ':' + id,
            lane: lane,
            id: id,
            start: new Date(timeStarted),
            end: new Date(timeEnded)
          }
        }

      });

      return {
        lanes: lanes,
        items: items
      };
    }

    // adapted from http://bl.ocks.org/bunkat/3127459
    function renderTimeline(target, data) {
      var vm = this;

      var items = data.items,
        lanes = data.lanes;

      var targetWidth = target.offsetWidth;
      var targetHeight;
      if(lanes.length < 5 ) {
        targetHeight = 300;
      } else if (5 <= lanes.length < 15) {
        targetHeight = lanes.length * 60;
      } else if (lanes.length >= 15) {
        targetHeight = lanes.length * 45;
      }

      // helper function to create dates prior to 1000
      var yr = function(year) {
        var date = new Date(2000,1,1);
        date.setFullYear(year);
        return date;
      };


      var margin = { top: 10, right: 0, bottom: 20, left: 0 }
        , width = targetWidth - margin.left - margin.right
        , height = targetHeight - margin.top - margin.bottom
        , miniHeight = lanes.length * 12 + 50
        , mainHeight = height - miniHeight - 50;


      var wfStart = d3.min(items, function (d) { return d.start; }),
        wfEnd = d3.max(items, function (d) { return d.end; });

      var duration = moment(wfEnd).subtract(wfStart);


      var x = d3.time.scale()
        .domain([ wfStart, wfEnd ])
        .range([0, width]);

      var x1 = d3.time.scale().range([0, width]);
      var ext = d3.extent(lanes, function(d) { return d.id; });
      var y1 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, mainHeight]);
      var y2 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, miniHeight]);

      // delete existing elements
      d3.select(target).selectAll("*").remove();

      var chart = d3.select(target)
        .append('svg:svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .attr('class', 'chart');

      chart.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', mainHeight);

      var main = chart.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', width)
        .attr('height', mainHeight)
        .attr('class', 'main');

      var mini = chart.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + (mainHeight + 60) + ')')
        .attr('width', width)
        .attr('height', miniHeight)
        .attr('class', 'mini');

      // draw the lanes for the main chart
      main.append('g').selectAll('.laneLines')
        .data(lanes)
        .enter().append('line')
        .attr('x1', 0)
        .attr('y1', function(d) { return d3.round(y1(d.id)) + 0.5; })
        .attr('x2', width)
        .attr('y2', function(d) { return d3.round(y1(d.id)) + 0.5; })
        .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray' });

      main.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function(d) { return d.label; })
        .attr('x', -10)
        .attr('y', function(d) { return y1(d.id + .5); })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

      // draw the lanes for the mini chart

      mini.append('g').selectAll('.laneLines')
        .data(lanes)
        .enter().append('line')
        .attr('x1', 0)
        .attr('y1', function(d) { return d3.round(y2(d.id)) + 0.5; })
        .attr('x2', width)
        .attr('y2', function(d) { return d3.round(y2(d.id)) + 0.5; })
        .attr('stroke', function(d) { return d.label === '' ? 'white' : 'lightgray' });

      mini.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function(d) { return d.label; })
        .attr('x', -10)
        .attr('y', function(d) { return y2(d.id + .5); })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

      // draw the x axis
      var xDateAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

      var x1DateAxis = d3.svg.axis()
        .scale(x1)
        .orient('bottom');

      main.append('g')
        .attr('transform', 'translate(0,' + mainHeight + ')')
        .attr('class', 'main axis date')
        .call(x1DateAxis);

      mini.append('g')
        .attr('transform', 'translate(0,' + miniHeight + ')')
        .attr('class', 'axis date')
        .call(xDateAxis);

      // draw the items
      var itemRects = main.append('g')
        .attr('clip-path', 'url(#clip)');

      mini.append('g').selectAll('miniItems')
        .data(getPaths(items))
        .enter().append('path')
        .attr('class', function(d) { return 'miniItem ' + d.class; })
        .attr('d', function(d) { return d.path; });

      // invisible hit area to move around the selection window
      mini.append('rect')
        .attr('pointer-events', 'painted')
        .attr('width', width)
        .attr('height', miniHeight)
        .attr('visibility', 'hidden')
        .on('mouseup', moveBrush);

      // draw the selection area
      var brush = d3.svg.brush()
        .x(x)
        .extent([
          d3.min(items, function (d) { return d.start; }),
          d3.max(items, function (d) { return d.end; })
        ])
        .on("brush", display);

      mini.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', 1)
        .attr('height', miniHeight - 1);

      mini.selectAll('rect.background').remove();
      display();

      function display () {
        var rects, labels
          , minExtent = brush.extent()[0]
          , maxExtent = brush.extent()[1]
          , visItems = items.filter(function (d) { return d.start < maxExtent && d.end > minExtent});

        mini.select('.brush').call(brush.extent([minExtent, maxExtent]));

        x1.domain([minExtent, maxExtent]);

        // update the axis
        main.select('.main.axis.date').call(x1DateAxis);

        // update the item rects
        rects = itemRects.selectAll('rect')
          .data(visItems, function (d) { return d.id; })
          .attr('x', function(d) { return x1(d.start); })
          .attr('width', function(d) { return x1(d.end) - x1(d.start); });

        var rectRadius = 3;
        rects.enter().append('rect')
          .attr('x', function(d) { return x1(d.start); })
          .attr('y', function(d) { return y1(d.lane) + .1 * y1(1) + 0.5; })
          .attr('rx', rectRadius)
          .attr('ry', rectRadius)
          .attr('width', function(d) { return x1(d.end) - x1(d.start); })
          .attr('height', function(d) { return .8 * y1(1); })
          .attr('class', function(d) { return 'mainItem ' + d.class; });

        rects.exit().remove();

        // update the item labels
        labels = itemRects
          .selectAll('text')
          .data(visItems, function (d) { return d.id; })
          .attr('x', function(d) { return x1(Math.max(d.start, minExtent)) + 2; });

        labels
          .enter()
          .append('text')
          .filter(function(d,i) {
            return x1(d.end) - x1(d.start) > 50;
          })
          .text(function (d) { return d.desc; })
          .attr('x', function(d) { return x1(Math.max(d.start, minExtent)) + 10; })
          .attr('y', function(d) {
            return y1(d.lane) + (y1(1)/2) + 5;
          })
          .attr('text-anchor', 'start')
          .attr('class', 'itemLabel');

        labels.exit().remove();
      }

      function moveBrush () {
        var origin = d3.mouse(this)
          , point = x.invert(origin[0])
          , halfExtent = (brush.extent()[1].getTime() - brush.extent()[0].getTime()) / 2
          , start = new Date(point.getTime() - halfExtent)
          , end = new Date(point.getTime() + halfExtent);

        brush.extent([start,end]);
        display();
      }

      // generates a single path for each item class in the mini display
      // ugly - but draws mini 2x faster than append lines or line generator
      // is there a better way to do a bunch of lines as a single path with d3?
      function getPaths(items) {
        var paths = {}, d, offset = .5 * y2(1) + 0.5, result = [];
        for (var i = 0; i < items.length; i++) {
          d = items[i];
          if (!paths[d.class]) paths[d.class] = '';
          paths[d.class] += ['M',x(d.start),(y2(d.lane) + offset),'H',x(d.end)].join(' ');
        }

        for (var className in paths) {
          result.push({class: className, path: paths[className]});
        }

        return result;
      }

    }
  }
})();

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
        params: '='
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
  function ExecutionTimelineController($scope, $element, moment, d3) {
    var vm = this;
    var target = $element[0].querySelector('#timeline');
    var data = randomData();
    var data2 = generateLanes(vm.executions);
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
          lanes.push({
            id: laneId,
            label: laneId,
            firstExecutionStarted: new Date(exec.timeStarted),
            lastExecutionEnded: new Date(exec.timeEnded)
          });

          items.push({
            class: 'past',
            desc: exec.parentType + ' ' + exec.parentId + ':' + exec.id,
            lane: laneId,
            id: index,
            start: new Date(exec.timeStarted),
            end: new Date(exec.timeEnded)
          });
          laneId++;
        } else {
          var openLane = _.find(lanes, function (lane) {
            return isBetween(exec.timeStarted, lane.firstExecutionStarted, lane.lastExecutionEnded);
          });

          if(_.isUndefined(openLane)) {
            lanes.push({
              id: laneId,
              label: laneId,
              firstExecutionStarted: new Date(exec.timeStarted),
              lastExecutionEnded: new Date(exec.timeEnded)
            });
            items.push({
              class: 'past',
              desc: exec.parentType + ' ' + exec.parentId + ':' + exec.id,
              lane: laneId,
              id: index,
              start: new Date(exec.timeStarted),
              end: new Date(exec.timeEnded)
            });
            laneId++;
          } else {
            items.push({
              class: 'past',
              desc: exec.parentType + ' ' + exec.parentId + ':' + exec.id,
              lane: openLane.id,
              id: index,
              start: new Date(exec.timeStarted),
              end: new Date(exec.timeEnded)
            });

            openLane.lastExecutionEnded = new Date(exec.timeEnded);
          }
        }

        function isBetween(time, start, end) {
          return moment(time).isBetween(start, end);
        }

      });

      return {
        lanes: lanes,
        items: items
      };
    }

    function renderTimeline(target, data) {
      var targetWidth = target.offsetWidth;
      var targetHeight = target.offsetHeight;

      var lanes = data2.lanes
        , items = data2.items
        , now = new Date();

      var margin = {top: 20, right: 15, bottom: 15, left: 60}
        , width = targetWidth - margin.left - margin.right
        , height = targetHeight - margin.top - margin.bottom
        , miniHeight = lanes.length * 12 + 50
        , mainHeight = height - miniHeight - 50;

      var x = d3.time.scale()
        .domain([d3.time.sunday(d3.min(items, function (d) {
          return d.start;
        })),
          d3.max(items, function (d) {
            return d.end;
          })])
        .range([0, width]);
      var x1 = d3.time.scale().range([0, width]);

      var ext = d3.extent(lanes, function (d) {
        return d.id;
      });
      var y1 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, mainHeight]);
      var y2 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, miniHeight]);

      // clear any previous rendering
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
        .attr('y1', function (d) {
          return d3.round(y1(d.id)) + 0.5;
        })
        .attr('x2', width)
        .attr('y2', function (d) {
          return d3.round(y1(d.id)) + 0.5;
        })
        .attr('stroke', function (d) {
          return d.label === '' ? 'white' : 'lightgray'
        });

      main.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function (d) {
          return d.label;
        })
        .attr('x', -10)
        .attr('y', function (d) {
          return y1(d.id + .5);
        })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

// draw the lanes for the mini chart
      mini.append('g').selectAll('.laneLines')
        .data(lanes)
        .enter().append('line')
        .attr('x1', 0)
        .attr('y1', function (d) {
          return d3.round(y2(d.id)) + 0.5;
        })
        .attr('x2', width)
        .attr('y2', function (d) {
          return d3.round(y2(d.id)) + 0.5;
        })
        .attr('stroke', function (d) {
          return d.label === '' ? 'white' : 'lightgray'
        });

      mini.append('g').selectAll('.laneText')
        .data(lanes)
        .enter().append('text')
        .text(function (d) {
          return d.label;
        })
        .attr('x', -10)
        .attr('y', function (d) {
          return y2(d.id + .5);
        })
        .attr('dy', '0.5ex')
        .attr('text-anchor', 'end')
        .attr('class', 'laneText');

// draw the x axis
      var xDateAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .ticks(d3.time.mondays, (x.domain()[1] - x.domain()[0]) > 15552e6 ? 2 : 1)
        .tickFormat(d3.time.format('%d'))
        .tickSize(6, 0, 0);

      var x1DateAxis = d3.svg.axis()
        .scale(x1)
        .orient('bottom')
        .ticks(d3.time.days, 1)
        .tickFormat(d3.time.format('%a %d'))
        .tickSize(6, 0, 0);

      var xMonthAxis = d3.svg.axis()
        .scale(x)
        .orient('top')
        .ticks(d3.time.months, 1)
        .tickFormat(d3.time.format('%b %Y'))
        .tickSize(15, 0, 0);

      var x1MonthAxis = d3.svg.axis()
        .scale(x1)
        .orient('top')
        .ticks(d3.time.mondays, 1)
        .tickFormat(d3.time.format('%b - Week %W'))
        .tickSize(15, 0, 0);

      main.append('g')
        .attr('transform', 'translate(0,' + mainHeight + ')')
        .attr('class', 'main axis date')
        .call(x1DateAxis);

      main.append('g')
        .attr('transform', 'translate(0,0.5)')
        .attr('class', 'main axis month')
        .call(x1MonthAxis)
        .selectAll('text')
        .attr('dx', 5)
        .attr('dy', 12);

      mini.append('g')
        .attr('transform', 'translate(0,' + miniHeight + ')')
        .attr('class', 'axis date')
        .call(xDateAxis);

      mini.append('g')
        .attr('transform', 'translate(0,0.5)')
        .attr('class', 'axis month')
        .call(xMonthAxis)
        .selectAll('text')
        .attr('dx', 5)
        .attr('dy', 12);

// draw a line representing today's date
      main.append('line')
        .attr('y1', 0)
        .attr('y2', mainHeight)
        .attr('class', 'main todayLine')
        .attr('clip-path', 'url(#clip)');

      mini.append('line')
        .attr('x1', x(now) + 0.5)
        .attr('y1', 0)
        .attr('x2', x(now) + 0.5)
        .attr('y2', miniHeight)
        .attr('class', 'todayLine');

// draw the items
      var itemRects = main.append('g')
        .attr('clip-path', 'url(#clip)');

      mini.append('g').selectAll('miniItems')
        .data(getPaths(items))
        .enter().append('path')
        .attr('class', function (d) {
          return 'miniItem ' + d.class;
        })
        .attr('d', function (d) {
          return d.path;
        });

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
        .extent([d3.time.monday(now), d3.time.saturday.ceil(now)])
        .on("brush", display);

      mini.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', 1)
        .attr('height', miniHeight - 1);

      mini.selectAll('rect.background').remove();
      display();

      function display() {

        var rects, labels
          , minExtent = d3.time.day(brush.extent()[0])
          , maxExtent = d3.time.day(brush.extent()[1])
          , visItems = items.filter(function (d) {
            return d.start < maxExtent && d.end > minExtent
          });

        mini.select('.brush').call(brush.extent([minExtent, maxExtent]));

        x1.domain([minExtent, maxExtent]);

        if ((maxExtent - minExtent) > 1468800000) {
          x1DateAxis.ticks(d3.time.mondays, 1).tickFormat(d3.time.format('%a %d'))
          x1MonthAxis.ticks(d3.time.mondays, 1).tickFormat(d3.time.format('%b - Week %W'))
        }
        else if ((maxExtent - minExtent) > 172800000) {
          x1DateAxis.ticks(d3.time.days, 1).tickFormat(d3.time.format('%a %d'))
          x1MonthAxis.ticks(d3.time.mondays, 1).tickFormat(d3.time.format('%b - Week %W'))
        }
        else {
          x1DateAxis.ticks(d3.time.hours, 4).tickFormat(d3.time.format('%I %p'))
          x1MonthAxis.ticks(d3.time.days, 1).tickFormat(d3.time.format('%b %e'))
        }


        //x1Offset.range([0, x1(d3.time.day.ceil(now) - x1(d3.time.day.floor(now)))]);

        // shift the today line
        main.select('.main.todayLine')
          .attr('x1', x1(now) + 0.5)
          .attr('x2', x1(now) + 0.5);

        // update the axis
        main.select('.main.axis.date').call(x1DateAxis);
        main.select('.main.axis.month').call(x1MonthAxis)
          .selectAll('text')
          .attr('dx', 5)
          .attr('dy', 12);

        // upate the item rects
        rects = itemRects.selectAll('rect')
          .data(visItems, function (d) {
            return d.id;
          })
          .attr('x', function (d) {
            return x1(d.start);
          })
          .attr('width', function (d) {
            return x1(d.end) - x1(d.start);
          });

        rects.enter().append('rect')
          .attr('x', function (d) {
            return x1(d.start);
          })
          .attr('y', function (d) {
            return y1(d.lane) + .1 * y1(1) + 0.5;
          })
          .attr('width', function (d) {
            return x1(d.end) - x1(d.start);
          })
          .attr('height', function (d) {
            return .8 * y1(1);
          })
          .attr('class', function (d) {
            return 'mainItem ' + d.class;
          });

        rects.exit().remove();

        // update the item labels
        labels = itemRects.selectAll('text')
          .data(visItems, function (d) {
            return d.id;
          })
          .attr('x', function (d) {
            return x1(Math.max(d.start, minExtent)) + 2;
          });

        labels.enter().append('text')
          .text(function (d) {
            return 'Item\n\n\n\n Id: ' + d.id;
          })
          .attr('x', function (d) {
            return x1(Math.max(d.start, minExtent)) + 2;
          })
          .attr('y', function (d) {
            return y1(d.lane) + .4 * y1(1) + 0.5;
          })
          .attr('text-anchor', 'start')
          .attr('class', 'itemLabel');

        labels.exit().remove();
      }

      function moveBrush() {
        var origin = d3.mouse(this)
          , point = x.invert(origin[0])
          , halfExtent = (brush.extent()[1].getTime() - brush.extent()[0].getTime()) / 2
          , start = new Date(point.getTime() - halfExtent)
          , end = new Date(point.getTime() + halfExtent);

        brush.extent([start, end]);
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
          paths[d.class] += ['M', x(d.start), (y2(d.lane) + offset), 'H', x(d.end)].join(' ');
        }

        for (var className in paths) {
          result.push({class: className, path: paths[className]});
        }

        return result;
      }
    }
    function randomData() {

      var addToLane = function (chart, item) {
        var name = item.lane;

        if (!chart.lanes[name])
          chart.lanes[name] = [];

        var lane = chart.lanes[name];

        var sublane = 0;
        while(isOverlapping(item, lane[sublane]))
          sublane++;

        if (!lane[sublane]) {
          lane[sublane] = [];
        }

        lane[sublane].push(item);
      };

      var isOverlapping = function(item, lane) {
        if (lane) {
          for (var i = 0; i < lane.length; i++) {
            var t = lane[i];
            if (item.start < t.end && item.end > t.start) {
              return true;
            }
          }
        }
        return false;
      };

      var parseData = function (data) {
        var i = 0, length = data.length, node;
        var chart = { lanes: {} };

        for (i; i < length; i++) {
          var item = data[i];

          addToLane(chart, item);


        }

        return collapseLanes(chart);
      };

      var collapseLanes = function (chart) {
        var lanes = [], items = [], laneId = 0;
        var now = new Date();

        for (var laneName in chart.lanes) {
          var lane = chart.lanes[laneName];

          for (var i = 0; i < lane.length; i++) {
            var subLane = lane[i];

            lanes.push({
              id: laneId,
              label: i === 0 ? laneName : ''
            });

            for (var j = 0; j < subLane.length; j++) {
              var item = subLane[j];

              items.push({
                id: item.id,
                lane: laneId,
                start: item.start,
                end: item.end,
                class: item.end > now ? 'future' : 'past',
                desc: item.desc
              });
            }

            laneId++;
          }
        }

        return {lanes: lanes, items: items};
      }

      var randomNumber = function(min, max) {
        return Math.floor(Math.random(0, 1) * (max - min)) + min;
      };

      var generateRandomWorkItems = function () {
        var data = [];
        var laneCount = randomNumber(5,7)
          , totalWorkItems = randomNumber(20,30)
          , startMonth = randomNumber(0,1)
          , startDay = randomNumber(1,28)
          , totalMonths = randomNumber(4,10);

        for (var i = 0; i < laneCount; i++) {
          var dt = new Date(2012, startMonth, startDay);
          for (var j = 0; j < totalWorkItems; j++) {

            var dtS = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + randomNumber(1,5), randomNumber(8, 16), 0, 0);

            var dateOffset =  randomNumber(0,7);
            var dt = new Date(dtS.getFullYear(), dtS.getMonth(), dtS.getDate() + dateOffset, randomNumber(dateOffset === 0 ? dtS.getHours() + 2 : 8, 18), 0, 0);

            var workItem = {
              id: i * totalWorkItems + j,
              name: 'work item ' + j,
              lane: 'lane ' + i,
              start: dtS,
              end: dt,
              desc: 'This is a description.'
            };

            data.push(workItem);
          }
        }
        return data;
      };

      return parseData(generateRandomWorkItems());
    }
  }
})();

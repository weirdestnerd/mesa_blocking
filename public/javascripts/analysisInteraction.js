function AnalysisControl() {
    let trucks_data;
    let analysis_data = [];

    function getVehicle(vehicle) {
        return analysis_data.find(truck => truck.vehicle === vehicle);
    }

    this.process = callback => {
        if (!callback) return console.error('callback is not provided');
        if (!trucks_data) return callback('Data is not available');
        mapconsole.message('Processing data on trucks.');
        Object.keys(trucks_data).forEach(week => {
            trucks_data[week]['routes'].forEach(truck => {
                let vehicle = getVehicle(truck.vehicle);
                if (!vehicle) vehicle = {vehicle: truck.vehicle, cans: {}, seconds: {}, stops: {}, new: true};
                vehicle.cans[week] = truck.cans;
                vehicle.seconds[week] = truck.seconds;
                vehicle.stops[week] = {};
                Object.keys(truck.stops).forEach(day => {
                    vehicle.stops[week][day] = truck.stops[day].length;
                });
                if (vehicle.new) {
                    delete vehicle.new;
                    analysis_data.push(vehicle);
                }
            })
        });
        mapconsole.message('Done processing data.');
        callback(null);
    };

    this.setData = data => {
        trucks_data = data;
    };

    this.listenForData = () => {
        return new Promise(resolve => {
            document.addEventListener('trucks data ready', resolve);
        })
    };

    function createPieChart(data) {
        let divWidth = document.querySelector('div#analysis_control').clientWidth / 2;

        let margin = {top: 20, right: 20, bottom: 50, left: 70},
            width = divWidth - margin.left - margin.right,
            height = 200,
            radius = Math.min(width, height) / 2;

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        let svg = d3.select(`div.overall_analysis .pie_chart`).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + ((width / 2) - margin.left - margin.right) + "," + ((height / 2) + margin.top + margin.bottom) + ")");

        const pie = d3.pie()
            .value(d => d.percentage)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const tooltip = d3.select('div.overall_analysis .pie_chart')
            .append('div')
            .attr('class', 'tooltip');
        tooltip.append('div').attr('class', 'label');
        tooltip.append('div').attr('class', 'percentage');

        let path = svg.selectAll("path")
            .data(pie(data))
            .enter().append("path")
            .attr("fill", (d, i) => color(i))
            .attr("d", arc)
            .attr("stroke", "white")
            .attr("stroke-width", "1px")
            .each(d => this._current - d)
            .text(d => d.data.label);

        path.on('mouseover', function (d) {
            tooltip.select('.label').html(d.data.label);
            tooltip.select('.percentage').html(`${d.data.percentage}%`);
            tooltip.style('display', 'block');
        });
        path.on('mouseout', () => {
            tooltip.style('display', 'none');
        });
        path.on('mousemove', function(d) { // when mouse moves
            tooltip.style('top', (d3.event.layerY + 10) + 'px') // always 10px below the cursor
                .style('left', (d3.event.layerX + 10) + 'px'); // always 10px to the right of the mouse
        });

        let legendRectSize = height / data.length;
        let legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function(d, i) {
                let height = legendRectSize + 6; // height of element is the height of the colored square plus the spacing
                let offset =  height * color.domain().length / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements
                let horz = 18 * legendRectSize; // the legend is shifted to the left to make room for the text
                let vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'
                return 'translate(' + horz + ',' + vert + ')'; //return translation
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color)
            .on('click', function(label) {
                let rect = d3.select(this); // this refers to the colored squared just clicked
                let enabled = true; // set enabled true to default
                let totalEnabled = d3.sum(data.map(function(d) { // can't disable all options
                    return (d.enabled) ? 1 : 0; // return 1 for each enabled entry. and summing it up
                }));

                if (rect.attr('class') === 'disabled') { // if class is disabled
                    rect.attr('class', ''); // remove class disabled
                } else { // else
                    if (totalEnabled < 2) return; // if less than two labels are flagged, exit
                    rect.attr('class', 'disabled'); // otherwise flag the square disabled
                    enabled = false; // set enabled to false
                }

                pie.value(function(d) {
                    if (d.label === label) d.enabled = enabled; // if entry label matches legend label
                    return (d.enabled) ? d.count : 0; // update enabled property and return count or 0 based on the entry's status
                });

                path = path.data(pie(data)); // update pie with new data

                path.transition() // transition of redrawn pie
                    .duration(750) //
                    .attrTween('d', function(d) { // 'd' specifies the d attribute that we'll be animating
                        let interpolate = d3.interpolate(this._current, d); // this = current path element
                        this._current = interpolate(0); // interpolate between current value and the new value of 'd'
                        return function(t) {
                            return arc(interpolate(t));
                        };
                    });
            });

        legend.append('text')
            .attr('x', legendRectSize + 6)
            .attr('y', legendRectSize - 6)
            .text(function(d) { return data[d].label; });
    }

    function createBarGraph(data, divID, properties) {
        if (!properties.hasOwnProperty('x') || !properties.hasOwnProperty('y')) {
            console.error('x or y identifiers not provided');
            return;
        }
        let divWidth = document.querySelector('div#analysis_control').clientWidth / 2;

        let margin = {top: 20, right: 20, bottom: 50, left: 70},
            width = divWidth - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        // set the ranges
        let x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
        let y = d3.scaleLinear()
            .range([height, 0]);

        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        let svg = d3.select(`div${divID}`).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data in the domains
        x.domain(data.map(function(d) { return d[properties.x]; }));
        y.domain([0, d3.max(data, function(d) { return d[properties.y]; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", divID)
            .attr("x", function (d) {
                return x(d[properties.x]);
            })
            .attr("width", x.bandwidth())
            .attr("y", function (d) {
                return y(d[properties.y]);
            })
            .attr("height", function (d) {
                return height - y(d[properties.y]);
            });

        //    TODO: add text value to bar of chart

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        //x axis label
        svg.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text(properties.x);

        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(properties.y);
    }

    function calculateTruckCount(type) {
        if (type !== 'stops' && type !== 'cans' && type !== 'seconds') {
            return console.error('Invalid type');
        }
        let result = [];
        for (let truck in analysis_data) {
            let totals;
            if (type === 'stops') {
                totals = Object.keys(analysis_data[truck][type]).reduce((acc, week) => {
                    let entry = analysis_data[truck][type];
                    return acc + Object.keys(entry[week]).reduce((acc2, day) => {
                        return acc2 + entry[week][day]
                    }, 0);
                }, 0);
            } else {
                totals = Object.keys(analysis_data[truck][type]).reduce((acc, week) => {
                    return acc + analysis_data[truck][type][week];
                }, 0);
            }
            let vehicle = {'vehicle': analysis_data[truck].vehicle};
            vehicle[type] = totals;
            result.push(vehicle);
        }
        return result;
    }

    function createGraphs() {
        let cansCount = calculateTruckCount('cans');
        createBarGraph(cansCount, '.overall_analysis .cans_graph', {x: 'vehicle', y: 'cans'});
        let stopsCount = calculateTruckCount('stops');
        createBarGraph(stopsCount, '.overall_analysis .stops_graph', {x: 'vehicle', y: 'stops'});
        let secondsCount = calculateTruckCount('seconds');
        let hoursCount = secondsCount.map(entry => {
            entry['hours'] = Math.floor(entry.seconds / 3600);
            return entry;
        });
        createBarGraph(hoursCount, '.overall_analysis .hours_graph', {x: 'vehicle', y: 'hours'});
        let overallTotal = (function () {
            return cansCount.reduce((acc, truck) => {
                return acc + truck.cans
            }, 0) + stopsCount.reduce((acc, truck) => {
                return acc + truck.stops
            }, 0) + secondsCount.reduce((acc, truck) => {
                return acc + truck.seconds
            }, 0);
        }());
        let truckTotal = cansCount.map(truck => {
            let result = {label: truck.vehicle, percentage: 0};
            let stops = stopsCount.find(entry => entry.vehicle === truck.vehicle).stops;
            let seconds = secondsCount.find(entry => entry.vehicle === truck.vehicle).seconds;
            result.percentage = (((truck.cans + stops + seconds) / overallTotal).toFixed(2)) * 100;
            return result;
        });
        createPieChart(truckTotal);
    //    create grouped bar graphs for weekly performance
    }

    this.load = () => {
        return new Promise(resolve => {
            this.process(error => {
                if (error) return mapconsole.error(error);
                createGraphs();
                resolve();
            })
        })
    }
}
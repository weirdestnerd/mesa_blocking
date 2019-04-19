function AnalysisControl() {
    let trucks_data;
    let density_data;
    let truck_analysis_data = [];
    let density_analysis_data = [];
    let trucksAnalysisMap = {};
    let densityAnalysisMap = {};

    function getVehicleFromAnalysis(vehicle) {
        return truck_analysis_data.find(truck => truck.vehicle === parseInt(vehicle));
    }

    function getVehicleFromTrucksData(vehicle) {
        let truck = {};
        Object.keys(trucks_data).forEach(week => {
            let truckInWeek = trucks_data[week].routes.find(truck => truck.vehicle === parseInt(vehicle));
            if (truckInWeek) truck[week] = truckInWeek;
        });
        return truck;
    }

    this.process = callback => {
        if (!callback) return console.error('callback is not provided');
        if (!trucks_data) return callback('Data is not available');
        mapconsole.message('Processing data on trucks.');
        Object.keys(trucks_data).forEach(week => {
            trucks_data[week]['routes'].forEach(truck => {
                let vehicle = getVehicleFromAnalysis(truck.vehicle);
                if (!vehicle) vehicle = {vehicle: truck.vehicle, cans: {}, seconds: {}, stops: {}, new: true};
                vehicle.cans[week] = truck.cans;
                vehicle.seconds[week] = truck.seconds;
                vehicle.stops[week] = {};
                Object.keys(truck.stops).forEach(day => {
                    vehicle.stops[week][day] = truck.stops[day].length;
                });
                if (vehicle.new) {
                    delete vehicle.new;
                    truck_analysis_data.push(vehicle);
                }
            })
        });
        mapconsole.message('Processing data on zones.');
        density_data.features.forEach(feature => {
            let zone = density_analysis_data.find(zone => {
                return zone.name === feature.properties.Map_Name && zone.day === feature.properties.GREEN_SVC;
            });
            if (!zone) {
                zone = {
                    name: feature.properties.Map_Name,
                    day: feature.properties.GREEN_SVC,
                    customers: feature.properties.customerCount,
                    pickups: {}
                };
                Object.keys(feature.properties).forEach(property => {
                    if (/^[^%][A-Za-z0-9_]+((.csv)|(.xlsx))$/g.test(property)) {
                        zone.pickups[property.replace(/(.csv)|(.xlsx)$/g, '')] = feature.properties[property];
                    }
                });
                density_analysis_data.push(zone);
            } else {
                zone.customers += feature.properties.customerCount ? feature.properties.customerCount : 0;
                Object.keys(feature.properties).forEach(property => {
                    if (/^[^%][A-Za-z0-9_]+((.csv)|(.xlsx))$/g.test(property)) {
                        zone.pickups[property.replace(/(.csv)|(.xlsx)$/g, '')] += feature.properties[property];
                    }
                });
            }
        });
        mapconsole.message('Done processing data.');
        callback(null);
    };

    this.setTruckData = data => {
        trucks_data = data;
    };

    this.setDensityData = data => {
        density_data = data;
    };

    this.listenForData = () => {
        return new Promise(resolve => {
            let waitOnSecondEvent = true;
            document.addEventListener('trucks data ready', () => {
                if (!waitOnSecondEvent) return resolve();
                waitOnSecondEvent = false;
            });
            document.addEventListener('density data ready', () => {
                if (!waitOnSecondEvent) return resolve();
                waitOnSecondEvent = false;
            });
        })
    };

    function createPieChart(data) {
        let divWidth = document.querySelector('div#analysis_control').clientWidth / 2;

        let margin = {top: 20, right: 20, bottom: 50, left: 70},
            width = divWidth - margin.left - margin.right,
            height = 200,
            radius = Math.min(width, height) / 2;

        const color = d3.scaleOrdinal(d3.schemeSet3);

        let svg = d3.select(`div.overall_analysis .performance_pie_chart`).append("svg")
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

        const tooltip = d3.select('div.overall_analysis .performance_pie_chart')
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
        let DOMelement = divID ? document.querySelector(`div${divID}`) : document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let svg = divID ? d3.select(DOMelement).append("svg") : d3.select(DOMelement);

        svg = svg.attr("width", width + margin.left + margin.right)
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

        return divID ? null : DOMelement;
    }

    function calculateTruckCount(type) {
        if (type !== 'stops' && type !== 'cans' && type !== 'seconds') {
            return console.error('Invalid type');
        }
        let result = [];
        for (let truck in truck_analysis_data) {
            let totals;
            if (type === 'stops') {
                totals = Object.keys(truck_analysis_data[truck][type]).reduce((acc, week) => {
                    let entry = truck_analysis_data[truck][type];
                    return acc + Object.keys(entry[week]).reduce((acc2, day) => {
                        return acc2 + entry[week][day]
                    }, 0);
                }, 0);
            } else {
                totals = Object.keys(truck_analysis_data[truck][type]).reduce((acc, week) => {
                    return acc + truck_analysis_data[truck][type][week];
                }, 0);
            }
            let vehicle = {'vehicle': truck_analysis_data[truck].vehicle};
            vehicle[type] = totals;
            result.push(vehicle);
        }
        return result;
    }

    function createLineChart(data, divID, properties) {
        if (!properties.hasOwnProperty('x') || !properties.hasOwnProperty('y')) {
            console.error('x or y identifiers not provided');
            return;
        }
        let divWidth = document.querySelector('div#analysis_control').clientWidth / 2;

        let margin = {top: 20, right: 20, bottom: 50, left: 70},
            width = divWidth - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        let maxY = data.reduce((acc, entry) => {
            return Math.max(acc, entry[properties.y]);
        }, -Infinity);

        let origin = {};
        origin[properties.x] = 0;
        origin[properties.y] = 0;
        data.unshift(origin);

        let xScale = d3.scalePoint()
            .domain(data.map(entry => entry[properties.x]))
            .range([0, width]);

        let yScale = d3.scaleLinear()
            .domain([0, maxY])
            .range([height, 0]);

        let line = d3.line()
            .x(d => xScale(d[properties.x]))
            .y(d => yScale(d[properties.y]));

        let DOMelement = divID ? document.querySelector(`div${divID}`) : document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let svg = divID ? d3.select(DOMelement).append("svg") : d3.select(DOMelement);

        svg = svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        svg.append('g')
            .attr('class', 'x_axis')
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        svg.append('g')
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale));

        svg.append('path')
            .datum(data)
            .attr("class", "line")
            .attr("d", line);

        let focus = svg.append('g')
            .attr('class', 'focus')
            .style('display', 'none');
        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", height);

        focus.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", width)
            .attr("x2", width);

        focus.append("circle")
            .attr("r", 7.5);

        focus.append("text")
            .attr("x", 15)
            .attr("dy", ".31em");

        svg.selectAll('.dot')
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d[properties.x]))
            .attr("cy", d => yScale(d[properties.y]))
            .attr("r", 5)
            .on("mouseover", function () {
                focus.style("display", null);
            })
            .on("mouseout", function () {
                focus.style("display", "none");
            })
            .on("mousemove", d => {
                focus.attr("transform", "translate(" + xScale(d[properties.x]) + "," + yScale(d[properties.y]) + ")");
                focus.select("text").text(function () {
                    return d[properties.y];
                });
                focus.select(".x-hover-line").attr("y2", height - yScale(d[properties.y]));
                focus.select(".y-hover-line").attr("x2", width + width);
            });

        svg.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text(properties.x);

        // text label for the y axis
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(properties.y);

        return divID ? null : DOMelement;
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
        let customersTotal = Object.keys(trucks_data).map(week => {
            let totalCustomerCount = trucks_data[week].routes.reduce((acc, route) => {
                return acc + Object.keys(route['stops']).reduce((acc2, day) => {
                    return acc2 + route['stops'][day].length;
                }, 0);
            }, 0);
            return {
                week: week.replace(/(.csv)|(.xlsx)$/g, ''),
                customers: totalCustomerCount
            };
        });
        createLineChart(customersTotal, '.analysis_section .customer_consistency_line_chart', {x: 'week', y: 'customers'});
    }

    function calculateConsistencyCustomers() {
        let all = Object.keys(trucks_data).map(week => {
            return trucks_data[week].routes.reduce((result, truck) => {
                Object.keys(truck.stops).forEach(day => {
                    result = result.concat(truck.stops[day]);
                });
                return result;
            }, []);
        });
        all.sort((first, second) => second.length - first.length);
        let intersect = all.shift();
        for (let index = 0; index++; index < all.length) {
            intersect = intersect.filter(coord => all[index].find(check => check[0] === coord[0] && check[1] === coord[1]) !== undefined);
        }
        return {
            customers: intersect,
            count: intersect.length
        }
    }

    function insertInformation() {
        document.querySelector('div.analysis_section div.customer_consistency div.card-panel h5.number').innerText = calculateConsistencyCustomers().count;
        document.querySelector('div.analysis_section div.truck_count div.card-panel h5.number').innerText = truck_analysis_data.length;
        document.querySelector('div.analysis_section div.weeks_count div.card-panel h5.number').innerText = Object.keys(trucks_data).length;
    }

    function getTruckAnalysisInfo(truckNumber) {
        return trucksAnalysisMap.hasOwnProperty(truckNumber) ? trucksAnalysisMap[truckNumber] : null;
    }

    function calculateDistance(week) {
        let totalDistance = 0;
        for (let index = 0; index < week.length - 1; index++) {
            let firstPoint = week[index],
                secondPoint = week[index + 1];
            totalDistance += utils.calculateLATLNGDistance(firstPoint[0], firstPoint[1], secondPoint[0], secondPoint[1]);
        }
        return totalDistance;
    }

    function createTruckAnalysisInfo(truckNumber) {
        let analysis = {};
        let truck = getVehicleFromAnalysis(truckNumber);

        analysis['truck_distance'] = (function () {
            let vehicle = getVehicleFromTrucksData(truckNumber);
            let allStops = Object.values(vehicle).reduce((acc, truck) => {
                acc.push(Object.values(truck.stops).flat());
                return acc;
            }, []);
            let distances = allStops.map(week => {
                return calculateDistance(week);
            });
            let totalDistance = distances.reduce((acc, distance) => acc + distance, 0);
            return `${Math.floor(totalDistance / Object.keys(trucks_data).length)} miles`;
        }());

        analysis['time_spent'] = (function () {
            let totalSeconds = Object.values(truck.seconds).reduce((acc, value) => acc + value, 0);
            totalSeconds /= Object.keys(trucks_data).length;
            return `${Math.floor(totalSeconds / 3600)} h ${Math.floor((totalSeconds % 3600) / 60)} m ${Math.floor((totalSeconds % 3600) % 60)} s`;
        }());

        analysis['truck_stops'] = (function () {
            let totalStops = Object.values(truck.stops).reduce((acc, week) => {
                let weekStops = Object.values(week).reduce((acc1, day) => acc1 + day);
                return acc + weekStops
            }, 0);
            return Math.floor(totalStops / Object.keys(trucks_data).length);
        }());

        analysis['cans_graph'] = (function () {
            let cansCount = Object.keys(truck.cans).map(week => {
                let weekCount = {};
                weekCount['week'] = week.replace(/(.csv)|(.xlsx)$/g, '');
                weekCount['cans'] = truck.cans[week];
                return weekCount;
            });
            return createBarGraph(cansCount, null, {x: 'week', y: 'cans'})
        }());

        analysis['stops_graph'] = (function () {
            let stopsCount = Object.keys(truck.stops).map(week => {
                let weekCount = {};
                weekCount['week'] = week.replace(/(.csv)|(.xlsx)$/g, '');
                weekCount['stops'] = Object.values(truck.stops[week]).reduce((acc, day) => {
                    return acc + day;
                }, 0);
                return weekCount;
            });
            return createBarGraph(stopsCount, null, {x:'week', y: 'stops'})
        }());

        analysis['hours_graph'] = (function () {
            let hoursCount = Object.keys(truck.seconds).map(week => {
                let weekCount = {};
                weekCount['week'] = week.replace(/(.csv)|(.xlsx)$/g, '');
                weekCount['hours'] = Math.floor(truck.seconds[week] / 3600);
                return weekCount;
            });
            return createBarGraph(hoursCount, null, {x: 'week', y: 'hours'})
        }());

        trucksAnalysisMap[truckNumber] = analysis;
        return getTruckAnalysisInfo(truckNumber);
    }

    function showTruckAnalysis(truckNumber) {
        document.querySelector('div.analysis_section div.truck_analysis div.interface').classList.remove('hide');
        document.querySelector('div.analysis_section div.truck_analysis h5.truck_number span').innerText = truckNumber;
        let truckInfo = getTruckAnalysisInfo(truckNumber);
        if (!truckInfo) truckInfo = createTruckAnalysisInfo(truckNumber);
        let DOMinterface = document.querySelector('div.analysis_section div.truck_analysis div.interface');

        DOMinterface.child = id => {
            let child = DOMinterface.querySelector(id);
            child.innerElement = element => {
                child.innerHTML = '';
                child.insertAdjacentElement('beforeend', element);
            };
            return child;
        };

        DOMinterface.child('div.truck_time h5.value').innerText = truckInfo.time_spent;
        DOMinterface.child('div.truck_distance h5.value').innerText = truckInfo.truck_distance;
        DOMinterface.child('div.truck_stops h5.value').innerText = truckInfo.truck_stops;
        DOMinterface.child('div.cans_graph').innerElement(truckInfo.cans_graph);
        DOMinterface.child('div.stops_graph').innerElement(truckInfo.stops_graph);
        DOMinterface.child('div.hours_graph').innerElement(truckInfo.hours_graph);
    }

    function activateTruckAnalysisSection() {
        let truckSelection = document.querySelector('div.truck_analysis select');
        truck_analysis_data.forEach(truck => {
            let DOMoption = document.createElement('option');
            DOMoption.setAttribute('value', truck.vehicle);
            DOMoption.innerText = truck.vehicle;
            truckSelection.insertAdjacentElement('beforeend', DOMoption);
        });
        $(document).ready(() => $(truckSelection).material_select());
        $(truckSelection).on('change', e => showTruckAnalysis(e.target.value));
        document.querySelector('div.analysis_section div.truck_analysis div.preloader').classList.add('hide');
        document.querySelector('div.analysis_section div.truck_analysis div.truck_selection').classList.remove('hide');
    }

    function getZoneAnalysisInfo(zoneName) {
        return densityAnalysisMap.hasOwnProperty(zoneName) ? densityAnalysisMap[zoneName] : null;
    }

    function getZoneFromDensityAnalysis(zoneName) {
        return density_analysis_data.find(zone => zone.name === zoneName);
    }

    function createZoneAnalysisInfo(zoneName) {
        let analysis = {};
        let zone = getZoneFromDensityAnalysis(zoneName);

        analysis['customers'] = zone.customers;

        analysis['pickups_line_chart'] = (function () {
            let pickupsCount = Object.keys(zone.pickups).map(week => {
                return {
                    week: week,
                    pickups: zone.pickups[week]
                };
            });
            return createLineChart(pickupsCount, null, {x: 'week', y:'pickups'})
        }());

        densityAnalysisMap[zoneName] = analysis;
        return getZoneAnalysisInfo(zoneName);
    }

    function showZonePickUps(zoneValue) {
        document.querySelector('div.analysis_section div.zone_performance div.interface').classList.remove('hide');
        document.querySelector('div.analysis_section div.zone_performance h5.zone_name span').innerText = zoneValue;
        let zoneName = zoneValue.replace(/\s+\(\w+\)$/g, '').trim();
        let zone = getZoneAnalysisInfo(zoneName);
        if (!zone) zone = createZoneAnalysisInfo(zoneName);
        let DOMinterface = document.querySelector('div.analysis_section div.zone_performance div.interface');

        DOMinterface.child = id => {
            let child = DOMinterface.querySelector(id);
            child.innerElement = element => {
                child.innerHTML = '';
                child.insertAdjacentElement('beforeend', element);
            };
            return child;
        };

        DOMinterface.child('div.customers h5.value').innerText = zone.customers;
        DOMinterface.child('div.pickups_line_chart').innerElement(zone.pickups_line_chart);
    }

    function activateZonePickUpsSection() {
        let zoneSelection = document.querySelector('div.zone_performance div.zone_selection select');
        density_analysis_data.forEach(zone => {
            let DOMoption = document.createElement('option');
            DOMoption.setAttribute('value', `${zone.name} (${zone.day})`);
            DOMoption.innerText = `${zone.name} (${zone.day})`;
            zoneSelection.insertAdjacentElement('beforeend', DOMoption);
        });
        $(document).ready(() => $(zoneSelection).material_select());
        $(zoneSelection).on('change', e => showZonePickUps(e.target.value));
        document.querySelector('div.analysis_section div.zone_performance div.preloader').classList.add('hide');
        document.querySelector('div.analysis_section div.zone_performance div.zone_selection').classList.remove('hide');
    }

    this.load = () => {
        return new Promise(resolve => {
            this.process(error => {
                if (error) return mapconsole.error(error);
                createGraphs();
                insertInformation();
                activateTruckAnalysisSection();
                activateZonePickUpsSection();
                resolve();
            })
        })
    }
}
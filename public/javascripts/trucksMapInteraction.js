let trucksMap;
let weeklyTrucksGeoJSON = {};
let currentTrucksMapLayer;
let currentTrucksMapLayerControl;

function createRoutesForWeek(week) {
    function generateColorPalette(colorGrades) {
        if (colorGrades.length === 0) {
            console.warn('ColorGrades is empty');
            return;
        }
        let colors = colorRange();
        let result = {};
        let rainbow = new Rainbow();
        rainbow.setNumberRange(0, colorGrades.length);
        rainbow.setSpectrum(colors.startColor, colors.endColor);
        for (let i = 1; i <= colorGrades.length; i++) {
            result[parseFloat(colorGrades[i - 1])] = `#${rainbow.colorAt(i)}`;
        }
        return result;
    }

    function addZValueToStops(stops) {
        let colorGrades = [];
        let updatedStops = stops.map((stop, index) => {
            let colorGrade;
            if (index % 2 === 0) {
                colorGrade = (1 / (index + 1)).toFixed(2);
                colorGrades.push(parseFloat(colorGrade));
            }
            else colorGrade = (1 / (index)).toFixed(2);
            stop.push(parseFloat(colorGrade));
            return stop;
        });
        return {stops: updatedStops, colorGrades: colorGrades}
    }

    function createLayerGroup(stops) {
        let markers = stops.map((point, index) => {
            return L.marker(point).bindPopup(`stop #${index}`);
        });
        return L.layerGroup(markers);
    }

    function getPolylinesForTrucks(day) {
        return week.activeDays[day].map(truckNumber => {
            let truck = week.routes.find(route => route.vehicle === truckNumber);
            if (!truck) {
                mapconsole.error(`TrucksMapInteraction::createRoutesForWeek: Truck ${truckNumber} not found in week.`)
            }
            let customers = createLayerGroup(truck.stops[day]);
            let z = addZValueToStops(truck.stops[day]);
            let palette = generateColorPalette(z.colorGrades);
            let hotline = L.hotline(z.stops, {palette: palette}).bindTooltip(truck.vehicle).bindPopup(truck.vehicle);
            // return L.layerGroup([customers, hotline]);
            return {customers: customers, route: hotline};
        });
    }

    let result = {};

    Object.keys(week.activeDays).forEach(day => {
        // let polylines = getPolylinesForTrucks(day);
        // result[day] = L.layerGroup(polylines);
        result[day] = getPolylinesForTrucks(day);
    });
    return result;
}

function addSelectionListenerToTrucksWeek(week, activeDays, allWeeksButton) {
    week.addEventListener('click', () => {
        allWeeksButton.forEach(otherWeek => {
            otherWeek.classList.remove('active');
        });
        week.classList.add('active');
        document.querySelector('div#trucks_map_controls button#week_selection').innerHTML = week.innerHTML;
        addDaysControls(week, activeDays);
    });
    document.querySelector('div#trucks_map_controls #week_selection').classList.remove('disabled');
}

function createMapRouteLegend() {
    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function () {
        let div = L.DomUtil.create('div', 'route info legend');
        div.setAttribute('style', 'background-color: #ccc');
        let header = `Routes Legend<br>`;
        let start = `Start: light Color <i style="background: #f7fcfd"></i><br>`;
        let end = `End: thick color <i style="background: #00441b"></i>`;
        div.innerHTML = header + start + end;
        return div;
    };

    legend.addTo(trucksMap);
}

function calculateCansCount(data) {
    let result = [];

    Object.keys(data).forEach(week => {
        data[week].routes.forEach(route => {
            if (!isNaN(route.vehicle)) {
                let truckIndex = result.findIndex(entry => {
                    return entry.vehicle === parseInt(route.vehicle);
                });
                if (truckIndex === -1) {
                    let newEntry = {'vehicle': parseInt(route.vehicle)};
                    newEntry[week] = parseInt(route.cans);
                    result.push(newEntry);
                } else {
                    result[truckIndex][week] = parseInt(route.cans);
                }
            }
        })
    });

    return result.map(entry => {
        let dataWeeks = Object.keys(data);
        let entryWeeks = Object.keys(entry).slice(1);
        let unavailableWeeks = dataWeeks.filter(week => !entryWeeks.includes(week))
            .concat(entryWeeks.filter(week => !dataWeeks.includes(week)));
        unavailableWeeks.forEach(week => {
            entry[week] = 0;
        });
        return entry;
    })
}

function createBarGraph(data, divID, options) {
    if (!options.hasOwnProperty('x') || !options.hasOwnProperty('y')) {
        console.warn('x or y identifiers not provided');
        return mapconsole.error('TrucksMapInteraction::createBarGraph: Rendering error: x or y identifier not provided');
    }
    if (data.length === 0) {
        console.warn('Empty data');
        return mapconsole.error('TrucksMapInteraction::createBarGraph: Rendering error: Empty data');
    }

    let divWidth = document.querySelector(`div${divID}`).clientWidth;
    let weeks = Object.keys(data[0]).slice(1);

    let margin = {top: 20, right: 20, bottom: 50, left: 70},
        width = divWidth - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    let x0 = d3.scaleBand()
        .domain(data.map(d => d[options.x]))
        .rangeRound([margin.left, width - margin.right])
        // .rangeRound([0, width])
        .paddingInner(0.1);

    let x1 = d3.scaleBand()
        .domain(weeks)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(weeks, key => d[key]))]).nice()
        // .rangeRound([height - margin.bottom, margin.top]);
        .rangeRound([0, height]);

    //WARN: # of weeks could be more than COLORS available
    let colorRange = weeks.map(w => {
        let color = COLORS[COLORS.length - weeks.indexOf(w) - 1];
        if (color[0] !== '#') color = color.padStart(color.length + 1, '#');
        return color;
    });

    let color = d3.scaleOrdinal().range(colorRange);

    let xAxis = g => {
        return g.attr("transform", `translate(0,${height - margin.bottom})`)
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .call(g => g.select(".domain").remove());
    };

    let yAxis = g => {
        return g.attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(options.y));
    };

    let legend = svg => {
        const g = svg
            .attr("transform", `translate(${width},0)`)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("g")
            .data(color.domain().slice().reverse())
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        g.append("rect")
            .attr("x", -19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);

        g.append("text")
            .attr("x", -24)
            .attr("y", 9.5)
            .attr("dy", "0.35em")
            .text(d => d);
    };

    let svg = d3.select(`div${divID}`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("g")
        .data(data)
        .join("g")
            .attr("transform", d => `translate(${x0(d[options.x])},0)`)
        .selectAll("rect")
        .data(d => weeks.map(key => ({key, value: d[key]})))
        .join("rect")
            .attr("x", d => x1(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => y(0) - y(d.value))
            .attr("fill", d => color(d.key));
    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    svg.append("g")
        .call(legend);
}

function addDaysControls(week, activeDays) {
    let nav = document.querySelector('div#trucks_days_controls ul.nav.nav-pills');
    nav.innerHTML = '';

    activeDays.forEach(day => {
        let li = document.createElement('li');
        li.className = 'nav-item';
        let link = `<a class="nav-link" id="${day}" data-toggle="pill" href="" role="tab" aria-controls="pills-home" aria-selected="true">${day}</a>`;
        li.innerHTML = link;
        nav.insertAdjacentElement('beforeend', li);
        li.addEventListener('click', () => {
            if (currentTrucksMapLayer) {
                currentTrucksMapLayer.forEach(truck => {
                    trucksMap.removeLayer(truck.customers);
                    trucksMap.removeLayer(truck.route);
                });
                // trucksMap.removeLayer(currentTrucksMapLayer);
            }
            let weekName = week.innerHTML.replace( /(.csv)|(.xlsx)$/g, '');

            currentTrucksMapLayer = weeklyTrucksGeoJSON[weekName][day];
            trucksMap.addLayer(currentTrucksMapLayer[0].route);
            let overlayControls = {};
            currentTrucksMapLayer.forEach(truck => {
                let truckNumber = truck.route.getTooltip()['_content'];
                overlayControls[truckNumber] = truck.route;
                overlayControls[`${truckNumber} stops`] = truck.customers;
            });
            // currentTrucksMapLayer.eachLayer(layer => {
            //     if (layer.getTooltip())
            //         overlayControls[layer.getTooltip()['_content']] = layer;
            // });
            if (currentTrucksMapLayerControl) currentTrucksMapLayerControl.remove(trucksMap);
            currentTrucksMapLayerControl = L.control.layers(null, overlayControls);
            currentTrucksMapLayerControl.addTo(trucksMap);
        })
    });
}

function calculateHousesCount(data) {
    let result = [];

    for (let week in data) {
        data[week].routes.forEach(truck => {
            let totalHouses = Object.keys(truck.stops).reduce( (acc, onDay) => {
                return acc + truck.stops[onDay].length;
            }, 0);
            result.push({'vehicle': truck.vehicle, 'houses': totalHouses})
        })
    }
    return result;
}

function calculateHoursCount(data) {
    let result = [];

    for (let week in data) {
        data[week].routes.forEach(truck => {
            let hours = Math.floor(truck.seconds / 3600);
            result.push({'vehicle': truck.vehicle, 'hours': hours})
        })
    }
    return result;
}

(function loadMapLayout() {
    trucksMap = initMap({divID: 'trucks_map'});
    mapconsole.message('Getting Trucks Map Data ...');
    getCityLayout()
        .then(layout => {
            L.geoJSON(layout, {
                style: {fill: false}
            }).addTo(trucksMap);
            mapconsole.message('Trucks Map plotted!');
        })
        .catch(mapconsole.error);
    getTrucksGeoJSON()
        .then(data => {
            let allWeeksButton = [].slice.call(document.querySelectorAll('div#trucks_map_controls a.dropdown-item'));
            for (let week of allWeeksButton) {
                let weekName = week.innerHTML.replace( /(.csv)|(.xlsx)$/g, '');
                let activeDays = Object.keys(data[weekName].activeDays);
                weeklyTrucksGeoJSON[weekName] = createRoutesForWeek(data[weekName]);
                addSelectionListenerToTrucksWeek(week, activeDays, allWeeksButton);
            }
            createMapRouteLegend();
            return data;
        })
        .then(data => {
            let cansCount = calculateCansCount(data);
            createBarGraph(cansCount, '.cans_graph', {x: 'vehicle', y: 'cans'});
            // let housesCount = calculateHousesCount(data);
            // createBarGraph(housesCount, '.houses_graph', {x: 'vehicle', y: 'houses'});
            // let hoursCount = calculateHoursCount(data);
            // createBarGraph(hoursCount, '.hours_graph', {x: 'vehicle', y: 'hours'});
        })
        .catch(mapconsole.error)
        .catch(mapconsole.error)
}());

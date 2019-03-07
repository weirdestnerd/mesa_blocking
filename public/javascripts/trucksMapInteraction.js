let trucksMap;
let weeklyTrucksGeoJSON = {};
let currentTrucksMapLayer;
let currentTrucksMapLayerControl;

function createRoutesForWeek(week) {
    function generateColorPalette(colorGrades) {
        let chunk = hexColorDistance('f7fcfd', '00441b').map(distance => {
            return parseInt(distance / colorGrades.length);
        });
        let result = {};
        let lastColor = '#00441b';
        colorGrades.forEach(grade => {
            result[parseFloat(grade)] = lastColor;
            lastColor = nextHexColor(lastColor, chunk);
        });
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

    function getPolylinesForTrucks(day) {
        return week.activeDays[day].map(truckNumber => {
            let truck = week.routes.find(route => route.vehicle === truckNumber);
            if (!truck) {
                mapconsole.error(`TrucksMapInteraction::createRoutesForWeek: Truck ${truckNumber} not found in week.`)
            }
            let z = addZValueToStops(truck.stops[day]);
            let palette = generateColorPalette(z.colorGrades);
            return L.hotline(z.stops, {palette: palette}).bindTooltip(truck.vehicle);
        });
    }

    let result = {};

    Object.keys(week.activeDays).forEach(day => {
        let polylines = getPolylinesForTrucks(day);
        result[day] = L.layerGroup(polylines);
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
        let start = `Start <i style="background: #f7fcfd"></i><br>`;
        let end = `End <i style="background: #00441b"></i>`;
        div.innerHTML = header + start + end;
        return div;
    };

    legend.addTo(trucksMap);
}

function calculateCansCount(data) {
    let result = [];

    for (let week in data) {
        data[week].routes.forEach(truck => {
            result.push({'vehicle': truck.vehicle, 'cans': truck.cans})
        })
    }
    return result;
}

function createBarGraph(data, divID, options) {
    if (!options.hasOwnProperty('x') || !options.hasOwnProperty('y')) {
        console.error('x & y identifiers not provided');
        return;
    }
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 320 - margin.left - margin.right,
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
    x.domain(data.map(function(d) { return d[options.x]; }));
    y.domain([0, d3.max(data, function(d) { return d[options.y]; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", divID)
        .attr("x", function(d) { return x(d[options.x]); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d[options.y]); })
        .attr("height", function(d) { return height - y(d[options.y]); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

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
            if (currentTrucksMapLayer) trucksMap.removeLayer(currentTrucksMapLayer);
            let weekName = week.innerHTML.replace( /(.csv)|(.xlsx)$/g, '');
            currentTrucksMapLayer = weeklyTrucksGeoJSON[weekName][day];
            trucksMap.addLayer(currentTrucksMapLayer);
            let overlayControls = {};
            currentTrucksMapLayer.eachLayer(layer => {
                overlayControls[layer.getTooltip()['_content']] = layer;
            });
            if (currentTrucksMapLayerControl) trucksMap.removeLayer(currentTrucksMapLayerControl);
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
            result.push({'vehicle': truck.vehicle, 'hours': truck.hours})
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
            let housesCount = calculateHousesCount(data);
            createBarGraph(housesCount, '.houses_graph', {x: 'vehicle', y: 'houses'});
            let hoursCount = calculateHoursCount(data);
            createBarGraph(hoursCount, '.hours_graph', {x: 'vehicle', y: 'hours'});
        })
        .catch(mapconsole.error)
        .catch(mapconsole.error)
}());

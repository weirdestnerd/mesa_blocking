let trucksMap;
let weeklyTrucksGeoJSON = {};
let currentTrucksMapLayer;

function createRoutesForWeek(routes) {
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

    let polylines = routes.map(truck => {
        let colorGrades = [];
        let stops = truck.stops.map((stop, index) => {
            let colorGrade;
            if (index % 2 === 0) {
                colorGrade = (1 / (index + 1)).toFixed(2);
                colorGrades.push(parseFloat(colorGrade));
            }
            else colorGrade = (1 / (index)).toFixed(2);
            stop.push(parseFloat(colorGrade));
            return stop;
        });
        let palette = generateColorPalette(colorGrades);
        return L.hotline(stops, {palette: palette}).bindTooltip(truck.vehicle);
    });

    return L.layerGroup(polylines);
}

function addSelectionListenerToTrucksWeek(week, allWeeksButton) {
    week.addEventListener('click', () => {
        allWeeksButton.forEach(otherWeek => {
            otherWeek.classList.remove('active');
        });
        week.classList.add('active');
        document.querySelector('div#trucks_map_controls button#week_selection').innerHTML = week.innerHTML;
        if (currentTrucksMapLayer) trucksMap.removeLayer(currentTrucksMapLayer);
        let weekName = week.innerHTML.replace( /(.csv)|(.xlsx)$/g, '');
        currentTrucksMapLayer = weeklyTrucksGeoJSON[weekName];
        trucksMap.addLayer(currentTrucksMapLayer);
        let overlayControls = {};
        currentTrucksMapLayer.eachLayer(layer => {
            overlayControls[layer.getTooltip()['_content']] = layer;
        });
        L.control.layers(null, overlayControls).addTo(trucksMap);
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

function createCansGraph(data) {
    let cansCount = calculateCansCount(data);
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
    let svg = d3.select("div.cans_graph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data in the domains
    x.domain(cansCount.map(function(d) { return d.vehicle; }));
    y.domain([0, d3.max(cansCount, function(d) { return d.cans; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(cansCount)
        .enter().append("rect")
        .attr("class", "cans bar")
        .attr("x", function(d) { return x(d.vehicle); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.cans); })
        .attr("height", function(d) { return height - y(d.cans); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

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
                weeklyTrucksGeoJSON[weekName] = createRoutesForWeek(data[weekName].routes);
                addSelectionListenerToTrucksWeek(week, allWeeksButton);
            }
            createMapRouteLegend();
            return data;
        })
        .then(data => {
            createCansGraph(data);
        })
        .catch(mapconsole.error)
        .catch(mapconsole.error)
}());

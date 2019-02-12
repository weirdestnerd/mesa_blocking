let weeklyGeoJSON = {};
let currentMapLayer;

// source: https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89
function createGraph(zoneDensities) {
    let weekNames = Object.keys(zoneDensities);
    let size = weekNames.length;
    let maxDensity = Object.values(zoneDensities).reduce(
        (accumulator, density) => Math.max(accumulator, density)
    );

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let margin = {top: 10, right: 25, bottom: 25, left: 25};
    let width = 175, height = 125;

    // scales for the graph
    let xScale = d3.scaleLinear()
        .domain([0, size - 1]) // input
        //uncomment when adding axis
        // .range([margin.left, width + margin.right]); // output
        .range([0, width]);
    let yScale = d3.scaleLinear()
        .domain([0, maxDensity]) // input
        //uncomment when adding y-axis
        // .range([height + margin.top, 0]); // output
        .range([height, 0]);

    // define width and height of svg
    d3.select(svg).attr('width', width).attr('height', height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //  create data structure suitable for d3 in the form array of objects
    let dataset = weekNames.map(name => {
        return {'density': zoneDensities[name]}
    });

    //TODO: add ticks to y axis

    // let yAxis = d3.axisLeft(yScale)
    //     .tickValues(Object.values(zoneDensities));
    //
    // let xAxis = d3.axisBottom(xScale)
        // .tickValues(Object.keys(zoneDensities));

    // add y axis to svg
    // d3.select(svg).append("g")
    //     .attr("class", "y axis")
    //     .attr('transform', 'translate(' + margin.left + ', 5)')
    //     .call(yAxis); // Create an axis component with d3.axisLeft

    // add x axis to svg
    // d3.select(svg).append('g')
    //     .attr('class', 'x axis')
    //     .attr('transform', `translate(0, ${height - 10})`)
    //     .call(xAxis);

    // line generator for graph
    let area = d3.area()
        .x((d, i) => xScale(i))
        .y0(yScale(0))
        .y1(d => yScale(d.density))
        .curve(d3.curveBasis);

    // Append the path, bind the data, and call the area generator
    d3.select(svg).append('path')
        .datum(dataset) //binds data to the area
        .attr('fill', '#0570b0') // fills the area with color
        .attr('d', area); // calls area generator

    return svg;
}

function bindPopupTo(layer, feature, weekName) {
    let customerCount = feature.properties.customer;
    let weekCount = feature.properties[weekName];
    let density = feature.properties['%' + weekName.slice(0, 7)];
    feature.properties['popUp'] = `Customers: ${customerCount}, Pick Ups: ${weekCount}, Density Percentage: ${density}%`;
    layer.bindPopup(feature.properties.popUp);
}

function bindTooltipTo(layer, feature, allWeeks) {
    // get density for all weeks
    let allWeekNames = allWeeks.map(week => `%${week.innerHTML.slice(0, 7)}`);
    let zoneDensities = {};
    allWeekNames.forEach(week => {
        zoneDensities[week] = feature.properties[week]
    });

    function isInvalidDensity(density) {
        return density < 0;
    }

    // don't draw graph if all densities for layer are invalid
    if (!Object.values(zoneDensities).every(isInvalidDensity)){
        let densityGraph = createGraph(zoneDensities);
        layer.bindTooltip(densityGraph);
    }
}

getZoneLayout().then(geoJSON => {
    L.geoJSON(geoJSON, {
        style: {fill: false}
    }).addTo(mymap);
    mapconsole.message('Zone plotted!');
    return geoJSON;
}).then(mapData => {
    // handle week selection
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        //WARN: property headers are only 8 letters long due to dbf storage limit
        let weekName = week.innerHTML.slice(0, 8);
        let weekGeoJSON = L.geoJSON(mapData, {
            onEachFeature: function (feature, layer) {
                bindPopupTo(layer, feature, weekName);
                bindTooltipTo(layer, feature, allWeeks);
            }
        });
        weekGeoJSON.setStyle(function (feature) {
            let density = parseInt(feature.properties['%' + weekName.slice(0, 7)]);
            let style = {fill: true, fillOpacity: 0.8};
            switch (true) {
                case density < 0: style.fillOpacity = 0; break;
                case density === 0: style.fillColor = 'gray'; break;
                case density < 10:
                    style.fillColor =  '#ffffcc'; break;
                case (density >= 10) && (density < 20):
                    style.fillColor =  '#ffeda0'; break;
                case (density >= 20) && (density < 30):
                    style.fillColor =  '#fed976'; break;
                case (density >= 30) && (density < 40):
                    style.fillColor =  '#feb24c'; break;
                case (density >= 40) && (density < 50):
                    style.fillColor =  '#fd8d3c'; break;
                case (density >= 50) && (density < 60):
                    style.fillColor =  '#fc4e2a'; break;
                case (density >= 60) && (density < 70):
                    style.fillColor =  '#e31a1c'; break;
                case (density >= 70 && density < 80):
                    style.fillColor =  '#e31423'; break;
                case (density >= 80 && density < 90):
                    style.fillColor =  '#C6000C'; break;
                case (density >= 90 && density < 100):
                    style.fillColor =  '#bd0026'; break;
                case (density >= 100):
                    style.fillColor =  '#800026'; break;
            }
            return style;
        });
        weeklyGeoJSON[week.innerHTML] = weekGeoJSON;
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
            document.querySelector('button#week_selection').innerHTML = week.innerHTML;
            if (currentMapLayer) mymap.removeLayer(currentMapLayer);
            currentMapLayer = weeklyGeoJSON[week.innerHTML];
            mymap.addLayer(currentMapLayer);
        });
        document.querySelector('#week_selection').classList.remove('disabled');
    }
    return mapData
})
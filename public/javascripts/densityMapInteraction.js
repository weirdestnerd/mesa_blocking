let densityMap;
let weeklyDensityGeoJSON = {};
let currentDensityMapLayer;
let densityColorGrades = {
    0: 'gray',
    10: '#ffffcc',
    20: '#ffeda0',
    30: '#fed976',
    40: '#feb24c',
    50: '#fd8d3c',
    60: '#fc4e2a',
    70: '#e31a1c',
    80: '#e31423',
    90: '#C6000C',
    100: '#bd0026'
};

// source: https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89
function createGraph(zoneDensities) {
    let weekNames = Object.keys(zoneDensities);
    let densities = Object.values(zoneDensities);
    let maxDensity = densities.reduce(
        (accumulator, density) => Math.max(accumulator, density)
    );

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let margin = {top: 10, right: 10, bottom: 10, left: 25};
    let width = 200, height = 125;

    let xScale = d3.scalePoint()
        .domain(weekNames)
        .range([margin.left, width]);

    let yScale = d3.scaleLinear()
        .domain([0, maxDensity])
        .range([height, margin.top]);

    // define width and height of svg
    d3.select(svg)
        .attr('width', width + margin.right )
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    //  create data structure suitable for d3 in the form array of objects
    let dataset = weekNames.map(name => {
        return {'density': zoneDensities[name]}
    });

    let yAxis = d3.axisLeft(yScale)
        .tickValues(densities);

    let xAxis = d3.axisBottom(xScale);

    // add y axis to svg
    d3.select(svg).append("g")
        .attr("class", "y axis")
        .attr('transform', 'translate(' + margin.left + ', 0)')
        .call(yAxis); // Create an axis component with d3.axisLeft

    // add x axis to svg
    d3.select(svg).append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);

    // line generator for graph
    let area = d3.area()
        .x((d, i) => xScale(weekNames[i]))
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
    let allWeekNames = allWeeks.map(week => `%${week.slice(0, 7)}`);
    let zoneDensities = {};
    allWeekNames.forEach(week => {
        if (feature.properties[week] >= 0){
            let key = week.slice(1).replace(/\.([a-zA-z0-9])/, '');
            zoneDensities[key] = feature.properties[week]
        }
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

// get the color for the range that density falls into
function getColor(density) {
    let gradeKeys = Object.keys(densityColorGrades);
    // should be sorted already, but just in case the object is tampered re-sort
    gradeKeys.sort((first, second) => first - second);
    //  find the first key that's greater than the density
    let key = gradeKeys.find(gradeKey => {
        return gradeKey >= density
    });

    // key is undefined if density is greater than 100
    return key ? densityColorGrades[key] : '#800026';
}

function createMapDensityLegend(map) {
    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {

        let div = L.DomUtil.create('div', 'density info legend');
        let gradeKeys = Object.keys(densityColorGrades);
        // should be sorted already, but just in case the object is tampered re-sort
        gradeKeys.sort((first, second) => first - second);

        // loop through our density intervals and generate a label with a colored square for each interval
        gradeKeys.forEach((gradeKey, index) => {
            let key = parseInt(gradeKey);
            // square block that shows color
            let singleLegend = `<i style="background: ${densityColorGrades[gradeKey]}"></i>`;

            if (key === 0) singleLegend += `${key}<br>`;
            // if there's an upper bound for current grade key, i.e. key = 40 & key 50 exists
            else if (key > 0 && (index + 1 < gradeKeys.length))
                singleLegend += `${gradeKeys[index - 1]} - ${key}<br>`;
            else
                singleLegend += `${key}+`;
            div.innerHTML += singleLegend;
        });
        
        return div;
    };

    legend.addTo(map);
}

function createGeoJSONForWeek(week, allWeeks, data) {
    //WARN: property headers are only 8 letters long due to dbf storage limit
    let weekName = week.slice(0, 8);
    let weekGeoJSON = L.geoJSON(data, {
        onEachFeature: function (feature, layer) {
            bindPopupTo(layer, feature, weekName);
            bindTooltipTo(layer, feature, allWeeks);
        }
    });
    weekGeoJSON.setStyle(function (feature) {
        let density = parseInt(feature.properties['%' + weekName.slice(0, 7)]);
        let style = {fill: true, fillOpacity: 0.8};
        if (density < 0) style.fillOpacity = 0;
        else style.fillColor = getColor(density);
        return style;
    });
    weeklyDensityGeoJSON[week] = weekGeoJSON;
}

function addButtonToControl(div) {
    document.querySelector('div#density_control div.preloader').classList.add('hide');
    document.querySelector('div#density_control').insertAdjacentElement('beforeend', div);
}

function addListenerToButton(div, map, week) {
    div.addEventListener('click', e => {
        if (div.classList.contains('active')) {
            div.classList.remove('active');
            map.removeLayer(currentDensityMapLayer);
        } else {
            [].slice
                .call(document.querySelectorAll('div#density_control div.chip'))
                .forEach(weekButton => {
                    weekButton.classList.remove('active');
                });
            div.classList.add('active');
            if (currentDensityMapLayer) map.removeLayer(currentDensityMapLayer);
            currentDensityMapLayer = weeklyDensityGeoJSON[week];
            map.addLayer(currentDensityMapLayer);
        }
    });
    return div;
}

function createButtonForWeek(week, map) {
    let div = document.createElement('div');
    div.className = 'chip';
    div.innerText = week.replace(/(.csv)|(.xlsx)$/g, '');
    div = addListenerToButton(div, map, week);
    addButtonToControl(div);
}

function loadDensityControl(map) {
    mapconsole.message('Getting Data on Zone Density ...');
    getDensityGeoJSON()
        .then(densityData => {
            let allWeeks = [].slice.call(document.querySelectorAll('#helper.available_weeks pre')).map(weekDOM => {
                return weekDOM.innerText;
            });

            for (let week of allWeeks) {
                createGeoJSONForWeek(week, allWeeks, densityData);
                createButtonForWeek(week, map);
            }
            createMapDensityLegend(map);
            mapconsole.message('Density controls ready');
        })
        .catch(mapconsole.error);
}
function TruckRoutesControl() {
    let trucks_and_routes_data;
    let weeklyTrucksGeoJSON = {};
    let currentTrucksMapLayer;
    let currentTrucksMapLayerControl = L.control.layers(null, null, {collapsed: false, position: 'topleft'});

    function createRoutesForWeek(week, weekData) {
        function generateColorPalette(colorGrades) {
            if (colorGrades.length === 0) {
                console.warn('ColorGrades is empty');
                return;
            }
            let colors = utils.colorRange();
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
                return stop.concat(parseFloat(colorGrade));
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
            return weekData.activeDays[day].map(truckNumber => {
                let truck = weekData.routes.find(route => route.vehicle === truckNumber);
                if (!truck) {
                    mapconsole.error(`TrucksMapInteraction::createRoutesForWeek: Truck ${truckNumber} not found in week.`)
                }
                let customers = createLayerGroup(truck.stops[day]);
                let z = addZValueToStops(truck.stops[day]);
                let palette = generateColorPalette(z.colorGrades);
                let renderer = L.Hotline.renderer({pane: 'routes'});
                let hotline = new L.Hotline(z.stops, {palette: palette, renderer: renderer}).bindTooltip(truck.vehicle.toString()).bindPopup(truck.vehicle.toString());

                return {customers: customers, route: hotline};
            });
        }

        let result = {};

        Object.keys(weekData.activeDays).forEach(day => {
            result[day] = getPolylinesForTrucks(day);
        });
        weeklyTrucksGeoJSON[week.replace(/(.csv)|(.xlsx)$/g, '')] = result;
    }

    /**
     * Create route legend and add to map
     * @param map
     */
    function createMapRouteLegend(map) {
        let legend = L.control({position: 'bottomright'});

        legend.onAdd = function () {
            let div = L.DomUtil.create('div', 'route info legend');
            // div.setAttribute('style', 'background-color: #ccc');
            let header = `Routes Legend<br>`;
            let start = `Start: light Color <i style="background: #f7fcfd"></i><br>`;
            let end = `End: thick color <i style="background: #00441b"></i>`;
            div.innerHTML = header + start + end;
            return div;
        };

        legend.addTo(map);
    }

    /**
     * Remove current trucks and routes layer on map
     * @param map
     */
    function removeCurrentLayerFromMap(map) {
        if (!currentTrucksMapLayer) return;
        currentTrucksMapLayer.forEach(truck => {
            map.removeLayer(truck.customers);
            currentTrucksMapLayerControl.removeLayer(truck.customers);
            map.removeLayer(truck.route);
            currentTrucksMapLayerControl.removeLayer(truck.route);
        });
        currentTrucksMapLayerControl.remove(map);
    }

    /**
     * Create button for specified week and add click listener
     * @param week
     * @param map
     */
    function createButtonForWeek(week, map) {
        let button = document.createElement('div');
        button.className = 'chip';
        button.innerText = week.replace(/(.csv)|(.xlsx)$/g, '');
        button.addEventListener('click', e => {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                [].slice
                    .call(document.querySelectorAll('div#trucks_control div.days_control div.chip'))
                    .forEach(weekButton => {
                        weekButton.classList.remove('active');
                    });
                removeCurrentLayerFromMap(map)
            } else {
                [].slice
                    .call(document.querySelectorAll('div#trucks_control div.chip'))
                    .forEach(weekButton => {
                        weekButton.classList.remove('active');
                    });
                button.classList.add('active');
                removeCurrentLayerFromMap(map)
            }
        });
        addElementToControl(button);
    }

    /**
     * Get the week that selected
     * @returns {*}
     */
    function getSelectedWeek() {
        let selected = document.querySelector('div#trucks_control div.chip.active');
        return selected ? selected.innerText : undefined;
    }

    /**
     * Add layers and control of specified week to the map.
     * @param week
     * @param day
     * @param map
     */
    function addNewLayerToMap(week, day, map) {
        currentTrucksMapLayer = weeklyTrucksGeoJSON[week][day];
        map.addLayer(currentTrucksMapLayer[0].route);
        currentTrucksMapLayer.forEach(truck => {
            let truckNumber = truck.route.getTooltip()['_content'];
            currentTrucksMapLayerControl.addOverlay(truck.route, truckNumber);
            currentTrucksMapLayerControl.addOverlay(truck.customers, `${truckNumber} stops`);
        });
        currentTrucksMapLayerControl.addTo(map);
    }

    /**
     * Add interaction listener to button. Toggle button active on click.
     * @param button
     * @param day
     * @param map
     * @returns {*}
     */
    function addListenerToDayButton(button, day, map) {
        button.addEventListener('click', e => {
            let week = getSelectedWeek();
            if (!week) return mapconsole.error('Select Week First');
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                removeCurrentLayerFromMap(map);
            } else {
                [].slice
                    .call(document.querySelectorAll('div#trucks_control div.days_control div.chip'))
                    .forEach(weekButton => {
                        weekButton.classList.remove('active');
                    });
                button.classList.add('active');
                if (currentTrucksMapLayer) removeCurrentLayerFromMap(map);
                addNewLayerToMap(week, day, map);
            }
        });
        return button;
    }

    /**
     * Create button for days the waste management operates regardless of the available in the data
     * @param map
     */
    function createButtonsForActiveDays(map) {
        let days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let container = document.createElement('div');
        container.className = 'days_control';
        container.setAttribute('style', 'overflow-x: scroll');
        days.forEach(day => {
            let div = document.createElement('div');
            div.className = 'chip';
            div.setAttribute('style', 'display: inline; padding: 7px 12px');
            div.innerText = day;
            div = addListenerToDayButton(div, day, map);
            container.insertAdjacentElement('beforeend', div);
        });

        addElementToControl(container);
    }

    /**
     * Add element to density control
     * @param element
     */
    function addElementToControl(element) {
        document.querySelector('div#trucks_control div.preloader').classList.add('hide');
        document.querySelector('div#trucks_control').insertAdjacentElement('beforeend', element);
    }

    function setData(data) {
        trucks_and_routes_data = data
    }

    this.getData = () => {
        return trucks_and_routes_data;
    };

    this.load = map => {
        mapconsole.message('Getting Data on Truck Routes...');
        utils.getData('trucks_and_routes')
            .then(data => {
                setData(data);
                document.dispatchEvent(dataOnTrucksReady);
                return data
            })
            .then(data => {
                let allWeeks = [].slice.call(document.querySelectorAll('#helper.available_weeks pre')).map(weekDOM => {
                    return weekDOM.innerText
                });

                map.createPane('routes');
                map.getPane('routes').style.zIndex = 399;
                for (let week of allWeeks) {
                    createRoutesForWeek(week, data[week]);
                    createButtonForWeek(week, map);
                }

                createButtonsForActiveDays(map);
                createMapRouteLegend(map);

                mapconsole.message('Truck routes controls ready');
            })
            .catch(mapconsole.error)
    }
}
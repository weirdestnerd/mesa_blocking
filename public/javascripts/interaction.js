let mapGeoJSON;

(function handleWeekSelection() {
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        //FIXME: use full name after fixing writing headers for properties in preprocess
        let weekName = week.innerHTML.slice(0, 8);
        getZoneLayout().then(geoJSON => {
            mapGeoJSON = L.geoJSON(geoJSON, {
                //calculate density on layer creation
                onEachFeature: function (feature) {
                    let customerCount = feature.properties.customer;
                    let weekCount = feature.properties[weekName];
                    let density = (customerCount / weekCount).toFixed(2);
                    feature.properties.densityPerWeek = {};
                    feature.properties.densityPerWeek[weekName] = density;
                },
                style: {color: '#bd0026'}
            }).addTo(mymap);
            mapconsole.message('Zone plotted!')
            document.querySelector('#week_selection').classList.remove('disabled');
        });
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
            document.querySelector('#week_selection').innerHTML = week.innerHTML;
            mapGeoJSON.setStyle(function (feature) {
                if (feature.properties[weekName] === 0 || feature.properties[weekName] === null || feature.properties[weekName] === undefined) return {color: 'gray'};
                let density = feature.properties.densityPerWeek[weekName];
                switch (true) {
                    case density < 1: return {color: 'ffffcc'};
                    case (density >= 1) && (density < 2): return {color: 'ffeda0'}
                    case (density >= 2) && (density < 3): return {color: 'fed976'}
                    case (density >= 3) && (density < 4): return {color: 'feb24c'}
                    case (density >= 4) && (density < 5): return {color: 'fd8d3c'}
                    case (density >= 5) && (density < 6): return {color: 'fc4e2a'}
                    case (density >= 6) && (density < 7): return {color: 'e31a1c'}
                }
            })
        })
    }
}());
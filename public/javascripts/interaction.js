let mapData;
let mapGeoJSON;
let defaultMapGeoJSON;

getInitialZoneLayout().then(layout => {
    mapData = layout;
    defaultMapGeoJSON = L.geoJSON();
    defaultMapGeoJSON.addData(layout);
    defaultMapGeoJSON.addTo(mymap);
    mapconsole.message('Zone Layout plotted.');
});

(function handleWeekSelection() {
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
            document.querySelector('#week_selection').innerHTML = week.innerHTML;
            getPreprocessedLayout().then(layout => {
                mapconsole.message('Preprocessing done!');
                mapData = layout;
                mapGeoJSON = L.geoJSON(mapData, {
                    //calculate density on layer creation
                    onEachFeature: function (feature) {
                        let customerCount = feature.properties.customerCount;
                        let weekCount = feature.properties.weeks[week.innerHTML].count;
                        let density = (customerCount / weekCount).toFixed(2);
                        feature.properties.weeks[week.innerHTML].density = density;
                    }
                }).addTo(mymap);
                mapGeoJSON.setStyle(function (feature) {
                    if (feature.properties.weeks[week.innerHTML].count === 0) return {color: 'gray'}
                    let density = feature.properties.weeks[week.innerHTML].density;
                    switch (true) {
                        case density < 10: return {color: 'ffffcc'};
                        case (density >= 10) && (density < 50): return {color: 'ffeda0'}
                        case (density >= 50) && (density < 100): return {color: 'fed976'}
                        case (density >= 100) && (density < 150): return {color: 'feb24c'}
                        case (density >= 150) && (density < 200): return {color: 'fd8d3c'}
                        case (density >= 200) && (density < 250): return {color: 'fc4e2a'}
                        case (density >= 250) && (density < 300): return {color: 'e31a1c'}
                    }
                })
            });
        })
    }
}());
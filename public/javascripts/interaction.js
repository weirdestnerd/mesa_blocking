let weeklyGeoJSON = {};
let currentMapLayer;

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
            //calculate density on layer creation
            onEachFeature: function (feature, layer) {
                let customerCount = feature.properties.customer;
                let weekCount = feature.properties[weekName];
                let density;
                //if there are customers and there are pick ups
                if (customerCount && customerCount !== 0 && weekCount && weekCount !== 0) {
                    density = ((weekCount / customerCount) * 100).toFixed(2);
                }
                //  if there are customers and no pick ups
                else if (customerCount && customerCount !== 0 && (!weekCount || weekCount === 0)) {
                    density = 0;
                }
                // if there are no customers and either there are pick ups or not
                else {
                    density = -1;
                }
                feature.properties[weekName + 'Density'] = density;
                feature.properties['popUp'] = `Customers: ${customerCount}, Pick Ups: ${weekCount}, Density Percentage: ${density}%`;
                layer.bindPopup(feature.properties.popUp);
            }
        });
        weekGeoJSON.setStyle(function (feature) {
            let density = parseInt(feature.properties[weekName + 'Density']);
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
}).then(() => {
//    TODO: create d3 graph of trend, bind graph to tooltip for each week geoJSON
//    weeklyGeoJSON['weekName'].bindTooltip(graph)
});
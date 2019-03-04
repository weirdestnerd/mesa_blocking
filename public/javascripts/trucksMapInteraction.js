(function loadMapLayout() {
    trucksMap = initMap({divID: 'trucks_map'});
    mapconsole.message('Getting Trucks Map Data ...');
    getCityLayout()
        .then(layout => {
            L.geoJSON(layout, {
                style: {fill: false}
            }).addTo(trucksMap);
            mapconsole.message('Trucks Map plotted!');
        });
    getTrucksGeoJSON()
        .then(data => {
        //    TODO: convert json to geoJSON format => {type: 'feature', properties: {}}
            console.log(data);
        })
        .catch(mapconsole.error)
}());

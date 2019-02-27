(function loadMapLayout() {
    densityMap = initMap({divID: 'trucks_map'});
    mapconsole.message('Getting Trucks Map Data ...');
    getTrucksGeoJSON()
        .then(data => {
        //    TODO: convert json to geoJSON format => {type: 'feature', properties: {}}
        })
        .catch(mapconsole.error)
}());

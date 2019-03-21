/**
    Create a single instance of leaflet map and attaches the map to a div#map element.
    @param {object} options:
        @property {string} divID: ID of div to attach map to
 */
function initMap(options) {
    let map;
    if (options.divID) map = L.map(options.divID).fitWorld();
    else return mapconsole.error('Map div is not provided.');

    let tileUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw';
    let tileLayerOptions = {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw'
    };

    L.tileLayer(tileUrl, tileLayerOptions).addTo(map);

    //  restrict zoom out to city level
    map.setMinZoom(11);

    //  restrict draggable map to city bounds
    let MesaCityNECorner = L.latLng(33.703076, -111.328150);
    let MesaCitySWCorner = L.latLng(33.239434, -112.091777);
    let bounds = L.latLngBounds(MesaCityNECorner, MesaCitySWCorner);
    map.setMaxBounds(bounds);

// add mesa city zone layout
    getCityLayout().then(layout => {
        L.geoJSON(layout, {style: {fill: false}}).addTo(map);
    });

    return map;
}
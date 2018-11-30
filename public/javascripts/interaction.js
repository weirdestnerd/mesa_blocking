//handle user interactions with map
let polyline;

var geojsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "Coors Field", // region in each section e.g. SW of section 4 ...
        "density": "", // density of picked ups
        "popupContent": "This is where the Rockies play!" // no of blocks and pickup per block per selected week
    },
    "geometry": {
        "type": "Point", //polgon
        "coordinates": [-104.99404, 39.75621] // all four corners
    }
};
// L.geoJSON(states, {
//     style: function(feature) {
//         switch (feature.properties.density) {
//             case 'Republican': return {color: "#ff0000"};
//             case 'Democrat':   return {color: "#0000ff"};
//             case 'Democrat':   return {color: "#0000ff"};
//             case 'Democrat':   return {color: "#0000ff"};
//         }
//     }
// }).addTo(map);

//on zoom in, hide heatmap, show grid
function showGrid() {
    if (polyline) return polyline.addTo(mymap);
    let grids = getGrids();
    polyline = L.polyline(grids, {color: 'red'}).addTo(mymap);
    // mymap.fitBounds(polyline.getBounds());
}

//on zoom out, show heatmap, hide grid
function showHeatMap() {
    if (polyline) polyline.removeFrom(mymap);
//    show geojson based on selected week
//    TODO: get geojson of selected week
}

mymap.on('zoom', zoomEvent => {
    mymap.getZoom() >= 15 ? showGrid() : showHeatMap();
});


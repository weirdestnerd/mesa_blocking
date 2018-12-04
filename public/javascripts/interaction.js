//handle user interactions with map
let gridline;
let heatmap;

//on zoom in, hide heatmap, show grid
function showGrid() {
    if (heatmap) heatmap.removeFrom(mymap);
    if (gridline) return gridline.addTo(mymap);
    let grids = getGrids();
    gridline = L.polyline(grids, {color: 'red'}).addTo(mymap);
    // mymap.fitBounds(gridline.getBounds());
}

//on zoom out, show heatmap, hide grid
function showHeatMap() {
    if (gridline) gridline.removeFrom(mymap);
//    TODO: create heatmaps using polygons for each region in each section
//    get density and polygon for selected week from socketIO
}

mymap.on('zoom', zoomEvent => {
    mymap.getZoom() >= 15 ? showGrid() : showHeatMap();
});


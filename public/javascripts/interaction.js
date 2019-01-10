//handle user interactions with map
let gridline;
let heatmap;
let previousSelectedWeekLayer;

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
    if (heatmap) heatmap.addTo(mymap);
    // getCustomersForSelectedWeek.then(customers => {
    //    calculate density and set heatmap, then addTo map
    // })
}

(function handleWeekSelection() {
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
            if (!allCustomers) {
                getCustomers()
            }
            getCustomersForSelectedWeek().then(customers => {
                if (previousSelectedWeekLayer) {
                    mapControl.removeLayer(previousSelectedWeekLayer);
                    previousSelectedWeekLayer.removeFrom(mymap);
                }
                mymap.addLayer(customers.layer);
                mapControl.addOverlay(customers.layer, 'selected week');
                previousSelectedWeekLayer = customers.layer;

                // socket.emit('calculate density', customers[1].data, data => {
                //    TODO: set heatmap to density
                // })
            });
        })
    }
}());

mymap.on('zoom', zoomEvent => {
    mymap.getZoom() >= 15 ? showGrid() : showHeatMap();
});


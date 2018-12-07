//handle user interactions with map
let gridline;
let heatmap;
let previousSelectedWeekLayer;

function createHeatmap(customers) {
    socket.emit('calculate density', customers.data, result => {
        if (heatmap) heatmap.removeFrom(mymap);
        heatmap = L.layerGroup();
        console.log(result);
        for (let section of result) {
            let polygon = L.polygon(section.latlngs);
            if (section.density === 0) {
                polygon.setStyle({color: "gray"})
            } else if (section.density > 0 && section.density < 20) {
                polygon.setStyle({color: "#99ff99", fillColor: "#99ff99"})
            }
            else {
                polygon.setStyle({color: "#00cc00", fillColor: "#00cc00"})
            }
            polygon.setStyle({fillOpacity: 0.35});
            heatmap.addLayer(polygon);
        }
        heatmap.addTo(mymap);
    })
}
//on zoom in, hide heatmap, show grid
function showGrid() {
    if (heatmap) heatmap.removeFrom(mymap);
    if (gridline) return gridline.addTo(mymap);
    let grids = getGrids();
    gridline = L.polyline(grids, {color: 'red'}).addTo(mymap);
}

//on zoom out, show heatmap, hide grid
function showHeatMap() {
    if (gridline) gridline.removeFrom(mymap);
    if (heatmap) return heatmap.addTo(mymap);
    getCustomersForSelectedWeek().then(customers => {
        createHeatmap(customers)
    })
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
                createHeatmap(customers);
            });
        })
    }
}());

mymap.on('zoom', zoomEvent => {
    mymap.getZoom() >= 15 ? showGrid() : showHeatMap();
});


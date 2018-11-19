let socket = io();

socket.emit('get grid', (grids) => {
    var polyline = L.polyline(grids, {color: 'red'}).addTo(mymap);
    // zoom the map to the polyline
    mymap.fitBounds(polyline.getBounds());
});

let socket = io();

socket.emit('get grid', (grids) => {
    var polyline = L.polyline(grids, {color: 'red'}).addTo(mymap);
    // zoom the map to the polyline
    mymap.fitBounds(polyline.getBounds());
});

socket.emit('get data', (data) => {
    if (!data) {
        alert("Internal Error: check console log");
        return;
    }
    for (customer of data) {
        L.marker([customer.LATITUDE, customer.LONGITUDE]).addTo(mymap);
    }
});

let socket = io();
let allCustomers;
let activeCustomers;
let overlapMaps = {};

let customerIcon = L.icon({
    iconUrl: 'images/baseline_place_black_18dp.png',
    iconSize: [38, 44],
    iconAnchor: [18,41]
});

socket.emit('get grid', (grids) => {
    var polyline = L.polyline(grids, {color: 'red'}).addTo(mymap);
    mymap.fitBounds(polyline.getBounds());
});

let getCustomers = new Promise(resolve => {
    if (allCustomers) resolve(allCustomers);
    socket.emit('get all customers', (data) => {
        if (!data) {
            alert("Internal Error: check console log");
            return;
        }
        allCustomers = L.layerGroup();
        for (let customer of data) {
            allCustomers.addLayer(L.marker([customer.LATITUDE, customer.LONGITUDE], {icon: customerIcon}));
        }
        mymap.addLayer(allCustomers);
        resolve(allCustomers);
    });
});

let getActiveCustomers = new Promise(resolve => {
    if (activeCustomers) resolve(activeCustomers);
    socket.emit('get active customers', (data) => {
        if (!data) {
            alert("Internal Error: check console log");
            return;
        }
        activeCustomers = L.layerGroup();
        for (let customer of data) {
            activeCustomers.addLayer(L.marker([customer.LATITUDE, customer.LONGITUDE]));
        }
        resolve(activeCustomers);
    });
});

Promise.all([getCustomers, getActiveCustomers]).then(values => {
    overlapMaps['customers'] = values[0];
    overlapMaps['active'] = values[1];
    L.control.layers(null, overlapMaps).addTo(mymap);
});

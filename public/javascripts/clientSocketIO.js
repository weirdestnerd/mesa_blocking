let socket = io();
let allCustomers;
let activeCustomers;
let overlapMaps = {};
let mapGrids;
// {week_name: "", geojson: ""}
let recentlyLoadedWeeks = [];

let customerIcon = L.icon({
    iconUrl: 'images/baseline_place_black_18dp.png',
    iconSize: [38, 44],
    iconAnchor: [18,41]
});

let getGrids = () => {
    if (mapGrids) return mapGrids;
    socket.emit('get grids', (grids) => {
        mapGrids = grids;
        return mapGrids
    });
};

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

//TODO: get for specified week
// let getCustomersForSelectedWeek = new Promise(resolve => {
//     let selectedWeek = getSelectedWeek();
//     if (isRecentlyLoaded(selectedWeek)) resolve(getWeekFromRecentlyLoaded(selectedWeek));
//     socket.emit('load week', selectedWeek, (data) => {
//         //TODO: convert data to geojson
//         addToRecentlyLoaded(data);
//         resolve(data);
//     })
// });

//TODO: discard when above is done
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

getCustomers.then(customers => {
    overlapMaps['customers'] = customers;
    L.control.layers(null, overlapMaps).addTo(mymap);
});

const socket = io();
let allCustomers;
let mapControl;
let mapGrids;
// {name: "", data: "", layer: L.layerGroup}
let recentlyLoadedWeeksQueue = [];

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

let getCustomers = () => {
    return new Promise(resolve => {
        if (allCustomers) resolve(allCustomers);
        socket.emit('get all customers', (data) => {
            if (!data) {
                mapconsole("Internal Error: check console log");
                return;
            }
            let mapLayer = L.layerGroup();
            //WARN: reducing data size
            data = data.slice(0, 100);
            for (let customer of data) {
                if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                    mapLayer.addLayer(L.marker([customer.LATITUDE, customer.LONGITUDE], {icon: customerIcon}));
                }
            }
            mymap.addLayer(mapLayer);
            allCustomers = {
                name: "All Customers"
            };
            allCustomers.data = data;
            allCustomers.layer = mapLayer;
            mapControl = L.control.layers();
            mapControl.addBaseLayer(mapLayer, 'customers');
            mapControl.addTo(mymap);
            resolve(allCustomers);
        });
    });
};

function getWeekFromRecentlyLoaded(selectedWeek) {
    return recentlyLoadedWeeksQueue.find(week => {
        return week.name === selectedWeek;
    });
}

function addWeekToRecentlyLoaded(week) {
    if (recentlyLoadedWeeksQueue.length < 3) {
        return recentlyLoadedWeeksQueue.push(week);
    }
    recentlyLoadedWeeksQueue.shift();
    return recentlyLoadedWeeksQueue.push(week);
}

let getCustomersForSelectedWeek = () => {
    return new Promise(resolve => {
        let selectedWeek = getSelectedWeek();
        let week = getWeekFromRecentlyLoaded(selectedWeek);
        if (week !== undefined) resolve(week);
        socket.emit('load week', selectedWeek, (data) => {
            if (!data) {
                mapconsole("Internal Error: check console log");
                return;
            }
            //WARN: reducing data size
            data = data.slice(0, 100);
            let mapLayer = L.layerGroup();
            for (let customer of data) {
                if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                    mapLayer.addLayer(L.marker([customer.LATITUDE, customer.LONGITUDE]));
                }
            }
            week = {
                name: selectedWeek,
                data: data,
                layer: mapLayer
            };
            addWeekToRecentlyLoaded(week);
            resolve(week);
        })
    });
};

getCustomers();

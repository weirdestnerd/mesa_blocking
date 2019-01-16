const socket = io();
let mapGrids;
let zoneLayout;

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

let getInitialZoneLayout = () => {
    return new Promise((resolve, reject) => {
        mapconsole.message('Getting Zone Layout ...');
        if (zoneLayout) resolve(zoneLayout);
        socket.emit('get zone layout', layout => {
            if (!layout) {
                mapconsole.error('Internal Server Error.');
                reject();
            }
            zoneLayout = layout;
            resolve(zoneLayout);
        })
    });
};
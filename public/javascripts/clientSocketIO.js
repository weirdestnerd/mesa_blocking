const socket = io();
let densityMapData;
let trucksMapData

let getDensityGeoJSON = () => {
    return new Promise((resolve, reject) => {
        if (densityMapData) resolve(densityMapData);
        socket.emit('get density zone layout', layout => {
            if (!layout) {
                reject('Internal Server Error.');
            }
            densityMapData = layout;
            resolve(densityMapData);
        })
    });
};

let getTrucksGeoJSON = () => {
    return new Promise((resolve, reject) => {
        if (trucksMapData) resolve(trucksMapData);
        socket.emit('get trucks data', data => {
            if (!data) {
                reject('Internal Server Error.');
            }
            trucksMapData = data;
            resolve(trucksMapData);
        })
    });
};
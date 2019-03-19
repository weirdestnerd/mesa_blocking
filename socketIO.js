const dataProvider = require('./data/provider');

let connection = io => {
    io.on('connection', socket => {
        socket.on('get city layout', fn => {
            dataProvider.getCityGeoJSON(false).then(fn).catch(console.error);
        });
        socket.on('get density zone layout', fn => {
            dataProvider.getCityGeoJSON(true).then(fn).catch(console.error);
        });
        socket.on('get trucks data', fn => {
            dataProvider.getJSONFromFile('TrucksData.json').then(fn).catch(console.error);
        })
    });
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
};
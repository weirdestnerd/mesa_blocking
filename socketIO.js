const dataProvider = require('./data/provider');
const preprocess = require('./preprocess/main');

let connection = io => {
    io.on('connection', socket => {
        socket.on('get zone layout', fn => {
            dataProvider.getGeoJSONFromFile().then(fn).catch(console.error);
        });
        socket.on('get preprocess layout', fn => {
            preprocess.run().then(fn).catch(console.error);
        })
    });
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
};
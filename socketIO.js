const provider = require('./data/provider');

let connection = io => {
    io.on('connection', socket => {
        socket.on('get zone layout', fn => {
            provider.getGeoJSONFromFile().then(fn).catch(console.error);
        })
    });
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
};
const preprocess = require('./preprocess/main');

let connection = io => {
    io.on('connection', socket => {
        socket.on('get zone layout', fn => {
            preprocess.getLayout().then(fn).catch(console.error);
        })
    });
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
};
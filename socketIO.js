let connection = io => {
    io.on('connection', socket => {
        console.log("connected!!!");
    });
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
};
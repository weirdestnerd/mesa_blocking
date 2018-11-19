const GridBlock = require('./calculation/preprocess').MesaCityGridAsBlockArray;

let connection = io => {
    io.on('connection', socket => {
        console.log("connected!!!");
    });
};

let getGrid = io => {
    io.on('connection', socket => {
        socket.on('get grid', fn => {
            fn(GridBlock);
        })
    })
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
    getGrid(io);
};
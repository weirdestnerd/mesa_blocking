const GridBlock = require('./processing/preprocess').MesaCityGridAsBlockArray;

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

let getData = io => {
//    TODO: return data points to plot on the map
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
    getGrid(io);
};
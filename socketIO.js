const GridBlock = require('./processing/preprocess').MesaCityGridAsBlockArray;
const data = require('./data/provider');

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
    io.on('connection', socket => {
        socket.on('get data', fn => {
            //TODO: change file path and schema
            data.getFromFile('./data/test.csv', ['latitude', 'longitude'])
                .then(fn)
                .catch(error => {
                    console.error(error);
                    fn(null);
                })
        })
    })
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
    getGrid(io);
    getData(io);
};
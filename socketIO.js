const GridBlock = require('./processing/preprocess').MesaCityGridAsBlockArray;
const dataProvider = require('./data/provider');

let connection = io => {
    io.on('connection', socket => {
        console.log("connected!!!");
    });
};

let getGrid = io => {
    io.on('connection', socket => {
        socket.on('get grids', fn => {
            fn(GridBlock);
        })
    })
};

let getData = io => {
    io.on('connection', socket => {
        socket.on('get all customers', fn => {
            //TODO: change file path and schema
            dataProvider.getFromFile('./data/test.csv', ['latitude', 'longitude'])
                .then(fn)
                .catch(error => {
                    console.error(error);
                    fn(null);
                })
        });
        socket.on('get active customers', fn => {
            //TODO: change file path and schema
            dataProvider.getFromFile('./data/test1.csv', ['latitude', 'longitude'])
                .then(fn)
                .catch(error => {
                    console.error(error);
                    fn(null);
                })
        })
    //    TODO: socket.emit('get week') from calculation/density
    })
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
    getGrid(io);
    getData(io);
};
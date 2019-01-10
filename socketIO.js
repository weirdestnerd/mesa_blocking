const GridBlock = require('./processing/preprocess').MesaCityGridAsBlockArray;
const dataProvider = require('./data/provider');
const densityCalculator = require('./calculation/density');
const path = require('path');

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
            let dir = path.join(__dirname, './data/allcustomers.csv');
            dataProvider.getFromFile(dir, ['latitude', 'longitude'])
                .then(fn)
                .catch(error => {
                    console.error(error);
                    fn(null);
                })
        });
        socket.on('load week', (selectedWeek, fn) => {
            let dir = path.join(__dirname, './data/weeks/');
            dataProvider.getFromFile(dir + selectedWeek, ['latitude', 'longitude'])
                .then(fn)
                .catch(error => {
                    console.error(error);
                    fn(null);
                })
        });
        socket.on('calculate density', (data, fn) => {
            let mesaCity = densityCalculator.sectionDensity(data);
            let result = [];
            for (let section of Object.values(mesaCity.sections)) {
                result.push({
                    latlngs: section.toBlockArray(),
                    density: section.density()
                })
            }
            fn(result);
        })
    })
};

module.exports = (http) => {
    let io = require('socket.io')(http);
    connection(io);
    getGrid(io);
    getData(io);
};
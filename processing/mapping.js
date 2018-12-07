// map data to grid
const MesaCity = require('../MesaCity');
const dataProvider = require('../data/provider');
const Coord = require('../utils').Coord;

async function mapCustomersToGrids () {
    await dataProvider.getFromFile('./data/allcustomers.csv', ['latitude', 'longitude'])
        .then(data => {
            for (let customer of data) {
                if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                    let location = new Coord(customer.LATITUDE, customer.LONGITUDE);
                    //FIXME: returns undefined for valid location
                    let grid = MesaCity.findGrid(location);
                    if (grid) {
                        grid.customers++;
                    }
                }
            }
        })
        .catch(error => {
            console.error(error);
        });
}

module.exports = {
    customersToGrid: mapCustomersToGrids
};
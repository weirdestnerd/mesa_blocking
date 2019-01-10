// map data to grid
const MesaCity = require('../MesaCity');
const dataProvider = require('../data/provider');
const Coord = require('../utils').Coord;
const path = require('path');

async function mapCustomersToGrids () {
    let dir = path.join(__dirname, '../data/allcustomers.csv');
    await dataProvider.getFromFile(dir, ['latitude', 'longitude'])
        .then(data => {
            for (let customer of data) {
                if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                    let location = new Coord(customer.LATITUDE, customer.LONGITUDE);
                    let section = MesaCity.findSection(location);
                    let grid = MesaCity.findGrid(location);
                    if (grid) {
                        section.customerCount++;
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
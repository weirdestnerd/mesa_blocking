// count number of occurrences in each grid block

const Clone = require('../utils').CloneObject;
const MesaCity = require('../MesaCity');
const Coord = require('../utils').Coord;

function calculateSectionDensity(data) {
    MesaCity.resetGridPickups();
    for (let customer of data) {
        if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
            let location = new Coord(customer.LATITUDE, customer.LONGITUDE);
            let grid = MesaCity.findGrid(location);
            if (grid) {
                grid.pickups++;
            }
        }
    }

    return Clone(MesaCity);
}

module.exports = {
    sectionDensity: calculateSectionDensity
};
// count number of occurrences in each grid block

const dataProvider = require('../data/provider');
const Clone = require('utils').CloneObject;
const MesaCityGridAsGrid = require('../processing/preprocess').MesaCityAsJSON;
const Coord = require('../utils').Coord;

function calculateDensity(path) {
    let schema = ['latitude', 'longitude'];
    let CityGrid = Clone(MesaCityGridAsGrid);

    //    TODO:
    function findSection(location) {
        function locationIsAt(section) {
            let northEast = new Coord();
            let southEast = new Coord();
            let northWest = new Coord();
            let southWest = new Coord();
            //TODO: put all four corners as bounds instead of just diagonals so you don't have to figure out what corner is what
            if (section.bounds[0].lat < section.bounds[1].lat) {
                if (section.bounds[0].lng < section.bounds[1].lng) {
                    //    section.bounds[0] is bottom left
                } else {
                //    is bottom right
                }
            } else {
                if (section.bounds[0].lng < section.bounds[1].lng) {
                    //    section.bounds[0] is top left
                } else {
                    //    is top right
                }
            }
            function isBoundedByTopAndBottom() {
                return this.northEast.lat >= location.lat && this.southEast.lat <= location;
            }

            function isBoundedByLeftAndRight() {
                return this.northEast.lng >= location.lng && this.northWest.lng <= location.lng;
            }

            return isBoundedByTopAndBottom() && isBoundedByLeftAndRight();
        }

        if (locationIsAt(CityGrid.sectionOne)) {

        }
    }

    dataProvider.getFromFile(path, schema).then(data => {
        for (let location of data) {
            let sectionName = findSection(location);
            CityGrid[sectionName].active++;
            CityGrid[sectionName].density = CityGrid[sectionName].gridCount / CityGrid[sectionName].active++;
        }
    })
}
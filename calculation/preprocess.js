// split mesa city into grid cells
const MesaCity = require('../MesaCity');
const utils = require('../utils');
const Grid = utils.Grid;
const Coord = utils.Coord;

let MesaCityGrid = {
    sectionOne: [],
    sectionTwo: [],
    sectionThree: [],
    sectionFour: [],
};

function splitSections() {
    //TODO: calculate .1 mile to the right and down
    //    TODO: handle overflow to the right or down
    //    check if next Coords are within the section
    //    create new grid if right & down are within bound
    (function splitSectionOne() {
    //    start from top left
        let sectionOne = Object.assign({}, MesaCity.sections.sectionOne);
        let bound = utils.NextBlock(sectionOne.southWest, utils.Directions.SW);

        function isBounded(potentialGrid) {
            return bound.lat < potentialGrid.lat && bound.lng < potentialGrid.lng;
        }

        let currentRow = Object.assign({}, sectionOne.northEast);
        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, .1, utils.Directions.West);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                //TODO: create and validate grid
                currentColumn = utils.NextLng(currentColumn, .1, utils.Directions.West);
            }
            MesaCityGrid.sectionOne.push(rowGrids);
            currentRow = utils.NextLat(currentRow, .1, utils.Directions.South);
        }

    }());

    (function splitSectionTwo() {
    //    start from top left/right
    }());

    (function splitSectionThree() {
    //    start from bottom left
    }());

    (function splitSectionFour() {
    //  start from top left
    }());

}

const main = () => {
// split city into square sections
//    split each section into grid
    splitSections();
//    return grid
    return MesaCityGrid;
};
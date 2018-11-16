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
        let sectionOne = utils.CloneObject(MesaCity.sections.sectionOne);
    //    bottom left + .1 mile is the boundary
        let bound = utils.NextBlock(sectionOne.southWest, utils.Directions.SW);

        function isBounded(coord) {
            return bound.lat < coord.lat && bound.lng < coord.lng;
        }

        //    start from top left
        let currentRow = utils.CloneObject(sectionOne.northEast);

        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, .1, utils.Directions.West);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                let grid = new Grid();
                grid.topLeft = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.unshift(grid);
                currentColumn = utils.NextLng(currentColumn, .1, utils.Directions.West);
            }
            MesaCityGrid.sectionOne.push(rowGrids);
            currentRow = utils.NextLat(currentRow, .1, utils.Directions.South);
        }
        for (let row of MesaCityGrid.sectionOne) {
            console.log("new row -------------------------------------");
            for (let col of row) {
                console.log("new col");
                col.log();
            }
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
main();
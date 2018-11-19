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
    (function splitSectionOne() {
        let sectionOne = utils.CloneObject(MesaCity.sections.sectionOne);
    //    bottom left + .1 mile is the boundary
        let bound = utils.NextBlock(sectionOne.southWest, utils.Directions.SW);

        function isBounded(coord) {
            return bound.lat < coord.lat && bound.lng < coord.lng;
        }

        //    start from top right
        let currentRow = utils.CloneObject(sectionOne.northEast);

        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, utils.Directions.West);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                let grid = new Grid();
                grid.topLeft = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.unshift(grid);
                currentColumn = utils.NextLng(currentColumn, utils.Directions.West);
            }
            MesaCityGrid.sectionOne.push(rowGrids);
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

    (function splitSectionTwo() {
    //    start from top left/right
        let sectionTwo = utils.CloneObject(MesaCity.sections.sectionTwo);
        //    bottom left + .1 mile is the boundary
        let bound = utils.NextBlock(sectionTwo.southWest, utils.Directions.SW);

        function isBounded(coord) {
            return bound.lat < coord.lat && bound.lng < coord.lng;
        }

        //    start from top right
        let currentRow = utils.CloneObject(sectionTwo.northEast);

        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, utils.Directions.West);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                let grid = new Grid();
                grid.topLeft = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.unshift(grid);
                currentColumn = utils.NextLng(currentColumn, utils.Directions.West);
            }
            MesaCityGrid.sectionTwo.push(rowGrids);
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

    (function splitSectionThree() {
    //    start from bottom left
        let sectionThree = utils.CloneObject(MesaCity.sections.sectionThree);
        //    top right + .1 mile is the boundary
        let bound = utils.NextBlock(sectionThree.northEast, utils.Directions.NE);

        function isBounded(coord) {
            return bound.lat > coord.lat && bound.lng > coord.lng;
        }

        //    start from bottom left
        let currentRow = utils.CloneObject(sectionThree.southWest);

        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, utils.Directions.East);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                let grid = new Grid();
                grid.bottomRight = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.push(grid);
                currentColumn = utils.NextLng(currentColumn, utils.Directions.East);
            }
            MesaCityGrid.sectionThree.push(rowGrids);
            currentRow = utils.NextLat(currentRow, utils.Directions.North);
        }
    }());

    (function splitSectionFour() {
    //  start from top left
        let sectionFour = utils.CloneObject(MesaCity.sections.sectionFour);
        //    bottom left + .1 mile is the boundary
        let bound = utils.NextBlock(sectionFour.southEast, utils.Directions.SE);

        function isBounded(coord) {
            return bound.lat < coord.lat && bound.lng > coord.lng;
        }

        //    start from top left
        let currentRow = utils.CloneObject(sectionFour.northWest);

        while (isBounded(currentRow)) {
            let currentColumn = utils.NextLng(currentRow, utils.Directions.East);
            let rowGrids = [];
            while (isBounded(currentColumn)) {
                let grid = new Grid();
                grid.topRight = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.push(grid);
                currentColumn = utils.NextLng(currentColumn, utils.Directions.East);
            }
            MesaCityGrid.sectionFour.push(rowGrids);
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

}


// split city into square sections
//    split each section into grid
splitSections();

console.log(MesaCityGrid.sectionOne.length);
console.log(MesaCityGrid.sectionTwo.length);
console.log(MesaCityGrid.sectionThree.length);
console.log(MesaCityGrid.sectionFour.length);

function gridAsBlockArray() {
    // MesaCityGrid is empty
    if (Object.values(MesaCityGrid).every(section => {return section.length === 0}))
        splitSections();

    let result = [];
    for (let section of Object.values(MesaCityGrid)) {
        for (let row of section) {
            for (let grid of row) {
                result.push(grid.toBlockArray());
            }
        }
    }
    return result;
}

//    return grid
module.exports = {
    MesaCityGrid: MesaCityGrid,
    MesaCityGridAsBlockArray: gridAsBlockArray()
};
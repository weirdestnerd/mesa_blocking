// split mesa city into grid cells
const MesaCity = require('../MesaCity');
const mapping = require('./mapping');
const utils = require('../utils');
const Grid = utils.Grid;
const Coord = utils.Coord;
const Region = utils.Region;

let MesaCityGrid = {
    sectionOne: [],
    sectionTwo: [],
    sectionThree: [],
    sectionFour: [],
};

let MesaCityGridAsBlockArray = [];

(function splitSections() {
    (function splitSectionOne() {
        let sectionOne = MesaCity.sections.sectionOne;
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
                let grid = new Grid("grid");
                grid.topLeft = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.unshift(grid);
                MesaCityGridAsBlockArray.push(grid.toBlockArray());
                currentColumn = utils.NextLng(currentColumn, utils.Directions.West);
            }

            let rowDiagonalBoundaries =  {
                northWest: new Coord(currentRow.lat, sectionOne.northWest.lng),
                northEast: currentRow,
                southWest: utils.NextLat(new Coord(currentRow.lat, sectionOne.northWest.lng), utils.Directions.South)
            };

            MesaCityGrid.sectionOne.push(rowGrids);
           sectionOne.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            sectionOne.gridCount += rowGrids.length;
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

    (function splitSectionTwo() {
    //    start from top left/right
        let sectionTwo = MesaCity.sections.sectionTwo;
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
                let grid = new Grid("grid");
                grid.topLeft = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.unshift(grid);
                MesaCityGridAsBlockArray.push(grid.toBlockArray());
                currentColumn = utils.NextLng(currentColumn, utils.Directions.West);
            }

            let rowDiagonalBoundaries =  {
                northWest: new Coord(currentRow.lat, sectionTwo.northWest.lng),
                northEast: currentRow,
                southWest: utils.NextLat(new Coord(currentRow.lat, sectionTwo.northWest.lng), utils.Directions.South)
            };

            MesaCityGrid.sectionTwo.push(rowGrids);
            sectionTwo.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            sectionTwo.gridCount += rowGrids.length;
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

    (function splitSectionThree() {
    //    start from bottom left
        let sectionThree = MesaCity.sections.sectionThree;
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
                let grid = new Grid("grid");
                grid.bottomRight = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.push(grid);
                MesaCityGridAsBlockArray.push(grid.toBlockArray());
                currentColumn = utils.NextLng(currentColumn, utils.Directions.East);
            }

            let rowDiagonalBoundaries =  {
                northWest: utils.NextLat(currentRow, utils.Directions.North),
                northEast: utils.NextLat(new Coord(currentRow.lat, sectionThree.northEast.lng), utils.Directions.North),
                southWest: currentRow
            };

            MesaCityGrid.sectionThree.push(rowGrids);
            sectionThree.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            sectionThree.gridCount += rowGrids.length;
            currentRow = utils.NextLat(currentRow, utils.Directions.North);
        }
    }());

    (function splitSectionFour() {
    //  start from top left
        let sectionFour = MesaCity.sections.sectionFour;
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
                let grid = new Grid("grid");
                grid.topRight = utils.CloneObject(currentColumn);
                grid.create();
                rowGrids.push(grid);
                MesaCityGridAsBlockArray.push(grid.toBlockArray());
                currentColumn = utils.NextLng(currentColumn, utils.Directions.East);
            }
            let rowDiagonalBoundaries = {
                northWest: utils.CloneObject(currentRow),
                northEast: new Coord(currentRow.lat, sectionFour.northEast.lng),
                southWest: utils.NextLat(currentRow, utils.Directions.South)
            };

            MesaCityGrid.sectionFour.push(rowGrids);
           sectionFour.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
           sectionFour.gridCount += rowGrids.length;
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

    // let location = new Coord(33.358000, -111.673278);
    // MesaCity.findGrid(location)
    //     .log();
    mapping.customersToGrid();
}());

//    return grid
module.exports = {
    MesaCityGrid: MesaCityGrid,
    MesaCityGridAsBlockArray: MesaCityGridAsBlockArray
};
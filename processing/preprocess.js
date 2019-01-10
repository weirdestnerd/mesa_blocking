// split mesa city into grid cells
const MesaCity = require('../MesaCity');
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
let MesaCityGridAsJSON = {
    sectionOne: {
        rows: [],
        members: 0,
        active: 0,
        gridCount: 0
    },
    sectionTwo: {
        rows: [],
        members: 0,
        active: 0,
        gridCount: 0
    },
    sectionThree: {
        rows: [],
        members: 0,
        active: 0,
        gridCount: 0
    },
    sectionFour: {
        rows: [],
        members: 0,
        active: 0,
        gridCount: 0
    },
};

(function splitSections() {
    (function splitSectionOne() {
        let sectionOne = utils.CloneObject(MesaCity.sections.sectionOne);
    //    bottom left + .1 mile is the boundary
        let bound = utils.NextBlock(sectionOne.southWest, utils.Directions.SW);

        function isBounded(coord) {
            return bound.lat < coord.lat && bound.lng < coord.lng;
        }

        MesaCityGridAsJSON.sectionOne["bounds"] = [sectionOne.southWest, sectionOne.northEast];

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
            //  top-right of row
            let rowDiagonalBoundaries = [currentRow, new Coord(currentRow.lat, sectionOne.southWest.lng)];

            MesaCityGrid.sectionOne.push(rowGrids);
            MesaCityGridAsJSON.sectionOne.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            MesaCityGridAsJSON.sectionOne.gridCount += rowGrids.length;
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

        MesaCityGridAsJSON.sectionTwo["bounds"] = [sectionTwo.southWest, sectionTwo.northEast];

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

            let rowDiagonalBoundaries = [currentRow, new Coord(currentRow.lat, sectionTwo.southWest.lng)];

            MesaCityGrid.sectionTwo.push(rowGrids);
            MesaCityGridAsJSON.sectionTwo.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            MesaCityGridAsJSON.sectionTwo.gridCount += rowGrids.length;
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

        MesaCityGridAsJSON.sectionThree["bounds"] = [sectionThree.northEast, sectionThree.southWest];
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

            let rowDiagonalBoundaries = [currentRow, new Coord(currentRow.lat, sectionThree.northEast.lng)];

            MesaCityGrid.sectionThree.push(rowGrids);
            MesaCityGridAsJSON.sectionThree.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            MesaCityGridAsJSON.sectionThree.gridCount += rowGrids.length;
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

        MesaCityGridAsJSON.sectionFour["bounds"] = [sectionFour.northWest, sectionFour.southEast];

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

            let rowDiagonalBoundaries = [currentRow, new Coord(currentRow.lat, sectionFour.southEast.lng)];

            MesaCityGrid.sectionFour.push(rowGrids);
            MesaCityGridAsJSON.sectionFour.rows.push({
                "bounds": rowDiagonalBoundaries,
                "grids": rowGrids
            });
            MesaCityGridAsJSON.sectionFour.gridCount += rowGrids.length;
            currentRow = utils.NextLat(currentRow, utils.Directions.South);
        }
    }());

}());

//    return grid
module.exports = {
    MesaCityGrid: MesaCityGrid,
    MesaCityGridAsBlockArray: MesaCityGridAsBlockArray,
    MesaCityAsJSON: MesaCityGridAsJSON
};
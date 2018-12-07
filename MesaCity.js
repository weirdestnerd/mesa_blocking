const Coord = require('./utils').Coord;

function CitySection (name) {
    this.name = name;
    this.northEast = new Coord();
    this.southEast = new Coord();
    this.northWest = new Coord();
    this.southWest = new Coord();
    this.rows = [];
    this.customerCount = 0;
    this.gridCount = 0;

    this.density = () => {
        let density = 0;
        for (let row of this.rows) {
            for (let grid of row.grids) {
                density += grid.density()
            }
        }
        return density;
    };
    this.toArray = function() {
        return [
            this.southWest.toArray(),
            this.northWest.toArray(),
            this.northEast.toArray(),
            this.southEast.toArray()
        ];
    };
    this.toBlockArray = () => {
        let result = this.toArray();
        result.push(this.southWest.toArray());
        return result;
    };
    this.log = () => {
        console.log("Name: %s, \nNorthEast: ", this.name);
        this.northEast.log();
        console.log("NorthWest: ");
        this.northWest.log();
        console.log("SouthEast: ");
        this.southEast.log();
        console.log("SouthWest: ");
        this.southWest.log();
    }
}

let singleInstance = null;

function MesaCity() {
    singleInstance = this;
    let sectionOne = new CitySection("sectionOne");
    sectionOne.northEast = new Coord(33.455611, -111.841803);
    sectionOne.northWest = new Coord(33.455611,-111.893905);
    sectionOne.southWest = new Coord(33.357090, -111.893905);
    sectionOne.southEast = new Coord(33.357090, -111.841803);

    let sectionTwo = new CitySection("sectionTwo");
    sectionTwo.northEast = new Coord(33.455611, -111.688848);
    sectionTwo.northWest = new Coord(33.455611, -111.841803);
    sectionTwo.southWest = new Coord(33.379279, -111.841803);
    sectionTwo.southEast = new Coord(33.379279, -111.688848);

    let sectionThree = new CitySection("sectionThree");
    sectionThree.northEast = new Coord(33.516079, -111.632890);
    sectionThree.northWest = new Coord(33.516079, -111.841803);
    sectionThree.southWest = new Coord(33.455611, -111.841803);
    sectionThree.southEast = new Coord(33.455611, -111.632890);

    let sectionFour = new CitySection("sectionFour");
    sectionFour.northEast = new Coord(33.455611, -111.584269);
    sectionFour.northWest = new Coord(33.455611, -111.688848);
    sectionFour.southWest = new Coord(33.282113, -111.688848);
    sectionFour.southEast = new Coord(33.282113, -111.584269);

    this.findSection = coord => {
        if (!(coord instanceof Coord)) {
            console.error("findSection: Type of coord must be utils/Coord");
            return
        }

        function isBoundedByTopAndBottom(section) {
            return section.northWest.lat >= coord.lat && section.southWest.lat <= coord.lat;
        }

        function isBoundedByLeftAndRight(section) {
            return section.northEast.lng >= coord.lng && section.northWest.lng <= coord.lng;
        }

        return Object.values(this.sections).find(eachSection => {
            return isBoundedByTopAndBottom(eachSection) && isBoundedByLeftAndRight(eachSection);
        })
    };

    this.findRow = (rows, coord) => {
        return rows.find(eachRow => {
            function isBoundedByTopAndBottom() {
                return eachRow.bounds.northWest.lat >= coord.lat && eachRow.bounds.southWest.lat <= coord.lat;
            }

            function isBoundedByLeftAndRight() {
                return eachRow.bounds.northEast.lng >= coord.lng && eachRow.bounds.northWest.lng <= coord.lng;
            }

            return isBoundedByTopAndBottom() && isBoundedByLeftAndRight();
        });
    };

    this.findGrid = coord => {
        let section = this.findSection(coord);
        if (section === undefined) return section;
        let row = this.findRow(section.rows, coord);
        if (row === undefined) return row;
        return row.grids.find(eachGrid => {
            return eachGrid.contains(coord);
        })
    };

    this.resetGridPickups = () => {
        for (let section of Object.values(this.sections)) {
            for (let row of section.rows) {
                for (let grid of row.grids) {
                    grid.pickups = 0;
                }
            }
        }
    };

    this.sections = {
        sectionOne: sectionOne,
        sectionTwo: sectionTwo,
        sectionThree: sectionThree,
        sectionFour: sectionFour,
    };
}

module.exports = singleInstance ? singleInstance : new MesaCity();

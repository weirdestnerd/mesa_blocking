const Coord = require('./utils').Coord;

function CitySection (name) {
    this.name = name;
    this.northEast = new Coord(null, null);
    this.southEast = new Coord(null, null);
    this.northWest = new Coord(null, null);
    this.southWest = new Coord(null, null);
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
    sectionThree.northWest = new Coord(33.516079, -111.840738);
    sectionThree.southWest = new Coord(33.468072, -111.840738);
    sectionThree.southEast = new Coord(33.468072, -111.632890);

    let sectionFour = new CitySection("sectionFour");
    sectionFour.northEast = new Coord(33.455611, -111.584269);
    sectionFour.northWest = new Coord(33.455611, -111.688848);
    sectionFour.southWest = new Coord(33.282113, -111.688848);
    sectionFour.southEast = new Coord(33.282113, -111.584269);

    this.sections = {
        sectionOne: sectionOne,
        sectionTwo: sectionTwo,
        sectionThree: sectionThree,
        sectionFour: sectionFour,
    };
}

function getCity() {
    console.log("s " + singleInstance);
    return singleInstance ? singleInstance : new MesaCity();
}

module.exports = {
    sections: getCity().sections
};

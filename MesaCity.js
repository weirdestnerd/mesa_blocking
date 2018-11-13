const Coord = require('./utils').Coord;

function CitySection () {
    this.northEast = new Coord(null, null);
    this.southEast = new Coord(null, null);
    this.northWest = new Coord(null, null);
    this.southWest = new Coord(null, null);
    this.log = () => {
        console.log("NorthEast: ");
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
    let sectionOne = new CitySection();
    sectionOne.northEast = new Coord(33.455611, -111.840738);
    sectionOne.northWest = new Coord(33.455042, -111.889525);
    sectionOne.southWest = new Coord(33.357027, -111.893905);
    sectionOne.southEast = new Coord(33.357090, -111.841803);

    let sectionTwo = new CitySection();
    sectionTwo.northEast = new Coord(33.455611, -111.688848);
    sectionTwo.northWest = new Coord(33.455611, -111.840738);
    sectionTwo.southWest = new Coord(33.357090, -111.841803);
    sectionTwo.southEast = new Coord(33.379279, -111.688848);

    let sectionThree = new CitySection();
    sectionThree.northEast = new Coord(33.516079, -111.632890);
    sectionThree.northWest = new Coord(33.516079, -111.840738);
    sectionThree.southWest = new Coord(33.455611, -111.840738);
    sectionThree.southEast = new Coord(33.468072, -111.632890);

    let sectionFour = new CitySection();
    sectionFour.northEast = new Coord(33.455611, -111.581634);
    sectionFour.northWest = new Coord(33.455611, -111.688848);
    sectionFour.southWest = new Coord(33.278884, -111.686500);
    sectionFour.southEast = new Coord(33.282113, -111.584269);

    this.sections = [sectionOne, sectionTwo, sectionThree, sectionFour]
}

function getCity() {
    console.log("s " + singleInstance);
    return singleInstance ? singleInstance : new MesaCity();
}

module.exports = {
    sections: getCity().sections
};

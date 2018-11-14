const Enum = require('enum');

const earthRadius = 3960.0;
const degToRad = Math.PI / 180.0;
const radToDeg = 180.0 / Math.PI;
const Directions = new Enum(['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'], {freez: true});

function Coord(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    this.isNull = () => {
        return (this.lat === null && this.lng === null) || (typeof(this.lat) === undefined && typeof(this.lng) === undefined);
    };
    this.log = () => {
        console.log("lat: %d, lng: %d", this.lat, this.lng);
    }
}

function Grid(topLeft) {
    this.topLeft = new Coord(null, null);
    this.topRight = new Coord(null, null);
    this.bottomLeft = new Coord(null, null);
    this.bottomRight = new Coord(null, null);

    if (topLeft && typeof (topLeft) === Coord) {
    //    TODO: create grid
    }
    this.log = () => {
        console.log("TopLeft: ");
        this.topLeft.log();
        console.log("TopRight: ");
        this.topRight.log();
        console.log("BottomLeft: ");
        this.bottomLeft.log();
        console.log("BottomRight: ");
        this.bottomRight.log();
    };
}

function addToLat(coord, miles, direction) {
    if (!(coord instanceof Coord)) {
        console.error("Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.North && direction !== Directions.South) {
        console.error("Direction must be North or South");
        return
    }

    function nextLat() {
        return (miles / earthRadius) * radToDeg;
    }

    direction === Directions.North ? coord.lat += nextLat() : coord.lat -= nextLat();

    return coord;
}

function addToLong(coord, miles, direction) {
    if (!(coord instanceof Coord)) {
        console.error("Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.West && direction !== Directions.East) {
        console.error("Direction must be North or South");
        return
    }

    function nextLng() {
        radius = earthRadius * Math.cos(coord.lat * degToRad);
        return (miles / radius) * radToDeg;
    }

    direction === Directions.East ? coord.lng += nextLng() : coord.lng -= nextLng();

    return coord;
}

function NextBlock(coord, direction) {
    if (!(coord instanceof Coord)) {
        console.error("Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.NE && direction !== Directions.NW && direction !== Directions.SE && direction !== Directions.SW) {
        console.error("Direction must be NE or NW or SE or SW");
        return
    }

    switch (direction) {
        case Directions.NE:
            coord.lat = addToLat(coord, .1, Directions.North).lat;
            coord.lng = addToLong(coord, .1, Directions.East).lng;
            break;
        case Directions.NW:
            coord.lat = addToLat(coord, .1, Directions.North).lat;
            coord.lng = addToLong(coord, .1, Directions.West).lng;
            break;
        case Directions.SE:
            coord.lat = addToLat(coord, .1, Directions.South).lat;
            coord.lng = addToLong(coord, .1, Directions.East).lng;
            break;
        case Directions.SW:
            coord.lat = addToLat(coord, .1, Directions.South).lat;
            coord.lng = addToLong(coord, .1, Directions.West).lng;
            break;
    }

    return coord;
}

module.exports = {
    Coord: Coord,
    Grid:Grid,
    Directions: Directions,
    NextLat: addToLat,
    NextLng: addToLong,
    NextBlock: NextBlock
};
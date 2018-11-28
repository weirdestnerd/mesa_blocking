const Enum = require('enum');

const CityBlockSize = .05;
const earthRadius = 3960.0;
const degToRad = Math.PI / 180.0;
const radToDeg = 180.0 / Math.PI;
const Directions = new Enum(['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'], {freez: true});

function Coord(lat = null, lng = null) {
    this.lat = lat;
    this.lng = lng;
    this.isNull = () => {
        return this.lat === null && this.lng === null;
    };
    this.log = () => {
        console.log("lat: %d, lng: %d", this.lat, this.lng);
    }
}

function Grid() {
    this.topLeft = new Coord();
    this.topRight = new Coord();
    this.bottomLeft = new Coord();
    this.bottomRight = new Coord();

    this.create = () => {
    //    if all corners are null, throw error
        if (this.isEmpty()) {
            console.error("At least one corner is needed to construct Grid");
            return;
        }
    //    if topRight, then calculate topLeft & bottomRight
        if (!this.topRight.isNull()) {
            this.topLeft = calculateLngByDistance(this.topRight, Directions.West);
            this.bottomRight = calculateLatByDistance(this.topRight, Directions.South);
        }
    //    if topLeft, then calculate topRight & bottomLeft
        if (!this.topLeft.isNull()) {
            this.topRight = calculateLngByDistance(this.topLeft, Directions.East);
            this.bottomLeft = calculateLatByDistance(this.topLeft, Directions.South);
        }
    //    if bottomRight, then calculate bottomLeft & topRight
        if (!this.bottomRight.isNull()) {
            this.bottomLeft = calculateLngByDistance(this.bottomRight, Directions.West);
            this.topRight = calculateLatByDistance(this.bottomRight, Directions.North);
        }
    //    if bottomLeft, then calculate bottomRight & topLeft
        if (!this.bottomLeft.isNull()) {
            this.bottomRight = calculateLngByDistance(this.bottomLeft, Directions.East);
            this.topLeft = calculateLatByDistance(this.bottomLeft, Directions.North);
        }
    };

    this.isEmpty = () => {
        let allCorners = [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];

        function isCornerNull(corner) {
            return corner.isNull();
        }

        return allCorners.every(isCornerNull);
    };

    this.toArray = () => {
        let result = [];
        result.push([this.topLeft.lat, this.topLeft.lng]);
        result.push([this.topRight.lat, this.topRight.lng]);
        result.push([this.bottomRight.lat, this.bottomRight.lng]);
        result.push([this.bottomLeft.lat, this.bottomLeft.lng]);
        return result;
    };

    this.toBlockArray = () => {
        let result = this.toArray();
        result.push([this.topLeft.lat, this.topLeft.lng]);
        return result;
    };

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

function calculateLatByDistance(coord, direction) {
    if (!(coord instanceof Coord)) {
        console.error("calculateLatByDistance: Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("calculateLatByDistance: Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.North && direction !== Directions.South) {
        console.error("calculateLatByDistance: Direction must be North or South");
        return
    }

    function nextLat() {
        return (CityBlockSize / earthRadius) * radToDeg;
    }

    let result = new Coord(null, coord.lng);
    result.lat = direction === Directions.North ? coord.lat + nextLat() : coord.lat - nextLat();

    return result;
}

function calculateLngByDistance(coord, direction) {
    if (!(coord instanceof Coord)) {
        console.error("calculateLngByDistance: Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("calculateLngByDistance: Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.West && direction !== Directions.East) {
        console.error("calculateLngByDistance: Direction must be North or South");
        return
    }

    function nextLng() {
        radius = earthRadius * Math.cos(coord.lat * degToRad);
        return (CityBlockSize / radius) * radToDeg;
    }

    let result = new Coord(coord.lat);
    result.lng = direction === Directions.East ? coord.lng + nextLng() : coord.lng - nextLng();
    // direction === Directions.East ? coord.lng += nextLng() : coord.lng -= nextLng();
    return result;
}

function NextBlock(coord, direction) {
    if (!(coord instanceof Coord)) {
        console.error("NextBlock: Type of coord must be utils/Coord");
        return
    }
    if (!Directions.isDefined(direction)) {
        console.error("NextBlock: Type of direction must be utils/Direction");
        return
    }
    if (direction !== Directions.NE && direction !== Directions.NW && direction !== Directions.SE && direction !== Directions.SW) {
        console.error("NextBlock: Direction must be NE or NW or SE or SW");
        return
    }

    let result = new Coord();

    switch (direction) {
        case Directions.NE:
            result.lat = calculateLatByDistance(coord, Directions.North).lat;
            result.lng = calculateLngByDistance(coord, Directions.East).lng;
            break;
        case Directions.NW:
            result.lat = calculateLatByDistance(coord, Directions.North).lat;
            result.lng = calculateLngByDistance(coord, Directions.West).lng;
            break;
        case Directions.SE:
            result.lat = calculateLatByDistance(coord, Directions.South).lat;
            result.lng = calculateLngByDistance(coord, Directions.East).lng;
            break;
        case Directions.SW:
            result.lat = calculateLatByDistance(coord, Directions.South).lat;
            result.lng = calculateLngByDistance(coord, Directions.West).lng;
            break;
    }

    return result;
}

//TODO: returns immutable object, fix that
function CloneObject(object) {
    return Object.create(object);
    // let clone = {};
    // clone.prototype = Object.create(Object.getPrototypeOf(object));
    // console.log(Object.getPrototypeOf(clone));
    // return Object.assign(clone, object);
}

module.exports = {
    Directions: Directions,
    Coord: Coord,
    Grid:Grid,
    NextLat: calculateLatByDistance,
    NextLng: calculateLngByDistance,
    NextBlock: NextBlock,
    CloneObject: CloneObject
};
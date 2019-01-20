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
    this.toArray = () => {
        return [this.lat, this.lng]
    };
    this.log = () => {
        let message = `(lat: ${this.lat}, lng: ${this.lng})`;
        console.log(message);
        return message;
    }
}

function Grid(name) {
    if (!name) {
        console.warn(`Creating Grid without 'name' identifier.`);
        this.name = "";
    } else this.name = name;
    this.topLeft = new Coord();
    this.topRight = new Coord();
    this.bottomLeft = new Coord();
    this.bottomRight = new Coord();
    this.customers = 0;
    this.pickups = 0;

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

    this.contains = location => {
        if (!location) {
            console.error('Provide location to check.');
            return;
        }
        if (!location instanceof Coord) {
            console.error('Grid.contains: Type of location must be utils/Coord');
            return;
        }
        function isBoundedByTopAndBottom(grid) {
            return grid.topLeft.lat >= location.lat && grid.bottomLeft.lat <= location.lat;
        }

        function isBoundedByLeftAndRight(grid) {
            return grid.topRight.lng >= location.lng && grid.topLeft.lng <= location.lng;
        }

        return isBoundedByTopAndBottom(this) && isBoundedByLeftAndRight(this);
    };

    this.density = () => {
        if (this.customers !== 0)
            return this.pickups / this.customers;
        return this.pickups;
    };

    this.log = () => {
        let message = `Grid [${this.name}]: {Customers: ${this.customers}, TopLeft: ${this.topLeft.log()}, TopRight: ${this.topRight.log()}, BottomLeft: ${this.bottomLeft.log()}, BottomRight: ${this.bottomRight.log()}}`;
        console.log(message);
        return message;
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

//FIXME: returns immutable object, fix that
function CloneObject(object) {
    return Object.create(object);
    // let clone = {};
    // clone.prototype = Object.create(Object.getPrototypeOf(object));
    // console.log(Object.getPrototypeOf(clone));
    // return Object.assign(clone, object);
}

function Region() {
    this.name = name;
    this.northEast = new Coord();
    this.southEast = new Coord();
    this.northWest = new Coord();
    this.southWest = new Coord();
    //TODO: fill region coordinates
    this.contains = location => {
        if (!location) {
            console.error('Provide location to check.');
            return;
        }
        if (!location instanceof Coord) {
            console.error('Region.contains: Type of location must be utils/Coord');
            return;
        }

        function isBoundedByTopAndBottom() {
            return this.northEast.lat >= location.lat && this.southEast.lat <= location.lat;
        }

        function isBoundedByLeftAndRight() {
            return this.northEast.lng >= location.lng && this.northWest.lng <= location.lng;
        }

        return isBoundedByTopAndBottom() && isBoundedByLeftAndRight();
    };
}

function distanceBetween(firstLocation, secondLocation) {
    if (!(firstLocation instanceof Coord) || !(secondLocation instanceof Coord)) {
        console.error("distanceBetween: Type of coord must be utils/Coord");
        return;
    }
    if (firstLocation.isNull() || secondLocation.isNull()) {
        console.error("Coord is not initialized");
        return;
    }
    let r1 = firstLocation.lat * degToRad;
    let r2 = secondLocation.lat * degToRad;
    let d1 = (firstLocation.lat - secondLocation.lat) * degToRad;
    let d2 = (firstLocation.lng - secondLocation.lng) * degToRad;

    let a = Math.sin(d1/2) * Math.sin(d1/2) +
        Math.cos(r1) * Math.cos(r2) *
        Math.sin(d2/2) * Math.sin(d2/2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return earthRadius * c;
}

function Polygon(polygon) {
    this.polygon = polygon;

    /*
        source: https://www.oodlestechnologies.com/blogs/Algorithm-for-finding-a-location-inside-a-polygon-area
    */
    this.contains = coord => {
        if (!this.polygon) {
            console.error("Polygon.contains: Polygon is not initialized")
        }
        let next = polygon.length - 1;
        let contains = false;
        for (let cursor = 0; cursor < polygon.length; next = cursor++) {
            let cursorLat = polygon[cursor][0], cursorLng = polygon[cursor][1];
            let nextLat = polygon[next][0], nextLng = polygon[next][1];

            let intersect = ((cursorLng > coord[1]) !== (nextLng > coord[1]))
                && (coord[0] < (nextLat - cursorLat) * (coord[1] - cursorLng) / (nextLng - cursorLng) + cursorLat);
            if (intersect) contains = true;
        }
        return contains;
    }
}

module.exports = {
    Directions: Directions,
    Coord: Coord,
    Grid:Grid,
    NextLat: calculateLatByDistance,
    NextLng: calculateLngByDistance,
    NextBlock: NextBlock,
    CloneObject: CloneObject,
    Distance: distanceBetween,
    Region: Region,
    Polygon: Polygon
};
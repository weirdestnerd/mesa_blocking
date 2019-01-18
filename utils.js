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

/*
    source: https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/
 */
function Polygon(polygon) {
    this.polygon = polygon;

    function onSegment(polygonElement, coord, polygonElement2) {
        return coord[0] <= Math.max(polygonElement[0], polygonElement2[0]) &&
        coord[0] >= Math.min(polygonElement[0], polygonElement2[0]) &&
        coord[1] <= Math.max(polygonElement[1], polygonElement2[1]) &&
        coord[1] >= Math.min(polygonElement[1], polygonElement2[1]);
    }

    function orientationOf(polygonElement, coord, polygonElement2) {
        let val =
            (coord[1] - polygonElement[1]) * (polygonElement2[0] - coord[0]) -
            (coord[0] - polygonElement[1]) * (polygonElement2[1] - coord[1]);

        if (val === 0 ) return 0;
        return (val > 0) ? 1 : 2;
    }

    function doIntersect(polygonElement, polygonElement2, coord, extreme) {
        let o1 = orientationOf(polygonElement, polygonElement2, coord);
        let o2 = orientationOf(polygonElement, polygonElement2, extreme);
        let o3 = orientationOf(coord, extreme, polygonElement);
        let o4 = orientationOf(coord, extreme, polygonElement2);

        if (o1 !== o2 && o3 !== o4)
            return true;

        if (o1 === 0 && onSegment(polygonElement, coord, polygonElement2)) return true;

        if (o2 === 0 && onSegment(polygonElement, extreme, polygonElement2)) return true;

        if (o3 === 0 && onSegment(coord, polygonElement, extreme)) return true;

        if (o4 === 0 && onSegment(coord, polygonElement2, extreme)) return true;

        return false;
    }

    this.contains = coord => {
        if (!this.polygon) {
            console.error("Polygon.contains: Polygon is not initialized")
        }
        let extreme = [Math.pow(10, 1000), coord[1]];
        let size = this.polygon.length;
        let cursor = 0;
        let count = 0;
        while (cursor < size - 1) {
            let next = cursor++;
            if (doIntersect(this.polygon[cursor], this.polygon[next], coord, extreme)) {
                if (orientationOf(this.polygon[cursor], coord, this.polygon[next]) === 0) {
                    return onSegment(this.polygon[cursor], coord, this.polygon[next]);
                }
                count++;
            }
            cursor++;
        }
        return count % 2 === 1
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
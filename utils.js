const Enum = require('enum');
const path = require('path');
const fs = require('fs');

/**
 *  Variables definition
 */
const CityBlockSize = .05;
const earthRadius = 3960.0;
const degToRad = Math.PI / 180.0;
const radToDeg = 180.0 / Math.PI;

/**
 * @type {Enum}
 */
const Directions = new Enum(['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'], {freez: true});

/**
 * @typedef {Object} Coord
 * @property {number} lat
 * @property {number} lng
 * /

 /**
 * @param {number} [lat=null]
 * @param {number} [lng=null]
 */
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

/**
 * @typedef {Object} Grid
 * @param {Coord} topLeft
 * @param {Coord} topRight
 * @param {Coord} bottomLeft
 * @param {Coord} bottomRight
 */

/**
 *
 * @param {string} [name]
 */
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

    /**
     * Populates the grid's attributes given at least one of the corners
     */
    this.create = () => {
    //    if all corners are null, throw error
        if (this.isUninitialized()) {
            return console.error("At least one corner is needed to construct Grid");
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

    this.isUninitialized = () => {
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
            return console.error('Provide location to check.');
        }
        if (!location instanceof Coord) {
            return console.error('Grid.contains: Type of location must be utils/Coord');
        }
        function isBoundedByTopAndBottom() {
            return this.grid.topLeft.lat >= location.lat && this.grid.bottomLeft.lat <= location.lat;
        }

        function isBoundedByLeftAndRight() {
            return this.grid.topRight.lng >= location.lng && this.grid.topLeft.lng <= location.lng;
        }

        return isBoundedByTopAndBottom() && isBoundedByLeftAndRight();
    };

    this.density = () => {
        //  if there are customers and there are pick ups
        if (this.customers && this.customers !== 0 && this.pickups && this.pickups !== 0) {
            return ((this.pickups / this.customers) * 100).toFixed(2);
        }
        //  if there are customers and no pick ups
        else if (this.customers && this.customers !== 0 && (!this.pickups || this.pickups === 0)) {
            return 0;
        }
        //  if there are no customers and either there are pick ups or not
        else {
            return -1;
        }
    };

    this.log = () => {
        let message = `Grid [${this.name}]: {Customers: ${this.customers}, TopLeft: ${this.topLeft.log()}, TopRight: ${this.topRight.log()}, BottomLeft: ${this.bottomLeft.log()}, BottomRight: ${this.bottomRight.log()}}`;
        console.log(message);
        return message;
    };
}

/**
 * Calculates the next latitude by CityBlockSize distance in the given direction keeping longitude the same
 * @param {Coord} coord
 * @param {Enum} direction
 * @returns {Coord}
 */
function calculateLatByDistance(coord, direction) {
    if (!(coord instanceof Coord)) {
        return console.error("calculateLatByDistance: Type of coord must be utils/Coord");
    }
    if (!Directions.isDefined(direction)) {
        return console.error("calculateLatByDistance: Type of direction must be utils/Direction");
    }
    if (direction !== Directions.North && direction !== Directions.South) {
        return console.error("calculateLatByDistance: Direction must be North or South");
    }

    function nextLat() {
        return (CityBlockSize / earthRadius) * radToDeg;
    }

    let result = new Coord(null, coord.lng);
    result.lat = direction === Directions.North ? coord.lat + nextLat() : coord.lat - nextLat();

    return result;
}

/**
 * Calculates the next longitude by CityBlockSize distance in the given direction keeping latitude the same
 * @param {Coord} coord
 * @param {Enum} direction
 * @returns {Coord}
 */
function calculateLngByDistance(coord, direction) {
    if (!(coord instanceof Coord)) {
        return console.error("calculateLngByDistance: Type of coord must be utils/Coord");
    }
    if (!Directions.isDefined(direction)) {
        return console.error("calculateLngByDistance: Type of direction must be utils/Direction");
    }
    if (direction !== Directions.West && direction !== Directions.East) {
        return console.error("calculateLngByDistance: Direction must be North or South");
    }

    function nextLng() {
        radius = earthRadius * Math.cos(coord.lat * degToRad);
        return (CityBlockSize / radius) * radToDeg;
    }

    let result = new Coord(coord.lat);
    result.lng = direction === Directions.East ? coord.lng + nextLng() : coord.lng - nextLng();
    return result;
}

/**
 * Calculates the next city block's latitude and longitude by CityBlockSize distance in the given direction
 * @param {Coord} coord
 * @param {Enum} direction
 * @returns {Coord}
 * @constructor
 */
function NextBlock(coord, direction) {
    if (!(coord instanceof Coord)) {
        return console.error("NextBlock: Type of coord must be utils/Coord");
    }
    if (!Directions.isDefined(direction)) {
        return console.error("NextBlock: Type of direction must be utils/Direction");
    }
    if (direction !== Directions.NE && direction !== Directions.NW && direction !== Directions.SE && direction !== Directions.SW) {
        return console.error("NextBlock: Direction must be NE or NW or SE or SW");
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

/**
 * Deep clones the object
 * @param {Object} object
 * @returns {Object}
 * @constructor
 */
function CloneObject(object) {
//FIXME: returns immutable object, fix that
    return Object.create(object);
    // let clone = {};
    // clone.prototype = Object.create(Object.getPrototypeOf(object));
    // console.log(Object.getPrototypeOf(clone));
    // return Object.assign(clone, object);
}

/**
 * Calculates the distance in miles between two coordinate points
 * @param {Coord} firstLocation
 * @param {Coord} secondLocation
 * @returns {number}
 */
function distanceBetween(firstLocation, secondLocation) {
    if (!(firstLocation instanceof Coord) || !(secondLocation instanceof Coord)) {
        return console.error("distanceBetween: Type of coord must be utils/Coord");
    }
    if (firstLocation.isNull() || secondLocation.isNull()) {
        return console.error("Coord is not initialized");
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

/**
 * @typedef {Object} Polygon
 * @param {number[][]} polygon
 */

/**
 * @param polygon
 */
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

/**
 * Transforms value to camelcase
 * @param value
 * @returns {string}
 */
function camelcase(value) {
    let words = value.split(' ');
    words = words.map(word => {
        return word[0].toUpperCase() + word.substring(1);
    });
    return words.join('');
}


/**
 * Validates filenames and rename filenames if necessary
 * @param {string[]} filenames
 * @param callback
 * @returns {*}
 */
function validateFilenames(filenames, callback) {
    function extractExtension(filename) {
        let regex = /(.csv)|(.xlsx)$/g;
        let foundExtension = filename.match(regex);
        if (foundExtension === null) {
            callback('File extension is expected in file path. if present, check for correctness.');
        }
        let type = foundExtension[0];
        if (!['.csv', '.xlsx'].includes(type)) {
            callback('Provided type is not supported.');
        }
        return type;
    }

    function isLong(filename) {
        let extension = extractExtension(filename);
        let name = filename.replace(extension, '');
        return name.length > 8;
    }

    if (filenames.some(isLong)) {
        callback('Rename filenames that are longer than 8 letters')
    }

    //TODO:
    // filenames.forEach(filename => {
    //     let oldPath = path.join(__dirname, '../data/weeks/' + filename);
    //     let newPath = path.join(__dirname, '../data/weeks/' + camelcase(filename));
    //     fs.renameSync(oldPath, newPath);
    // });
    return filenames;
}

/**
 * Extracts the expected extension type of path
 */
function extractExtension(filepath, extension) {
    let regex = new RegExp(`(.${extension})`, 'g');
    let foundExtension = filepath.match(regex);
    if (foundExtension === null) {
        console.warn('File extension is expected in file path. if present, check for correctness.');
        return null;
    }
    return foundExtension[0];
}

/**
 * Validates path
 */
function validatePath(path, type) {
    if (!type) {
        console.warn('Expected type of file is not provided');
        return;
    }
    if (!path) {
        return null;
    }
    let directory = path.replace(type, '');
    let regex = /([a-zA-Z0-9\s_\\.\-\(\):])+/g;
    if (!regex.test(directory)) {
        console.warn('File name is empty');
        return null;
    }
    return path;
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
    Polygon: Polygon,
    Camelcase: camelcase,
    ValidateFilenames: validateFilenames,
    ExtractExtension: extractExtension,
    ValidatePath: validatePath
};
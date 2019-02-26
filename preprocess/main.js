/**
 * Module dependencies
 */
const dataProvider = require('../data/provider');
const Polygon = require('../utils').Polygon;
const fs = require('fs');
const path = require('path');
const dbf = require('dbf');
const camelcase = require('../utils').Camelcase;

/**
 * Global dependencies
 */
let zoneGeoJSON;
let allCustomers;
let allWeeksFileNames;

/**
 * Finds the index of the zone that coordinate belongs to
 * @param {Coord} coord
 * @returns {number}
 */
function findZoneIndexOf(coord) {
    return zoneGeoJSON.features.findIndex(feature => {
        let polygon = new Polygon(feature.geometry.coordinates[0]);
        // coordinates are stored in the zone (zoneGeoJSOn) as [lng, lat], so to compare accurately we need to reverse the provided coordinate
        let reversedCoord = [coord[1], coord[0]];
        return polygon.contains(reversedCoord);
    });
}

/**
 *  Assign customer to zone by find the zone that customer's lat & lng belongs to.
 */
function assignCustomerToZone() {
    for (let customer of allCustomers) {
        if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
            let index = findZoneIndexOf([customer.LATITUDE, customer.LONGITUDE]);
            if (index === -1){}
                // console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
            else {
                let properties = zoneGeoJSON.features[index].properties;
                properties['customerCount'] = properties.hasOwnProperty('customerCount') ? properties['customerCount'] + 1 : 1;
                zoneGeoJSON.features[index].properties = properties;
            }
        }
    }
}

/**
 * Read from file the weekly data and assign each customer for that week to their respective zone.
 * @param {string} filename
 * @returns {Promise<any>}
 */
function assignWeekDataToZone(filename) {
    return new Promise((resolve, reject) => {
        let filePath = path.join(__dirname, '../data/weeks/' + filename);
        dataProvider.getWeeklyDataFromFile(filePath, ['latitude', 'longitude'])
            .then(week => {
                for (let customer of week) {
                    if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                        let index = findZoneIndexOf([customer.LATITUDE, customer.LONGITUDE]);
                        if (index === -1){}
                            // console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
                        else {
                            let properties = zoneGeoJSON.features[index].properties;
                            if (!properties.hasOwnProperty(filename)) properties[filename] = 0;
                            properties[filename]++;
                            zoneGeoJSON.features[index].properties = properties;
                        }
                    }
                }
                resolve();
            })
            .catch(reject)
    })
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

    filenames.forEach(filename => {
        let oldPath = path.join(__dirname, '../data/weeks/' + filename);
        let newPath = path.join(__dirname, '../data/weeks/' + camelcase(filename));
        fs.renameSync(oldPath, newPath);
    });
    return filenames;
}

/**
 * Calculate density for each zone
 */
function calculateZoneDensity() {
    zoneGeoJSON.features.forEach(feature => {
        let customerCount = feature.properties.customerCount;
        for (let weekName of allWeeksFileNames) {
            let weekCount = feature.properties[weekName];
            let density;
            //  if there are customers and there are pick ups
            if (customerCount && customerCount !== 0 && weekCount && weekCount !== 0) {
                density = ((weekCount / customerCount) * 100).toFixed(2);
            }
            //  if there are customers and no pick ups
            else if (customerCount && customerCount !== 0 && (!weekCount || weekCount === 0)) {
                density = 0;
            }
            //  if there are no customers and either there are pick ups or not
            else {
                density = -1;
            }
            feature.properties['%' + weekName] = density;
        }
    })
}

/**
 * Save geoJSON properties in .dbf file
 * @returns {*}
 */
function savePropertiesInDBF() {
    let allProperties = zoneGeoJSON.features.map(feature => {
        return feature.properties;
    });
    //WARN: dbf saves headers as long as 8 letters
    let buffer = dbf.structure(allProperties);
    let dbfPath = path.join(__dirname, '../data/MesaCityZonesPreprocessed.dbf');

    function toBuffer(ab) {
        let buffer = Buffer.alloc(ab.byteLength);
        let view = new Uint8Array(ab);
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
    }

    fs.writeFileSync(dbfPath, toBuffer(buffer.buffer));
    return zoneGeoJSON;
}

function preprocess() {
    return new Promise((resolve, reject) => {
        dataProvider.getGeoJSONFromFile(false)
            .then(geoJSON => {
                zoneGeoJSON = geoJSON;
            })
            .then(() => {
                fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
                    if (error) reject(error);
                    filenames = validateFilenames(filenames, error => {
                        if (error) reject(error)
                    });
                    allWeeksFileNames = filenames;
                    //  apply holds all the promises to be triggered
                    let apply = filenames.map(filename => {
                        return assignWeekDataToZone(filename);
                    });

                    //  get customers first before weekly data
                    apply.unshift(dataProvider.getAllCustomers(['latitude', 'longitude']));

                    Promise.all(apply)
                        .then(values => {
                            allCustomers = values[0];
                            assignCustomerToZone();
                        })
                        .then(() =>{
                            calculateZoneDensity();
                        })
                        .then(() => {
                            savePropertiesInDBF();
                            return zoneGeoJSON;
                        })
                        .then(resolve)
                        .catch(reject);
                })
            })
            .catch(reject)
    });
}

module.exports = {
    run: preprocess
};

preprocess().then(geoJson => {
    console.log('Done!');
    console.log(geoJson.features[0].properties);
}).catch(console.error);
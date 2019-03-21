/**
 * Module dependencies
 */
const dataProvider = require('../data/provider');
const Polygon = require('../utils').Polygon;
const fs = require('fs');
const path = require('path');
const dbf = require('dbf');
const utils = require('../utils');
const HashMap = require('hashmap');

/**
 * Global dependencies
 */
let zoneGeoJSON;
let latLngRoute = new HashMap();
let isFirstToFinish = true;
let weeks;

/**
 * Finds the index of the zone that coordinate belongs to
 * @param {*[]} coord
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
 * Find the index of zone that has route name
 * @param {String} route
 * @returns {*}
 */
function findIndexOfRoute(route) {
    return zoneGeoJSON.features.findIndex(feature => {
        return feature.properties.Map_Name === route
    })
}

/**
 *  Assign customer to zone by finding the zone that customer's lat & lng belongs to.
 */
function assignCustomerToZone() {
    return new Promise((resolve, reject) => {
        dataProvider.getAllCustomers(['latitude', 'longitude', 'route'])
            .then(allCustomers => {
                for (let customer of allCustomers) {
                    if (customer && customer.hasOwnProperty('ROUTE') && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                        //  creating mapping from location to route
                        latLngRoute.set([customer.LATITUDE, customer.LONGITUDE], customer.ROUTE);
                        let index = findIndexOfRoute(customer.ROUTE);
                        if (index === -1) {}
                        // console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
                        else {
                            let properties = zoneGeoJSON.features[index].properties;
                            properties['customerCount'] = properties.hasOwnProperty('customerCount') ? properties['customerCount'] + 1 : 1;
                            zoneGeoJSON.features[index].properties = properties;
                        }
                    }
                }
                console.log(`Done with allCustomers with ${allCustomers.length} entries`);
                resolve();
            })
            .catch(reject);
    })
}

/**
 * Read from file the weekly data and assign each customer for that week to their respective zone.
 * @param {string} filename filename name of file in ./data directory. if file is in sub-directory of ./data, precede the filename with sub-directory name. Include file extension in filename.
 * @returns {Promise<any>}
 */
function assignWeekDataToZone(filename) {
    return new Promise((resolve, reject) => {
        dataProvider.getWeeklyDataFromFile(filename, ['latitude', 'longitude'])
            .then(week => {
                let weekName = filename.replace('weeks/', '');
                for (let customer of week) {
                    if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
                        let zone = latLngRoute.get([customer.LATITUDE, customer.LONGITUDE]);
                        let index = zone ? findIndexOfRoute(zone) : findZoneIndexOf([customer.LATITUDE, customer.LONGITUDE]);
                        if (index === -1){}
                            // console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
                        else {
                            let properties = zoneGeoJSON.features[index].properties;
                            if (!properties.hasOwnProperty(weekName)) properties[weekName] = 0;
                            properties[weekName]++;
                            zoneGeoJSON.features[index].properties = properties;
                        }
                    }
                }
                console.log(`Done with ${weekName} with ${week.length} entries`);
                resolve();
            })
            .catch(reject)
    })
}

/**
 * Calculate density for each zone
 */
function calculateZoneDensity() {
    zoneGeoJSON.features.forEach(feature => {
        let customerCount = feature.properties.customerCount;
        for (let weekName of weeks) {
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
 * Save global zoneGeoJSON properties in .dbf file
 * @returns {*}
 */
function savePropertiesInDBF() {
    let allProperties = zoneGeoJSON.features.map(feature => {
        return feature.properties;
    });
    //WARN: dbf saves headers as long as 8 letters
    let buffer = dbf.structure(allProperties);
    let dbfPath = path.join(__dirname, '../data/MesaCityZonesDensity.dbf');

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

/**
 * Runs through data on all customers and recorded pick ups in each available week. Records the count of entries in geoJSON and then saves the geoJSON in file
 * @returns {Promise<any>}
 */
function preprocess() {
    return new Promise((resolve, reject) => {
        dataProvider.getCityGeoJSON()
            .then(geoJSON => {
                zoneGeoJSON = geoJSON;
                //  if assigning all customer data finishes first then let assignWeekDataToZone() save to dbf
                assignCustomerToZone()
                    .then(() => {
                        if (isFirstToFinish) {
                            isFirstToFinish = false;
                        } else {
                            calculateZoneDensity();
                            savePropertiesInDBF();
                        }
                    });
            })
            .then(() => {
                fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
                    if (error) reject(error);
                    weeks = filenames;
                    let apply = filenames.map(filename => {
                        return assignWeekDataToZone(`weeks/${filename}`);
                    });

                    //  if assigning all week data finishes first then let assignCustomerToZone() save to dbf
                    Promise.all(apply)
                        .then(() => {
                            if (isFirstToFinish) {
                                isFirstToFinish = false;
                            } else {
                                calculateZoneDensity();
                                savePropertiesInDBF();
                            }
                            resolve(zoneGeoJSON);
                        })
                        .catch(reject);
                })
            })
            .catch(reject)
    });
}

module.exports = {
    run: preprocess
};

let timer = new utils.Timer().startTimer();
preprocess().then(() => {
    console.log(`Done in ${timer.stopTimer()} seconds`);
}).catch(console.error);
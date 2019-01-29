// calculate density for each zone

/*
    feature: {
        properties: {
            customers: count,
            weeks: {
             week n: {
                    count:
                    density:
                }
            }
        }
    }
 */

const dataProvider = require('../data/provider');
const Polygon = require('../utils').Polygon;
const fs = require('fs');
const path = require('path');
const dbf = require('dbf');
const camelcase = require('../utils').Camelcase;

let zoneGeoJSON;
let allCustomers;

function findZoneIndexOf(coord) {
    let length = zoneGeoJSON.features.length;
    let index = -1, continueFind = true;
    while (continueFind && index < length - 1) {
        index++;
        let polygon = new Polygon(zoneGeoJSON.features[index].geometry.coordinates[0]);
        let reversedCoord = [coord[1], coord[0]];
        continueFind = !polygon.contains(reversedCoord);
    }
    return continueFind ? -1 : index;
}

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

function preprocess() {
    return new Promise((resolve, reject) => {
        dataProvider.getGeoJSONFromFile()
            .then(geoJSON => {
                zoneGeoJSON = geoJSON;
            })
            .then(() => {
                fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
                    if (error) reject(error);
                    let apply = filenames.map(filename => {
                        filename = camelcase(filename);
                        return assignWeekDataToZone(filename);
                    });
                    apply.unshift(dataProvider.getAllCustomers(['latitude', 'longitude']));
                    Promise.all(apply).then(values => {
                        allCustomers = values[0];
                        assignCustomerToZone();
                        return zoneGeoJSON;
                    })
                        .then(() => {
                            let allProperties = zoneGeoJSON.features.map(feature => {
                                return feature.properties;
                            });
                            //WARN: dbf saves headers as long as 8 letters
                            let buffer = dbf.structure(allProperties);
                            let dbfPath = path.join(__dirname, '../data/GreenWasteRoutes.dbf');

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
                    })
                        .then(resolve)
                })
            })
            .catch(reject);
    });
}

module.exports = {
    run: preprocess
};

preprocess().then(geoJson => {
    console.log('Done!')
}).catch(console.error);
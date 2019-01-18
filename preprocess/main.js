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
const Polgon = require('../utils').Polygon;
const fs = require('fs');
const path = require('path');

let zoneGeoJSON;
let allCustomers;

function findZoneIndexOf(coord) {
    let length = zoneGeoJSON.features.length;
    let index = -1, continueFind = true;
    while (continueFind && index < length - 1) {
        index++;
        let polygon = new Polgon(zoneGeoJSON.features[index].geometry.coordinates[0]);
        continueFind = !polygon.contains(coord);
    }
    return continueFind ? -1 : index;
}

function assignCustomerToZone() {
    for (let customer of allCustomers) {
        if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
            let index = findZoneIndexOf([customer.LATITUDE, customer.LONGITUDE]);
            if (index === -1)
                console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
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
                        if (index === -1)
                            console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
                        else {
                            let properties = zoneGeoJSON.features[index].properties;
                            if (!properties.hasOwnProperty('weeks')) properties.weeks = {};
                            if (!properties.weeks.hasOwnProperty(filename)) properties.weeks[filename] = {};
                            if (!properties.weeks[filename].hasOwnProperty('count')) properties.weeks[filename].count = 0;
                            properties.weeks[filename].count++;
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
                        return assignWeekDataToZone(filename);
                    });
                    apply.unshift(dataProvider.getAllCustomers(['latitude', 'longitude']));
                    Promise.all(apply).then(values => {
                        allCustomers = values[0];
                        assignCustomerToZone();
                        resolve(zoneGeoJSON);
                    })
                })
            })
            .catch(reject);
    });
}

module.exports = {
    run: preprocess
};

preprocess().then(console.log);
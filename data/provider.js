// get data based on type and location provided
const excelCustomerSchema = require('./customer_schema');
const readXlsxFile = require('read-excel-file');
const utils = require('../utils');
const fs = require('fs');
const csv = require('csv-parser');
const shapefile = require('shapefile');
const proj4 = require('proj4');
const path = require('path');

let zoneGeoJSON;
let coordProjection;
let shpFilePath = path.join(__dirname, './GreenWasteRoutes.shp');
let dbfFilePath = path.join(__dirname, './GreenWasteRoutes.dbf');

function getExcelData(path, schema) {
    return new Promise((resolve, reject) => {
        let excelSchema = {};

        (function processSchema() {
            let transformedSchema = schema.map(property => {
                return property.trim().toUpperCase().replace(' ', '_');
            });
            for (let property of transformedSchema) {
                if (excelCustomerSchema.hasOwnProperty(property)) {
                    excelSchema[property] = utils.CloneObject(excelCustomerSchema[property]);
                }
                else {
                    console.warn(`Property "${property}" is not valid. Check schema.`);
                }
            }
        }());

        if (!excelSchema) {
            reject('Invalid schema format provided');
        }
        //FIXME: throws error about opening excel file
        readXlsxFile(fs.createReadStream(path), {schema: excelSchema}).then(({rows, errors}) => {
            if (errors.length !== 0) {
                reject(`Error reading excel file "${path}" at ${errors[0]}`);
            }
            resolve(rows);
        })
    });
}

function getCSVData(path, schema) {
    return new Promise(resolve => {
        let data = [];
        let csvCustomerSchema = {};
        let csvSchema = [];
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });

        function convertRequestedSchema(headers) {
            for (let header of headers) {
                let prop = header.trim().toUpperCase().replace(' ', '_');
                csvCustomerSchema[prop] = {
                    prop: prop,
                    location: headers.indexOf(header)
                }
            }
            for (let prop of transformedSchema) {
                if (csvCustomerSchema.hasOwnProperty(prop)) {
                    csvSchema.push(headers[csvCustomerSchema[prop].location]);
                }
            }
        }

        fs.createReadStream(path)
            .pipe(csv())
            .on('headers', headers => {
                convertRequestedSchema(headers);
            })
            .on('data', row => {
                let requested = {};
                for (let property of csvSchema) {
                    if (row.hasOwnProperty(property)) {
                        let standardProperty = property.trim().toUpperCase().replace(' ', '_');
                        requested[standardProperty] = row[property];
                    } else {
                        console.warn(`Property "${property}" is not valid. Check schema.`);
                    }
                }
                data.push(requested);
            })
            .on('end', () => {
                resolve(data);
            });
    });
}

function readFile(path, schema) {
    return new Promise((resolve, reject) => {
        let type;
        function extractExtension() {
            let regex = /(.csv)|(.xlsx)$/g;
            let foundExtension = path.match(regex);
            if (foundExtension === null) {
                reject('File extension is expected in file path. if present, check for correctness.');
            }
            type = foundExtension[0];
            if (!['.csv', '.xlsx'].includes(type)) {
                reject('Provided type is not supported.');
            }
        }
        (function validatePath() {
            if (!path) {
                reject('Path is not provided.');
            }
            extractExtension();
            let directory = path.replace(type, '');
            let regex = /([a-zA-Z0-9\s_\\.\-\(\):])+/g;
            if (!regex.test(directory)) {
                reject('File name is empty');
            }
        }());
        switch (type) {
            case '.xlsx':
                getExcelData(path, schema).then(resolve).catch(reject);
                break;
            case '.csv':
                getCSVData(path, schema).then(resolve).catch(reject);
                break;
        }
    });
}

function readDatabase() {return}

function getProjection() {
    return new Promise((resolve, reject) => {
        if (coordProjection) resolve(coordProjection);
        let prjFile = path.join(__dirname, './GreenWasteRoutes.prj');
        fs.readFile(prjFile, 'utf8', (error, data) => {
            if (error) reject(error);
            coordProjection = data;
            resolve(coordProjection);
        })
    })
}

function transformCoordinates(coord) {
    return proj4(coordProjection).inverse(coord);
}

function transformFeatureCoordinates(feature) {
    function parsePointCoord() {
        feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates)
    }

    function parseLineStringCoord() {
        feature.geometry.coordinates = feature.geometry.coordinates.map(coord => {
            return transformCoordinates(coord);
        });
    }

    function parsePolygonCoord() {
        feature.geometry.coordinates[0] = feature.geometry.coordinates[0].map(coord => {
            return transformCoordinates(coord);
        });
    }
    switch (feature.geometry.type) {
        case 'Point':
            parsePointCoord();
            break;
        case 'LineString':
            parseLineStringCoord();
            break;
        case 'Polygon':
            parsePolygonCoord();
            break;
    }
    return feature;
}

function getZone() {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        shapefile.read(shpFilePath, dbfFilePath)
            .then(geoJSON => {
                zoneGeoJSON = geoJSON;
                resolve(zoneGeoJSON);
            })
            .catch(error => {
                console.error(error.stack);
                reject(error.stack)
            })
    });
}

function readGeoJSON() {
    return new Promise(resolve => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        Promise.all([getProjection(), getZone()])
            .then(() => {
                zoneGeoJSON.features = zoneGeoJSON.features.map(feature => {
                    return transformFeatureCoordinates(feature);
                });
                resolve(zoneGeoJSON);
            });
    })
}

function readCustomersFile(schema) {
    let filePath = path.join(__dirname, '/allcustomers.csv');
    return new Promise((resolve, reject) => {
        readFile(filePath, schema)
            .then(resolve)
            .catch(reject);
    })
}

module.exports = {
    getWeeklyDataFromFile: readFile,
    getWeeklyDataFromDatabase: readDatabase,
    getAllCustomers: readCustomersFile,
    getGeoJSONFromFile: readGeoJSON
};
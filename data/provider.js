// get data based on type and location provided
const excelCustomerSchema = require('./customer_schema');
const readXlsxFile = require('read-excel-file');
const XLSX = require('xlsx');
const utils = require('../utils');
const fs = require('fs');
const csv = require('csv-parser');
const shapefile = require('shapefile');
const proj4 = require('proj4');
const path = require('path');

let zoneGeoJSON;
let coordProjection;
let shpFilePath = path.join(__dirname, './GreenWasteRoutes.shp');
let originalDbfFilePath = path.join(__dirname, './GreenWasteRoutesOriginal.dbf');
let dbfFilePath = path.join(__dirname, './GreenWasteRoutes.dbf');

function getExcelData(path, schema) {
    return new Promise((resolve, reject) => {
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });
        let workbook = XLSX.readFile(path);
        //  check if there are more than 1 worksheets in excel file
        if (workbook.SheetNames.length > 1) {
            reject("Excel file has more than one worksheet. Parsing multiple worksheets within same file is not supported yet");
        }
        let rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});

        //  find intersection between schema and rows. That must be the header row
        //  if no intersection, either schema is incorrect or file doesn't have header row
        function findHeaderRow() {
            let result = {};
            result.headerIndex = rows.findIndex(row => {
                //  capitalize each string on current row
                let modified = row.map(value => {
                    if (typeof value === "string")
                        return value.trim().toUpperCase().replace(' ', '_');
                    return value;
                });
                let schemaIndex = {};
                function findSchemaInRow(schemaProp) {
                    if (modified.includes(schemaProp)) {
                        schemaIndex[schemaProp] = modified.indexOf(schemaProp);
                        return true;
                    }
                    return false;
                }
                //  if every schema property is found in current row,
                // save index of schema properties
                if (transformedSchema.every(findSchemaInRow)) {
                    result.schemaIndex = schemaIndex;
                    return true;
                }
                return false;
            });

            if (result.headerIndex === -1) {
                reject("Excel file doesn't have a header row.")
            }
            return result;
        }

        let headerProp = findHeaderRow();
        let data = [];
        //  populate data with values at every row after the header row that have the schema indices
        rows.slice(headerProp.headerIndex + 1).forEach((row, rowIndex) => {
            let dataRow = {};
            Object.keys(headerProp.schemaIndex).forEach(schemaProp => {
                let index = headerProp.schemaIndex[schemaProp];
                if (row[index] !== undefined) {
                    dataRow[schemaProp] = row[index];
                } else {
                    console.warn(`Schema property '${schemaProp}' is not available at row ${rowIndex} and column ${index}.`);
                    dataRow[schemaProp] = null;
                }
            });
            data.push(dataRow);
        });
        resolve(data);
    })
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

function getZone(preprocessed) {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        let filePath = preprocessed ? dbfFilePath : originalDbfFilePath;
        shapefile.read(shpFilePath, filePath)
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

function readGeoJSON(preprocessed) {
    return new Promise(resolve => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        Promise.all([getProjection(), getZone(preprocessed)])
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
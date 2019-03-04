/**
 * Module dependencies
 */
const XLSX = require('xlsx');
const fs = require('fs');
const csv = require('csv-parser');
const Shapefile = require('shapefile');
const Proj4 = require('proj4');
const path = require('path');
const jsonfile = require('jsonfile');
const utils = require('../utils');

/**
 * Global variables
 */
let zoneGeoJSON;
let coordProjection;

/**
 * Define file paths
 */
let shpFilePath = path.join(__dirname, './MesaCityZones.shp');
let originalDbfFilePath = path.join(__dirname, './MesaCityZones.dbf');
let dbfFilePath = path.join(__dirname, './MesaCityZonesPreprocessed.dbf');

/**
 * Reads an excel file at path
 * @param {string} filepath path to file
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<Object[]>}
 */
function getExcelData(filepath, schema) {
    return new Promise((resolve, reject) => {
        //  transform the schema to be consistent, i.e. capitalize hyphenated
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });
        //  read file
        let workbook = XLSX.readFile(filepath);

        //  if there are more than 1 worksheets in excel file, reject promise
        if (workbook.SheetNames.length > 1) {
            reject("Excel file has more than one worksheet. Parsing multiple worksheets within same file is not supported yet");
        }

        let rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1});

        /**
         * Find intersection between schema and rows. That must be the header row.
         * if no intersection, either schema is incorrect or file doesn't have header row
         */
        function findHeaderRow() {
            let result = {};

            // go through every row in the excel file to find the row that has similar schema properties
            result.headerIndex = rows.findIndex(row => {
                //  capitalize each string on current row to be consistent with schema
                let modified = row.map(value => {
                    if (typeof value === "string")
                        return value.trim().toUpperCase().replace(' ', '_');
                    return value;
                });

                let schemaIndex = {};

                /**
                 * Finds schema property in current row of excel sheet and keeps track of property's index
                 * @param schemaProp schema property to search for
                 * @returns {boolean}
                 */
                function findSchemaInRow(schemaProp) {
                    if (modified.includes(schemaProp)) {
                        schemaIndex[schemaProp] = modified.indexOf(schemaProp);
                        return true;
                    }
                    return false;
                }

                // apply function to every schema property
                if (transformedSchema.every(findSchemaInRow)) {
                    //  current row has every schema property.
                    //  propagate schema properties index on current row
                    result.schemaIndex = schemaIndex;
                    //  end 'findIndex' function at current row and row's index will be header's index
                    return true;
                }
                // at this point, none of the rows in the excel file has the header. -1 will be returned
                return false;
            });

            //  header row is not found in the excel file
            if (result.headerIndex === -1) {
                reject("Excel file doesn't have a header row.")
            }
            return result;
        }

        //  get index of row in excel file containing the headers(schema) and the index of each schema property on that row
        let headerProp = findHeaderRow();

        let data = [];

        //  from the header row to the end of the file, save values on every row that has indices of the schema properties
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

/**
 * Reads an csv file at path
 * @param {string} filepath path to file
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<Object[]>}
 */
function getCSVData(filepath, schema) {
    return new Promise(resolve => {
        let data = [];
        let csvCustomerSchema = {};
        let csvSchema = [];

        //  transform the schema to be consistent, i.e. capitalize hyphenated
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });

        /**
         * Convert schema properties to the same format as defined in the csv file.
         * For example, schema = ['latitude'], csv file has 'LATitude' as header.
         * Then convert 'latitude' to match 'LATitude'
         * @param headers headers of the csv file
         */
        function convertRequestedSchema(headers) {
            for (let header of headers) {
                let prop = header.trim().toUpperCase().replace(' ', '_');
                //  convert headers to the consistent schema format: capitalize hyphenated
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

        fs.createReadStream(filepath)
            .pipe(csv())
            .on('headers', headers => {
                convertRequestedSchema(headers);
            })
            .on('data', row => {
                let requested = {};
                for (let property of csvSchema) {
                    if (row.hasOwnProperty(property)) {
                        // convert property format to consistent schema format: capitalize hyphenated
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

/**
 * Supports reading from excel and csv files
 * @param {string} filepath path to file
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<Object[]>}
 */
function readFile(filepath, schema) {
    return new Promise((resolve, reject) => {
        let type = utils.ExtractExtension('csv') || utils.ExtractExtension('xlsx');
        if (!utils.ValidatePath(filepath, type)) {
            reject('Provided path is invalid');
        }
        switch (type) {
            case '.xlsx':
                getExcelData(filepath, schema).then(resolve).catch(reject);
                break;
            case '.csv':
                getCSVData(filepath, schema).then(resolve).catch(reject);
                break;
            default: reject('Provided type is not supported.');
        }
    });
}

/**
 * Read from database /to be implemented/
 */
function readDatabase() {return}

/**
 * Read .prj file for projection definition.
 * @returns {Promise<any>}
 */
function getProjection() {
    return new Promise((resolve, reject) => {
        //  to avoid reading file every time, save content in a variable
        if (coordProjection) resolve(coordProjection);
        let prjFile = path.join(__dirname, './MesaCityZones.prj');
        fs.readFile(prjFile, 'utf8', (error, data) => {
            if (error) reject(error);
            coordProjection = data;
            resolve(coordProjection);
        })
    })
}

/**
 * Transform coordinate from WGS84 system to latitude and longitude using projection from .prj file.
 * Make sure that the projection is available before calling this function
 * @param {Coord} coord
 * @returns {[]}
 */
function transformCoordinates(coord) {
    return coordProjection ? Proj4(coordProjection).inverse(coord) : null;
}

/**
 *  Transforms the coordinate of provided feature to latitude and longitude
 *
 * @param {Object} feature
 * @returns {Object} returns the same feature, but with transformed coordinates
 */
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

/**
 * Read ShapeFile of zone and integrate with data in .dbf file
 * @param {boolean} preprocessed if true, preprocessed zone is returned
 * @returns {Promise<any>}
 */
function getZones(preprocessed) {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        let filePath = preprocessed ? dbfFilePath : originalDbfFilePath;
        Shapefile.read(shpFilePath, filePath)
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

/**
 * Reads from file the geoJSON of zone and transforms the coordinates to latitude and longitude
 * @param {boolean} preprocessed if true, preprocessed zone is returned
 * @returns {Promise<any>}
 */
function readGeoJSON(preprocessed) {
    return new Promise(resolve => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        Promise.all([getProjection(), getZones(preprocessed)])
            .then(() => {
                zoneGeoJSON.features = zoneGeoJSON.features.map(feature => {
                    return transformFeatureCoordinates(feature);
                });
                resolve(zoneGeoJSON);
            });
    })
}

/**
 * Reads from file all customers
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<any>}
 */
function readCustomersFile(schema) {
    let filePath = path.join(__dirname, '/allcustomers.csv');
    return new Promise((resolve, reject) => {
        readFile(filePath, schema)
            .then(resolve)
            .catch(reject);
    })
}

function readJSON(filename) {
    return new Promise((resolve, reject) => {
        if(!utils.ExtractExtension(filename, 'json')) {
            reject('Provided file is not a JSON file')
        }
        let filepath = path.join(__dirname, filename);
        jsonfile.readFile(filepath).then(resolve).catch(reject);
    });
}

module.exports = {
    getWeeklyDataFromFile: readFile,
    getWeeklyDataFromDatabase: readDatabase,
    getAllCustomers: readCustomersFile,
    getGeoJSONFromFile: readGeoJSON,
    getJSONFromFile: readJSON
};
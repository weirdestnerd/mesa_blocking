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

/**
 * Reads an excel file at path
 * @param {string} filepath path to file
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<Object[]>}
 */
function getExcelData(filepath, schema) {
    return new Promise((resolve, reject) => {
        let fileType = utils.ExtractExtension(filepath, 'xlsx');
        if (!utils.ValidatePath(filepath, fileType)) {
            reject('Provided path is invalid');
        }
        if (!schema) reject('Schema is not provided.');
        //  transform the schema to be consistent, i.e. capitalize hyphenated
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });
        //  read file
        let workbook = XLSX.readFile(filepath, {cellDates: true});

        //  if there are more than 1 worksheets in excel file, reject promise
        if (workbook.SheetNames.length > 1) {
            reject("Excel file has more than one worksheet. Parsing multiple worksheets within same file is not supported yet");
        }

        let rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1, raw: false});

        /**
         * Find intersection between schema and rows. That must be the header row.
         * if no intersection, either schema is incorrect or file doesn't have header row
         * @returns {Object} an object with index of row of the header and the indices of each property found in that row
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

                let schemaIndices = {};

                /**
                 * Finds schema property in current row of excel sheet and keeps track of property's index
                 * @param schemaProp schema property to search for
                 * @returns {boolean}
                 */
                function findSchemaInRow(schemaProp) {
                    if (modified.includes(schemaProp)) {
                        schemaIndices[schemaProp] = modified.indexOf(schemaProp);
                        return true;
                    }
                    return false;
                }

                // apply function to every schema property
                if (transformedSchema.every(findSchemaInRow)) {
                    //  current row has every schema property.
                    //  propagate schema properties index on current row
                    result.schemaIndices = schemaIndices;
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

        let header = findHeaderRow();
        let data = [];

        /**
         * Adds object from rows to data[]
         * @param {Object} row
         * @param {number} rowIndex index of row in rows
         */
        function addToDataArray(row, rowIndex) {
            let dataRow = {};
            Object.keys(header.schemaIndices).forEach(schemaProp => {
                let index = header.schemaIndices[schemaProp];
                if (row[index] !== undefined) {
                    dataRow[schemaProp] = row[index];
                } else {
                    console.warn(`Schema property '${schemaProp}' is not available at row ${rowIndex + 1} and column ${index + 1}.`);
                    dataRow[schemaProp] = null;
                }
            });
            data.push(dataRow);
        }

        /**
         * Recursively split the start and end at the middle and add to data[]
         * @param start
         * @param end
         */
        function populateDataArray(start, end) {
            if (!start || !end) {
                reject(Error('Missing parameter'));
            }
            if (start === end) {
                return addToDataArray(rows[start], start);
            }
            if (start > end) {
                let difference = end - start;
                start = start - difference;
                end = end + difference;
            }
            let middle = start + Math.floor((end - start) / 2);

            populateDataArray(start, middle);
            populateDataArray(middle + 1, end);
        }

        //  from the header row to the end of the file, save values on every row that has indices of the schema properties
        populateDataArray(header.headerIndex + 1, rows.length - 1);
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
    return new Promise((resolve, reject) => {
        let fileType = utils.ExtractExtension(filepath, 'csv');
        if (!utils.ValidatePath(filepath, fileType)) {
            reject('Provided path is invalid');
        }
        if (!schema) reject('Schema is not provided.');
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
 * @param {string} filename name of file in ./data directory. if file is in sub-directory of ./data, precede the filename with sub-directory name. Include file extension in filename.
 * @param {Object} schema schema specifying keys of key-value result to return
 * @returns {Promise<Object[]>}
 */
function readFile(filename, schema) {
    return new Promise((resolve, reject) => {
        let filepath = path.join(__dirname, filename);
        if(!fs.existsSync(filepath)) {
            reject('File does not exist in \'data\' directory ', filepath);
        }
        let type = utils.ExtractExtension(filename, 'csv') || utils.ExtractExtension(filename, 'xlsx');
        if (!utils.ValidatePath(filename, type)) {
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
function getMesaCityProjection() {
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
 * @param {string} [preprocessed] if provided, preprocessed zone of provided string is fetched
 * @returns {Promise<any>}
 */
function getZones(preprocessed) {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        if (preprocessed && (typeof preprocessed !== 'string')) {
            reject('Preprocessed value must be a string');
        }
        if (preprocessed && preprocessed.length === 0) {
            reject('Can not get preprocessed zone for empty value');
        }
        preprocessed = preprocessed ? utils.Camelcase(preprocessed) : '';
        let filePath = path.join(__dirname, `./MesaCityZones${preprocessed}.dbf`);
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
 * @param {string} [preprocessed] if provided, preprocessed zone of provided string is fetched for the geoJSON
 * @returns {Promise<any>}
 */
function readGeoJSON(preprocessed) {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        if (preprocessed && (typeof preprocessed !== 'string')) {
            reject('Preprocessed value must be a string');
        }
        if (preprocessed && preprocessed.length === 0) {
            reject('Can not get preprocessed zone for empty value');
        }
        Promise.all([getMesaCityProjection(), getZones(preprocessed)])
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
    return new Promise((resolve, reject) => {
        readFile('allcustomers.csv', schema)
            .then(resolve)
            .catch(reject);
    })
}

/**
 * Reads JSON file
 * @param {string} filename name of JSON file in ./data directory. if file is in sub-directory of ./data, precede the filename with sub-directory name. Include file extension in filename.
 * @returns {Promise<any>}
 */
function readJSON(filename) {
    return new Promise((resolve, reject) => {
        if(!utils.ExtractExtension(filename, 'json')) {
            reject('Provided file is not a JSON file')
        }
        let filepath = path.join(__dirname, filename);
        jsonfile.readFile(filepath).then(resolve).catch(reject);
    });
}

/**
 * Find the intersection between all customers and the customers in the specified week name.
 * @param {String} weekname Name of week to compare
 */
function countFiles(weekname) {
    readCustomersFile(['latitude', 'longitude'])
        .then(customers => {
            readFile('weeks/'+weekname, ['latitude', 'longitude'])
                .then(week => {
                    let intersect = customers.filter(loc => week.findIndex(p => p.LATITUDE === loc.LATITUDE && p.LONGITUDE === loc.LONGITUDE) !== -1);
                    console.log('intersects: ', intersect.length);
                    console.log('allCustomers: ', customers.length, 'week: ', week.length)
                })
        })
}

module.exports = {
    getData: readFile,
    getWeeklyDataFromDatabase: readDatabase,
    getAllCustomers: readCustomersFile,
    getCityGeoJSON: readGeoJSON,
    getJSONFromFile: readJSON
};
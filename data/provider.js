// get data based on type and location provided
const customerSchema = require('./customer_schema');
const readXlsxFile = require('read-excel-file');
const utils = require('../utils');
const fs = require('fs');
const csv = require('csv-parser');

function getExcelData(path, schema) {
    return new Promise((resolve, reject) => {
        let excelSchema = {};

        (function processSchema() {
            let transformedSchema = schema.map(property => {
                return property.trim().toUpperCase().replace(' ', '_');
            });
            for (let property of transformedSchema) {
                if (customerSchema.hasOwnProperty(property)) {
                    excelSchema[property] = utils.CloneObject(customerSchema[property]);
                }
                else {
                    console.warn(`Property "${property}" is not valid.`);
                }
            }
        }());

        if (!excelSchema) {
            reject('Invalid schema format provided');
        }
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
        let transformedSchema = schema.map(property => {
            return property.trim().toUpperCase().replace(' ', '_');
        });
        fs.createReadStream(path)
            .pipe(csv())
            .on('data', row => {
                let requested = {};
                for (let property of transformedSchema) {
                    if (row.hasOwnProperty(property)) {
                        requested[property] = row[property];
                    } else {
                        console.warn(`Property "${property}" is not valid.`);
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

function readDatabase() {}

module.exports = {
    getFromFile: readFile,
    getFromDatabase: readDatabase,
};

// readFile('./test.csv', ['latitude', 'longitude']).then(console.log).catch(console.log);
// readFile('./test.xlsx', ['latitude', 'longitude']).then(console.log).catch(console.log);

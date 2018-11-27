// get data based on type and location provided
const customerSchema = require('./customer_schema');
const readXlsxFile = require('read-excel-file');
const utils = require('../utils');
const fs = require('fs');
const csv = require('csv-parser');

function getExcelData(path, schema) {
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
                console.warn(`Property ${property} is not valid.`);
            }
        }
    }());

    if (!excelSchema) {
        console.error('Invalid schema format provided');
        return;
    }

    readXlsxFile(fs.createReadStream(path), {schema: excelSchema}).then(({rows, errors}) => {
    //    TODO:
        console.log(rows[0]);
    })
}

async function getCSVData(path, schema) {
    let data = [];
    let transformedSchema = schema.map(property => {
        return property.trim().toUpperCase().replace(' ', '_');
    });
    //TODO: return data from stream // or return promise
    await fs.createReadStream(path)
        .pipe(csv())
        .on('data', row => {
            let requested = {};
            for (let property of transformedSchema) {
                requested[property] = row[property];
            }
            data.push(requested);
        })
        .on('end', () => {
            console.log(`This is data: ${data}`);
            return data;
        });
    console.log(`afterwards ${data}`);
    return data;
}

async function get(type, path, schema) {
    type = type.toLowerCase().trim();
    if (!['csv', 'excel', 'sql'].includes(type)) {
        console.error('Provided type is not supported.');
        return;
    }
    if (!path) {
        console.error('Path is not provided.');
        return;
    }
    switch (type) {
        case 'excel':
            return getExcelData(path, schema);
        case 'csv':
            return await getCSVData(path, schema);
        case 'sql':
            break;
    }
}


module.exports = {
    get: get
};

let d = get('csv', './test.csv', ['latitude', 'longitude']);
console.log(d.then(console.log));
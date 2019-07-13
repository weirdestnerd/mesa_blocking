const dbf = require('dbf');
const path = require('path');
const fs = require('fs');
const dataProvider = require('../_data/provider');


function saveToDBF(features, destination) {
    //WARN: dbf saves headers as long as 8 letters
    let buffer = dbf.structure(features);
    let dbfPath = path.join(__dirname, destination);

    //    create buffer for dbf
    function toBuffer(ab) {
        let buffer = Buffer.alloc(ab.byteLength);
        let view = new Uint8Array(ab);
        for (let i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
    }

    fs.writeFileSync(dbfPath, toBuffer(buffer.buffer));
}

/**
 * Adds columns from a csv file to a dbf file
 * @param {string} source csv file to read from. File must be in 'data/' directory
 * @param {string} destination dbf file to merge to. Destination is with relative to this path
 * @param {Array} columns list of columns to merge
 */
function mergeCSVToDBF(source, destination, columns) {
    if (!source || !destination || !columns) {
        console.error(`All parameters are required`);
    }
//    read csv file & extract specified columns => [ {name:value} ... ]
    Promise.all([dataProvider.getData(source, columns), dataProvider.getCityGeoJSON()])
        .then(data => {
            let csvValues = data[0];
            let zoneGeoJSON = data[1];

            // combine columns to geoJSON
            let mergedFeatures = zoneGeoJSON.features.concat(csvValues);
            saveToDBF(mergedFeatures, destination);
        })
        .catch(console.error);
}

/**
 * not a function. needed to convert to specific feature
 */
function mine() {
    let columns = ['UNIQUEID', 'NUMBER_OF_', 'FULL_ADDRE', 'CITY', 'STREET_NUM', 'STREET_DIR', 'STREET_NAM', 'STREET_TYP', 'STREET_POS', 'UNIT_TYPE', 'UNIT_BUILD', 'LATITUDE', 'LONGITUDE', 'X_COORDINA', 'Y_COORDINA', 'DAY', 'ROUTE'];
    Promise.all([
        dataProvider.getData('allcustomers.csv', columns),
        dataProvider.getCityGeoJSON()
    ]).then(data => {
        let customers = data[0];
        let zoneGeoJSON = data[1];

        let customerAsFeatures = customers.map(customer => {
            let feature = {
                "type": "feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [parseFloat(customer.LATITUDE), parseFloat(customer.LONGITUDE)]
                }
            };
            delete customer.LATITUDE;
            delete customer.LONGITUDE;
            feature['properties'] = customer;
            return feature;
        });
        let mergedFeatures = zoneGeoJSON.features.concat(customerAsFeatures);
        saveToDBF(mergedFeatures, '../_data/map.dbf')
    })
}
const dataProvider = require('../_data/provider');
const path = require('path');
const utils = require('../utils');
const jsonfile = require('jsonfile');
const fs = require('fs');

let zoneGeoJSON;

/**
 * Save global zoneGeoJSON in JSON file
 */
function saveCityZonesAsJSON() {
    let filepath = path.join(__dirname, '../_data/json');
    if(!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath)
    }
    filepath = path.join(__dirname, '../_data/json/CityZonesGeoJSON.json');
    jsonfile.writeFile(filepath, zoneGeoJSON)
        .catch(console.error);
}

function preprocess() {
    return new Promise((resolve, reject) => {
        dataProvider.getCityGeoJSON()
            .then(allCustomers => {
                zoneGeoJSON = allCustomers;
                saveCityZonesAsJSON();
                resolve();
            })
            .catch(reject);
    })
}

module.exports = {
    run: preprocess
};

if (process.mainModule.filename === __filename) {
    let timer = new utils.Timer().startTimer();
    preprocess().then(() => {
        console.log(`Done in ${timer.stopTimer()} seconds`);
    }).catch(console.error);
}

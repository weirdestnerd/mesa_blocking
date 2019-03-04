const dataProvider = require('../data/provider');
const utils = require('../utils');
const jsonfile = require('jsonfile');

let trucksJSON = {};
/*
{ type: 'Feature',
  properties:
   { OBJECTID: 1,
     GREEN_SVC: 'THURSDAY',
     Map_Name: 'HG84',
     GreenBarre: 'HG84 (THURSDAY)',
     FirstLoads: 'RAD',
     LastLoads: 'RAD',
     Shape_Leng: 71507.3357106,
     Shape_Area: 87510541.3132 },
  geometry: { type: 'Polygon', coordinates: [ [Array] ] } }

 */

/**
 * Populates an object with the properties of truck activities per week
 * @param filenames Names of the files for all the weeks to consider
 * @returns {Promise<any>}
 */
function createWeeklyTruckData(filename) {
    return new Promise((resolve, reject) => {
        let filePath = path.join(__dirname, '../data/weeks/' + filename);
        dataProvider.getWeeklyDataFromFile(filePath, [])
            .then(week => {
                for (let pickup of week) {
                //TODO:
                }
                resolve();
            })
            .catch(reject);
    })
}

/**
 * Save object in JSON file
 */
function savePropertiesInJSONFile() {
    let filepath = path.join(__dirname, '../data/TrucksData.json');
    jsonfile.writeFile(filepath, trucksJSON)
        .catch(console.error);
}

function preprocess() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
            if (error) reject(error);
            filenames = utils.ValidateFilenames(filenames, error => {
                if (error) reject(error)
            });
            let apply = filenames.map(filename => {
                return createWeeklyTruckData(filename);
            });
            Promise.all(apply)
                .then(() => {
                    savePropertiesInJSONFile();
                })
                .catch(reject);
        })
    })
}
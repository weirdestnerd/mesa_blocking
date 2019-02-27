const dataProvider = require('../data/provider');
const utils = require('../utils');

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
function createWeeklyTruckData(filenames) {
    return new Promise((resolve, reject) => {
    //TODO:
    })
}

/**
 * Save object in JSON file
 */
function savePropertiesInJSONFile() {
//TODO:
}

function preprocess() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
            if (error) reject(error);
            filenames = utils.ValidateFilenames(filenames, error => {
                if (error) reject(error)
            });
            createWeeklyTruckData(filenames)
                .then(() => {
                    savePropertiesInJSONFile();
                }).catch(reject);
        })
    })
}
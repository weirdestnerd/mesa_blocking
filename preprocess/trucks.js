/**
 * Module dependencies
 */
const dataProvider = require('../_data/provider');
const utils = require('../utils');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');

/**
 * Global dependencies
 */
let trucksJSON = {};

/**
 * Populates an object with the properties of truck activities per week
 * @param {string} filename name of file in ./data directory. if file is in sub-directory of ./data, precede the filename with sub-directory name. Include file extension in filename.
 * @returns {Promise<any>}
 */
function createWeeklyTruckData(filename) {
    /**
     * Convert digit to day of the week
     * @param {number} day
     * @returns {string}
     */
    function toDay(day) {
        switch (day) {
            case 0:
                return 'Sunday';
            case 1:
                return 'Monday';
            case 2:
                return 'Tuesday';
            case 3:
                return 'Wednesday';
            case 4:
                return 'Thursday';
            case 5:
                return 'Friday';
            case 6:
                return 'Saturday';
        }
        return '';
    }

    function isDate(value) {
        return new Date(value).toString() !== 'Invalid Date';
    }

    return new Promise((resolve, reject) => {
        let weekName = filename.replace('weeks/', '');
        trucksJSON[weekName] = {};
        dataProvider.getData(filename, ['vehicle', 'start date', 'can count', 'latitude', 'longitude', 'total seconds'])
            .then(week => {
                if (!week || week.length === 0) {
                    console.warn(`No record for ${filename}`);
                    return
                }

                let routes = [];
                let activeDays = {};

                for (let record of week) {
                    if (record.hasOwnProperty('VEHICLE') && record.VEHICLE && !isNaN(parseInt(record.VEHICLE))) {
                        let vehilceNum = parseInt(record.VEHICLE);
                        let truck = routes.find(route => route.vehicle === vehilceNum);
                        if (!truck) {
                            truck = {vehicle: vehilceNum, stops: {}, cans: 0, seconds: 0};
                        }
                        if (record.hasOwnProperty('START_DATE') && record.START_DATE && isDate(record.START_DATE)) {
                            let day = toDay(new Date(record.START_DATE).getDay());
                            if (!truck.stops.hasOwnProperty(day)) {
                                truck.stops[day] = [];
                            }
                            truck.stops[day].push([record.LATITUDE, record.LONGITUDE]);
                            if (activeDays.hasOwnProperty(day)) {
                                if (!activeDays[day].includes(vehilceNum)) {
                                    activeDays[day].push(vehilceNum);
                                }
                            } else {
                                activeDays[day] = [vehilceNum];
                            }
                        }
                        if (record.hasOwnProperty('CAN_COUNT') && record.CAN_COUNT) {
                            truck.cans += parseInt(record.CAN_COUNT);
                        }
                        if (record.hasOwnProperty('TOTAL_SECONDS') && record.TOTAL_SECONDS)
                            truck.seconds += parseInt(record.TOTAL_SECONDS);

                        let truckIndex = routes.findIndex(route => route.vehicle === vehilceNum);
                        if (truckIndex < 0) {
                            routes.push(truck);
                        } else routes[truckIndex] = truck;
                    }
                }
                trucksJSON[weekName].routes = routes;
                trucksJSON[weekName].activeDays = activeDays;
                console.log(`Done with ${weekName} with ${week.length} entries`);
                resolve();
            })
            .catch(reject);
    })
}

/**
 * Save object in JSON file
 */
function savePropertiesInJSONFile() {
    let filepath = path.join(__dirname, '../data/json');
    if(!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath)
    }
    filepath = path.join(__dirname, '../data/json/TrucksAndRoutes.json');
    jsonfile.writeFile(filepath, trucksJSON)
        .catch(console.error);
}

function preprocess() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname, '../data/weeks/'), (error, filenames) => {
            if (error) reject(error);

            let apply = filenames.map(filename => {
                return createWeeklyTruckData(`weeks/${filename}`);
            });

            Promise.all(apply)
                .then(() => {
                    savePropertiesInJSONFile();
                    resolve();
                })
                .catch(reject);
        })
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
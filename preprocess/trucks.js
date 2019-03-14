const dataProvider = require('../data/provider');
const utils = require('../utils');
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');

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
    }

    function isDate(value) {
        return new Date(value).toString() !== 'Invalid Date';
    }

    return new Promise((resolve, reject) => {
        let filePath = path.join(__dirname, '../data/weeks/' + filename);
        let weekName = filename.replace(/(.csv)|(.xlsx)$/g, '');
        console.log('processing ' + weekName);
        trucksJSON[weekName] = {};
        dataProvider.getWeeklyDataFromFile(filePath, ['vehicle', 'start date', 'can count', 'latitude', 'longitude', 'total seconds'])
            .then(week => {
                // when start time toggles from pm to am, it's new day.
                if (!week || week.length === 0) {
                    console.warn(`No record for ${filename}`);
                    return
                }

                let routes = [];
                let activeDays = {};

                for (let record of week) {
                    if (record.hasOwnProperty('VEHICLE') && record.VEHICLE) {
                        let truck = routes.find(route => route.vehicle === record.VEHICLE);
                        if (!truck) {
                            if (!isNaN(parseInt(record.VEHICLE)))
                                truck = {vehicle: parseInt(record.VEHICLE), stops: {}, cans: 0, seconds: 0};
                            else continue;
                        }
                        if (record.hasOwnProperty('START_DATE') && record.START_DATE && isDate(record.START_DATE)) {
                            let day = toDay(new Date(record.START_DATE).getDay());
                            if (!truck.stops.hasOwnProperty(day)) {
                                truck.stops[day] = [];
                            }
                            truck.stops[day].push([record.LATITUDE, record.LONGITUDE]);
                            if (activeDays.hasOwnProperty(day)) {
                                if (!activeDays[day].includes(record.VEHICLE)) {
                                    activeDays[day].push(record.VEHICLE);
                                }
                            } else {
                                activeDays[day] = [record.VEHICLE];
                            }
                        }
                        if (record.hasOwnProperty('CAN_COUNT') && record.CAN_COUNT) {
                            truck.cans += parseInt(record.CAN_COUNT);
                        }
                        if (record.hasOwnProperty('TOTAL_SECONDS') && record.TOTAL_SECONDS)
                            truck.seconds += parseInt(record.TOTAL_SECONDS);

                        let truckIndex = routes.findIndex(route => route.vehicle === record.VEHICLE);
                        if (truckIndex < 0) {
                            routes.push(truck);
                        } else routes[truckIndex] = truck;
                    }
                }
                trucksJSON[weekName].routes = routes;
                trucksJSON[weekName].activeDays = activeDays;
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

preprocess().then(() => {console.log('done');})
const dataProvider = require('../_data/provider');
const createCSVWriter = require('csv-writer').createArrayCsvWriter;
const utils = require('../utils');
const path = require('path');

let currentWeekBuffer = [];
let weekStartDate = null;

let schema = ['start date', 'start time', 'duration', 'vehicle', 'total seconds', 'can count', 'latitude', 'longitude', 'speed'];

/**
 * Checks if nextDate indicates the succeeding week of currentDate
 * @param currentDate
 * @param nextDate
 */
function isNewWeek(currentDate, nextDate) {
    return (nextDate.day < currentDate.day) || (currentDate.day === nextDate.day && currentDate.date < nextDate.date)
}

/**
 * Saves content of currentWeekBuffer into an csv file
 */
function saveWeek() {
    let filename = `weekOf${weekStartDate.getMonth()+1}.${weekStartDate.getDate()}.csv`;
    let filepath = path.join(__dirname, '../data/weeks/' + filename);
    const csvWriter = createCSVWriter({
        header: schema.map(utils.Capitalize),
        path: filepath
    });
    csvWriter.writeRecords(currentWeekBuffer)
        .then(() => {
            console.log('Saved ', filename);
        })
        .catch(console.error);
    currentWeekBuffer = [];
}

function split(data) {
    let index = 0;

    while (index < data.length - 1) {
        if (currentWeekBuffer.length === 0) weekStartDate = new Date(data[index]['START_DATE']);
        currentWeekBuffer.push(Object.values(data[index]));

        let currentDate = {
            day: new Date(data[index]['START_DATE']).getDay(),
            date: new Date(data[index]['START_DATE']).getDate()
        };
        let nextDate = {
            day: new Date(data[index + 1]['START_DATE']).getDay(),
            date: new Date(data[index + 1]['START_DATE']).getDate()
        };

        if (isNewWeek(currentDate, nextDate)) saveWeek();
        index++;
    }

    if (index === data.length - 1) {
        currentWeekBuffer.push(Object.values(data[index]));
        saveWeek();
    }
}

dataProvider.getData(process.argv[2], schema).then(split).catch(console.error);
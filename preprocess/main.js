// calculate density for each zone

/*
    feature: {
        properties: {
            customers: count,
            week n: count,
            density week n: density,
            density all: density
        }
    }
 */

const dataProvider = require('../data/provider');
const Polgon = require('../utils').Polygon;

let zoneGeoJSON;
let allCustomers;
//TODO: get zoneGeoJSON
//TODO: read location of all customers, assign each customer to zoneGeoJSON

//TODO: read each week's data, assign customers in week to zoneGeoJSON

//TODO: (can be done via leaflet clientside) calculate zoneGeoJSON density, assign color to zone

function assignCustomerToZone() {
    function findZoneIndexOf(coord) {
        let length = zoneGeoJSON.features.length;
        let index = -1, continueFind = true;
        while (continueFind && index < length - 1) {
            index++;
            let polygon = new Polgon(zoneGeoJSON.features[index].geometry.coordinates[0]);
            continueFind = !polygon.contains(coord);
        }
        return continueFind ? -1 : index;
    }

    for (let customer of allCustomers) {
        if (customer && customer.hasOwnProperty('LATITUDE') && customer.hasOwnProperty('LONGITUDE')) {
            let index = findZoneIndexOf([customer.LATITUDE, customer.LONGITUDE]);
            if (index === -1)
                console.error(`index not found for ${[customer.LATITUDE, customer.LONGITUDE]}`);
            else {
                let properties = zoneGeoJSON.features[index].properties;
                properties['customerCount'] = properties.hasOwnProperty('customerCount') ? properties['customerCount'] + 1 : 1;
                zoneGeoJSON.features[index].properties = properties;
            }
        }
    }
}

Promise.all([
    dataProvider.getGeoJSONFromFile(),
    dataProvider.getAllCustomers(['latitude', 'longitude'])
]).then(values => {
    zoneGeoJSON = values[0];
    allCustomers = values[1];
    assignCustomerToZone();
});
const shapefile = require('shapefile');
const proj4 = require('proj4');
const path = require('path');
const fs = require('fs');

let zoneGeoJSON;
let coordProjection;
let shpFilePath = path.join(__dirname, '../data/GreenWasteRoutes.shp');
let dbfFilePath = path.join(__dirname, '../data/GreenWasteRoutes.dbf');

function getProjection() {
    return new Promise((resolve, reject) => {
        if (coordProjection) resolve(coordProjection);
        let prjFile = path.join(__dirname, '../data/GreenWasteRoutes.prj');
        fs.readFile(prjFile, 'utf8', (error, data) => {
            if (error) reject(error);
            coordProjection = data;
            resolve(coordProjection);
        })
    })
}

function transformCoordinates(coord) {
    return proj4(coordProjection).inverse(coord);
}

function transformFeatureCoordinates(feature) {
    function parsePointCoord() {
        feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates)
    }

    function parseLineStringCoord() {
        feature.geometry.coordinates = feature.geometry.coordinates.map(coord => {
            return transformCoordinates(coord);
        });
    }

    function parsePolygonCoord() {
        feature.geometry.coordinates[0] = feature.geometry.coordinates[0].map(coord => {
            return transformCoordinates(coord);
        });
    }
     switch (feature.geometry.type) {
        case 'Point':
            parsePointCoord();
            break;
        case 'LineString':
            parseLineStringCoord();
            break;
        case 'Polygon':
            parsePolygonCoord();
            break;
    }
    return feature;
}

function getZone() {
    return new Promise((resolve, reject) => {
        if (zoneGeoJSON) resolve(zoneGeoJSON);
        shapefile.read(shpFilePath, dbfFilePath)
            .then(geoJSON => {
                zoneGeoJSON = geoJSON;
                resolve(zoneGeoJSON);
            })
        //     .catch(reject);
        // shapefile.open(shpFilePath, dbfFilePath)
        //     .then(source => {
        //         source.read()
        //             .then(function process(result) {
        //                 if (result.done) return resolve(zoneGeoJSON);
        //                 let feature = result.value;
        //                 feature = transformFeatureCoordinates(feature);
        //                 zoneGeoJSON.push(feature);
        //                 console.log(zoneGeoJSON.length);
        //                 return source.read().then(process);
        //             })
        //             .then(() => {
        //                 console.log('all done');
        //                 console.log(zoneGeoJSON.length);
        //                 resolve(zoneGeoJSON)
        //             })
        //     })
            .catch(error => {
                console.error(error.stack);
                reject(error.stack)
            })
    });
}

function getLayout() {
    return new Promise(resolve => {
        Promise.all([getProjection(), getZone()])
            .then(() => {
                zoneGeoJSON.features = zoneGeoJSON.features.map(feature => {
                    return transformFeatureCoordinates(feature);
                });
                resolve(zoneGeoJSON);
            });
    })
}

module.exports = {
    getLayout: async function () {
        return await getLayout();
    }
};
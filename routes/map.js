const express = require('express');
const router = express.Router();
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const camelcase = require('../utils').Camelcase;

/* GET /map page. */
router.get('/', function(req, res, next) {
    //  read filenames in data/week
    fs.readdir(path.join(__dirname, '../data/weeks'), (error, files) => {
        if (error) {
            console.error(error);
            return;
        }
        files = files.filter(file => !file.includes('~$'));
        files = files.map(file => {return camelcase(file)});
        res.render('map', { title: 'Map', available_weeks: files });
    });
});

router.param('datarequest', (req, res, next, requestedfile) => {
    let filepath;
    switch (requestedfile) {
        case 'city': filepath = path.join(__dirname, '../data/json/CityZonesGeoJSON.json');
            break;
        case 'density': filepath = path.join(__dirname, '../data/json/ZonesGeoJSON.json');
            break;
        case 'trucks_and_routes': filepath = path.join(__dirname, '../data/json/TrucksAndRoutes.json');
            break;
        default:
            res.sendStatus(404);
    }
    let data = fs.createReadStream(filepath);
    //TODO: send file as zip if file is big
    // let gzip = zlib.createGzip();
    res.set('Content-Type', 'application/json');
    data
        // .pipe(gzip)
        .pipe(res);
    data.on('end', () => res.end)
});

router.get('/:datarequest', (req, res, next) => {
    next();
});

module.exports = router;

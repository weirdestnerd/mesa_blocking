var express = require('express');
var router = express.Router();
const fs = require('fs');
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

        files = files.map(file => {return camelcase(file)});
        res.render('map', { title: 'Map', files: files });
    });
});

module.exports = router;

var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const camelcase = require('../utils').Camelcase;

/* GET home page. */
router.get('/', function(req, res, next) {
    //count number of files in data/week
    fs.readdir(path.join(__dirname, '../data/weeks'), (error, files) => {
        if (error) {
            console.error(error);
            return;
        }
        function containsSpace(filename) {
            return filename.includes(' ');
        }

        if (!files.every(containsSpace)) {
            files.forEach(filename => {
                let oldPath = path.join(__dirname, '../data/weeks/' + filename);
                let newPath = path.join(__dirname, '../data/weeks/' + camelcase(filename));
                fs.renameSync(oldPath, newPath);
            })
        }
        files = files.map(file => {return camelcase(file)});
        res.render('map', { title: 'Map', files: files });
    });
});

module.exports = router;

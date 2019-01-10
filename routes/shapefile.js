var express = require('express');
var router = express.Router();
const path = require('path');

router.param('filename', function (req, res, next, filename) {
    console.log(filename);
    res.sendFile(path.join(__dirname, '../data/' + filename));
});

router.get('/:filename', function (req, res, next) {
    next();
});

module.exports = router;

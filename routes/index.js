var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //WARN: redirection
  res.redirect('/map');
  // res.render('index', { title: 'Express' });
});

module.exports = router;

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/saw', function(req, res, next) {
  res.send('content')
});

module.exports = router;

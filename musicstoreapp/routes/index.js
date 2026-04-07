var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('/shop');
});

router.get('/error', function (req, res) {
  let message = req.query.message || "Se ha producido un error";
  res.status(500);
  res.render('error', { message: message, error: { status: 500 } });
});

module.exports = router;

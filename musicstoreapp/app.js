var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let MongoClient = require('mongodb').MongoClient;

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let connectionStrings = 'mongodb://admin:ADMSIS123$@ac-0beetcy-shard-00-00.8hdb8cu.mongodb.net:27017,ac-0beetcy-shard-00-01.8hdb8cu.mongodb.net:27017,ac-0beetcy-shard-00-02.8hdb8cu.mongodb.net:27017/?ssl=true&replicaSet=atlas-bh382k-shard-0&authSource=admin&appName=musicstoreapp';
let dbClient = new MongoClient(connectionStrings);
app.set('connectionStrings', connectionStrings);

let songsRepository = require("./repositories/songsRepository.js");
songsRepository.init(app, dbClient);

require("./routes/songs.js")(app, songsRepository);
require("./routes/authors.js")(app);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

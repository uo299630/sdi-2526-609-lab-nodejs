var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let MongoClient = require('mongodb').MongoClient;
let fileUpload = require('express-fileupload');
let crypto = require('crypto');
let expressSession = require('express-session');

var indexRouter = require('./routes/index');

var app = express();

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    createParentPath: true
}));
app.set('uploadPath', __dirname);
app.set('clave','abcdefg');
app.set('crypto',crypto);

app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

const userSessionRouter = require('./routes/userSessionRouter');
const userAudiosRouter = require('./routes/userAudiosRouter');
const userAuthorRouter = require('./routes/userAuthorRouter');
app.use("/songs/add", userSessionRouter);
app.use("/publications", userSessionRouter);
app.use("/audios/", userAudiosRouter);
app.use("/shop/", userSessionRouter);
app.use("/songs/favorites", userSessionRouter);
app.use("/songs/buy", userSessionRouter);
app.use("/purchases", userSessionRouter);
app.use("/songs/edit", userAuthorRouter);
app.use("/songs/delete", userAuthorRouter);

let connectionStrings = 'mongodb://admin:ADMSIS123$@ac-0beetcy-shard-00-00.8hdb8cu.mongodb.net:27017,ac-0beetcy-shard-00-01.8hdb8cu.mongodb.net:27017,ac-0beetcy-shard-00-02.8hdb8cu.mongodb.net:27017/?ssl=true&replicaSet=atlas-bh382k-shard-0&authSource=admin&appName=musicstoreapp';
let dbClient = new MongoClient(connectionStrings);
app.set('connectionStrings', connectionStrings);

let songsRepository = require("./repositories/songsRepository.js");
songsRepository.init(app, dbClient);

let usersRepository = require("./repositories/usersRepository.js");
usersRepository.init(app, dbClient);

let favoriteSongsRepository = require("./repositories/favoriteSongsRepository.js");
favoriteSongsRepository.init(app, dbClient);

let commentRepository = require("./repositories/commentRepository.js");
commentRepository.init(app, dbClient);

require("./routes/songs/favorites.js")(app, songsRepository, favoriteSongsRepository);
require("./routes/comments.js")(app, commentRepository);
require("./routes/songs.js")(app, songsRepository, commentRepository);
require("./routes/authors.js")(app);
require("./routes/users.js")(app, usersRepository);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log("Se ha producido un error " + err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

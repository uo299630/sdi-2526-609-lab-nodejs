const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, songsRepository) {
    // 1. Rutas fijas (Estáticas) - Van PRIMERO
    app.get("/songs", function (req, res) {
        res.redirect("/shop");
    });

    app.get('/shop', function (req, res) {
        let filter = {};
        let options = { sort: { title: 1 } };
        if (req.query.search != null &&
            typeof (req.query.search) != "undefined" &&
            req.query.search !== "") {
            filter = { title: { $regex: ".*" + req.query.search + ".*" } };
        }
        songsRepository.getSongs(filter, options).then(function (songs) {
            res.render("shop.twig", { songs: songs });
        }).catch(function (error) {
            res.send("Se ha producido un error al listar las canciones " + error);
        });
    });

    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    });

    app.post('/songs/add', function(req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price
        };

        songsRepository.insertSong(song, function (result) {
            if (result.songId !== null && result.songId !== undefined) {
                if (req.files != null) {
                    let image = req.files.cover;
                    if (image != null) {
                        image.mv(app.get("uploadPath") + '/public/covers/' + result.songId + '.png')
                            .then(function () {
                                if (req.files.audio != null) {
                                    let audio = req.files.audio;
                                    audio.mv(app.get("uploadPath") + '/public/audios/' + result.songId + '.mp3')
                                        .then(function () {
                                            res.send("Agregada la canción ID: " + result.songId);
                                        })
                                        .catch(function () {
                                            res.send("Error al subir el audio de la canción");
                                        });
                                } else {
                                    res.send("Agregada la canción ID: " + result.songId);
                                }
                            })
                            .catch(function () {
                                res.send("Error al subir la portada de la canción");
                            });
                    } else {
                        res.send("Agregada la canción ID: " + result.songId);
                    }
                } else {
                    res.send("Agregada la canción ID: " + result.songId);
                }
            } else {
                res.send("Error al insertar canción " + result.error);
            }
        });
    });

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(response));
    });

    // 2. Rutas con parámetros (Dinámicas) - Van AL FINAL
    app.get('/songs/:id', function(req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            res.render("songs/song.twig", { song: song });
        }).catch(function (error) {
            res.send("Se ha producido un error al buscar la canción " + error);
        });
    });

    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    });
    app.get('/promo*', function (req, res) {

        res.send('Respuesta al patrón promo*');
    });
    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    });
};

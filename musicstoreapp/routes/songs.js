const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, songsRepository, commentRepository) {
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

    app.get('/publications', function (req, res) {
        let filter = { author: req.session.user };
        let options = { sort: { title: 1 } };
        songsRepository.getSongs(filter, options).then(function (songs) {
            res.render("publications.twig", { songs: songs });
        }).catch(function (error) {
            res.send("Se ha producido un error al listar las publicaciones del usuario: " + error);
        });
    });

    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    });

    app.post('/songs/add', function(req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
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
                                            res.redirect("/publications");
                                        })
                                        .catch(function () {
                                            res.send("Error al subir el audio de la canción");
                                        });
                                } else {
                                    res.redirect("/publications");
                                }
                            })
                            .catch(function () {
                                res.send("Error al subir la portada de la canción");
                            });
                    } else {
                        res.redirect("/publications");
                    }
                } else {
                    res.redirect("/publications");
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
            if (song == null) {
                res.send("La canción no existe");
            } else {
                let commentFilter = { song_id: new ObjectId(req.params.id) };
                let commentOptions = { sort: { _id: 1 } };
                commentRepository.getComments(commentFilter, commentOptions).then(function (comments) {
                    res.render("songs/song.twig", {
                        song: song,
                        comments: comments,
                        user: req.session.user
                    });
                }).catch(function (error) {
                    res.send("Se ha producido un error al listar los comentarios " + error);
                });
            }
        }).catch(function (error) {
            res.send("Se ha producido un error al buscar la canción " + error);
        });
    });

    app.get('/songs/edit/:id', function (req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            res.render("songs/edit.twig", { song: song });
        }).catch(function (error) {
            res.send("Se ha producido un error al buscar la canción " + error);
        });
    });

    app.post('/songs/edit/:id', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        };
        let songId = req.params.id;
        let filter = { _id: new ObjectId(songId) };
        const options = { upsert: false };
        songsRepository.updateSong(song, filter, options).then(function (result) {
            step1UpdateCover(req.files, songId, function (ok) {
                if (ok == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.redirect("/publications");
                }
            });
        }).catch(function (error) {
            res.send("Se ha producido un error al modificar la canción " + error);
        });
    });

    app.get('/songs/delete/:id', function (req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        songsRepository.deleteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/publications");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error);
        });
    });

    app.post('/songs/buy/:id', function (req, res) {
        let songId = new ObjectId(req.params.id);
        let shop = {
            user: req.session.user,
            song_id: songId
        };
        songsRepository.buySong(shop).then(result => {
            if (result.insertedId === null || typeof (result.insertedId) === "undefined") {
                res.send("Se ha producido un error al comprar la canción");
            } else {
                res.redirect("/purchases");
            }
        }).catch(error => {
            res.send("Se ha producido un error al comprar la canción " + error);
        });
    });

    app.get('/purchases', function (req, res) {
        let filter = { user: req.session.user };
        let options = { projection: { _id: 0, song_id: 1 } };
        songsRepository.getPurchases(filter, options).then(purchasedIds => {
            const purchasedSongs = purchasedIds.map(song => song.song_id);
            let filter = { "_id": { $in: purchasedSongs } };
            let options = { sort: { title: 1 } };
            songsRepository.getSongs(filter, options).then(songs => {
                res.render("purchase.twig", { songs: songs });
            }).catch(error => {
                res.send("Se ha producido un error al listar las publicaciones del usuario: " + error);
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error);
        });
    });

    function step1UpdateCover(files, songId, callback) {
        if (files && files.cover != null) {
            let image = files.cover;
            image.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                if (err) {
                    callback(null);
                } else {
                    step2UpdateAudio(files, songId, callback);
                }
            });
        } else {
            step2UpdateAudio(files, songId, callback);
        }
    }

    function step2UpdateAudio(files, songId, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null);
                } else {
                    callback(true);
                }
            });
        } else {
            callback(true);
        }
    }

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

const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, songsRepository, commentRepository) {
    // 1. Rutas fijas (Estáticas) - Van primero
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
        let page = parseInt(req.query.page);
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0" || isNaN(page)) {
            page = 1;
        }
        songsRepository.getSongsPg(filter, options, page).then(function (result) {
            let lastPage = result.total / 4;
            if (result.total % 4 > 0) {
                lastPage = lastPage + 1;
            }
            let pages = [];
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            let response = {
                songs: result.songs,
                pages: pages,
                currentPage: page
            };
            res.render("shop.twig", response);
        }).catch(function (error) {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al listar las canciones " + error));
        });
    });

    app.get('/publications', function (req, res) {
        let filter = { author: req.session.user };
        let options = { sort: { title: 1 } };
        songsRepository.getSongs(filter, options).then(function (songs) {
            res.render("publications.twig", { songs: songs });
        }).catch(function (error) {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al listar las publicaciones del usuario: " + error));
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
                                            res.redirect("/error?message=" +
                                                encodeURIComponent("Error al subir el audio de la canción"));
                                        });
                                } else {
                                    res.redirect("/publications");
                                }
                            })
                            .catch(function () {
                                res.redirect("/error?message=" +
                                    encodeURIComponent("Error al subir la portada de la canción"));
                            });
                    } else {
                        res.redirect("/publications");
                    }
                } else {
                    res.redirect("/publications");
                }
            } else {
                res.redirect("/error?message=" +
                    encodeURIComponent("Error al insertar canción " + result.error));
            }
        });
    });

    app.get('/add', function(req, res) {
        let response = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.redirect("/error?message=" + encodeURIComponent(String(response)));
    });

    // 2. Rutas con parámetros (Dinámicas) - Van despues
    app.get('/songs/:id', function(req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            if (song == null) {
                res.redirect("/error?message=" +
                    encodeURIComponent("La canción no existe"));
            } else {
                let isAuthor = false;
                let hasBought = false;
                if (req.session.user && song.author === req.session.user) {
                    isAuthor = true;
                }
                let calculateUsdAndRender = function () {
                    let restSettings = {
                        url: "https://api.currencyapi.com/v3/latest?apikey=MITOKEN&base_currency=EUR&currencies=USD",
                        method: "get"
                    };
                    let rest = app.get("rest");
                    rest(restSettings, function (error, response, body) {
                        try {
                            if (!error && response && response.statusCode >= 200 && response.statusCode < 300) {
                                let responseObject = JSON.parse(body);
                                if (responseObject && responseObject.data && responseObject.data.USD && responseObject.data.USD.value) {
                                    let rateUSD = responseObject.data.USD.value;
                                    let songValue = song.price / rateUSD;
                                    song.usd = Math.round(songValue * 100) / 100;
                                }
                            }
                        } catch (e) {
                        }
                        res.render("songs/song.twig", {
                            song: song,
                            comments: res.locals.comments,
                            user: req.session.user,
                            isAuthor: isAuthor,
                            hasBought: hasBought
                        });
                    });
                };
                if (req.session.user) {
                    let purchaseFilter = {
                        user: req.session.user,
                        song_id: new ObjectId(req.params.id)
                    };
                    let purchaseOptions = { projection: { _id: 0, song_id: 1 } };
                    songsRepository.getPurchases(purchaseFilter, purchaseOptions).then(function (purchases) {
                        if (purchases && purchases.length > 0) {
                            hasBought = true;
                        }
                        let commentFilter = { song_id: new ObjectId(req.params.id) };
                        let commentOptions = { sort: { _id: 1 } };
                        commentRepository.getComments(commentFilter, commentOptions).then(function (comments) {
                            res.locals.comments = comments;
                            calculateUsdAndRender();
                        }).catch(function (error) {
                            res.redirect("/error?message=" +
                                encodeURIComponent("Se ha producido un error al listar los comentarios " + error));
                        });
                    }).catch(function (error) {
                        res.redirect("/error?message=" +
                            encodeURIComponent("Se ha producido un error al comprobar las compras de la canción " + error));
                    });
                } else {
                    let commentFilter = { song_id: new ObjectId(req.params.id) };
                    let commentOptions = { sort: { _id: 1 } };
                    commentRepository.getComments(commentFilter, commentOptions).then(function (comments) {
                        res.locals.comments = comments;
                        calculateUsdAndRender();
                    }).catch(function (error) {
                        res.redirect("/error?message=" +
                            encodeURIComponent("Se ha producido un error al listar los comentarios " + error));
                    });
                }
            }
        }).catch(function (error) {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al buscar la canción " + error));
        });
    });

    app.get('/songs/edit/:id', function (req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            res.render("songs/edit.twig", { song: song });
        }).catch(function (error) {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al buscar la canción " + error));
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
                    res.redirect("/error?message=" +
                        encodeURIComponent("Error al actualizar la portada o el audio de la canción"));
                } else {
                    res.redirect("/publications");
                }
            });
        }).catch(function (error) {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al modificar la canción " + error));
        });
    });

    app.get('/songs/delete/:id', function (req, res) {
        let filter = { _id: new ObjectId(req.params.id) };
        songsRepository.deleteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.redirect("/error?message=" +
                    encodeURIComponent("No se ha podido eliminar el registro"));
            } else {
                res.redirect("/publications");
            }
        }).catch(error => {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al intentar eliminar la canción: " + error));
        });
    });

    app.post('/songs/buy/:id', function (req, res) {
        let songObjectId = new ObjectId(req.params.id);
        let filter = { _id: songObjectId };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            if (song == null) {
                res.redirect("/error?message=" +
                    encodeURIComponent("La canción no existe."));
            } else if (song.author === req.session.user) {
                res.redirect("/error?message=" +
                    encodeURIComponent("No puedes comprar tu propia canción."));
            } else {
                let purchaseFilter = {
                    user: req.session.user,
                    song_id: songObjectId
                };
                let purchaseOptions = { projection: { _id: 0, song_id: 1 } };
                songsRepository.getPurchases(purchaseFilter, purchaseOptions).then(function (purchases) {
                    if (purchases && purchases.length > 0) {
                        res.redirect("/error?message=" +
                            encodeURIComponent("Ya has comprado esta canción anteriormente."));
                    } else {
                        let shop = {
                            user: req.session.user,
                            song_id: songObjectId
                        };
                        songsRepository.buySong(shop).then(result => {
                            if (result.insertedId === null || typeof (result.insertedId) === "undefined") {
                                res.redirect("/error?message=" +
                                    encodeURIComponent("Se ha producido un error al comprar la canción."));
                            } else {
                                res.redirect("/purchases");
                            }
                        }).catch(error => {
                            res.redirect("/error?message=" +
                                encodeURIComponent("Se ha producido un error al comprar la canción."));
                        });
                    }
                }).catch(error => {
                    res.redirect("/error?message=" +
                        encodeURIComponent("Se ha producido un error al comprobar las compras de la canción."));
                });
            }
        }).catch(error => {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al buscar la canción."));
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
                res.redirect("/error?message=" +
                    encodeURIComponent("Se ha producido un error al listar las publicaciones del usuario: " + error));
            });
        }).catch(error => {
            res.redirect("/error?message=" +
                encodeURIComponent("Se ha producido un error al listar las canciones del usuario " + error));
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

const { ObjectId } = require("mongodb");

module.exports = function (app, songsRepository) {
    app.get("/api/v1.0/songs", function (req, res) {
        let filter = {};
        let options = {};
        songsRepository.getSongs(filter, options).then(songs => {
            const songsWithLinks = songs.map(song => {
                const songObj = { ...song };
                songObj._links = {
                    self: "/api/v1.0/songs/" + song._id,
                    author: "/users/" + encodeURIComponent(song.author)
                };
                return songObj;
            });
            res.status(200).json({ songs: songsWithLinks });
        }).catch(() => {
            res.status(500).json({ error: "Se ha producido un error al recuperar las canciones." });
        });
    });

    app.get("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            let filter = { _id: songId };
            let options = {};
            songsRepository.findSong(filter, options).then(song => {
                if (song === null) {
                    res.status(404).json({ error: "ID inválido o no existe" });
                } else {
                    const songObj = { ...song };
                    songObj._links = {
                        self: "/api/v1.0/songs/" + song._id,
                        author: "/users/" + encodeURIComponent(song.author)
                    };
                    res.status(200).json({ song: songObj });
                }
            }).catch(() => {
                res.status(500).json({ error: "Se ha producido un error al recuperar la canción." });
            });
        } catch (error) {
            res.status(500).json({ error: "Se ha producido un error: " + error.message });
        }
    });

    app.delete("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            let filter = { _id: songId };
            songsRepository.deleteSong(filter, {}).then(result => {
                if (result === null || result.deletedCount === 0) {
                    res.status(404).json({ error: "ID inválido o no existe, no se ha borrado el registro." });
                } else {
                    res.status(200).json(result);
                }
            }).catch(error => {
                res.status(500).json({ error: "Se ha producido un error: " + error.message });
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post("/api/v1.0/songs", function (req, res) {
        try {
            let song = {
                title: req.body.title,
                kind: req.body.kind,
                price: req.body.price,
                author: req.session.user
            };
            songsRepository.insertSong(song, function (result) {
                if (!result || result.songId === null || typeof result.songId === "undefined") {
                    res.status(409).json({ error: "No se ha podido crear la canción. El recurso ya existe." });
                } else {
                    res.status(201).json({
                        message: "Canción añadida correctamente.",
                        _id: result.songId
                    });
                }
            });
        } catch (error) {
            res.status(500).json({ error: "Se ha producido un error al intentar crear la canción: " + error.message });
        }
    });

    app.put("/api/v1.0/songs/:id", function (req, res) {
        try {
            let songId = new ObjectId(req.params.id);
            let filter = { _id: songId };
            const options = { upsert: false };
            let song = {
                author: req.session.user
            };
            if (typeof req.body.title !== "undefined" && req.body.title !== null) {
                song.title = req.body.title;
            }
            if (typeof req.body.kind !== "undefined" && req.body.kind !== null) {
                song.kind = req.body.kind;
            }
            if (typeof req.body.price !== "undefined" && req.body.price !== null) {
                song.price = req.body.price;
            }
            songsRepository.updateSong(song, filter, options).then(result => {
                if (result === null) {
                    res.status(404).json({ error: "ID inválido o no existe, no se ha actualizado la canción." });
                } else if (result.modifiedCount === 0) {
                    res.status(409).json({ error: "No se ha modificado ninguna canción." });
                } else {
                    res.status(200).json({
                        message: "Canción modificada correctamente.",
                        result: result
                    });
                }
            }).catch(error => {
                res.status(500).json({ error: "Se ha producido un error al modificar la canción: " + error.message });
            });
        } catch (error) {
            res.status(500).json({ error: "Se ha producido un error al intentar modificar la canción: " + error.message });
        }
    });
};


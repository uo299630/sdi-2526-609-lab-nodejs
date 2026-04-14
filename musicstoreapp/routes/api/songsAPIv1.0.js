const { ObjectId } = require("mongodb");

module.exports = function (app, songsRepository, usersRepository) {
    app.post('/api/v1.0/users/login', async function (req, res) {
        try {
            const securePassword = app.get("crypto").createHmac('sha256', app.get('clave')).update(req.body.password).digest('hex');
            const filter = {
                email: req.body.email,
                password: securePassword
            };
            const user = await usersRepository.findUser(filter, {});
            if (user == null) {
                return res.status(401).json({
                    message: "usuario no autorizado",
                    authenticated: false
                });
            }
            const token = app.get('jwt').sign(
                { user: user.email, time: Date.now() / 1000 },
                "secreto"
            );
            res.status(200).json({
                message: "usuario autorizado",
                authenticated: true,
                token: token
            });
        } catch (e) {
            res.status(500).json({
                message: "Se ha producido un error al verificar credenciales",
                authenticated: false
            });
        }
    });

    app.get("/api/v1.0/search", function (req, res) {
        const termRaw = req.query.term;
        if (!termRaw || typeof termRaw !== "string" || termRaw.trim().length === 0) {
            return res.status(400).json({ error: "Debe proporcionar un parámetro de búsqueda válido." });
        }
        const term = encodeURIComponent(termRaw.trim());
        const url = "https://itunes.apple.com/search?media=music&entity=song&limit=10&term=" + term;
        const settings = {
            url: url,
            method: "get"
        };
        const rest = app.get("rest");
        rest(settings, function (error, response, body) {
            if (error || !response) {
                return res.status(500).json({ error: "Se ha producido un error al llamar al servicio externo." });
            }
            try {
                const data = JSON.parse(body);
                const results = Array.isArray(data.results) ? data.results : [];
                const songs = results.map(function (item) {
                    return {
                        title: item.trackName,
                        artist: item.artistName,
                        album: item.collectionName,
                        previewUrl: item.previewUrl
                    };
                });
                res.status(200).json({ songs: songs });
            } catch (e) {
                res.status(500).json({ error: "Se ha producido un error al procesar la respuesta del servicio externo." });
            }
        });
    });

    /**
     * @swagger
     * /api/v1.0/songs:
     *   get:
     *     summary: Obtener lista de canciones
     *     description: Retorna todas las canciones almacenadas en el sistema.
     *     tags:
     *       - Songs
     *     responses:
     *       200:
     *         description: Lista de canciones obtenida correctamente.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 songs:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Song'
     *       500:
     *         description: Error interno del servidor al recuperar las canciones.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Se ha producido un error al recuperar las canciones.
     */
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

    /**
     * @swagger
     * /api/v1.0/songs/{id}:
     *   delete:
     *     summary: Eliminar una canción
     *     description: Elimina una canción del sistema a partir de su identificador.
     *     tags:
     *       - Songs
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Identificador único de la canción.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Canción eliminada correctamente.
     *       404:
     *         description: ID inválido o canción no encontrada.
     *       500:
     *         description: Error interno del servidor.
     */
    app.delete("/api/v1.0/songs/:id", async function (req, res) {
        try {
            let songId;
            try {
                songId = new ObjectId(req.params.id);
            } catch (e) {
                return res.status(400).json({ error: "ID inválido." });
            }
            let filter = { _id: songId };
            const song = await songsRepository.findSong(filter, {});
            if (song === null) {
                return res.status(404).json({ error: "ID inválido o no existe, no se ha borrado el registro." });
            }
            if (!res.user || song.author !== res.user) {
                return res.status(403).json({ error: "No tiene permisos para eliminar esta canción." });
            }
            const result = await songsRepository.deleteSong(filter, {});
            if (result === null || result.deletedCount === 0) {
                res.status(404).json({ error: "No se ha podido eliminar el registro." });
            } else {
                res.status(200).json(result);
            }
        } catch (error) {
            res.status(500).json({ error: "Se ha producido un error: " + error.message });
        }
    });

    /**
     * @swagger
     * /api/v1.0/songs:
     *   post:
     *     summary: Crear una nueva canción
     *     description: Añade una nueva canción al sistema.
     *     tags:
     *       - Songs
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SongRequest'
     *     responses:
     *       201:
     *         description: Canción creada correctamente.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Canción añadida correctamente.
     *                 _id:
     *                   type: string
     *       409:
     *         description: Conflicto, la canción ya existe.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: No se ha podido crear la canción. El recurso ya existe.
     *       500:
     *         description: Error interno del servidor.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    app.post("/api/v1.0/songs", function (req, res) {
        try {
            const errors = [];
            const title = req.body.title;
            const kind = req.body.kind;
            const priceRaw = req.body.price;
            if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 40) {
                errors.push("El título debe tener entre 3 y 40 caracteres.");
            }
            if (!kind || typeof kind !== "string" || kind.trim().length < 3 || kind.trim().length > 30) {
                errors.push("El género debe tener entre 3 y 30 caracteres.");
            }
            const price = parseFloat(priceRaw);
            if (isNaN(price) || price <= 0) {
                errors.push("El precio debe ser un número positivo.");
            }
            if (errors.length > 0) {
                return res.status(400).json({ error: errors.join(" ") });
            }
            if (!res.user) {
                return res.status(403).json({ error: "Usuario no autorizado." });
            }
            let song = {
                title: title.trim(),
                kind: kind.trim(),
                price: price,
                author: res.user
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

    /**
     * @swagger
     * /api/v1.0/songs/{id}:
     *   put:
     *     summary: Modificar una canción
     *     description: Actualiza los datos de una canción existente mediante su identificador.
     *     tags:
     *       - Songs
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: Identificador único de la canción.
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SongRequest'
     *     responses:
     *       200:
     *         description: Canción modificada correctamente.
     *       404:
     *         description: ID inválido o canción no encontrada.
     *       409:
     *         description: No se ha realizado ninguna modificación.
     *       500:
     *         description: Error interno del servidor.
     */
    app.put("/api/v1.0/songs/:id", async function (req, res) {
        try {
            let songId;
            try {
                songId = new ObjectId(req.params.id);
            } catch (e) {
                return res.status(400).json({ error: "ID inválido." });
            }
            let filter = { _id: songId };
            const existingSong = await songsRepository.findSong(filter, {});
            if (existingSong === null) {
                return res.status(404).json({ error: "ID inválido o no existe, no se ha actualizado la canción." });
            }
            if (!res.user || existingSong.author !== res.user) {
                return res.status(403).json({ error: "No tiene permisos para modificar esta canción." });
            }
            const options = { upsert: false };
            let song = {
                author: res.user
            };
            const errors = [];
            let hasChanges = false;
            if (typeof req.body.title !== "undefined") {
                const title = req.body.title;
                if (!title || typeof title !== "string" || title.trim().length < 3 || title.trim().length > 40) {
                    errors.push("El título debe tener entre 3 y 40 caracteres.");
                } else {
                    song.title = title.trim();
                    hasChanges = true;
                }
            }
            if (typeof req.body.kind !== "undefined") {
                const kind = req.body.kind;
                if (!kind || typeof kind !== "string" || kind.trim().length < 3 || kind.trim().length > 30) {
                    errors.push("El género debe tener entre 3 y 30 caracteres.");
                } else {
                    song.kind = kind.trim();
                    hasChanges = true;
                }
            }
            if (typeof req.body.price !== "undefined") {
                const priceRaw = req.body.price;
                const price = parseFloat(priceRaw);
                if (isNaN(price) || price <= 0) {
                    errors.push("El precio debe ser un número positivo.");
                } else {
                    song.price = price;
                    hasChanges = true;
                }
            }
            if (!hasChanges) {
                return res.status(400).json({ error: "No se han enviado campos válidos para modificar." });
            }
            if (errors.length > 0) {
                return res.status(400).json({ error: errors.join(" ") });
            }
            const result = await songsRepository.updateSong(song, filter, options);
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
        } catch (error) {
            res.status(500).json({ error: "Se ha producido un error al intentar modificar la canción: " + error.message });
        }
    });
};


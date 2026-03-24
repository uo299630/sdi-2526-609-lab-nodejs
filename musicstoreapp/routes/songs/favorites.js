const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, songsRepository, favoriteSongsRepository) {
    app.get('/songs/favorites', function (req, res) {
        let filter = { user: req.session.user };
        let options = { sort: { date: -1 } };
        favoriteSongsRepository.getFavorites(filter, options).then(function (favorites) {
            let total = favorites.reduce(function (sum, favorite) {
                return sum + parseFloat(favorite.price);
            }, 0);
            res.render('songs/favorites.twig', {
                favorites: favorites,
                total: total
            });
        }).catch(function (error) {
            res.send('Se ha producido un error al listar los favoritos ' + error);
        });
    });

    app.post('/songs/favorites/add/:song_id', function (req, res) {
        let songId = req.params.song_id;
        let filter = { _id: new ObjectId(songId) };
        let options = {};
        songsRepository.findSong(filter, options).then(function (song) {
            if (song == null) {
                res.send('La canción no existe');
            } else {
                let favorite = {
                    song_id: new ObjectId(songId),
                    user: req.session.user,
                    date: new Date(),
                    price: parseFloat(song.price),
                    title: song.title
                };
                favoriteSongsRepository.addFavorite(favorite).then(function () {
                    res.redirect('/songs/favorites');
                }).catch(function (error) {
                    res.send('Se ha producido un error al añadir la canción a favoritos ' + error);
                });
            }
        }).catch(function (error) {
            res.send('Se ha producido un error al buscar la canción ' + error);
        });
    });

    app.get('/songs/favorites/delete/:song_id', function (req, res) {
        let songId = req.params.song_id;
        let filter = {
            user: req.session.user,
            song_id: new ObjectId(songId)
        };
        let options = {};
        favoriteSongsRepository.deleteFavorite(filter, options).then(function () {
            res.redirect('/songs/favorites');
        }).catch(function (error) {
            res.send('Se ha producido un error al eliminar la canción de favoritos ' + error);
        });
    });
};


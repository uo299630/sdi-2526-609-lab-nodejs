const ObjectId = require('mongodb').ObjectId;

module.exports = function (app, commentRepository) {
    app.post('/comments/:song_id', function (req, res) {
        if (req.session.user == null) {
            res.send("Usuario no identificado. No puede añadir comentarios");
        } else {
            let comment = {
                author: req.session.user,
                text: req.body.text,
                song_id: new ObjectId(req.params.song_id)
            };
            commentRepository.addComment(comment).then(function () {
                res.redirect("/songs/" + req.params.song_id);
            }).catch(function (error) {
                res.send("Se ha producido un error al añadir el comentario " + error);
            });
        }
    });

    app.get('/comments/delete/:comment_id/:song_id', function (req, res) {
        if (req.session.user == null) {
            res.send("Usuario no identificado. No puede borrar comentarios");
        } else {
            let filter = {
                _id: new ObjectId(req.params.comment_id),
                author: req.session.user
            };
            let options = {};
            commentRepository.deleteComments(filter, options).then(function () {
                res.redirect("/songs/" + req.params.song_id);
            }).catch(function (error) {
                res.send("Se ha producido un error al borrar el comentario " + error);
            });
        }
    });
};

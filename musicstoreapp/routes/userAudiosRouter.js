const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const songsRepository = require('../repositories/songsRepository');

const userAudiosRouter = express.Router();

userAudiosRouter.use(function (req, res, next) {
    let path = require('path');
    let songId = path.basename(req.originalUrl, '.mp3');

    let filter = { _id: new ObjectId(songId) };
    songsRepository.findSong(filter, {}).then(function (song) {
        if (req.session.user && song && song.author === req.session.user) {
            next();
        } else {
            res.redirect("/shop");
        }
    }).catch(function () {
        res.redirect("/shop");
    });
});

module.exports = userAudiosRouter;


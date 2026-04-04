const express = require('express');
const path = require("path");
const ObjectId = require("mongodb").ObjectId;
const songsRepository = require("../repositories/songsRepository");

const userAuthorRouter = express.Router();

userAuthorRouter.use(function (req, res, next) {
    let songId = path.basename(req.originalUrl);
    let filter = { _id: new ObjectId(songId) };
    songsRepository.findSong(filter, {}).then(song => {
        if (req.session.user && song && song.author === req.session.user) {
            next();
        } else {
            res.redirect("/shop");
        }
    }).catch(error => {
        res.redirect("/shop");
    });
});

module.exports = userAuthorRouter;


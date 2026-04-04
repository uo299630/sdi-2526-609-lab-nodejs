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
            return next();
        } else {
            let purchaseFilter = { user: req.session.user, song_id: new ObjectId(songId) };
            let options = { projection: { _id: 0, song_id: 1 } };
            songsRepository.getPurchases(purchaseFilter, options).then(function (purchasedIds) {
                if (purchasedIds !== null && purchasedIds.length > 0) {
                    return next();
                } else {
                    res.redirect("/shop");
                }
            }).catch(function () {
                res.redirect("/shop");
            });
        }
    }).catch(function () {
        res.redirect("/shop");
    });
});

module.exports = userAudiosRouter;

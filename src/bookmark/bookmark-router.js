const express = require('express');
const {v4: uuid} = require("uuid")
const logger = require("../logger");
//let { bookmarks } = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json()
const BookmarksService = require('./bookmarks-service')


bookmarkRouter
    .route("/bookmarks")
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                return res
                    .json(bookmarks)
            })
            .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const {title, url, rating, description} = req.body;
        if (!title) {
            logger.error("Bookmark title is required.")
            return res
                .status(400)
                .send("Invalid data. Title required")
        }
        if (!url) {
            logger.error("Bookmark URL is required.")
            return res
                .status(400)
                .send("Invalid data. URL required")
        }
        if(!rating) {
            logger.error("Bookmark Rating is required.")
            return res
                .status(400)
                .send("Invalid data. Rating required")
        }
        const id = uuid();
        const bookmark = {
            title,
            url,
            rating,
            description,
            id
        }
        bookmarks.push(bookmark)
        logger.info(`Bookmark with url ${url} created.`)
        res
            .status(201)
            .location(`../bookmarks`)
            .json(bookmark)
    })

bookmarkRouter
    .route("/bookmarks/:id")
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        const {id} = req.params;
        BookmarksService.getBookmarkById(knexInstance, id)
            .then(bookmark => {
                if (bookmark) {
                    return res
                        .json(bookmark)
                }
                else return res
                    .status(404)
                    .send("404 Not Found")
            })
            .catch(next)
    })
    .delete((req, res) => {
        const {id} = req.params;
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
        logger.info(`Bookmark with id ${id} deleted.`)
        res
            .status(204)
            .end()
    })

module.exports = bookmarkRouter
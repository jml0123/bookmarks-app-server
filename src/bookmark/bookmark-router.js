const express = require('express');
const {v4: uuid} = require("uuid")
const logger = require("../logger");
let { bookmarks } = require('../store');

const bookmarkRouter = express.Router();
const bodyParser = express.json()

bookmarkRouter
    .route("/bookmarks")
    .get((req, res) => {
        res
            .json(bookmarks)
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
    .get((req, res)=> {
        const {id} = req.params;
        const found = bookmarks.find(bookmark => bookmark.id === id)
        if (found) {
            res.json(found)
        }
        else res
            .status(404)
            .send("Not Found")
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
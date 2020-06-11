const path = require('path');
const express = require('express');
const xss = require('xss')
const {v4: uuid} = require("uuid")
const logger = require("../logger");
//let { bookmarks } = require('../store');

const bookmarkRouter = express.Router();


const bodyParser = express.json()
const BookmarksService = require('./bookmarks-service')


bookmarkRouter
    .route("/")
    .all((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            if (!bookmarks) {
                return res
                    .status(404)
                    .send('404 Not Found')
            }
            res.bookmarks = bookmarks;
            next()   
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(res.bookmarks)
    })
    .post(bodyParser, (req, res, next) => {
        const {title, url, rating, description, id} = req.body;
        const knexInstance = req.app.get('db');
        const requiredData = {title, url, rating};
        for (const [key, value] of Object.entries(requiredData)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Invalid data - ${key} required`}
                })
            }
        }
        if(rating < 1 || rating > 5) {
            return res.status(400).json({
                error: { message: `Invalid data - rating needs to be from 1-5 only`}
            })
        }
        if(!id) {
            const id = uuid();
        }
        const newBookmark = {title, url, rating, description, id}
        BookmarksService.insertBookmark(knexInstance, newBookmark)
        .then(bookmark => {
            logger.info(`Bookmark with url ${url} created.`)
            res 
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                .json({
                    id: bookmark.id,
                    title: xss(bookmark.title),
                    url: xss(bookmark.url),
                    rating: bookmark.rating,
                    description: xss(bookmark.description)
                })  
        })
        .catch(next)
        //bookmarks.push(bookmark)
    })

bookmarkRouter
    .route("/:id")
    .all((req, res, next) => {
        const knexInstance = req.app.get('db');
        const {id} = req.params;
        BookmarksService.getBookmarkById(knexInstance, id)
        .then(bookmark => {
            if (!bookmark) {
                return res
                    .status(404)
                    .send('404 Not Found')
            }
            res.bookmark = bookmark;
            next()   
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title),
            url: xss(res.bookmark.url),
            rating: res.bookmark.rating,
            description: xss(res.bookmark.description)
        })
    })
    .delete((req, res) => {
        const knexInstance = req.app.get('db');
        const {id} = req.params;
        BookmarksService.deleteBookmark(knexInstance, res.bookmark.id)
        logger.info(`Bookmark with id ${id} deleted.`)
        res
            .status(204)
            .end()
    })
    .patch(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db');
        const {title, url, rating, description} = req.body;
        const updatedData = {title, url, rating, description}
        const {id} = req.params

        const numFieldValues = Object.values(updatedData).filter(Boolean).length
        if (numFieldValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either title, url, rating or description`
                }
            })
        }
        BookmarksService.updateBookmark(knexInstance, id, updatedData)
        .then(numRowsAffected => {
            res.status(204).end();
        })
        .catch(next)
    })

module.exports = bookmarkRouter
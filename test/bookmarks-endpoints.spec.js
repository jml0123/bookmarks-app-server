const {expect} = require('chai')
const knex = require('knex');
const app = require('../src/app');
const {makeBookmarksFixtures} = require("./bookmarks.fixtures")

describe.only("Bookmarks Endpoints", function(){
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db);
    })
    

    after('disconnect from db', () => db.destroy())
    before('clean existing table', () => db('bookmarks').truncate())
    afterEach('cleanup after each test', ()=> db('bookmarks').truncate())
    
    describe('GET/bookmarks', ()=> {
        context("Given no existing bookmarks", () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        context("Given there are bookmarks in the db", () => {
            const testBookmarks = makeBookmarksFixtures();
            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('GET /bookmarks responds with 200 and all of the articles', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })
    })
    describe('GET/bookmarks/:id', ()=> {
        context("Given no bookmarks in the db", () => {
            it('responds with 404 not found', () => {
                const bookmarkId = 90210;
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, "404 Not Found")
            })
        })
        context("Given there are bookmarks in the db", () => {
            const testBookmarks = makeBookmarksFixtures();
            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('GET /bookmarks/:id responds with 200 and the specific bookmark', () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)
            })
        })
    })




})

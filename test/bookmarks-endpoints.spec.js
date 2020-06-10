const {expect} = require('chai')
const knex = require('knex');
const app = require('../src/app');
const {makeBookmarksFixtures} = require("./bookmarks.fixtures")

describe("Bookmarks Endpoints", function(){
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
            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
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
        context(`Given an XSS attack`, () => {
            const maliciousBookmark = {
                id: 991,
                title: `Malicious Link <script>alert("xss");</script>`,
                url: `https://yourescrewed.com`,
                rating: 1,
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            }
            beforeEach('insert malicious bookmark', () => {
                return db   
                    .into('bookmarks')
                    .insert([maliciousBookmark])
            })
            it('removes XSS attack content', ()=>{
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res =>{
                        expect(res.body.title).to.eql('Malicious Link &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
    
        })
    })
    describe('POST /bookmarks', () => {
        const requiredFields = ['title', 'url', 'rating']
        requiredFields.forEach(field=> {
            const newBookmark = {
                title: 'Test request',
                url: 'www.test.com',
                rating: 4,
                description: 'Testing requests now.'
            }
            it(`responds with 400 and an error message when the '{field}' is missing`, () => {
                delete newBookmark[field]
                return supertest(app)
                    .post("/bookmarks")
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(400, {
                        error: {message: `Invalid data - ${field} required` }
                    })
            })
        })
       
        it('responds with 400 and an error message when the rating is not between 1 and 5', () =>{
            const badBookmark = {
                title: 'Test bookmark',
                url: 'https://www.test.com',
                rating: 6,
                description: "this is a test bookmark",
                id: 99
            }
            return supertest(app)
                .post("/bookmarks")
                .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                .send(badBookmark)
                .expect(400, {
                    error: {message: `Invalid data - rating needs to be from 1-5 only`}
                }) 
        })
        it('creates a bookmark, responding with 201 and the new bookmark', ()=> {
            const newBookmark = {
                title: 'Test bookmark',
                url: 'https://www.test.com',
                rating: 4,
                description: "this is a test bookmark",
                id: 12
            }
            return supertest(app)
            .post('/bookmarks')
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send(newBookmark)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newBookmark.title)
                expect(res.body.url).to.eql(newBookmark.url)
                expect(res.body.rating).to.eql(newBookmark.rating)
                expect(res.body.description).to.eql(newBookmark.description)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
            })
            .then(postRes =>
                supertest(app)
                .get(`/bookmarks/${postRes.body.id}`)
                .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                .expect(postRes.body))
        })
    })
    describe("DELETE /bookmarks/:id", ()=> {
        context('Given there are bookmarks in the db', ()=>{
            const testBookmarks = makeBookmarksFixtures();
            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                // Remove bookmark fromm test
                const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                        .get(('/bookmarks'))
                        .expect(expectedBookmark)
                    })
            })
        })
        context('Given no bookmarks', () => {
            it('responds with 404', ()=>{
                const bookmarkId=1232992
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, '404 Not Found')
            })
        })
    })
})

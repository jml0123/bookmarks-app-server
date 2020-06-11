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
    
    describe('GET /api/bookmarks', ()=> {
        context("Given no existing bookmarks", () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/bookmarks')
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
            it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            })
        })
    })
    describe('GET /api/bookmarks/:id', ()=> {
        context("Given no bookmarks in the db", () => {
            it('responds with 404 not found', () => {
                const bookmarkId = 90210;
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
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
            it('GET /api/bookmarks/:id responds with 200 and the specific bookmark', () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
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
                    .get(`/api/bookmarks/${maliciousBookmark.id}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res =>{
                        expect(res.body.title).to.eql('Malicious Link &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
    
        })
    })
    describe('POST /api/bookmarks', () => {
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
                    .post("/api/bookmarks")
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
                .post("/api/bookmarks")
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
            .post('/api/bookmarks/')
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .send(newBookmark)
            .expect(201)
            .expect(res => {
                expect(res.body.title).to.eql(newBookmark.title)
                expect(res.body.url).to.eql(newBookmark.url)
                expect(res.body.rating).to.eql(newBookmark.rating)
                expect(res.body.description).to.eql(newBookmark.description)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
            })
            .then(postRes =>
                supertest(app)
                .get(`/api/bookmarks/${postRes.body.id}`)
                .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                .expect(postRes.body))
        })
    })
    describe("DELETE /api/ookmarks/:id", ()=> {
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
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                        .get(('/api/bookmarks'))
                        .expect(expectedBookmark)
                    })
            })
        })
        context('Given no bookmarks', () => {
            it('responds with 404', ()=>{
                const bookmarkId=1232992
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, '404 Not Found')
            })
        })
    })
    describe(`PATCH /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, "404 Not Found")
            })
        })
        context('Given there are bookmarks in the db', () => {
            const testBookmarks = makeBookmarksFixtures();
            beforeEach('Insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it(`responds with 204 and updates the article`, () => {
                const idToUpdate = 2;
                const updateBookmark = {
                    title: 'Updated bookmark title',
                    url: 'https://newdomain.io',
                    rating: 3
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .send(updateBookmark)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)    
                    )
            })
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2;
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .send({ badKey: 'bad data '})
                    .expect(400, {
                        error: {
                            message: `Request body must contain either title, url, rating or description`
                        }
                    })
            })
            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2;
                const updatedData = {
                    title: `updated bookmark title`
                }
                const expectedData = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updatedData
                }
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updatedData,
                        badField: `should not be in GET response`
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedData)
                    )
            })
        })
    })
})

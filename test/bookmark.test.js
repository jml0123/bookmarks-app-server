require('dotenv').config()
const supertest = require('supertest');
const app = require('../src/app');
const { expect } = require('chai');

describe('GET/bookmarks', () => {
    it('should be 401 if invalid auth token is passed', () => {
        return supertest(app)
            .get("/bookmarks")
            .set("Authorization", `Bearer bad token`)
            .expect(401, {error: 'Unauthorized request'})
    })
    it('should be 401 if no auth token is passed', () => {
        return supertest(app)
            .get("/bookmarks")
            .expect(401, {error: 'Unauthorized request'})
    })
    it('should return an array of bookmarks', () => {
        return supertest(app)
            .get("/bookmarks")
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .then(res => {
                expect(res.body).to.be.an('array');
                const bookmark = res.body[0];
                expect(bookmark).to.include.all.keys(
                    'title', 'url', 'rating', 'id'
                )
            })
    })
    it('should be 400 if no title is passed', () => {
        return supertest(app)
            .post("/bookmarks")
            .send({url: "www.abc.com", rating: 4.5})
            .set('Accept', 'application/json')
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400)
    })
    it('should be 400 if no url is passed', () => {
        return supertest(app)
            .post("/bookmarks")
            .send({title: "abc website", rating: 4.5})
            .set('Accept', 'application/json')
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400)
    })
    it('should be 400 if no rating is passed', () => {
        return supertest(app)
            .post("/bookmarks")
            .send({title: "abc website", url: "www.abc.com"})
            .set('Accept', 'application/json')
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400)
    })
    it('should be 200 if all fields are captured', () => {
        return supertest(app)
            .post("/bookmarks")
            .send({title: 'abc website', url: 'www.abc.com', rating: 4.5})
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
    })
})

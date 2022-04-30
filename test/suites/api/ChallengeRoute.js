const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert


describe("should do service operations", function () {
    let server
    let challengeService
    let challengeServiceMock

    this.timeout(3000)

    before(function () {
        challengeService = require('../../../app/service/ChallengeService')
        server = require('./Server')
    })

    after(function () {
        server.close()
    })


    beforeEach(function () {
        challengeServiceMock = sinon.mock(challengeService)
    })

    afterEach(function () {
        challengeServiceMock.restore()
    })

    it("should add challenge", async function () {
        let expectation = challengeServiceMock.expects('addChallenge').once().resolves('someId')
        const response = await request("http://localhost:3000")
            .post("/challenge/")
            .send({ requestedBy: 'a7038', targetUser: 'a001', challengeDate: 'x-y-z', question: { type: 'jumble' } })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.challenger, 'a7038')
            // console.log('in matcher actual is ' + JSON.stringify(actual))
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.text, "someId")
    })

    it("should report internal server error when challenge persist fails", async function () {
        let expectation = challengeServiceMock.expects('addChallenge').once().rejects('Service layer failure')
        const response = await request("http://localhost:3000")
            .post("/challenge/")
            .send({ requestedBy: 'a7038', targetUser: 'a001' })
            .set('Accept', 'application/json')

        expectation.verify()
        assert.equal(response.status, 500)
        assert.equal(response.text, "Could not complete add challenge request due to a backend error")
    })

    it("should report invalid data when challenge data does not validate", async function () {
        const response = await request("http://localhost:3000")
            .post("/challenge/")
            .send({ world: 'beautiful' })
            .set('Accept', 'application/json')

        assert.equal(response.status, 400)
        assert.equal(response.text, "valid challenge data not found")
    })


})
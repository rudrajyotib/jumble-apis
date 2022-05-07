const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert
const { response } = require('express')


describe("should do service operations", function () {
    let challengeService
    let challengeServiceMock

    this.timeout(3000)

    before(function () {
        challengeService = require('../../../app/service/ChallengeService')
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

    it('/duel/:duelId - should return the duel data', async function () {
        let expectation = challengeServiceMock.expects('getDuelData').once().resolves({
            found: true,
            data: { sourceUserId: 'someSourceId', targetUserId: 'someTargetId', status: 'open', challengeId: 'someChallengeId', score: { someSourceId: 1, someTargetId: 2 } }
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/duel/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someDuelId'))
        assert.equal(response.status, 200)
        const duelData = response.body
        assert.equal(duelData.sourceUserId, 'someSourceId')
        assert.equal(duelData.targetUserId, 'someTargetId')
        assert.equal(duelData.status, 'open')
        sinon.assert.match(duelData, sinon.match((duel) => {
            assert.exists(duel.score)
            assert.equal(duel.score['someSourceId'], 1)
            assert.equal(duel.score['someTargetId'], 2)
            assert.exists(duel.challengeId)
            assert.equal(duel.challengeId, 'someChallengeId')
            return true
        }))
    })

    it('/duel/:duelId - should return no content when duel data does not exist', async function () {
        let expectation = challengeServiceMock.expects('getDuelData').once().resolves({ found: false })
        const response = await request("http://localhost:3000")
            .get("/challenge/duel/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someDuelId'))
        assert.equal(response.status, 204)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('/duel/:duelId - should return no content when service layer fails brutally', async function () {
        let expectation = challengeServiceMock.expects('getDuelData').once().rejects({ error: 'mockError' })
        const response = await request("http://localhost:3000")
            .get("/challenge/duel/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someDuelId'))
        assert.equal(response.status, 204)
        const duelData = response.body
        assert.isEmpty(duelData)
    })


})
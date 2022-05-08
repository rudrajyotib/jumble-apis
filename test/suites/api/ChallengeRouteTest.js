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

    it("addChallenge:should add challenge", async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(true)
        const response = await request("http://localhost:3000")
            .post("/challenge/addChallenge/someDuelId")
            .send({ requestedBy: 'a7038', targetUser: 'a001', challengeDate: 'x-y-z', question: { type: 'jumble' } })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.challenger, 'a7038')
            assert.equal(actual.targetUser, 'a001')
            assert.equal(actual.challengeDate, 'x-y-z')
            assert.equal(actual.question.type, 'jumble')
            assert.equal(actual.duelId, 'someDuelId')
            assert.equal(actual.duelEvent, 'challenge')
            return true
        }, "does not match"))
        assert.equal(response.status, 204)
    })

    it("addChallenge:should handle add challenge when service fails gracefully", async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(false)
        const response = await request("http://localhost:3000")
            .post("/challenge/addChallenge/someDuelId")
            .send({ requestedBy: 'a7038', targetUser: 'a001', challengeDate: 'x-y-z', question: { type: 'jumble' } })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.challenger, 'a7038')
            assert.equal(actual.targetUser, 'a001')
            assert.equal(actual.challengeDate, 'x-y-z')
            assert.equal(actual.question.type, 'jumble')
            assert.equal(actual.duelId, 'someDuelId')
            assert.equal(actual.duelEvent, 'challenge')
            return true
        }, "does not match"))
        assert.equal(response.status, 400)
    })

    it("addChallenge:should report internal server error when challenge persist fails", async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().rejects('Service layer failure')
        const response = await request("http://localhost:3000")
            .post("/challenge/addChallenge/someDuelId")
            .send({ requestedBy: 'a7038', targetUser: 'a001', challengeDate: 'x-y-z', question: { type: 'jumble' } })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.challenger, 'a7038')
            assert.equal(actual.targetUser, 'a001')
            assert.equal(actual.challengeDate, 'x-y-z')
            assert.equal(actual.question.type, 'jumble')
            assert.equal(actual.duelId, 'someDuelId')
            assert.equal(actual.duelEvent, 'challenge')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.isEmpty(response.text)
    })

    it("addChallenge:should report invalid data when challenge data does not validate", async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').never()
        const response = await request("http://localhost:3000")
            .post("/challenge/addChallenge/someDuelId")
            .send({ world: 'beautiful' })
            .set('Accept', 'application/json')

        assert.equal(response.status, 400)
        assert.equal(response.text, "valid challenge data not found")
    })

    it('getDuelData: /duel/:duelId - should return the duel data', async function () {
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

    it('getDuelData: /duel/:duelId - should return no content when duel data does not exist', async function () {
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

    it('getDuelData: /duel/:duelId - should return no content when service layer fails brutally', async function () {
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
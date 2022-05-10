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

    it('attemptChallenge: /attemptChallenge/:duelId - should update to attempt duel', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(true)
        const response = await request("http://localhost:3000")
            .post("/challenge/attempt/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('attempt', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 204)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('attemptChallenge: /attemptChallenge/:duelId - should return graceful failure of service', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(false)
        const response = await request("http://localhost:3000")
            .post("/challenge/attempt/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('attempt', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('attemptChallenge: /attemptChallenge/:duelId - should return runtime failure of service', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .post("/challenge/attempt/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('attempt', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('challengeSuccess: /attemptChallenge/:duelId - should update to mark duel success', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(true)
        const response = await request("http://localhost:3000")
            .post("/challenge/success/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('success', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 204)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('challengeSuccess: /attemptChallenge/:duelId - should update to mark duel success', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(false)
        const response = await request("http://localhost:3000")
            .post("/challenge/success/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('success', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('challengeSuccess: /attemptChallenge/:duelId - should update to mark duel success', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .post("/challenge/success/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('success', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('failChallenge: /attemptChallenge/:duelId - should update to mark duel failure', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(true)
        const response = await request("http://localhost:3000")
            .post("/challenge/failure/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('failure', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 204)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('failChallenge: /attemptChallenge/:duelId - should update to mark duel failure', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().resolves(false)
        const response = await request("http://localhost:3000")
            .post("/challenge/failure/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('failure', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })

    it('failChallenge: /attemptChallenge/:duelId - should update to mark duel failure', async function () {
        let expectation = challengeServiceMock.expects('updateDuelData').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .post("/challenge/failure/someDuelId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match((duelData) => {
            assert.equal('someDuelId', duelData.duelId)
            assert.equal('failure', duelData.duelEvent)
            return true
        }))
        assert.equal(response.status, 400)
        const duelData = response.body
        assert.isEmpty(duelData)
    })


    it('getChallengeData:/challenge/:challengeId - should return the challenge data', async function () {
        let expectation = challengeServiceMock.expects('getChallengeData').once().resolves({
            found: true,
            data: { type: 'jumble', question: { questionData: 'soemWord' } }
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/challenge/someChallengeId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someChallengeId'))
        assert.equal(response.status, 200)
        const duelData = response.body
        assert.equal(duelData.type, 'jumble')
        assert.equal(duelData.question.questionData, 'soemWord')
    })

    it('getChallengeData: /challenge/:challengeId - should return error response when challenge data does not exist', async function () {
        let expectation = challengeServiceMock.expects('getChallengeData').once().resolves({ found: false })
        const response = await request("http://localhost:3000")
            .get("/challenge/challenge/someChallengeId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someChallengeId'))
        assert.equal(response.status, 400)
        const challengeData = response.body
        assert.isEmpty(challengeData)
    })

    it('getChallengeData: /challenge/:challengeId - should return error response when service layer promise fails', async function () {
        let expectation = challengeServiceMock.expects('getChallengeData').once().rejects({ error: 'mockError' })
        const response = await request("http://localhost:3000")
            .get("/challenge/challenge/someChallengeId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someChallengeId'))
        assert.equal(response.status, 400)
        const challengeData = response.body
        assert.isEmpty(challengeData)
    })

    it("listPendingDuels: /pendingduels/:targetUserId - should load all pending duels and send in response", async function () {
        let expectation = challengeServiceMock.expects('listOfPendingDuels').once().resolves({
            found: true, duels: [
                { duelId: 'd1', sourceUser: 'someSourceUser1', challengeId: 'c1' },
                { duelId: 'd2', sourceUser: 'someSourceUser2', challengeId: 'c2' }
            ]
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/pendingduels/someTargetUserId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someTargetUserId'))
        assert.equal(response.status, 200)
        const challengeData = response.body
        assert.equal(challengeData.length, 2)
        assert.equal(challengeData[0].duelId, 'd1')
        assert.equal(challengeData[0].sourceUser, 'someSourceUser1')
        assert.equal(challengeData[0].challengeId, 'c1')
        assert.equal(challengeData[0].duelId, 'd1')
        assert.equal(challengeData[0].sourceUser, 'someSourceUser1')
        assert.equal(challengeData[0].challengeId, 'c1')
    })

    it("listPendingDuels: /pendingduels/:targetUserId - should handle if service returns empty array", async function () {
        let expectation = challengeServiceMock.expects('listOfPendingDuels').once().resolves({
            found: true, duels: []
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/pendingduels/someTargetUserId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someTargetUserId'))
        assert.equal(response.status, 400)
        const challengeData = response.body
        assert.isEmpty(challengeData)
    })

    it("listPendingDuels: /pendingduels/:targetUserId - should handle if service notifies not found", async function () {
        let expectation = challengeServiceMock.expects('listOfPendingDuels').once().resolves({
            found: false
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/pendingduels/someTargetUserId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someTargetUserId'))
        assert.equal(response.status, 400)
        const challengeData = response.body
        assert.isEmpty(challengeData)
    })

    it("listPendingDuels: /pendingduels/:targetUserId - should handle if service fails", async function () {
        let expectation = challengeServiceMock.expects('listOfPendingDuels').once().rejects({
            error: 'mock error'
        })
        const response = await request("http://localhost:3000")
            .get("/challenge/pendingduels/someTargetUserId")
            .send()
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match('someTargetUserId'))
        assert.equal(response.status, 400)
        const challengeData = response.body
        assert.isEmpty(challengeData)
    })
})
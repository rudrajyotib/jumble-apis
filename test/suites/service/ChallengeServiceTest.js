const sinon = require('sinon')
const { assert } = require('chai')


describe("challenge service test suite", function () {
    let challengeService
    let challengeRepositoryMock
    let challengeRepo

    before(function () {
        challengeService = require('../../../app/service/ChallengeService')
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
    })

    beforeEach(function () {
        challengeRepositoryMock = sinon.mock(challengeRepo)
    })

    afterEach(function () {
        challengeRepositoryMock.restore()
    })

    it("addChallenge:challenge service should add challenge data", async function () {
        let expectation = challengeRepositoryMock.expects('addChallenge').once().returns('someId')
        let challengeId = await challengeService.addChallenge({ place: 'hell' })
        assert.equal('someId', challengeId)
        expectation.verify()
    })

    it("addChallenge:challenge service should handle error adding challenge data", async function () {
        let expect = challengeRepositoryMock.expects('addChallenge').once().throws(new Error('challenge creation failed'))

        let err
        try {
            let id = await challengeService.addChallenge({ place: 'hell' })
        } catch (error) {
            err = error
        }
        assert.equal('Challenege could not be created', err.message)
    })

    it("getDuelData:should fetch duel data for a duelId", async function () {
        let getDuelDataExpectation = challengeRepositoryMock.expects('getDuel').once().resolves({
            found: true,
            data: { sourceUserId: 'someSourceId', targetUserId: 'someTargetId', status: 'open', challengeId: 'someChallengeId', score: { someSourceId: 1, someTargetId: 2 } }
        })
        const duelDataResponse = await challengeService.getDuelData('someDuelId')
        getDuelDataExpectation.verify()
        sinon.assert.calledWith(getDuelDataExpectation.getCall(0), 'someDuelId')
        assert.isTrue(duelDataResponse.found)
        const duelData = duelDataResponse.data
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

    it("getDuelData:should gracefully handle repo error when getting duel data", async function () {
        let getDuelDataExpectation = challengeRepositoryMock.expects('getDuel').once().resolves({ found: false })
        const duelDataResponse = await challengeService.getDuelData('someDuelId')
        getDuelDataExpectation.verify()
        sinon.assert.calledWith(getDuelDataExpectation.getCall(0), 'someDuelId')
        assert.isFalse(duelDataResponse.found)
        assert.notExists(duelDataResponse.data)

    })

    it("getDuelData:should handle brute repo error when getting duel data", async function () {
        let getDuelDataExpectation = challengeRepositoryMock.expects('getDuel').once().rejects({ error: 'mock error' })
        const duelDataResponse = await challengeService.getDuelData('someDuelId')
        getDuelDataExpectation.verify()
        sinon.assert.calledWith(getDuelDataExpectation.getCall(0), 'someDuelId')
        assert.isFalse(duelDataResponse.found)
        assert.notExists(duelDataResponse.data)
    })

    it("updateDuelData: should update duel data with with challenge", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.once().resolves('someChallengeId')
        duelUpdateExpectation.once().resolves(true)
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'challenge', challengeData: { challengeInput: 'someInput' } })
        assert.isTrue(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match((challengeInput) => {
            assert.equal(challengeInput.challengeInput, 'someInput')
            return true
        }))
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.exists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.notExists(updateDuelInput.scoreUpdate)
            assert.notExists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.challengeId, 'someChallengeId')
            assert.equal(updateDuelInput.status, 'active')
            return true
        }))
    })

    it("updateDuelData: should not update duel data if challenge creation fails gracefully", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.once().rejects({ error: 'mock error' })
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'challenge', challengeData: { challengeInput: 'someInput' } })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match((challengeInput) => {
            assert.equal(challengeInput.challengeInput, 'someInput')
            return true
        }))
    })

    it("updateDuelData: should update duel when a duel is completed successfully", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.once().resolves(true)
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'success' })
        assert.isTrue(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.notExists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.exists(updateDuelInput.scoreUpdate)
            assert.exists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.status, 'active')
            assert.isTrue(updateDuelInput.scoreUpdate)
            assert.isTrue(updateDuelInput.roleChange)
            return true
        }))
    })

    it("updateDuelData: should update duel when a duel is not completed successfully", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.once().resolves(true)
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'failure' })
        assert.isTrue(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.notExists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.notExists(updateDuelInput.scoreUpdate)
            assert.exists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.status, 'active')
            // assert.isTrue(updateDuelInput.scoreUpdate)
            assert.isTrue(updateDuelInput.roleChange)
            return true
        }))
    })

    it("updateDuelData: should update duel when a duel is being attempted", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.once().resolves(true)
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'attempt' })
        assert.isTrue(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.notExists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.notExists(updateDuelInput.scoreUpdate)
            assert.notExists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.status, 'inProgress')
            // assert.isTrue(updateDuelInput.scoreUpdate)
            // assert.isTrue(updateDuelInput.roleChange)
            return true
        }))
    })

    it("updateDuelData: should handle when repo fails to update duel", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.once().rejects({ error: 'mock error' })
        const result = await challengeService.updateDuelData({ duelId: 'someDuelId', duelEvent: 'attempt' })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.notExists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.notExists(updateDuelInput.scoreUpdate)
            assert.notExists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.status, 'inProgress')
            // assert.isTrue(updateDuelInput.scoreUpdate)
            // assert.isTrue(updateDuelInput.roleChange)
            return true
        }))
    })

    it("updateDuelData: should not attempt if duelId is empty", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({ duelId: '    ', duelEvent: 'attempt' })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
    })

    it("updateDuelData: should not attempt if duelId is not provided", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({ duelEvent: 'attempt' })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
    })

    it("updateDuelData: should not attempt if duelEvent is empty", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({ duelId: 'someId', duelEvent: '    ' })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
    })

    it("updateDuelData: should not attempt if duelEvent is not provided", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({ duelId: 'someId' })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
    })

    it("getChallengeData: should get challenge data from repo", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('getChallenge')
        addChallenegeExpectation.once().resolves({ found: true, data: { question: 'someQuestion' } })
        const challengeData = await challengeService.getChallengeData('someChallengeId')
        assert.isTrue(challengeData.found)
        assert.equal(challengeData.data.question, "someQuestion")
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match("someChallengeId"))
    })

    it("getChallengeData: should report if challenge is found in repo without any data", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('getChallenge')
        addChallenegeExpectation.once().resolves({ found: true })
        const challengeData = await challengeService.getChallengeData('someChallengeId')
        assert.isFalse(challengeData.found)
        assert.notExists(challengeData.data)
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match("someChallengeId"))
    })

    it("getChallengeData: should report if challenge is not found in repo", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('getChallenge')
        addChallenegeExpectation.once().resolves({ found: false })
        const challengeData = await challengeService.getChallengeData('someChallengeId')
        assert.isFalse(challengeData.found)
        assert.notExists(challengeData.data)
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match("someChallengeId"))
    })

    it("getChallengeData: should report if challenge repo rejects promise", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('getChallenge')
        addChallenegeExpectation.once().rejects({ error: "mock error" })
        const challengeData = await challengeService.getChallengeData('someChallengeId')
        assert.isFalse(challengeData.found)
        assert.notExists(challengeData.data)
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match("someChallengeId"))
    })
})
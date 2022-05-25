const sinon = require('sinon')
const { assert } = require('chai')


describe("challenge service test suite", function () {
    let challengeService
    let challengeRepositoryMock
    let userRepositoryMock
    let challengeRepo
    let userRepo

    before(function () {
        challengeService = require('../../../app/service/ChallengeService')
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
        userRepo = require('../../../app/repositories/UserRepository')
    })

    beforeEach(function () {
        challengeRepositoryMock = sinon.mock(challengeRepo)
        userRepositoryMock = sinon.mock(userRepo)
    })

    afterEach(function () {
        challengeRepositoryMock.restore()
        userRepositoryMock.restore()
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
        const result = await challengeService.updateDuelData({
            duelId: 'someDuelId', duelEvent: 'challenge', challengeData: {
                sourceUserId: 'someSource',
                question: { type: 'JUMBLE', content: { word: 'ABCDE' } }
            }
        })
        assert.isTrue(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match((challengeInput) => {
            assert.equal(challengeInput.sourceUserId, 'someSource')
            assert.equal(challengeInput.question.type, 'JUMBLE')
            assert.equal(challengeInput.question.content.word, 'ABCDE')
            return true
        }))
        sinon.assert.calledWith(duelUpdateExpectation.getCall(0), sinon.match((updateDuelInput) => {
            assert.exists(updateDuelInput.duelId)
            assert.exists(updateDuelInput.challengeId)
            assert.exists(updateDuelInput.status)
            assert.notExists(updateDuelInput.scoreUpdate)
            assert.notExists(updateDuelInput.roleChange)
            assert.equal(updateDuelInput.duelId, 'someDuelId')
            assert.equal(updateDuelInput.userId, 'someSource')
            assert.equal(updateDuelInput.challengeId, 'someChallengeId')
            assert.equal(updateDuelInput.status, 'pendingAction')
            return true
        }))
    })

    it("updateDuelData: should not update duel data if challenge creation fails gracefully", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.once().rejects({ error: 'mock error' })
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({
            duelId: 'someDuelId', duelEvent: 'challenge', challengeData: {
                sourceUserId: 'someSource',
                question: { type: 'JUMBLE', content: { word: 'ABCDE' } }
            }
        })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
        sinon.assert.calledWith(addChallenegeExpectation.getCall(0), sinon.match((challengeInput) => {
            assert.equal(challengeInput.sourceUserId, 'someSource')
            assert.equal(challengeInput.question.type, 'JUMBLE')
            assert.equal(challengeInput.question.content.word, 'ABCDE')
            return true
        }))
    })

    it("updateDuelData: should not update duel data if challenge creation input is not valid", async function () {
        let addChallenegeExpectation = challengeRepositoryMock.expects('addChallenge')
        let duelUpdateExpectation = challengeRepositoryMock.expects('updateDuel')
        addChallenegeExpectation.never()
        duelUpdateExpectation.never()
        const result = await challengeService.updateDuelData({
            duelId: 'someDuelId', duelEvent: 'challenge', challengeData: {
                sourceUserId: 'someSource',
                question: { type: 'JUMBLE', content: { word: 'ABCD1E' } }
            }
        })
        assert.isFalse(result)
        duelUpdateExpectation.verify()
        addChallenegeExpectation.verify()
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
            assert.exists(updateDuelInput.preCondition)
            assert.equal(updateDuelInput.preCondition, 'inProgress')
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
            assert.exists(updateDuelInput.preCondition)
            assert.equal(updateDuelInput.preCondition, 'inProgress')
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
            assert.exists(updateDuelInput.preCondition)
            assert.equal(updateDuelInput.preCondition, 'pendingAction')
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
            assert.exists(updateDuelInput.preCondition)
            assert.equal(updateDuelInput.preCondition, 'pendingAction')
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

    it("listOfPendingDuels: should get all duels with source user name and challenge Id", async function () {
        let challengeRepoExpectation = challengeRepositoryMock.expects('getDuelsByTargetUserAndStatus')
        let userRepoExpectation = userRepositoryMock.expects('getUser')
        challengeRepoExpectation.once().resolves({
            errorCode: 1, duels: [
                { duelId: 'd1', sourceUserId: 'sourceUserId1', challengeId: 'c1' },
                { duelId: 'd2', sourceUserId: 'sourceUserId2', challengeId: 'c2' },
                { duelId: 'd3', challengeId: 'c3' },
                { duelId: 'd4', sourceUserId: 'sourceUserId4', challengeId: 'c4' },
            ]
        })
        userRepoExpectation.exactly(3)
        userRepoExpectation.onCall(0).resolves({ found: true, id: 'sourceUserId1', name: 'sourceUserName1', email: 'sourceUserEmail1' })
        userRepoExpectation.onCall(1).resolves({ found: true, id: 'sourceUserId2', name: 'sourceUserName2', email: 'sourceUserEmail2' })
        userRepoExpectation.onCall(2).resolves({ found: false })
        const duelDetails = await challengeService.listOfPendingDuels('someTargetUserId')
        challengeRepoExpectation.verify()
        userRepoExpectation.verify()
        assert.isTrue(duelDetails.found)
        assert.equal(duelDetails.duels.length, 2)
        assert.equal(duelDetails.duels[0].sourceUser, 'sourceUserName1')
        assert.equal(duelDetails.duels[0].duelId, 'd1')
        assert.equal(duelDetails.duels[0].challengeId, 'c1')
        assert.equal(duelDetails.duels[1].sourceUser, 'sourceUserName2')
        assert.equal(duelDetails.duels[1].duelId, 'd2')
        assert.equal(duelDetails.duels[1].challengeId, 'c2')
        sinon.assert.calledWith(challengeRepoExpectation.getCall(0), 'someTargetUserId', 'pendingAction')
        sinon.assert.calledWith(userRepoExpectation.getCall(0), 'sourceUserId1')
        sinon.assert.calledWith(userRepoExpectation.getCall(1), 'sourceUserId2')
        sinon.assert.calledWith(userRepoExpectation.getCall(2), 'sourceUserId4')
    })

    it("listOfPendingDuels: should handle when duels are not found by repo", async function () {
        let challengeRepoExpectation = challengeRepositoryMock.expects('getDuelsByTargetUserAndStatus')
        let userRepoExpectation = userRepositoryMock.expects('getUser')
        challengeRepoExpectation.once().resolves({ errorCode: -1, })
        userRepoExpectation.never()
        const duelDetails = await challengeService.listOfPendingDuels('someTargetUserId')
        challengeRepoExpectation.verify()
        userRepoExpectation.verify()
        assert.isFalse(duelDetails.found)
        assert.notExists(duelDetails.duels)
    })

    it("listOfPendingDuels: should handle errors in repo", async function () {
        let challengeRepoExpectation = challengeRepositoryMock.expects('getDuelsByTargetUserAndStatus')
        let userRepoExpectation = userRepositoryMock.expects('getUser')
        challengeRepoExpectation.once().rejects({ error: 'mock error' })
        userRepoExpectation.never()
        const duelDetails = await challengeService.listOfPendingDuels('someTargetUserId')
        challengeRepoExpectation.verify()
        userRepoExpectation.verify()
        assert.isFalse(duelDetails.found)
        assert.notExists(duelDetails.duels)
    })

    it("listOfPendingDuels: should handle blank input", async function () {
        let challengeRepoExpectation = challengeRepositoryMock.expects('getDuelsByTargetUserAndStatus')
        let userRepoExpectation = userRepositoryMock.expects('getUser')
        challengeRepoExpectation.never()
        userRepoExpectation.never()
        const duelDetails = await challengeService.listOfPendingDuels('')
        challengeRepoExpectation.verify()
        userRepoExpectation.verify()
        assert.isFalse(duelDetails.found)
        assert.notExists(duelDetails.duels)
    })
})
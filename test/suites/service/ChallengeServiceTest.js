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

})
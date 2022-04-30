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

    it("challenge service should add challenge data", async function () {
        let expectation = challengeRepositoryMock.expects('addChallenge').once().returns('someId')
        let challengeId = await challengeService.addChallenge({ place: 'hell' })
        assert.equal('someId', challengeId)
        expectation.verify()
    })

    it("challenge service should handle error adding challenge data", async function () {
        let expect = challengeRepositoryMock.expects('addChallenge').once().throws(new Error('challenge creation failed'))

        let err
        try {
            let id = await challengeService.addChallenge({ place: 'hell' })
        } catch (error) {
            err = error
        }
        assert.equal('Challenege could not be created', err.message)
    })

})
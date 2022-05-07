const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all challenge repository tests", function () {

    let documentDataMock
    let firestoreCollectionSpy
    let challengeRepo
    let firestoreSpy
    let firestore

    before(function () {
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
        firestore = require('../../setup/AppSetup').firestore
    })

    beforeEach(function () {
        documentDataMock = sinon.mock(firebaseSetup.firestoreDocument)
        firestoreCollectionSpy = sinon.spy(firebaseSetup.firestoreCollection, 'doc')
        firestoreSpy = sinon.spy(firestore, 'collection')
    })

    afterEach(function () {
        documentDataMock.restore()
        firestoreCollectionSpy.restore()
        firestoreSpy.restore()
    })

    it('should set data', async function () {
        let expectation = documentDataMock.expects('set').once().resolves()
        await challengeRepo.addChallenge({ place: 'hell' })
        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match.has('place'))
        assert(firestoreCollectionSpy.calledOnce)
    })

    it('should handle failure to add data', async function () {
        let expectation = documentDataMock.expects('set').once().rejects(new Error('could not add challenge'))
        let err
        try {
            await challengeRepo.addChallenge()
        } catch (error) {
            err = error
        }
        assert.equal('challenge not created', err.message)
        expectation.verify()
    })

    it('should add a new duel', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const setDuelExpectation = documentDataMock.expects('set')
        getDuelExpectation.once().resolves({ exists: false })
        setDuelExpectation.once().resolves()
        const addDuelResult = await challengeRepo.addDuel({
            duelId: 'someDuelId',
            sourceUserId: 'someSourceUserId',
            targetUserId: 'someTargetUserId',
            duelStatus: 'someDuelStatus'
        })
        assert.isTrue(addDuelResult)
        getDuelExpectation.verify()
        setDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), "duel")
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(setDuelExpectation.getCall(0), sinon.match((duelData) => {
            assert.equal(duelData.sourceUserId, 'someSourceUserId')
            assert.equal(duelData.targetUserId, 'someTargetUserId')
            assert.equal(duelData.duelStatus, 'someDuelStatus')
            assert.exists(duelData.score)
            assert.equal(duelData.score['someSourceUserId'], 0)
            assert.equal(duelData.score['someTargetUserId'], 0)
            return true
        }))
    })

    it('should negate when duel fails to be persisted', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const setDuelExpectation = documentDataMock.expects('set')
        getDuelExpectation.once().resolves({ exists: false })
        setDuelExpectation.once().rejects({ error: 'mock error' })
        const addDuelResult = await challengeRepo.addDuel({
            duelId: 'someDuelId',
            sourceUserId: 'someSourceUserId',
            targetUserId: 'someTargetUserId',
            duelStatus: 'someDuelStatus'
        })
        assert.isFalse(addDuelResult)
        getDuelExpectation.verify()
        setDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), "duel")
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(setDuelExpectation.getCall(0), sinon.match((duelData) => {
            assert.equal(duelData.sourceUserId, 'someSourceUserId')
            assert.equal(duelData.targetUserId, 'someTargetUserId')
            assert.equal(duelData.duelStatus, 'someDuelStatus')
            assert.exists(duelData.score)
            assert.equal(duelData.score['someSourceUserId'], 0)
            assert.equal(duelData.score['someTargetUserId'], 0)
            return true
        }))
    })

    it('should negate when duel already exists', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const setDuelExpectation = documentDataMock.expects('set')
        getDuelExpectation.once().resolves({ exists: true })
        setDuelExpectation.never()
        const addDuelResult = await challengeRepo.addDuel({
            duelId: 'someDuelId',
            sourceUserId: 'someSourceUserId',
            targetUserId: 'someTargetUserId',
            duelStatus: 'someDuelStatus'
        })
        assert.isFalse(addDuelResult)
        getDuelExpectation.verify()
        setDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), "duel")
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)

    })

})

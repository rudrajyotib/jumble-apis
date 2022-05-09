const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all challenge repository tests", function () {

    let documentDataMock
    let firestoreCollectionSpy
    let challengeRepo
    let firestoreSpy
    let firestore
    let firestoreCollectionMock
    let querySnapshotMock
    let firestoreCollection

    before(function () {
        challengeRepo = require('../../../app/repositories/ChallengeRepository')
        firestore = require('../../setup/AppSetup').firestore
        firestoreCollection = require('../../setup/AppSetup').firestoreCollection
    })

    beforeEach(function () {
        documentDataMock = sinon.mock(firebaseSetup.firestoreDocument)
        firestoreCollectionSpy = sinon.spy(firebaseSetup.firestoreCollection, 'doc')
        firestoreSpy = sinon.spy(firestore, 'collection')
        firestoreCollectionMock = sinon.mock(firebaseSetup.firestoreCollection)
        querySnapshotMock = sinon.mock(firebaseSetup.querySnapshot)
    })

    afterEach(function () {
        documentDataMock.restore()
        firestoreCollectionSpy.restore()
        firestoreSpy.restore()
        firestoreCollectionMock.restore()
        querySnapshotMock.restore()
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

    it("should get details of a duel", async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () { return { sourceUserId: 'someSourceId', targetUserId: 'someTargetId', duelStatus: 'open', score: { someTargetId: 1, someSourceId: 2 } } }
        })
        const duelDataResponse = await challengeRepo.getDuel('someDuelId')
        getDuelExpectation.verify()
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        assert.isTrue(duelDataResponse.found)
        const duelData = duelDataResponse.data
        assert.equal(duelData.sourceUserId, 'someSourceId')
        assert.equal(duelData.targetUserId, 'someTargetId')
        assert.equal(duelData.status, 'open')
        sinon.assert.match(duelData, sinon.match((duel) => {
            assert.exists(duel.score)
            assert.equal(duel.score['someSourceId'], 2)
            assert.equal(duel.score['someTargetId'], 1)
            assert.notExists(duel.challengeId)
            return true
        }))
    })

    it("should handle absence of duel gracefully when duel is searched", async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        getDuelExpectation.once().resolves({ exists: false })
        const duelData = await challengeRepo.getDuel('someDuelId')
        getDuelExpectation.verify()
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        assert.isFalse(duelData.found)
        assert.notExists(duelData.data)
    })

    it('updateDuel:should update duel with all details', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () {
                return {
                    sourceUserId: 'someSourceId',
                    targetUserId: 'someTargetId',
                    score: initialScore,
                    status: 'open'
                }
            }
        })
        updateDuelExpectation.once().resolves()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            scoreUpdate: true,
            roleChange: true,
            challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isTrue(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(updateDuelExpectation.getCall(0), sinon.match((updateInput) => {
            assert.exists(updateInput.duelStatus)
            assert.exists(updateInput.sourceUserId)
            assert.exists(updateInput.targetUserId)
            assert.exists(updateInput.challengeId)
            assert.exists(updateInput.score)
            assert.equal(updateInput.duelStatus, 'active')
            assert.equal(updateInput.sourceUserId, 'someTargetId')
            assert.equal(updateInput.targetUserId, 'someSourceId')
            assert.equal(updateInput.challengeId, 'c1')
            assert.equal(updateInput.score['someSourceId'], 4)
            assert.equal(updateInput.score['someTargetId'], 9)
            return true
        }))


    })

    it('updateDuel:should should update only status', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () {
                return {
                    sourceUserId: 'someSourceId',
                    targetUserId: 'someTargetId',
                    score: initialScore,
                    status: 'open'
                }
            }
        })
        updateDuelExpectation.once().resolves()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            // roleChange: true,
            // challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isTrue(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(updateDuelExpectation.getCall(0), sinon.match((updateInput) => {
            assert.exists(updateInput.duelStatus)
            assert.notExists(updateInput.sourceUserId)
            assert.notExists(updateInput.targetUserId)
            assert.notExists(updateInput.challengeId)
            assert.notExists(updateInput.score)
            assert.equal(updateInput.duelStatus, 'active')
            // assert.equal(updateInput.sourceUserId, 'someTargetId')
            // assert.equal(updateInput.targetUserId, 'someSourceId')
            // assert.equal(updateInput.challengeId, 'c1')
            // assert.equal(updateInput.score['someSourceId'], 4)
            // assert.equal(updateInput.score['someTargetId'], 9)
            return true
        }))
    })


    it('updateDuel:should should update only challengeId', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () {
                return {
                    sourceUserId: 'someSourceId',
                    targetUserId: 'someTargetId',
                    score: initialScore,
                    status: 'open'
                }
            }
        })
        updateDuelExpectation.once().resolves()
        const updateResult = await challengeRepo.updateDuel({
            // status: 'active',
            // scoreUpdate: true,
            // roleChange: true,
            challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isTrue(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(updateDuelExpectation.getCall(0), sinon.match((updateInput) => {
            assert.notExists(updateInput.duelStatus)
            assert.notExists(updateInput.sourceUserId)
            assert.notExists(updateInput.targetUserId)
            assert.exists(updateInput.challengeId)
            assert.notExists(updateInput.score)
            // assert.equal(updateInput.duelStatus, 'active')
            // assert.equal(updateInput.sourceUserId, 'someTargetId')
            // assert.equal(updateInput.targetUserId, 'someSourceId')
            assert.equal(updateInput.challengeId, 'c1')
            // assert.equal(updateInput.score['someSourceId'], 4)
            // assert.equal(updateInput.score['someTargetId'], 9)
            return true
        }))


    })

    it('updateDuel:should should update status and change roles without updating score', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () {
                return {
                    sourceUserId: 'someSourceId',
                    targetUserId: 'someTargetId',
                    score: initialScore,
                    status: 'open'
                }
            }
        })
        updateDuelExpectation.once().resolves()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isTrue(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(updateDuelExpectation.getCall(0), sinon.match((updateInput) => {
            assert.exists(updateInput.duelStatus)
            assert.exists(updateInput.sourceUserId)
            assert.exists(updateInput.targetUserId)
            assert.notExists(updateInput.challengeId)
            assert.notExists(updateInput.score)
            assert.equal(updateInput.duelStatus, 'active')
            assert.equal(updateInput.sourceUserId, 'someTargetId')
            assert.equal(updateInput.targetUserId, 'someSourceId')
            // assert.equal(updateInput.challengeId, 'c1')
            // assert.equal(updateInput.score['someSourceId'], 4)
            // assert.equal(updateInput.score['someTargetId'], 9)
            return true
        }))
    })

    it('updateDuel:should should handle graceful update failures', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: true,
            data: function () {
                return {
                    sourceUserId: 'someSourceId',
                    targetUserId: 'someTargetId',
                    score: initialScore,
                    status: 'open'
                }
            }
        })
        updateDuelExpectation.once().rejects({ error: 'mock error' })
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isFalse(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(updateDuelExpectation.getCall(0), sinon.match((updateInput) => {
            assert.exists(updateInput.duelStatus)
            assert.exists(updateInput.sourceUserId)
            assert.exists(updateInput.targetUserId)
            assert.notExists(updateInput.challengeId)
            assert.notExists(updateInput.score)
            assert.equal(updateInput.duelStatus, 'active')
            assert.equal(updateInput.sourceUserId, 'someTargetId')
            assert.equal(updateInput.targetUserId, 'someSourceId')
            // assert.equal(updateInput.challengeId, 'c1')
            // assert.equal(updateInput.score['someSourceId'], 4)
            // assert.equal(updateInput.score['someTargetId'], 9)
            return true
        }))
    })


    it('updateDuel:should should handle if duel does not exist', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: false
        })
        updateDuelExpectation.never()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isFalse(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')

    })

    it('updateDuel:should should handle if duel does not exist', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.once().resolves({
            exists: false
        })
        updateDuelExpectation.never()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            duelId: 'someDuelId'
        })
        assert.isFalse(updateResult)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')

    })

    it('updateDuel:should should handle if duelId is missing in request', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.never()
        updateDuelExpectation.never()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            // duelId: 'someDuelId'
        })
        assert.isFalse(updateResult)
        assert(firestoreSpy.notCalled)
        assert(firestoreCollectionSpy.notCalled)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        // sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        // sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')

    })

    it('updateDuel:should should handle if duelId is blank in request', async function () {
        const getDuelExpectation = documentDataMock.expects('get')
        const updateDuelExpectation = documentDataMock.expects('update')
        initialScore = {}
        initialScore['someSourceId'] = 4
        initialScore['someTargetId'] = 8
        getDuelExpectation.never()
        updateDuelExpectation.never()
        const updateResult = await challengeRepo.updateDuel({
            status: 'active',
            // scoreUpdate: true,
            roleChange: true,
            // challengeId: 'c1',
            duelId: ''
        })
        assert.isFalse(updateResult)
        assert(firestoreSpy.notCalled)
        assert(firestoreCollectionSpy.notCalled)
        updateDuelExpectation.verify()
        getDuelExpectation.verify()
        // sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someDuelId')
        // sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')

    })

    it("getChallenge::should get details of a challenge", async function () {
        const getChallengeExpectation = documentDataMock.expects('get').once().resolves({
            exists: true,
            data: function () {
                return {
                    questionType: "jumble",
                    question: { word: "someWord" }
                }
            }
        })
        const challengeDetails = await challengeRepo.getChallenge("someChallengeId")
        getChallengeExpectation.verify()
        assert.equal(getChallengeExpectation.getCall(0).args.length, 0)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someChallengeId')
        assert.isTrue(challengeDetails.found)
        assert.equal(challengeDetails.data.type, 'jumble')
        assert.equal(challengeDetails.data.question.word, 'someWord')
    })

    it("getChallenge::should handle gracefully if no data is found", async function () {
        const getChallengeExpectation = documentDataMock.expects('get').once().resolves({
            exists: false
        })
        const challengeDetails = await challengeRepo.getChallenge("someChallengeId")
        getChallengeExpectation.verify()
        assert.equal(getChallengeExpectation.getCall(0).args.length, 0)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someChallengeId')
        assert.isFalse(challengeDetails.found)
        assert.notExists(challengeDetails.data)
    })

    it("getChallenge::should handle if get promise is rejected", async function () {
        const getChallengeExpectation = documentDataMock.expects('get').once().rejects({
            error: "mock error"
        })
        const challengeDetails = await challengeRepo.getChallenge("someChallengeId")
        getChallengeExpectation.verify()
        assert.equal(getChallengeExpectation.getCall(0).args.length, 0)
        assert(firestoreSpy.calledOnce)
        assert(firestoreCollectionSpy.calledOnce)
        sinon.assert.calledWith(firestoreCollectionSpy.getCall(0), 'someChallengeId')
        assert.isFalse(challengeDetails.found)
        assert.notExists(challengeDetails.data)
    })

    it("getDuelsByTargetUserAndStatus: should load all duels matching query", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').twice()
        whereClauseExpectation.onCall(0).returns(firestoreCollection)
        whereClauseExpectation.onCall(1).returns(firebaseSetup.querySnapshot)
        const querySnapshotExpectation = querySnapshotMock.expects('get').once().resolves(
            [
                { id: 'duel1', data: function () { return { sourceUserId: 'sourceUserId1' } } },
                { id: 'duel2', data: function () { return { sourceUserId: 'sourceUserId2' } } }
            ]
        )
        const result = await challengeRepo.getDuelsByTargetUserAndStatus('user1', 'open')
        whereClauseExpectation.verify()
        querySnapshotExpectation.verify()
        assert.equal(result.duels.length, 2)
        assert.equal(result.errorCode, 1)
        assert.equal(result.duels[0].duelId, 'duel1')
        assert.equal(result.duels[0].sourceUserId, 'sourceUserId1')
        assert.equal(result.duels[1].duelId, 'duel2')
        assert.equal(result.duels[1].sourceUserId, 'sourceUserId2')
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), "targetUserId", '=', 'user1')
        sinon.assert.calledWith(whereClauseExpectation.getCall(1), "duelStatus", "=", 'open')
    })

    it("getDuelsByTargetUserAndStatus: should send success error code with empty array when no match", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').twice()
        whereClauseExpectation.onCall(0).returns(firestoreCollection)
        whereClauseExpectation.onCall(1).returns(firebaseSetup.querySnapshot)
        const querySnapshotExpectation = querySnapshotMock.expects('get').once().resolves([])
        const result = await challengeRepo.getDuelsByTargetUserAndStatus('user1', 'open')
        whereClauseExpectation.verify()
        querySnapshotExpectation.verify()
        assert.equal(result.duels.length, 0)
        assert.equal(result.errorCode, 1)

        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), "targetUserId", '=', 'user1')
        sinon.assert.calledWith(whereClauseExpectation.getCall(1), "duelStatus", "=", 'open')
    })

    it("getDuelsByTargetUserAndStatus: should handle rejection", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').twice()
        whereClauseExpectation.onCall(0).returns(firestoreCollection)
        whereClauseExpectation.onCall(1).returns(firebaseSetup.querySnapshot)
        const querySnapshotExpectation = querySnapshotMock.expects('get').once().rejects({ error: 'mock error' })
        const result = await challengeRepo.getDuelsByTargetUserAndStatus('user1', 'open')
        whereClauseExpectation.verify()
        querySnapshotExpectation.verify()
        assert.equal(result.duels.length, 0)
        assert.equal(result.errorCode, -1)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'duel')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), "targetUserId", '=', 'user1')
        sinon.assert.calledWith(whereClauseExpectation.getCall(1), "duelStatus", "=", 'open')
    })

})

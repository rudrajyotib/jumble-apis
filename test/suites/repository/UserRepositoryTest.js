const sinon = require('sinon')
const firebaseSetup = require('../../setup/AppSetup')
const { assert } = require('chai')




describe("should execute all user repository tests", function () {

    let documentDataMock
    let querySnapshotMock
    let userRepo
    let firestoreGetCollectionSpy
    let firestoreCollectionMock
    let firestoreCollection
    let firestoreSpy
    let firestore


    before(function () {
        userRepo = require('../../../app/repositories/UserRepository')
        firestoreCollection = require('../../setup/AppSetup').firestoreCollection
        firestore = require('../../setup/AppSetup').firestore
    })

    beforeEach(function () {
        documentDataMock = sinon.mock(firebaseSetup.firestoreDocument)
        querySnapshotMock = sinon.mock(firebaseSetup.querySnapshot)
        firestoreGetCollectionSpy = sinon.spy(firebaseSetup.firestoreCollection, 'doc')
        firestoreCollectionMock = sinon.mock(firebaseSetup.firestoreCollection)
        firestoreSpy = sinon.spy(firestore, 'collection')
    })

    afterEach(function () {
        documentDataMock.restore()
        firestoreGetCollectionSpy.restore()
        firestoreCollectionMock.restore()
        firestoreSpy.restore()
        querySnapshotMock.restore()
    })

    it('addUser: should add user', async function () {
        let expectation = documentDataMock.expects('set').once().resolves()
        await userRepo.addUser({ place: 'hell', name: 'someName', email: 'someEmail' })
        expectation.verify()
        sinon.assert.calledWith(expectation.getCall(0), sinon.match((user) => {
            assert.notExists(user.place)
            assert.equal('someName', user.name)
            assert.equal('someEmail', user.email)
            return true
        }))
        assert(firestoreGetCollectionSpy.calledOnce)
    })

    it('addUser: should handle failure to add user', async function () {
        const expectation = documentDataMock.expects('set').once().rejects(new Error('could not add challenge'))

        const result = await userRepo.addUser({ place: 'hell' })

        assert.equal(result.result, 1)
        expectation.verify()
    })

    it('should find a user', async function () {
        let expectation = documentDataMock.expects('get').once().resolves({
            name: 'someName',
            email: 'someEmail',
            exists: true,
            data: function () {
                return {
                    name: 'someName',
                    email: 'someEmail'
                }
            }
        })
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'someId')
        assert(firestoreGetCollectionSpy.calledOnce)
        assert(user, sinon.match((user) => {
            assert.equal('someId', user.id)
            assert.isTrue(user.found)
            assert.equal('someName', user.name)
            assert.equal('someEmail', user.email)
        }))
    })

    it('should indicate in response when a user is not found', async function () {
        let expectation = documentDataMock.expects('get').once().resolves({
            exists: false
        })
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'someId')
        assert(firestoreGetCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should indicate in response when remote promise fails to find a user', async function () {
        let expectation = documentDataMock.expects('get').once().rejects('some error in remote')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'someId')
        assert(firestoreGetCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should indicate in response when execution fails to find a user', async function () {
        let expectation = documentDataMock.expects('get').once().throws('some error')
        const user = await userRepo.getUser('someId')
        expectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'someId')
        assert(firestoreGetCollectionSpy.calledOnce)
        assert.isFalse(user.found)
    })

    it('should add friend', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: false })
        documentDataSetMockExpectation.once().resolves()
        await userRepo.addFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            targetFriendName: 'friendName',
            status: 'someStatus',
            duelId: 'someDuelId'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataSetMockExpectation.getCall(0), sinon.match((targetFriend) => {
            assert.equal('friendName', targetFriend.name)
            assert.equal('someStatus', targetFriend.status)
            assert.equal('someDuelId', targetFriend.duelId)
            return true
        }))
    })

    it('should not add friend if exist', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: true })
        documentDataSetMockExpectation.never()
        await userRepo.addFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            targetFriendName: 'friendName',
            status: 'someStatus',
            duelId: 'someDuelId'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
    })

    it('should assert friend entity exists', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: true })
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isTrue(friendExists)
    })

    it('should negate friend entity exists', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: false })
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendExists)
    })

    it('should negate friend entity exists when promise fails to get user', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().rejects('mock error')
        const friendExists = await userRepo.isFriend({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser'
        })
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendExists)
    })

    it('should update friend status', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataUpdateMockExpectation = documentDataMock.expects('update')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataUpdateMockExpectation.once().resolves()
        documentDataSetMockExpectation.never()
        const result = await userRepo.updateFriendStatus({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            status: 'someStatus'
        })
        assert.isTrue(result)
        documentDataCollectionMockExpectation.verify()
        documentDataUpdateMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataUpdateMockExpectation.getCall(0), sinon.match((updateData) => {
            assert.equal(updateData.status, 'someStatus')
            assert.notExists(updateData.name)
            return true
        }))
    })

    it('should catch fail to update friend status', async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataUpdateMockExpectation = documentDataMock.expects('update')
        let documentDataSetMockExpectation = documentDataMock.expects('set')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataUpdateMockExpectation.once().rejects({ error: 'mockError' })
        documentDataSetMockExpectation.never()
        const result = await userRepo.updateFriendStatus({
            sourceUserId: 'sourceUser',
            targetUserId: 'targetUser',
            status: 'someStatus'
        })
        assert.isFalse(result)
        documentDataCollectionMockExpectation.verify()
        documentDataUpdateMockExpectation.verify()
        documentDataSetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(documentDataUpdateMockExpectation.getCall(0), sinon.match((updateData) => {
            assert.equal(updateData.status, 'someStatus')
            assert.notExists(updateData.name)
            return true
        }))
    })

    it("friendsWithStatus:should query friends with status and return a list with success code", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        let sinonMockWhereExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        querySnapshotGetMockExpectation.once().resolves([
            { id: 1, data: function () { return { name: 'nameOfOne', duelId: 'd1' } } },
            { id: 2, data: function () { return { name: 'nameOfTwo', duelId: 'd2' } } }
        ])
        const result = await userRepo.friendsWithStatus({
            sourceUserId: 'sourceUser',
            status: 'someStatus'
        })
        documentDataCollectionMockExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinonMockWhereExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(sinonMockWhereExpectation.getCall(0), 'status', '=', 'someStatus')
        assert.equal(result.errorCode, 1)
        assert.equal(result.friends.length, 2)
        sinon.assert.match(result.friends[0], sinon.match((friend) => {
            assert.equal(friend.id, 1)
            assert.equal(friend.name, 'nameOfOne')
            assert.equal(friend.duelId, 'd1')
            return true
        }))
        sinon.assert.match(result.friends[1], sinon.match((friend) => {
            assert.equal(friend.id, 2)
            assert.equal(friend.name, 'nameOfTwo')
            assert.equal(friend.duelId, 'd2')
            return true
        }))
    })

    it("friendsWithStatus:should query friends with status and return a blank list of friends", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        let sinonMockWhereExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        querySnapshotGetMockExpectation.once().resolves([])
        const result = await userRepo.friendsWithStatus({
            sourceUserId: 'sourceUser',
            status: 'someStatus'
        })
        documentDataCollectionMockExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinonMockWhereExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(sinonMockWhereExpectation.getCall(0), 'status', '=', 'someStatus')
        assert.equal(result.errorCode, 1)
        assert.equal(result.friends.length, 0)
    })

    it("friendsWithStatus:should handle errors in query", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let sinonMockWhereExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        let querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        querySnapshotGetMockExpectation.once().rejects({ error: "mock error" })
        const result = await userRepo.friendsWithStatus({
            sourceUserId: 'sourceUser',
            status: 'someStatus'
        })
        documentDataCollectionMockExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinonMockWhereExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        sinon.assert.calledWith(sinonMockWhereExpectation.getCall(0), 'status', '=', 'someStatus')
        assert.equal(result.errorCode, -1)
        assert.equal(result.friends.length, 0)
    })

    it("getFriendshipDetails:should get friend users details", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: true, data: function () { return { status: 'confirmed', duelId: 'someDuelId' } } })
        const friendDetails = await userRepo.getFriendshipDetails('sourceUser', 'targetUser')
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isTrue(friendDetails.found)
        assert.equal(friendDetails.status, 'confirmed')
        assert.equal(friendDetails.duelId, 'someDuelId')
    })

    it("getFriendshipDetails:should return not found if data is not found in repo", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().resolves({ exists: false })
        const friendDetails = await userRepo.getFriendshipDetails('sourceUser', 'targetUser')
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendDetails.found)
        assert.notProperty(friendDetails, 'status')
        assert.notProperty(friendDetails, 'duelId')
    })

    it("getFriendshipDetails:should return not found if collection throws error", async function () {
        let documentDataCollectionMockExpectation = documentDataMock.expects('collection')
        let documentDataGetMockExpectation = documentDataMock.expects('get')
        documentDataCollectionMockExpectation.once().returns(firestoreCollection)
        documentDataGetMockExpectation.once().rejects('mock error')
        const friendDetails = await userRepo.getFriendshipDetails('sourceUser', 'targetUser')
        documentDataCollectionMockExpectation.verify()
        documentDataGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(0), 'sourceUser')
        sinon.assert.calledWith(firestoreGetCollectionSpy.getCall(1), 'targetUser')
        assert(firestoreGetCollectionSpy.calledTwice)
        assert(firestoreSpy.calledOnce)
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'friends')
        sinon.assert.calledWith(documentDataCollectionMockExpectation.getCall(0), "friendlist")
        assert.isFalse(friendDetails.found)
        assert.notProperty(friendDetails, 'status')
        assert.notProperty(friendDetails, 'duelId')
    })

    it("findUserByAppUserId: should find user data from appUserId", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        const querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        querySnapshotGetMockExpectation.once().resolves({
            empty: false,
            docs: [{
                data: function () { return { email: 'someEmail' } }
            }]
        })
        const userDetails = await userRepo.findUserByAppUserId("someAppUserId")
        assert.equal(userDetails.result, 1)
        assert.equal(userDetails.email, 'someEmail')
        whereClauseExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'users')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), 'appUserId', '==', 'someAppUserId')
    })

    it("findUserByAppUserId: should report if user with app user ID not found", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        const querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        querySnapshotGetMockExpectation.once().resolves({
            empty: true
        })
        const userDetails = await userRepo.findUserByAppUserId("someAppUserId")
        assert.equal(userDetails.result, 0)
        whereClauseExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'users')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), 'appUserId', '==', 'someAppUserId')
    })

    it("findUserByAppUserId: should report if query execution promise fails", async function () {
        const whereClauseExpectation = firestoreCollectionMock.expects('where').once().returns(firebaseSetup.querySnapshot)
        const querySnapshotGetMockExpectation = querySnapshotMock.expects('get')
        querySnapshotGetMockExpectation.once().rejects({
            error: 'mock error'
        })
        const userDetails = await userRepo.findUserByAppUserId("someAppUserId")
        assert.equal(userDetails.result, -1)
        whereClauseExpectation.verify()
        querySnapshotGetMockExpectation.verify()
        sinon.assert.calledWith(firestoreSpy.getCall(0), 'users')
        sinon.assert.calledWith(whereClauseExpectation.getCall(0), 'appUserId', '==', 'someAppUserId')
    })


})

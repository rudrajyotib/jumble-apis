const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert
const chai = require('chai')

describe("should do service operations", function () {
    let userService
    let userServiceMock

    this.timeout(3000)

    before(function () {
        userService = require('../../../app/service/UserService')
    })

    beforeEach(function () {
        userServiceMock = sinon.mock(userService)
    })

    afterEach(function () {
        userServiceMock.restore()
    })

    it("should add friends and return success", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: 1
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.text, "Friends created Ok")
    })

    it("should report error if service fails to add friends entity and handles it", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: 0,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 400)
        assert.equal(response.text, "requestor user does not exist")
    })

    it("should report error if service fails to add friends entity because of unhandled error", async function () {
        let expectation = userServiceMock.expects('addFriend').once().resolves({
            result: -1,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "requestor user does not exist")
    })


    it("should report error if service fails to add friends entity because of unhandled error and propagates the exception up", async function () {
        let expectation = userServiceMock.expects('addFriend').once().rejects({
            result: -1,
            message: 'requestor user does not exist'
        })
        const response = await request("http://localhost:3000")
            .post("/user/addfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "User not created due to unhandled backend error")
    })

    it("should find existence of a friend and return success", async function () {
        let expectation = userServiceMock.expects('isFriend').once().resolves(true)
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friend, true)
    })

    it("should check find existence of a friend and return success when none found", async function () {
        let expectation = userServiceMock.expects('isFriend').once().resolves(false)
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friend, false)
    })

    it("should check find existence of a friend and return success when service promise is rejected", async function () {
        let expectation = userServiceMock.expects('isFriend').once().rejects({})
        const response = await request("http://localhost:3000")
            .get("/user/isfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')
            .set('Produces', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "User not created")
    })

    it("should confirm friends and return success", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().resolves({
            result: 1
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.body.friendStatus, "confirmed")
    })

    it("should handle and inform if friend confirmation fails gracefully", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().resolves({
            result: -1
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 400)
        assert.equal(response.text, "update failed")
    })

    it("should handle and inform if friend confirmation service throws unexpected", async function () {
        let expectation = userServiceMock.expects('updateFriendStatus').once().rejects({
            error: 'mock error'
        })
        const response = await request("http://localhost:3000")
            .post("/user/confirmfriend")
            .send({ sourceUserId: "someSourceId", targetUserId: "someTargetId", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someSourceId')
            assert.equal(actual.targetUserId, 'someTargetId')
            assert.equal(actual.status, 'confirmed')
            assert.notExists(actual.password)
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "update failed")
    })

    it("should get list of confirmed friends and return", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once().resolves({
            result: 1,
            friends: [{ id: 1, name: 'nameOne' }, { id: 2, name: 'nameTwo' }]
        })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someUserId')
            assert.equal(actual.status, 'confirmed')
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.length, 2)
        assert.equal(response.body[0].id, 1)
        assert.equal(response.body[1].id, 2)
        assert.equal(response.body[0].name, 'nameOne')
        assert.equal(response.body[1].name, 'nameTwo')
    })

    it("should report service fails to list confirmed friends gracefully", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .resolves({
                result: -1
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'confirmed')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when no confirmed friends found", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .resolves({
                result: 1
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'confirmed')
            return true
        }, "does not match"))
        assert.equal(response.status, 204)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when service fails brute to list confirmed friends", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .rejects({
                error: 'mock error'
            })
        const response = await request("http://localhost:3000")
            .get("/user/friends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'confirmed')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        assert.equal(response.text, 'no result')
    })

    it("should get list of pending friends and return", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once().resolves({
            result: 1,
            friends: [{ id: 1, name: 'nameOne' }, { id: 2, name: 'nameTwo' }]
        })
        const response = await request("http://localhost:3000")
            .get("/user/pendingfriends/someUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someUserId')
            assert.equal(actual.status, 'pending')
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.length, 2)
        assert.equal(response.body[0].id, 1)
        assert.equal(response.body[1].id, 2)
        assert.equal(response.body[0].name, 'nameOne')
        assert.equal(response.body[1].name, 'nameTwo')
    })

    it("should report service fails to list pending friends gracefully", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .resolves({
                result: -1
            })
        const response = await request("http://localhost:3000")
            .get("/user/pendingfriends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'pending')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when no pending friends found", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .resolves({
                result: 1
            })
        const response = await request("http://localhost:3000")
            .get("/user/pendingfriends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'pending')
            return true
        }, "does not match"))
        assert.equal(response.status, 204)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("should report when service fails brute to list pending friends", async function () {
        let serviceExpectation = userServiceMock.expects('listOfFriendsByStatus').once()
            .rejects({
                error: 'mock error'
            })
        const response = await request("http://localhost:3000")
            .get("/user/pendingfriends/someId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation, sinon.match(function (actual) {
            assert.equal(actual.sourceUserId, 'someId')
            assert.equal(actual.status, 'pending')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        assert.equal(response.text, 'no result')
    })

    it("/isChallengeable/:sourceUserId/:targetUserId - should identify friends as challengeable", async function () {
        let serviceExpectation = userServiceMock.expects('isEligibleForChallenge').once().resolves(true)
        const response = await request("http://localhost:3000")
            .get("/user/isChallengeable/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.challengeable, true)
    })

    it("/isChallengeable/:sourceUserId/:targetUserId - should identify friends as not challengeable from service response", async function () {
        let serviceExpectation = userServiceMock.expects('isEligibleForChallenge').once().resolves(false)
        const response = await request("http://localhost:3000")
            .get("/user/isChallengeable/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.challengeable, false)
    })

    it("/isChallengeable/:sourceUserId/:targetUserId - should identify friends as not challengeable from service rejection", async function () {
        let serviceExpectation = userServiceMock.expects('isEligibleForChallenge').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .get("/user/isChallengeable/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.challengeable, false)
    })


    it("/scoresandchallengestatus/:sourceUserId/:targetUserId - should identify friends as challengeable with score", async function () {
        let serviceExpectation = userServiceMock.expects('getFriendshipDetailsForChallenge').once().resolves({
            isFriend: true,
            challengeable: true,
            sourceUserScore: 1,
            targetUserScore: 2
        })
        const response = await request("http://localhost:3000")
            .get("/user/scoresandchallengestatus/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.challengeable, true)
        assert.equal(response.body.sourceUserScore, 1)
        assert.equal(response.body.targetUserScore, 2)
        assert.notProperty(response.body, 'isFriend')
    })

    it("/scoresandchallengestatus/:sourceUserId/:targetUserId - should identify friends as not challengeable from service response, but produce score", async function () {
        let serviceExpectation = userServiceMock.expects('getFriendshipDetailsForChallenge').once().resolves({
            isFriend: true,
            challengeable: false,
            sourceUserScore: 1,
            targetUserScore: 2
        })
        const response = await request("http://localhost:3000")
            .get("/user/scoresandchallengestatus/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.challengeable, false)
        assert.equal(response.body.sourceUserScore, 1)
        assert.equal(response.body.targetUserScore, 2)
        assert.notProperty(response.body, 'isFriend')
    })

    it("/scoresandchallengestatus/:sourceUserId/:targetUserId - should identify friends as not challengeable if friendship is not confirmed", async function () {
        let serviceExpectation = userServiceMock.expects('getFriendshipDetailsForChallenge').once().resolves({
            isFriend: false,
            challengeable: false,
            sourceUserScore: 1,
            targetUserScore: 2
        })
        const response = await request("http://localhost:3000")
            .get("/user/scoresandchallengestatus/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 400)
        // assert.exists(response.body)
        chai.expect(response.body).to.be.empty
        assert.equal(response.text, "not a friend")
    })

    it("/scoresandchallengestatus/:sourceUserId/:targetUserId - should identify friends as not challengeable from service rejection", async function () {
        let serviceExpectation = userServiceMock.expects('getFriendshipDetailsForChallenge').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .get("/user/scoresandchallengestatus/someSourceUserId/someTargetUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someSourceUserId"), sinon.match("someTargetUserId"))
        assert.equal(response.status, 400)
        // assert.exists(response.body)
        chai.expect(response.body).to.be.empty
        assert.equal(response.text, "not a friend")
    })

    it("/userIdAvailable/:appUserId - should return available false if result code is 0", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().resolves({ result: 0 })
        const response = await request("http://localhost:3000")
            .get("/user//userIdAvailable/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.exists, false)
    })

    it("/userIdAvailable/:appUserId - should return available true if result code is 1", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().resolves({ result: 1, email: 'someEmail' })
        const response = await request("http://localhost:3000")
            .get("/user//userIdAvailable/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.exists, true)
        assert.notProperty(response.body, "email")
    })

    it("/userIdAvailable/:appUserId - should return server error code false if result code is -1", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().resolves({ result: -1, email: 'someEmail' })
        const response = await request("http://localhost:3000")
            .get("/user//userIdAvailable/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("/userIdAvailable/:appUserId - should return server error code false if service fails", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().rejects({ error: 'some error' })
        const response = await request("http://localhost:3000")
            .get("/user//userIdAvailable/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("/emailIdForLogin/:appUserId - should return email when user is found", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().resolves({ result: 1, email: 'someEmail' })
        const response = await request("http://localhost:3000")
            .get("/user/emailIdForLogin/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 200)
        assert.exists(response.body)
        assert.equal(response.body.email, 'someEmail')
    })

    it("/emailIdForLogin/:appUserId - should not return content when user is found", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().resolves({ result: 0, email: 'someEmail' })
        const response = await request("http://localhost:3000")
            .get("/user/emailIdForLogin/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 204)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

    it("/emailIdForLogin/:appUserId - should not return content when service fails", async function () {
        let serviceExpectation = userServiceMock.expects('findUserByAppUserId').once().rejects({ error: 'mock error' })
        const response = await request("http://localhost:3000")
            .get("/user/emailIdForLogin/someAppUserId")
            .send()
        serviceExpectation.verify()
        sinon.assert.calledWith(serviceExpectation.getCall(0), sinon.match("someAppUserId"))
        assert.equal(response.status, 500)
        assert.exists(response.body)
        chai.expect(response.body).to.be.empty
    })

})
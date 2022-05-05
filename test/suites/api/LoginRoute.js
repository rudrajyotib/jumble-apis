const request = require('supertest')
const sinon = require('sinon')
const assert = require('chai').assert


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

    it("should add User", async function () {
        let expectation = userServiceMock.expects('addUser').once().resolves('someId')
        const response = await request("http://localhost:3000")
            .post("/user/signup")
            .send({ name: "someName", email: "someEmail", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.displayName, 'someName')
            assert.equal(actual.email, 'someEmail')
            assert.equal(actual.password, 'somePassword')
            return true
        }, "does not match"))
        assert.equal(response.status, 200)
        assert.equal(response.text, "User created Ok")
    })

    it("should report when User input is not correct", async function () {
        let expectation = userServiceMock.expects('addUser').never()
        const response = await request("http://localhost:3000")
            .post("/user/signup")
            .send({ email: "someEmail", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        assert.equal(response.status, 400)
        assert.equal(response.text, "Not sufficient for user creation")
    })

    it("should report internal server error when service fails", async function () {
        let expectation = userServiceMock.expects('addUser').once().rejects("server error")
        const response = await request("http://localhost:3000")
            .post("/user/signup")
            .send({ name: "someName", email: "someEmail", password: "somePassword" })
            .set('Accept', 'application/json')

        expectation.verify()
        sinon.assert.calledWith(expectation, sinon.match(function (actual) {
            assert.equal(actual.displayName, 'someName')
            assert.equal(actual.email, 'someEmail')
            assert.equal(actual.password, 'somePassword')
            return true
        }, "does not match"))
        assert.equal(response.status, 500)
        assert.equal(response.text, "User not created")
    })


})
const sinon = require('sinon')
const { assert } = require('chai')
const userApiUtil = require('../../../../app/api/utils/UserApiUtil')

describe("should verify user api related  utility functions", function () {

    it("should not validate if request is empty", function () {
        let validationResult = userApiUtil.validateAndConvertUserCreateRequest({

        })
        assert.isDefined(validationResult)
        assert.isFalse(validationResult.valid)
        assert.notExists(validationResult.userInput)
    })

    it("should not validate if request body does not have proper structure", function () {

        let validationResult = userApiUtil.validateAndConvertUserCreateRequest({
            body: {
                name: "someName"
            }
        })
        assert.isDefined(validationResult)
        assert.isFalse(validationResult.valid)
        assert.notExists(validationResult.userInput)
    })

    it("should not validate if request body does  have proper structure with empty values", function () {

        let validationResult = userApiUtil.validateAndConvertUserCreateRequest({
            body: {
                name: "",
                email: "",
                password: ""
            }
        })
        assert.isDefined(validationResult)
        assert.isFalse(validationResult.valid)
        assert.notExists(validationResult.userInput)
    })

    it("should validate only if request has proper structure with non-empty values", function () {
        let validationResult = userApiUtil.validateAndConvertUserCreateRequest({
            body: {
                name: "someName",
                email: "someEmail",
                password: "somePassword"
            }
        })
        assert.isDefined(validationResult)
        assert.isTrue(validationResult.valid)
        assert.exists(validationResult.userInput)
        assert.exists(validationResult.userInput.displayName)
        assert.exists(validationResult.userInput.email)
        assert.exists(validationResult.userInput.password)
        assert.exists(validationResult.userInput.disabled)
        assert.equal(validationResult.userInput.displayName, "someName")
        assert.equal(validationResult.userInput.email, "someEmail")
        assert.equal(validationResult.userInput.password, "somePassword")
        assert.isFalse(validationResult.userInput.disabled)
    })
})
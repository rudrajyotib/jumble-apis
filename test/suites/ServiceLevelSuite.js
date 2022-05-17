const sinon = require('sinon')

describe("should execute all service level test cases", function () {
    require('./service/ChallengeServiceTest')
    require('./service/UserServiceTest')
    require('./service/ServiceUtilTest')
})
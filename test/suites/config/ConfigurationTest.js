const sinon = require('sinon')
const { assert } = require('chai')
//const { dotenv } = require('dotenv')

describe("should load configuration", function () {

    let dotEnvConfigStub
    let dotEnv

    before(function () {
        dotEnv = require('dotenv')
        dotEnvConfigStub = sinon.spy(dotEnv)
        process.env.firebase_auth_type = "someServiceAccount"
        process.env.project_id = "someProjectId"
        process.env.private_key_id = "someKeyId"
        process.env.private_key = "somePrivateKey"
        process.env.client_email = "someEmail"
        process.env.client_id = "someClientId"
        process.env.auth_uri = "someAuthenticationUri"
        process.env.token_uri = "someTokenUri"
        process.env.auth_provider_x509_cert_url = "someAuthCertificateUrl"
        process.env.client_x509_cert_url = "someClientCertificateUrl"
    })

    this.beforeEach(function () {
    })

    afterEach(function () {
        dotEnvConfigStub.config.resetHistory()
    })

    it("should load dotenv for local ENV", function () {
        let config = require('../../../app/config/Config')
        appConfig = config.firebaseAuthenticationProvider()
        assert.isTrue(dotEnvConfigStub.config.calledOnce)
        assert.equal('someServiceAccount', appConfig.type)
        assert.equal('someProjectId', appConfig.project_id)
        assert.equal('someKeyId', appConfig.private_key_id)
        assert.equal('somePrivateKey', appConfig.private_key)
        assert.equal('someEmail', appConfig.client_email)
        assert.equal('someClientId', appConfig.client_id)
        assert.equal('someAuthenticationUri', appConfig.auth_uri)
        assert.equal('someTokenUri', appConfig.token_uri)
        assert.equal('someAuthCertificateUrl', appConfig.auth_provider_x509_cert_url)
        assert.equal('someClientCertificateUrl', appConfig.client_x509_cert_url)
    })

    it("should not load dotenv for PROD ENV", function () {
        process.env.NODE_ENV = 'production'
        let config = require('../../../app/config/Config')
        appConfig = config.firebaseAuthenticationProvider()
        assert.isTrue(dotEnvConfigStub.config.notCalled)
    })
})
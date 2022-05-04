const admin = require('firebase-admin')

const firestore = admin.firestore()
const auth = admin.auth()

exports.repository = firestore
exports.authenticator = auth
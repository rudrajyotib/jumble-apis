const admin = require('firebase-admin')

const firestore = admin.firestore()

exports.repository = firestore
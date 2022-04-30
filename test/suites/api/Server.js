const appRoot = require('../../../app/api/routers/Root')
const express = require('express')
const bodyParser = require('body-parser')


const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use("/", appRoot)

let server = app.listen(3000, function () {
    console.log("test server started")
})

module.exports = server
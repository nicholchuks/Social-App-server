const express = require("express")
const cors = require("cors")
const {connect} = require("mongoose")
require("dotenv") .config()
const upload = require("express-fileupload")

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json({extended: true}))
app.use(cors({credentials: true, origin:["http://localhost:3000"]}))
app.use(upload())

app.listen(process.env.PORT, () => console.log(`Server started on ${process.env.PORT}`))



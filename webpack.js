const webpack = require("./my-webpack")
const config = require("./webpack.config")

const complier = webpack(config)

complier.run(function (stat) {
    console.log(stat)
})
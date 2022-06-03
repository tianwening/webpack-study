const path = require("path")
const RunWebpackPLugin = require("./plugins/run-webpack-plugin")
const DoneWebpackPLugin = require("./plugins/done-webpack-plugin")

module.exports = {
    entry: {
        entry1: './src/entry1.js',
        entry2: './src/entry2.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [path.resolve(__dirname, 'loaders/logger1.js'), path.resolve(__dirname, 'loaders/logger2.js')]
            }
        ]
    },
    plugins: [
        new RunWebpackPLugin(),
        new DoneWebpackPLugin()
    ]
}
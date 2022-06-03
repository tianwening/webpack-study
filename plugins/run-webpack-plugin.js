class RunWebpackPlugin {
    apply(complier) {
        complier.hooks.run.tap("run", function () {

        })
    }
}

module.exports = RunWebpackPlugin
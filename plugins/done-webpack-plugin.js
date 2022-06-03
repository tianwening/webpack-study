class DoneWebpackPlugin {
    apply(complier) {
        complier.hooks.done.tap("done", function () {

        })
    }
}

module.exports = DoneWebpackPlugin
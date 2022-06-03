
const Compiler = require("./compiler")

function webpack(options = {}) {
    // 1. 组合命令里面的和配置文件的，最终生成一份选项
    const shellArgs = process.argv.slice(2)
    const shellOptions = shellArgs.reduce((result, cur) => {
        const [key, value] = cur.split("=")
        result[key.slice(2)] = value
        return result
    }, {})
    const finalOptions = Object.assign({}, options, shellOptions)
    // 2. 使用最终的配置初始化compiler对象
    const compiler = new Compiler(finalOptions)
    // 3. 遍历插件列表执行
    const { plugins = [] } = finalOptions
    plugins.forEach((plugin) => {
        // 将编译器传递给相关的插件
        plugin.apply(compiler)
    })
    // 4.开始执行编译
    compiler.run()
}

module.exports = webpack
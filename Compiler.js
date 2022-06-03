const { SyncHook } = require("tapable")
const Compilation = require("./Compilation")
const path = require("path")
const fs = require("fs")

// Compiler对象里面有对应声明周期的钩子
class Compiler {
    constructor(options) {
        this.options = options
        this.hooks = {
            run: new SyncHook(),
            done: new SyncHook()
        }
        this.fileDependenciesSet = new Set()
    }

    // 执行编译的过程
    run() {
        // 开始编译
        this.hooks.run.call()
        // 完成编译的回调
        const onCompiled = (err, stats, fileDependencies) => {
            const { assets } = stats
            // 10.确定输出的内容之后，根据配置的输出路径和文件名，把相关的文件内容写入到文件里面去
            for (let filename in assets) {
                if (!fs.existsSync(this.options.output.path)) {
                    fs.mkdirSync(this.options.output.path)
                }
                const filePath = path.join(this.options.output.path, filename)
                fs.writeFileSync(filePath, assets[filename], 'utf-8')
            }
            // 监视文件的变化，变化的时候重新进行编译
            if(this.options.watch) {
                [...fileDependencies].forEach(filePath => {
                    if (!this.fileDependenciesSet.has(filePath)) {
                        fs.watch(filePath, () => this.compile(onCompiled))
                        this.fileDependenciesSet.add(filePath)
                    }
                })
            }
            // 执行完成的hooks
            this.hooks.done.call()
        }
        this.compile(onCompiled)
    }
    // compiler是一直存在的， compilation是一次编译的对象
    compile(callback) {
        let compilation = new Compilation(this.options)
        compilation.build(callback)
    }
}

module.exports = Compiler
const { SyncHook } = require("tapable")
const Compilation = require("./Compilation")

// Compiler对象里面有对应声明周期的钩子
class Compiler {
    constructor(options) {
        this.options = options
        this.hooks = {
            run: new SyncHook(),
            done: new SyncHook()
        }
    }
    
    // 执行编译的过程
    run() {
        // 开始编译
        this.hooks.run.call()
        // 完成编译的回调
        const onCompiled = () => {
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
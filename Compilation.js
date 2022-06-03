const path = require("path")
const fs = require("fs")

function toUnixPath(path) {
    return path.replace(/\\/g, '/')
}

const baseDir = toUnixPath(process.cwd())

class Compilation {
    constructor(options) {
        this.options = options
        // 本次编译所生成的模块
        this.modules = []
        // 本次编译所生成的chunks
        this.chunks = []
        // 本次编译产出的资源
        this.assets = {}
        // 本次编译涉及了哪些文件
        this.fileDependencies = []
    }
    build() {
        // 5.根据配置文件找到所有的入口
        let entry = {}
        if (typeof this.options.entry == 'string') {
            entry = {
                main: this.options.entry
            }
        } else {
            entry = this.options.entry
        }
        // 6. 从入口文件出发，调用所有配置的loader规则,比如loader对模块进行编译
        for (let entryName in entry) {
            const entryFilePath = path.posix.join(baseDir, entry[entryName])
            // 把入口文件的绝对路径添加到依赖数组里面去
            this.fileDependencies.push(entryFilePath)
            let entryModule = this.buildModule(entryName, entryFilePath)
        }
    }
    buildModule(name, modulePath) {
        // 读取文件的真实内容
        let moduleSourceCode = fs.readFileSync(modulePath, 'utf-8')
        // 找到合适的loader对源码进行翻译和转换
        let loaders = []
        const { rules = [] } = this.options?.module || {}
        rules.forEach(({ test, use }) => {
            if (modulePath.match(test)) {
                loaders.push(...use)
            }
        })
        moduleSourceCode = loaders.reduceRight((source, loader) => {
            return require(loader)(source)
        }, moduleSourceCode)

        console.log(moduleSourceCode)
    }
}

module.exports = Compilation
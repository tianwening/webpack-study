const path = require("path")
const fs = require("fs")
const parser = require("@babel/parser")
const traverse = require("@babel/traverse").default
const generator = require("@babel/generator").default
const types = require("@babel/types")

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
        this.fileDependencies = new Set()
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
            this.fileDependencies.add(entryFilePath)
            let entryModule = this.buildModule(entryName, entryFilePath)
            this.modules.push(entryModule)
        }
        console.log(this.modules)
    }
    buildModule(name, modulePath) {
        console.log(modulePath)
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

        const moduleId = './' + path.posix.relative(baseDir, modulePath)
        const module = { id: moduleId, dependencies: [], names: [name] }
        const ast = parser.parse(moduleSourceCode, { sourceType: 'module' })
        traverse(ast, {
            CallExpression: ({ node }) => {
                // 表示有其他模块的引入
                if (node.callee.name === 'require') {
                    let depModuleName = node.arguments[0].value
                    // 找到当前模块的所在目录
                    const dirname = path.dirname(modulePath)
                    let depModulePath = path.posix.join(dirname, depModuleName)
                    const extensions = this.options.resolve.extensions || []
                    depModulePath = tryExtension(depModulePath, extensions)
                    this.fileDependencies.add(depModulePath)
                    // moduleId 是一个相对路径的字符串
                    const depModuleId = './' + path.posix.relative(baseDir, depModulePath)
                    // 修改语法树，是require("./title") => require("./src/title.js")
                    node.arguments = [types.stringLiteral(depModuleId)]
                    // 给当前的模块添加依赖
                    module.dependencies.push({
                        depModuleId,
                        depModulePath
                    })
                }
            }
        })
        // 根据改造后的语法树生成新的源代码
        const { code } = generator(ast)
        module._source = code
        // 遍历module的依赖进行递归
        module.dependencies.forEach(({ depModuleId, depModulePath }) => {
            const existModule = this.modules.find(item => item.id === depModuleId)
            if (existModule) {
                existModule.names.push(name)
            } else {
                let depModule = this.buildModule(name, depModulePath)
                this.modules.push(depModule)
            }
        })

        return module
    }
}

// 不全后缀看文件存不存在
function tryExtension(modulePath, extensions) {
    if (fs.existsSync(modulePath)) {
        return modulePath
    }
    for (let i = 0; i < extensions.length; i++) {
        const extensionPath = modulePath + extensions[i]
        if (fs.existsSync(extensionPath)) {
            return extensionPath
        }
    }
}

module.exports = Compilation
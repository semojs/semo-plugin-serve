import fs from 'fs'
import path from 'path'
import { Utils } from '@semo/core'

export const command = 'route <name>'
export const desc = 'Generate a route template'
// export const aliases = ''

export const builder = function (yargs) {
  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code'
  })
}

export const handler = function(argv) {
  const routeDir = argv.routeMakeDir || argv.routeDir
  if (!routeDir || !fs.existsSync(routeDir)) {
    console.log(Utils.chalk.red('"routeDir" missing in config file or not exist in current directory!'))
    return
  }

  const routeFilePath = path.resolve(routeDir, `${argv.name}.${ argv.typescript ? 'ts' : 'js'}`)
  const routeFileDir = path.dirname(routeFilePath)

  Utils.fs.ensureDirSync(routeFileDir)
  if (fs.existsSync(routeFilePath)) {
    Utils.error(Utils.chalk.red('Route file exist!'))
  }

  let code
  if (argv.typescript) {
    code = `// export const name = '' // 路由名字，非必填
// export const path = '' // 追加额外的路由，非必填
// export const method = 'get' // 路由方法，默认 get，非必填
// // https://indicative.adonisjs.com/validations/master/min
// export const middleware = [] // 为单个路由指定前置中间件
// export const validate = {
//   username: 'min:6' 
// }
export const handler = async ctx => {
  // ctx.errors[11] = '错误'
  ctx.json = true // 返回JSON数据结构
  return 'hello'
}
`
  } else {
    code = `// exports.name = '' // 路由名字，非必填
    // exports.path = '' // 追加额外的路由，非必填
    // exports.method = 'get' // 路由方法，默认 get，非必填
    // // https://indicative.adonisjs.com/validations/master/min
    // exports.middleware = [] // 为单个路由指定前置中间件
    // exports.validate = {
    //   username: 'min:6' 
    // }
    exports.handler = async ctx => {
      // ctx.errors[11] = '错误'
      ctx.json = true // 返回JSON数据结构
      return 'hello'
    }
    `
  }

  if (!fs.existsSync(routeFilePath)) {
    fs.writeFileSync(routeFilePath, code)
    console.log(Utils.chalk.green(`${routeFilePath} created!`))
  }
}

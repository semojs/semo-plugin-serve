import { existsSync, writeFileSync } from 'node:fs'
import { ensureDirSync } from 'fs-extra'
import path from 'path'
import { error, success } from '@semo/core'

export const command = 'route <name>'
export const desc = 'Generate a route template'
// export const aliases = ''

export const builder = function (yargs) {
  yargs.option('typescript', {
    alias: 'ts',
    describe: 'generate typescript style code',
  })

  yargs.option('force', {
    alias: 'F',
    describe: 'Force create, override existed file.',
  })

  yargs.option('format', {
    choices: ['esm', 'cjs', 'typescript'],
    describe: 'Choose route format.',
  })
}

export const handler = function (argv) {
  if (argv.typescript && !argv.format) {
    argv.format = 'typescript'
  }

  let routeDir = argv.routeMakeDir || argv.routeDir
  argv.rootDir ??= process.cwd()
  routeDir = path.resolve(argv.rootDir, routeDir)
  if (!routeDir || !existsSync(routeDir)) {
    error(
      '"routeDir" missing in config file or not exist in current directory!'
    )
    return
  }

  const routeFilePath = path.resolve(
    routeDir,
    `${argv.name}.${argv.format === 'typescript' ? 'ts' : 'js'}`
  )
  const routeFileDir = path.dirname(routeFilePath)

  ensureDirSync(routeFileDir)
  if (!argv.force && existsSync(routeFilePath)) {
    error('Route file exist!')
  }

  let code

  switch (argv.format) {
    case 'typescript':
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
      break
    case 'cjs':
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
      break
    case 'esm':
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
      break
  }

  if (argv.force || !existsSync(routeFilePath)) {
    writeFileSync(routeFilePath, code)
    success(`${routeFilePath} created!`)
  }
}

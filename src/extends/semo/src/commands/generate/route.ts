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
      code = `// export const name = '' // Route name (optional)
// export const path = '' // Additional route path (optional)
// export const method = 'get' // HTTP method, defaults to get (optional)
// // https://indicative.adonisjs.com/validations/master/min
// export const middleware = [] // Middleware for this route
// export const validate = z.object({
//   username: z.string().min(6),
// })
export const handler = async ctx => {
  // ctx.errors[11] = 'Error message'
  ctx.json = true // Return JSON structure
  return 'hello'
}
`
      break
    case 'cjs':
      code = `// exports.name = '' // Route name (optional)
// exports.path = '' // Additional route path (optional)
// exports.method = 'get' // HTTP method, defaults to get (optional)
// // https://indicative.adonisjs.com/validations/master/min
// exports.middleware = [] // Middleware for this route
// exports.validate = z.object({
//   username: z.string().min(6),
// })
exports.handler = async ctx => {
  // ctx.errors[11] = 'Error message'
  ctx.json = true // Return JSON structure
  return 'hello'
}
    `
      break
    case 'esm':
      code = `// export const name = '' // Route name (optional)
// export const path = '' // Additional route path (optional)
// export const method = 'get' // HTTP method, defaults to get (optional)
// // https://indicative.adonisjs.com/validations/master/min
// export const middleware = [] // Middleware for this route
// export const validate = z.object({
//   username: z.string().min(6),
// })
export const handler = async ctx => {
  // ctx.errors[11] = 'Error message'
  ctx.json = true // Return JSON structure
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

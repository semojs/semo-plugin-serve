import { Argv, ArgvExtraOptions } from '@semo/core'
import { startServer } from '../common/server.js'

export const disabled = false
export const plugin = 'serve'
export const command = 'serve [publicDir]'
export const aliases = 's'
export const desc = 'Simple server tool'

export const builder = function (yargs: Argv) {
  const InternalControlGroup = 'Internal Controls:'
  const ViewsControlGroup = 'Views Controls:'
  const ServeControlGroup = 'Server Controls:'

  // Behaviours controls
  yargs.option('open-browser', {
    describe: 'Auto open browser',
    alias: ['open', 'B'],
    type: 'boolean',
  })
  yargs.option('clear-console', {
    describe: 'Auto clear console',
    alias: ['clear', 'C'],
    type: 'boolean',
  })

  // Basic settings
  yargs.option('port', {
    default: 3000,
    describe: 'server port',
    group: ServeControlGroup,
  })
  yargs.option('yes', {
    describe: 'Say yes to use new port when default port in use',
    alias: 'Y',
    group: ServeControlGroup,
  })
  yargs.option('list-routes', {
    describe: 'List routes',
    alias: 'L',
    group: ServeControlGroup,
  })
  yargs.option('api-prefix', {
    default: '',
    describe: 'Prefix all routes',
    group: ServeControlGroup,
  })
  yargs.option('spa', {
    describe: 'Fallback to index.html',
    group: ServeControlGroup,
  })
  yargs.option('gzip', { describe: 'Enable gzip', group: ServeControlGroup })
  yargs.option('route-dir', {
    describe: 'Routes location',
    group: ServeControlGroup,
  })
  yargs.option('root-dir', {
    describe: 'Base root directory, default is current directory',
    group: ServeControlGroup,
  })
  yargs.option('public-dir', {
    default: '.',
    describe: 'Static files location',
    group: ServeControlGroup,
  })
  yargs.option('file-index', {
    default: 'index.html',
    describe: 'Index file name',
    group: ServeControlGroup,
  })
  yargs.option('file-404', {
    describe: '404 file name',
    group: ServeControlGroup,
  })
  yargs.option('static-404', {
    describe: 'If use simple 404 response, only work when file-404 is not set',
    type: 'boolean',
    group: ServeControlGroup,
  })
  yargs.option('proxy', {
    describe: 'Provide a proxy route /proxy',
    alias: 'P',
    group: ServeControlGroup,
  })

  // Switches
  yargs.option('disable-index-directory', {
    describe: 'List directory files if file index not exist',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-custom-error', {
    describe: 'Disable internal middleware custom error',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-custom-static', {
    describe: 'Disable internal middleware custom static',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-custom-routes', {
    describe: 'Disable internal middleware custom routes',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-koa-logger', {
    describe: 'Disable internal middleware koa-logger',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-koa-bodyparser', {
    describe: 'Disable internal middleware koa-bodyparser',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-internal-middleware-koa-kcors', {
    describe: 'Disable internal middleware kcors',
    type: 'boolean',
    group: InternalControlGroup,
  })
  yargs.option('disable-health-check-route', {
    describe: 'Disable health check route',
    type: 'boolean',
    group: InternalControlGroup,
  })

  // About Koa views
  yargs.option('views-engine', {
    default: 'nunjucks',
    describe: 'Set koa-views engine',
    group: ViewsControlGroup,
  })
  yargs.option('views-extension', {
    default: 'html',
    describe: 'Set koa-views template extension',
    group: ViewsControlGroup,
  })
  yargs.option('views-dir', {
    default: '',
    describe: 'Set koa-views template dir',
    group: ViewsControlGroup,
  })
}

export const handler = async function (argv: ArgvExtraOptions) {
  argv.disableIndexDirectory = argv.$core.getPluginConfig(
    'disableIndexDirectory'
  )
  argv.disableGlobalExcpetionRouter = argv.$core.getPluginConfig(
    'disableGlobalExcpetionRouter'
  )
  argv.disableInternalMiddlewareCustomError = argv.$core.getPluginConfig(
    'disableInternalMiddlewareCustomError'
  )
  argv.disableInternalMiddlewareKoaLogger = argv.$core.getPluginConfig(
    'disableInternalMiddlewareKoaLogger'
  )
  argv.disableInternalMiddlewareKcors = argv.$core.getPluginConfig(
    'disableInternalMiddlewareKcors'
  )
  argv.disableInternalMiddlewareKoaBodyparser = argv.$core.getPluginConfig(
    'disableInternalMiddlewareKoaBodyparser'
  )
  argv.disableInternalMiddlewareCustomRoutes = argv.$core.getPluginConfig(
    'disableInternalMiddlewareCustomRoutes'
  )
  await startServer({
    // Basic
    port: argv.port,
    apiPrefix: argv.apiPrefix,
    proxy: argv.proxy,
    gzip: argv.gzip,
    clearConsole: argv.clearConsole,
    yes: argv.yes,
    openBrowser: argv.openBrowser,
    listRoutes: argv.listRoutes,

    // Init app & Add routes
    initApp: argv.initApp,
    addRoutes: argv.addRoutes,

    // Root dir & Public dir & Route dir
    rootDir: argv.rootDir,
    publicDir: argv.publicDir,
    routeDir: argv.routeDir,

    // Static
    spa: argv.spa,
    fileIndex: argv.fileIndex,

    // 404
    file404: argv.file404,
    static404: argv.static404,

    // Switches
    disableIndexDirectory: argv.disableIndexDirectory,
    disableInternalMiddlewareCustomError:
      argv.disableInternalMiddlewareCustomError,
    disableInternalMiddlewareKoaLogger: argv.disableInternalMiddlewareKoaLogger,
    disableInternalMiddlewareKcors: argv.disableInternalMiddlewareKcors,
    disableInternalMiddlewareKoaBodyparser:
      argv.disableInternalMiddlewareKoaBodyparser,
    disableInternalMiddlewareCustomRoutes:
      argv.disableInternalMiddlewareCustomRoutes,
    disableInternalMiddlewareCustomStatic:
      argv.disableInternalMiddlewareCustomStatic,

    // Views
    viewsEngine: argv.viewsEngine,
    viewsExtension: argv.viewsExtension,
    viewsDir: argv.viewsDir,
  })

  return false
}

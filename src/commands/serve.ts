import startServer from '../common/startServer'

export const disabled = false
export const plugin = 'serve'
export const command = 'serve [publicDir]'
export const aliases = 's'
export const desc = 'Simple server tool'

export const builder = function (yargs) {

  let InternalControlGroup = 'Internal Controls:'

  yargs.option('port', { default: 3000, describe: 'server port', alias: 'P' })
  yargs.option('yes', { describe: 'Say yes to use new port when default port in use', alias: 'Y' })
  yargs.option('list', { describe: 'List routes', alias: 'L' })
  yargs.option('init-koa', { describe: 'Initial koa application', alias: 'I' })
  yargs.option('api-prefix', { default: '', describe: 'Prefix all routes'})
  yargs.option('spa', { describe: 'Fallback to index.html' })
  yargs.option('gzip', { describe: 'Enable gzip' })
  yargs.option('proxy', { describe: 'Provide a proxy route /proxy' } )
  yargs.option('route-dir', { describe: 'Routes location' })
  yargs.option('public-dir', { default: '.', describe: 'Static files location' })
  yargs.option('file-index', { default: 'index.html', describe: 'Index file name' })
  yargs.option('file-404', { describe: '404 file name' })
  yargs.option('views-engine', { default: 'nunjucks', describe: 'Set koa-views engine'})
  yargs.option('views-extension', { default: 'html', describe: 'Set koa-views template extension' })
  yargs.option('views-dir', { default: '', describe: 'Set koa-views template dir'})
  yargs.option('views-data', { default: '', describe: 'Set koa-views template data'})
  yargs.option('open-browser', { describe: 'Auto open browser', alias: ['open', 'B'] })
  yargs.option('clear-console', { describe: 'Auto clear console', alias: ['clear', 'C'] })
  yargs.option('disable-index-directory', { describe: 'List directory files if file index not exist', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-custom-error', { describe: 'Disable internal middleware custom error', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-custom-static', { describe: 'Disable internal middleware custom static', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-custom-router', { describe: 'Disable internal middleware custom router', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'Disable internal middleware koa-logger', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'Disable internal middleware koa-bodyparser', group: InternalControlGroup })
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'Disable internal middleware kcors', group: InternalControlGroup })
}

export const handler = async function (argv) {
  const { Utils } = argv.$semo
  
  argv.disableIndexDirectory = Utils.pluginConfig('disableIndexDirectory')
  argv.disableGlobalExcpetionRouter = Utils.pluginConfig('disableGlobalExcpetionRouter')
  argv.disableInternalMiddlewareCustomError = Utils.pluginConfig('disableInternalMiddlewareCustomError')
  argv.disableInternalMiddlewareKoaLogger = Utils.pluginConfig('disableInternalMiddlewareKoaLogger')
  argv.disableInternalMiddlewareKcors = Utils.pluginConfig('disableInternalMiddlewareKcors')
  argv.disableInternalMiddlewareKoaBodyparser = Utils.pluginConfig('disableInternalMiddlewareKoaBodyparser')
  argv.disableInternalMiddlewareCustomRouter = Utils.pluginConfig('disableInternalMiddlewareCustomRouter')

  await startServer(argv)
}

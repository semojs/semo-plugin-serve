/**
 * TODO:
 * [*]: beautify launch message
 * [*]: write more comments
 * [*]: send 404 header when 404
 * [*]: enable gzip for text content type
 * [*]: mock inside
 * [*]: support spa mode and 404 mode
 * [*]: return format, base on Zhike api style, with errors by middleware ***
 * [*]: support pure response, ctx.json = false
 * [*]: restructure middlewares
 * [*]: port detect
 * [*]: simple route, function module as handler
 * [*]: speical route, index
 * [*]: semo serve -l list all routes
 * [*]: semo make route a/b/c/d 'desc'
 * [*]: README.md
 * [*]: Rewrite all not-found requests to `index.html`
 * [*]: http access log
 * [*]: support init script
 * [*]: support router middleware
 * [*]: disable internal middleware
 * [*]: validation support
 * [*]: watch mode, nodemon --exec 'semo serve'
 * [-]: view & template
 * [-]: support sentry
 * []: debug
 * []: directory file list
 */
import startServer from '../common/startServer'

export const disabled = false
export const plugin = 'serve'
export const command = 'serve [publicDir]'
export const aliases = 's'
export const desc = 'Simple server tool'

export const builder = function (yargs) {
  yargs.option('port', { default: 3000, describe: 'server port', alias: 'P' })
  yargs.option('yes', { describe: 'say yes to use new port when default port in use', alias: 'Y' })
  yargs.option('list', { describe: 'list routes', alias: 'L' })
  yargs.option('init-koa', { describe: 'initial koa application', alias: 'I' })
  yargs.option('api-prefix', { default: '', describe: 'prefix all routes'})
  yargs.option('spa', { describe: 'fallback to index.html' })
  yargs.option('gzip', { describe: 'enable gzip' })
  yargs.option('proxy', { describe: 'provide a proxy route /proxy' } )
  yargs.option('route-dir', { describe: 'routes location' })
  yargs.option('public-dir', { default: '.', describe: 'static files location' })
  yargs.option('file-index', { default: 'index.html', describe: 'index file name' })
  yargs.option('file-404', { describe: 'index file name' })
  yargs.option('views-engine', { default: 'nunjucks', describe: 'set koa-views engine'})
  yargs.option('views-extension', { default: 'html', describe: 'set koa-views template extension' })
  yargs.option('views-dir', { default: '', describe: 'set koa-views template dir'})
  yargs.option('views-data', { default: '', describe: 'set koa-views template data'})
  yargs.option('open-browser', { describe: 'Auto open browser', alias: ['open', 'B'] })
  yargs.option('clear-console', { describe: 'Auto clear console', alias: ['clear', 'C'] })
  yargs.option('disable-index-directory', { describe: 'list directory files if file index not exist'})
  yargs.option('disable-internal-middleware-custom-error', { describe: 'disable internal middleware custom error'})
  yargs.option('disable-internal-middleware-custom-static', { describe: 'disable internal middleware custom static'})
  yargs.option('disable-internal-middleware-custom-router', { describe: 'disable internal middleware custom router'})
  yargs.option('disable-internal-middleware-koa-logger', { describe: 'disable internal middleware koa-logger'})
  yargs.option('disable-internal-middleware-koa-bodyparser', { describe: 'disable internal middleware koa-bodyparser'})
  yargs.option('disable-internal-middleware-koa-kcors', { describe: 'disable internal middleware kcors'})
}

export const handler = async function (argv) {
  const { Utils } = argv.$semo
  
  argv.disableIndexDirectory = Utils.config('disableIndexDirectory', argv.disableIndexDirectory)
  argv.disableGlobalExcpetionRouter = Utils.config('disableGlobalExcpetionRouter', argv.disableGlobalExcpetionRouter)
  argv.disableInternalMiddlewareCustomError = Utils.config('disableInternalMiddlewareCustomError', argv.disableInternalMiddlewareCustomError)
  argv.disableInternalMiddlewareKoaLogger = Utils.config('disableInternalMiddlewareKoaLogger', argv.disableInternalMiddlewareKoaLogger)
  argv.disableInternalMiddlewareKcors = Utils.config('disableInternalMiddlewareKcors', argv.disableInternalMiddlewareKcors)
  argv.disableInternalMiddlewareKoaBodyparser = Utils.config('disableInternalMiddlewareKoaBodyparser', argv.disableInternalMiddlewareKoaBodyparser)
  argv.disableInternalMiddlewareCustomRouter = Utils.config('disableInternalMiddlewareCustomRouter', argv.disableInternalMiddlewareCustomRouter)

  await startServer(argv)
}

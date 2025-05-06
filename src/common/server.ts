import { colorize, warn } from '@semo/core'

import { confirm } from '@inquirer/prompts'
import boxen from 'boxen'
import detect from 'detect-port'
import isRoot from 'is-root'
import Koa from 'koa'
import _ from 'lodash'
import { promises as fs } from 'node:fs'
import open from 'open'
import os from 'node:os'
import path from 'node:path'

import { errorMiddleware } from '../middlewares/error.js'
import { routerMiddleware } from '../middlewares/router.js'
import staticMiddleware from '../middlewares/static.js'

import views from '@ladjs/koa-views'
import cors from 'kcors'
import bodyParser from 'koa-bodyparser'
import compress from 'koa-compress'
import logger from 'koa-logger'
import { fileBrowser } from '../middlewares/fileBrowser.js'
import { notFoundMiddleware } from '../middlewares/notFound.js'
import { SemoServerOptions } from './types.js'

export const startServer = async (opts: SemoServerOptions, app: any = null) => {
  opts.rootDir ??= process.cwd()
  opts.publicDir ??= '.'
  opts.routeDir ??= '.'
  opts.apiPrefix ??= ''
  opts.port ??= 3000

  opts.publicDir = path.resolve(opts.rootDir, opts.publicDir)
  opts.routeDir = path.resolve(opts.rootDir, opts.routeDir)
  if (opts.file404) {
    opts.file404 = path.resolve(opts.rootDir, opts.file404)
  }
  if (opts.fileIndex) {
    opts.fileIndex = path.resolve(opts.rootDir, opts.fileIndex)
  }

  if (opts.viewsDir) {
    opts.viewsDir = path.resolve(opts.rootDir, opts.viewsDir)
  }

  let port = Number(opts.port)

  if (!app) {
    app = new Koa()
  }

  if (!opts.disableInternalMiddlewareKoaBodyparser) {
    app.use(bodyParser())
  }

  // 错误处理
  if (!opts.disableInternalMiddlewareCustomError) {
    app.use(errorMiddleware)
  }

  if (opts.initApp && typeof opts.initApp === 'function') {
    opts.initApp(app)
  }

  // 加载常用中间件
  if (!opts.disableInternalMiddlewareKoaLogger) {
    app.use(logger())
  }
  if (!opts.disableInternalMiddlewareKcors) {
    app.use(cors({ credentials: true }))
  }

  // 支持 Gzip
  if (opts.gzip) {
    app.use(
      compress({
        filter: function (content_type) {
          return /text|javascript|css/i.test(content_type)
        },
        threshold: 2048,
      })
    )
  }

  if (opts.viewsDir) {
    app.use(
      views(opts.viewsDir, {
        autoRender: false,
        extension: opts.viewsExtension || 'html',
        map: {
          // html: opts.viewsEngine || 'nunjucks',
          [opts.viewsExtension || 'html']: opts.viewsEngine || 'nunjucks',
        },
      })
    )
  }

  // 最后进行异常处理
  if (!opts.disableGlobalExcpetionRouter) {
    app.use(notFoundMiddleware)
  }

  // 加载静态路由
  if (!opts.disableInternalMiddlewareCustomStatic) {
    await fs.access(opts.publicDir, fs.constants.F_OK)

    if (!opts.spa) {
      app.use(fileBrowser(opts))
    } else {
      app.use(staticMiddleware(opts))
    }

    await fs.access(
      path.resolve(opts.publicDir, opts.file404),
      fs.constants.F_OK
    )
  }

  // 加载动态路由
  // 如果fileIndex不存在，这里的路由有可能会跟serveIndex的机制冲突，所以如果明确只将本功能用于开发api服务，应该禁用index directory
  if (!opts.disableInternalMiddlewareCustomRoutes) {
    app.use(await routerMiddleware(opts))
  }

  // 给启动信息加个框
  const box = [colorize('green', 'Semo Serving!'), '']

  // 端口检测
  const message =
    process.platform !== 'win32' && port < 1024 && !isRoot()
      ? `Admin permissions are required to run a server on a port below 1024.`
      : `Something is already running on port ${port}.`

  const _port = await detect(port)

  if (port !== _port) {
    if (opts.yes) {
      port = _port
    } else {
      const confirmed = await confirm({
        message: colorize(
          'yellow',
          message + `\n\nWould you like to run on another port instead?`
        ),
        default: true,
      })
      if (confirmed) {
        port = _port
      } else {
        console.log(warn('User aborted!'))
        process.exit(0)
      }
    }
  }

  // HOST地址检测
  const localhost = `http://localhost:${_port}`
  const network: any = _.chain(os.networkInterfaces())
    .flatMap()
    .find((o: any) => o.family === 'IPv4' && o.internal === false)
    .value()
  const nethost = network ? `http://${network.address}:${_port}` : null

  app.listen(port)
  if (opts.openBrowser) {
    await open(nethost || localhost)
  }

  // 清除终端，copy from package: react-dev-utils
  if (opts.clearConsole) {
    function clearConsole() {
      process.stdout.write(
        process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
      )
    }
    if (process.stdout.isTTY) {
      clearConsole()
    }
  }

  box.push(colorize('bold', `Local: `) + colorize('green', localhost))
  if (nethost) {
    box.push(colorize('bold', `Network: `) + colorize('green', nethost))
  }
  box.push(
    colorize('bold', '- spa: ') +
      (opts.spa ? colorize('green', 'on') : colorize('red', 'off'))
  )
  box.push(
    colorize('bold', '- gzip: ') +
      (opts.gzip ? colorize('green', 'on') : colorize('red', 'off'))
  )

  console.log(
    boxen(box.join('\n'), {
      margin: 1,
      padding: 1,
      borderColor: 'green',
    })
  )
}

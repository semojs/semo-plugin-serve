import { Utils } from '@semo/core'
import path from 'path'
import fs from 'fs'
import os from 'os'
import boxen from 'boxen'
import isRoot from 'is-root'

import detect from 'detect-port';

import Koa from 'koa'

import errorMiddleware from '../middlewares/error'
import staticMiddleware from '../middlewares/static'
import routerMiddleware from '../middlewares/router'

import logger from 'koa-logger'
import cors from 'kcors'
import bodyParser from 'koa-bodyparser'
import compress from 'koa-compress'

export = async (argv, app: any = null) => {
  argv.fileIndex = argv.fileIndex || 'index.html'
  argv.publicDir = argv.publicDir || '.'
  argv.apiPrefix = argv.apiPrefix || '/api'

  let port = parseInt(argv.port, 10) || 3000
  const appConfig = Utils.getApplicationConfig()

  if (!app) {
    app = new Koa()
  }

  // 错误处理
  argv.disableInternalMiddlewareCustomError || app.use(errorMiddleware)
  
  // 允许应用插入一些中间件
  if (argv.initApp && fs.existsSync(path.resolve(appConfig.applicationDir, argv.initApp))) {
    require(path.resolve(appConfig.applicationDir, argv.initApp))(app)
  }

  // 加载常用中间件
  argv.disableInternalMiddlewareKoaLogger || app.use(logger())
  argv.disableInternalMiddlewareKcors || app.use(cors({ credentials: true }))
  argv.disableInternalMiddlewareKoaBodyparser || app.use(bodyParser())

  // 支持 Gzip
  if (argv.gzip) {
    app.use(compress({
      filter: function (content_type) {
        return /text/i.test(content_type)
      },
      threshold: 2048
    }))
  }

  // 加载静态资源
  if (!argv.disableInternalMiddlewareCustomStatic) {
    if (!fs.existsSync(path.resolve(argv.publicDir))) {
      Utils.error('Invalid public dir.')
    }

    if (argv.spa && argv.fileIndex && !fs.existsSync(path.resolve(argv.publicDir, argv.fileIndex))) {
      Utils.error('Invalid file index')
    }

    if (argv.file404 && !fs.existsSync(path.resolve(argv.publicDir, argv.file404))) {
      Utils.error('Invalid file 404')
    }

    app.use(staticMiddleware(argv))
  }

  // 加载动态路由
  argv.disableInternalMiddlewareCustomRouter || app.use(routerMiddleware(argv))


  // 给启动信息加个框
  const box = [Utils.chalk.green('Semo Serving!'), '']

  // 端口检测
  const message =
    process.platform !== 'win32' && port < 1024 && !isRoot()
      ? `Admin permissions are required to run a server on a port below 1024.`
      : `Something is already running on port ${port}.`;


  const _port = await detect(port)

  if (port !== _port) {
    if (argv.yes) {
      port = _port
    } else {
      const question = {
        name: 'shouldChangePort',
        type: 'confirm',
        message: Utils.chalk.yellow(message + `\n\nWould you like to run on another port instead?`),
        default: true
      }
      const confirm = await Utils.inquirer.prompt(question)
      if (confirm.shouldChangePort) {
        port = _port
      } else {
        console.log(Utils.chalk.cyan('Aborted!'))
        process.exit(0)
      }
    }
  }

  // HOST地址检测
  const localhost = 'http://localhost'
  const network = Utils._.chain(os.networkInterfaces()).flatMap().find(o => o.family === 'IPv4' && o.internal === false).value()
  const nethost = network ? `http://${network.address}` : null

  app.listen(port)

  // 清除终端，copy from package: react-dev-utils
  function clearConsole() {
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    );
  }
  process.stdout.isTTY && clearConsole()

  box.push(Utils.chalk.bold(`Local: `) + Utils.chalk.green(`${localhost}:${_port}`))
  if (nethost) {
    box.push(Utils.chalk.bold(`Network: `) + Utils.chalk.green(`${nethost}:${_port}`))
  }
  box.push(Utils.chalk.bold('- spa: ') + (argv.spa ? Utils.chalk.green('on'): Utils.chalk.red('off')))
  box.push(Utils.chalk.bold('- gzip: ') + (argv.gzip ? Utils.chalk.green('on'): Utils.chalk.red('off')))

  console.log(boxen(box.join('\n'), {
    margin: 1,
    padding: 1,
    borderColor: 'green'
  }))
}
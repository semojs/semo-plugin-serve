import { Utils } from '@semo/core'
import path from 'path'
import axios from 'axios'

import requireDirectory from 'require-directory'
import { validate } from 'indicative/validator'
import Router from 'koa-router'
const router = new Router()

import Mock from 'mockjs'

const travelRouter = (argv, router, routes, prefixPath = '') => {
  Object.keys(routes).forEach(name => {
    let route = routes[name]

    // 支持特殊路由 index
    let routePath = name === 'index' ? `${prefixPath ? prefixPath : '/'}` : `${prefixPath}/${name}`

    // 支持简单路由
    if (Utils._.isFunction(route)) {
      route = { handler: route } // simple route
    }

    if (route.handler && Utils._.isFunction(route.handler)) {
      // 允许路由做额外修饰
      if (route.path) {
        routePath = `${routePath}/${route.path}`
      }

      // 允许路由定义路由方法
      const method = route.method ? Utils._.lowerCase(route.method) : 'get'

      // 路由中间件
      let middlewares = route.middleware ? Utils._.castArray(route.middleware) : []
      if (route.handler) {
        middlewares.push(async (ctx) => {
          // 内置路由实例
          ctx.router = router
          // 支持数据模拟实例，基于 mockjs
          ctx.Mock = Mock
          ctx.mock = Mock.mock
          const input = method === 'get' ? Object.assign({}, ctx.params, ctx.query) : Object.assign({}, ctx.params, ctx.query, ctx.body)
  
          // 支持参数校验路由配置
          if (route.validate) {
            try {
              // https://indicative.adonisjs.com/validations/master/min
              await validate(input, route.validate, route.validate_messages, {
                cacheKey: ctx.url
              })
            } catch (e) {
              throw new ctx.Exception(3, '', e)
            }
          }
          ctx.body = {
            reqId: ctx.reqId,
            code: 0
          }

          // 支持让路由控制关闭 gzip
          if (argv.gzip) {
            ctx.gzip = true
          }

          const handled = await route.handler(ctx, argv)

          if (argv.gzip) {
            ctx.compress = ctx.gzip
          }

          if (ctx.json) {
            ctx.body.data = handled
          } else {
            ctx.body = handled
          }

        })
      }
      routePath = routePath.replace(/\/+/g, '/')
      if (route.name && Utils._.isString(route.name)) {
        router[method](route.name, routePath, ...middlewares)
      } else {
        router[method](routePath, ...middlewares)
      }
      
    } else if (Utils._.isObject(route)) {
      travelRouter(argv, router, route, routePath)
    } else {
      // Do nothing
    }
  })
}

export = (argv) => {
  const appConfig = Utils.getApplicationConfig()

  // 支持路由前缀
  if (argv.apiPrefix) {
    router.prefix(argv.apiPrefix)
  }

  if (argv.proxy) {
    router.get('/proxy/(.*)', async (ctx, next) => {
      const proxyUrl = ctx.request.url.substring(7)
      return axios({
        url: proxyUrl,
        responseType: 'stream'
      }).then(response => {
        ctx.type = response.headers['content-type']
        ctx.body = response.data
      })
    })
  }

  const routes = argv.routeDir ? requireDirectory(module, path.resolve(appConfig.applicationDir, argv.routeDir)) : null
  if (routes) {
    travelRouter(argv, router, routes)

    if (!argv.disableGlobalExcpetionRouter) {
      // 默认路由，如果没有设置路由目录，则默认路由也没有
      router['all']('/(.*)', async ctx => {
        // @ts-ignore
        throw new ctx.Exception(4)
      })
    }
  }


  // 查看注册的所有路由
  if (argv.list) {
    if (!argv.disableInternalMiddlewareCustomStatic) {
      const publicDir = argv.publicDir ? path.resolve(argv.publicDir) : path.resolve('.')
      console.log(`${Utils.chalk.green('Static Directory:')}`)
      console.log(publicDir)
      console.log()
    }

    console.log(Utils.chalk.green('Routes:'))
    const headers = [Utils.chalk.cyan.bold('PATH'), Utils.chalk.cyan.bold('NAME'), Utils.chalk.cyan.bold('METHOD')]
    const rows: any = []
    router.stack.forEach(item => {
      rows.push([
        item.path,
        item.name,
        item.methods.length > 30 ? 'ALL' : item.methods.join(', ')
      ])
    })

    console.log(rows.length > 0 ? Utils.table([headers].concat(rows)) : Utils.chalk.yellow('No routes defined.'))
    process.exit(0)
  }

  return router.routes()
}
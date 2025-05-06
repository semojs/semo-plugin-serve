import { colorfulLog, colorize, outputTable, warn } from '@semo/core'
import _ from 'lodash'
import path from 'node:path'

// import { validator } from 'indicative'
import Router from '@koa/router'
import axios from 'axios'
import { Context } from 'koa'
import { ZodType } from 'zod'
import Joi from 'joi'
import { importDirectory } from '../common/route.js'
import { SemoServerOptions } from '../common/types.js'
import { ERROR_VALIDATE_FAILED } from '../common/exception.js'

const router = new Router()

const travelRouter = (
  opts: SemoServerOptions,
  router,
  routes,
  prefixPath = ''
) => {
  Object.keys(routes).forEach((name) => {
    let route = routes[name]

    let overrideMethod
    // name 中支持解析 get, post, put, delete, patch基于.分割
    const nameSplits = name.split('.')
    if (nameSplits.length > 1) {
      if (
        ['get', 'post', 'put', 'delete', 'patch'].includes(
          nameSplits.at(-1).toLowerCase()
        )
      ) {
        overrideMethod = nameSplits.at(-1)
        name = nameSplits.slice(0, -1).join('.')
      }
    }

    // 支持特殊路由 index
    let routePath =
      name === 'index'
        ? `${prefixPath ? prefixPath : '/'}`
        : `${prefixPath}/${name}`

    // 支持简单路由
    if (_.isFunction(route)) {
      route = { handler: route } // simple route
    }

    if (route.handler && _.isFunction(route.handler)) {
      // 允许路由定义路由方法
      const method =
        overrideMethod ?? (route.method ? _.lowerCase(route.method) : 'get')

      // 允许路由做额外修饰
      if (route.path) {
        routePath = `${routePath}/${route.path}`
      }

      // 路由中间件
      const middlewares: any[] = route.middleware
        ? _.castArray(route.middleware)
        : []
      if (route.handler) {
        middlewares.unshift(async (ctx: Context) => {
          // 内置路由实例
          ctx.router = router
          const input =
            method === 'get'
              ? Object.assign({}, ctx.params, ctx.request.query)
              : Object.assign(
                  {},
                  ctx.params,
                  ctx.request.query,
                  ctx.request.body
                )

          // 支持参数校验路由配置
          if (route.validate) {
            if (route.validate instanceof ZodType) {
              try {
                route.validate.parse(input)
              } catch (e) {
                let tryPass = e.message
                try {
                  tryPass = JSON.parse(e.message)
                } catch {}
                ctx.error(ERROR_VALIDATE_FAILED, '', 400, tryPass)
              }
            } else if (Joi.isSchema(route.validate)) {
              try {
                await route.validate.validateAsync(input)
              } catch (e) {
                let tryPass = e.message
                try {
                  tryPass = JSON.parse(e.message)
                } catch {}
                ctx.error(ERROR_VALIDATE_FAILED, '', 400, tryPass)
              }
            } else {
              // Maybe I will support more
            }
          }
          ctx.body = {
            reqId: ctx.reqId,
            code: 0,
          }

          // 支持让路由控制关闭 gzip
          if (opts.gzip) {
            ctx.gzip = true
          }

          const handled = await route.handler(ctx, opts)

          if (opts.gzip) {
            ctx.compress = ctx.gzip
          }

          if (ctx.json) {
            // @ts-ignore
            ctx.body.data = handled
          } else {
            ctx.set('Content-Type', 'text/plain')
            ctx.body = handled
          }
        })
      }
      routePath = routePath.replace(/\/+/g, '/')
      if (name && _.isString(name)) {
        router[method](name, routePath, ...middlewares)
      } else {
        router[method](routePath, ...middlewares)
      }
    } else if (_.isObject(route)) {
      travelRouter(opts, router, route, routePath)
    } else {
      // Do nothing
    }
  })
}

export const routerMiddleware = async (opts: SemoServerOptions) => {
  // 支持路由前缀
  if (opts.apiPrefix) {
    router.prefix(opts.apiPrefix)
  }

  // Proxy 路由配置，支持跨域请求转发
  if (opts.proxy) {
    router.get('/proxy/(.*)', async (ctx, _next) => {
      const proxyUrl = ctx.request.url.substring(7)
      return axios({
        method: 'get',
        url: proxyUrl,
        responseType: 'stream',
      }).then((response) => {
        ctx.type = response.headers['content-type']
        ctx.body = response.data
      })
    })
  }

  if (!opts.disableHealthCheckRoute) {
    router.get('/healthCheck', async (ctx, _next) => {
      ctx.body = 'OK'
    })
  }

  router.get('/favicon.ico', async (ctx) => {
    // return a svg icon
    ctx.set('Content-Type', 'image/svg+xml')
    ctx.body = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
 "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="180.000000pt" height="180.000000pt" viewBox="0 0 180.000000 180.000000"
 preserveAspectRatio="xMidYMid meet">
<metadata>
Created by potrace 1.10, written by Peter Selinger 2001-2011
</metadata>
<g transform="translate(0.000000,180.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">
<path d="M645 1463 c-11 -2 -41 -11 -67 -19 -44 -14 -48 -18 -48 -48 0 -77 94
-203 189 -251 53 -27 145 -55 175 -54 19 0 18 1 -4 11 -163 69 -240 130 -286
226 -31 65 -30 66 72 81 173 26 272 -39 327 -213 20 -64 22 -68 25 -38 6 59
-33 164 -80 217 -59 67 -123 95 -213 94 -38 -1 -79 -3 -90 -6z"/>
<path d="M820 1231 c0 -5 15 -19 34 -31 54 -33 141 -133 174 -200 45 -89 60
-178 72 -430 6 -124 15 -229 19 -233 4 -4 11 23 14 60 7 85 59 265 101 358 50
106 103 167 181 206 36 17 63 34 61 37 -10 10 -107 -21 -149 -48 -24 -15 -60
-47 -80 -72 -41 -50 -87 -142 -87 -175 0 -13 -4 -23 -10 -23 -6 0 -10 32 -10
75 0 155 -50 275 -154 373 -61 57 -166 122 -166 103z"/>
<path d="M1470 1139 c-63 -10 -92 -23 -134 -60 -40 -34 -66 -77 -66 -106 0
-13 5 -10 19 12 45 74 114 109 211 108 36 0 85 -6 108 -12 41 -11 43 -14 37
-39 -19 -77 -145 -172 -229 -172 -32 0 -56 -10 -56 -22 0 -13 101 -3 168 17
93 28 189 147 180 223 -3 22 -10 27 -58 38 -82 18 -130 21 -180 13z"/>
<path d="M175 858 c-73 -40 -58 -112 28 -132 22 -5 28 -12 25 -29 -2 -17 -11
-23 -39 -25 -23 -2 -40 2 -49 13 -12 14 -15 14 -31 -1 -25 -22 -24 -29 6 -42
46 -21 113 -15 140 13 49 48 27 102 -48 119 -22 5 -28 12 -25 29 2 18 9 22 38
21 19 0 41 -2 48 -5 8 -2 19 4 25 14 10 14 9 20 -3 27 -20 13 -90 12 -115 -2z"/>
<path d="M344 776 c-27 -27 -34 -42 -34 -73 0 -49 24 -73 71 -73 35 0 79 23
79 41 0 12 -37 12 -45 -1 -10 -16 -52 -12 -59 6 -10 27 -7 29 39 30 105 2 119
104 15 104 -23 0 -42 -10 -66 -34z m94 -18 c2 -12 -6 -19 -33 -24 -45 -8 -54
0 -30 26 22 24 58 23 63 -2z"/>
<path d="M511 743 c-7 -38 -15 -78 -18 -90 -4 -19 -1 -23 20 -23 22 0 25 5 31
52 8 58 28 88 59 88 21 0 21 -18 2 -107 -7 -30 -5 -33 17 -33 23 0 26 5 32 48
7 57 29 92 58 92 22 0 22 -17 3 -107 -7 -30 -5 -33 16 -33 23 0 25 6 36 75 7
41 10 82 7 90 -8 20 -54 19 -83 -1 -22 -16 -24 -16 -33 0 -11 20 -47 21 -76 0
-20 -14 -22 -14 -22 0 0 9 -8 16 -18 16 -15 0 -21 -13 -31 -67z"/>
<path d="M852 794 c-75 -52 -65 -164 15 -164 67 0 113 45 113 110 0 60 -75 92
-128 54z m84 -48 c15 -62 -72 -116 -91 -56 -3 11 1 33 10 50 12 23 22 30 45
30 23 0 31 -5 36 -24z"/>
</g>
</svg>
`
  })

  // 允许自定义路由
  if (opts.addRoutes && typeof opts.addRoutes === 'function') {
    opts.addRoutes(router)
  }

  const routes = opts.routeDir ? await importDirectory(opts.routeDir) : null

  if (routes) {
    travelRouter(opts, router, routes)
  }

  // 查看注册的所有路由
  if (opts.listRoutes) {
    if (!opts.disableInternalMiddlewareCustomStatic) {
      const publicDir = opts.publicDir
        ? path.resolve(opts.publicDir)
        : path.resolve('.')
      colorfulLog('green', 'Static Directory:')
      console.log(publicDir)
      console.log()
    }

    colorfulLog('green', 'Routes:')
    const headers = [
      colorize('cyan.bold', 'PATH'),
      colorize('cyan.bold', 'NAME'),
      colorize('cyan.bold', 'METHOD'),
    ]
    const rows: any = []
    router.stack.forEach((item) => {
      rows.push([
        item.path,
        item.name,
        item.methods.length > 30 ? 'ALL' : item.methods.join(', '),
      ])
    })

    console.log(
      rows.length > 0
        ? outputTable([headers].concat(rows))
        : warn('No routes defined.')
    )
    process.exit(0)
  }

  return router.routes()
}

/**
 * @file index.js
 *
 * This file is used to demonstrate how to use semo-plugin-serve as a lib.
 */

import { startServer } from '../../lib/index.js'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

startServer({
  port: 3000,
  apiPrefix: '/api',
  rootDir: path.resolve(__dirname, '../'),
  routeDir: 'src/routes',
  publicDir: 'public',
  file404: '404.html',
  fileIndex: 'index.html',
  addRoutes: (router) => {
    // access /api/hello-world
    router.get('/hello-world', async (ctx) => {
      ctx.body = 'Hello World'
    })
  },
  initApp: (app) => {
    app.use(async (ctx, next) => {
      console.log('initApp middleware')
      await next()
    })
  },
})

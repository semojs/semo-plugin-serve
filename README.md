# semo-plugin-serve

A simple HTTP Server tool, similar tools include but are not limited to:

- [http-server](https://www.npmjs.com/package/http-server)
- [serve](https://www.npmjs.com/package/serve)

There are also other tools like `hexo`, originally a blog tool, that comes with HTTP Server functionality; `umi`, originally a frontend development scaffold, also includes HTTP Server startup functionality. Of course, there are also well-known tools like `create-react-app`, etc. Moreover, writing a simple web server with Node itself isn't very complicated, so why create another wheel?

## Why Build This Wheel

One reason was seeing a project `osgood`, which implemented the idea of quickly defining routes and controllers via command-line tools. Additionally, since `Semo` as a command-line development framework has the value of encapsulating various command-line tools on demand, and its commands and scripts have a relatively unified module style - that is, the convention-over-configuration approach of exporting fixed variables for fixed purposes. Combining these two led to this new HTTP Server tool, whose web server part is implemented based on Koa and its middleware, with strong customizability. This wheel mainly sets rules and provides related syntactic sugar.

Thanks to `Koa`'s simplicity and flexibility, we can customize the features we need on demand. This program uses `Koa` to implement web services and various extension features.

## Features

- Supports both static resource services and backend interface services
- Backend service directory structure is the route structure
- Backend service routes can be flexibly configured with built-in parameter validation mechanism
- Backend services can introduce global middleware and single-route middleware, and can also disable built-in middleware
- Supports some personalized options, which can also be set in the configuration file (`.semorc.yml`)
- Supports automatic port occupancy detection
- Supports SPA mode and 404 mode

## Installation

```
npm i -g @semo/cli semo-plugin-serve
```

## Usage

```bash
semo serve [publicDir]

Simple server tool

Server Controls:
      --port         server port                                                           [default: 3000]
  -Y, --yes          Say yes to use new port when default port in use
  -L, --list-routes  List routes
      --api-prefix   Prefix all routes                                                       [default: ""]
      --spa          Fallback to index.html
      --gzip         Enable gzip
      --route-dir    Routes location
      --root-dir     Base root directory, default is current directory
      --public-dir   Static files location                                                  [default: "."]
      --file-index   Index file name                                               [default: "index.html"]
      --file-404     404 file name
      --static-404   If use simple 404 response, only work when file-404 is not set              [boolean]
  -P, --proxy        Provide a proxy route /proxy

Internal Controls:
      --disable-index-directory                     List directory files if file index not exist [boolean]
      --disable-internal-middleware-custom-error    Disable internal middleware custom error     [boolean]
      --disable-internal-middleware-custom-static   Disable internal middleware custom static    [boolean]
      --disable-internal-middleware-custom-routes   Disable internal middleware custom routes    [boolean]
      --disable-internal-middleware-koa-logger      Disable internal middleware koa-logger       [boolean]
      --disable-internal-middleware-koa-bodyparser  Disable internal middleware koa-bodyparser   [boolean]
      --disable-internal-middleware-koa-kcors       Disable internal middleware kcors            [boolean]
      --disable-health-check-route                  Disable health check route                   [boolean]

Views Controls:
      --views-engine     Set koa-views engine                                        [default: "nunjucks"]
      --views-extension  Set koa-views template extension                                [default: "html"]
      --views-dir        Set koa-views template dir                                          [default: ""]

Options:
      --verbose                 Enable verbose logging                          [boolean] [default: false]
  -B, --open-browser, --open    Auto open browser                                                [boolean]
  -C, --clear-console, --clear  Auto clear console                                               [boolean]
  -h, --help                    Show help                                                        [boolean]
  -v, --version                 Show version number                                              [boolean]
```

## Command Line Usage Instructions

### Route Code Generator

Leveraging Semo's unified code generation entry and extensibility, we've implemented a simple route code generator

```
semo make route a/b/c
```

### View Declared Route Addresses

```
semo serve --list
```

### Start Service

```
semo serve [publicDir]
semo serve # Default current directory
```

## Route System Explanation

### What a Route Looks Like

#### Full Version

```js
export const name = 'signup' // Name the route
export const method = 'post' // Supports various HTTP request methods
export const path = 'abc' // Automatically appended to the path route
export const handler = async (ctx) => {} // Route callback
```

#### Simplified Version

```js
export = async ctx => {}
```

### Convention Usage of ctx

#### Disable Default JSON Response Format

```js
ctx.json = false
```

#### Custom Error Codes

Note that thrown error codes must be defined

```js
ctx.errors[10001] = 'Custom error message'
// or
ctx.error(10001, 'Custom error message', 405)

throw new ctx.Exception(10001, 'Override error message')
```

#### Parameter Validation

Supports both zod and Joi parameter validation libraries. You still need to install them locally. After definition, the built-in route middleware can recognize them.

```js
export const validate = {
  body: z.object({
    name: z.string(),
  }),
}
```

#### Gzip Compression

When the `--gzip` option is set to true, by default all responses with content type containing text will be gzip compressed. If you want to disable this in a route response function, you can do the following:

```js
module.export = async (ctx) => {
  ctx.compress = false
  // or
  ctx.gzip = false
}
```

### Special Routes

Index-named routes have special meaning in our understanding of routes because we generally don't need to access a route like `/api/a/b/index`, but just `/api/a/b`. So if we implement the route not in `b.js` but in `b/index.js`, the effect is the same.

### SPA Mode and 404 Mode

When starting with the `--spa` option, non-existent paths will point to the default `index.html`. Note that routes under the API prefix specified by the `--api-prefix` option will only throw a route-not-found exception response even if not found, rather than pointing to `index.html`. This is done to support both frontend and backend usage scenarios.

If not using SPA mode and the `--file-404` option is configured (e.g., 404.html), all non-existent 404 static resources will use this configured static page for output. If set to false to disable this option, it will output as a `Not found` string.

## APIs

If you don't want to use Semo for dispatching, you can also directly import it as a module. Parameters can refer to command-line options or check IDE hints. Typescript projects can import the type: SemoServerOptions. By default, only a few parameters are needed, as most have default values.

```js
import { startServer } from 'semo-plugin-serve'

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
```

## Constants

- SEMO_SERVE_DISABLE_ERROR_STACK=1

## License

MIT

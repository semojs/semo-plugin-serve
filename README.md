# semo-plugin-serve

一个简易的 HTTP Server 工具，类似的工具有很多，包括但不限于：

- [http-server](https://www.npmjs.com/package/http-server)
- [serve](https://www.npmjs.com/package/serve)

还有一些工具，比如 `hexo`，本来是个博客工具，也自带了 HTTP Server 的功能，`umi`，本来是个前端开发脚手架，也自带了启动 HTTP Server 的功能，当然，还有大名鼎鼎的 `create-react-app` 等等，而且 node 本身写一个简单的Web服务器也不是很复杂，那为什么还要去做一个新的轮子呢？

## 为什么造这个轮子

其中一个原因是看到了一个项目 `osgood`，其实现了基于命令行工具快速定义路由和控制器的思路。另外，由于 `Semo` 做为一个命令行开发框架，其价值就是按需封装各种各样的命令行工具，而且其命令，脚本都有相对统一的模块风格，那就是基于约定导出固定变量用于固定用途的约定大于配置的思路。将二者结合就形成了这个新的 HTTP Server 工具，其 Web Server 部分基于 koa 及其中间件实现，定制性较强，这个轮子主要就是制定规则，提供相关语法糖。

感谢 `Koa` 的简洁和灵活，我们可以按需定制所需要的特性，本程序使用 `Koa` 来实现 Web 服务以及各种扩展功能

## 特性

- 同时支持静态资源服务和后端接口服务，
- 后端服务，目录结构就是路由结构
- 后端服务路由可以灵活配置，内置了参数验证机制
- 后端服务可以引入全局中间件和单个路由中间件，也可以禁用内置中间件
- 支持一些个性化选项，个性化选项也都可以在配置文件(`.semorc.yml`)中设置
- 支持端口占用自动检测
- 支持和SPA模式和404模式

## 安装

```
npm i -g @semo/cli semo-plugin-serve
```

## 使用

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

## 命令行使用说明

### 路由代码生成器

借助于 Semo 提供的统一的代码生成入口和扩展性，我们实现了一个简单的路由代码生成器

```
semo make route a/b/c
```

### 查看声明的路由地址

```
semo serve --list
```

### 启动服务

```
semo serve [publicDir]
semo serve # 默认当前目录
```

## 路由系统说明

### 一个路由的样子

#### 完整版

```js
export const name = 'signup' // 给路由起个名字
export const method = 'post' // 支持各种 HTTP 请求方法
export const path = 'abc' // 自动添加到路径路由的后面
export const handler = async (ctx) => {} // 路由回调
```

#### 简单版

```js
export = async ctx => {}
```

### ctx 的约定用法

#### 关闭默认的 json 响应格式

```js
ctx.json = false
```

#### 自定义错误码

这里要注意的是抛出的错误码必须经过定义

```js
ctx.errors[10001] = '自定义错误消息'
// 或
ctx.error(10001, '自定义错误消息', 405)

throw new ctx.Exception(10001, '重写错误消息')
```

#### 验证参数

支持 zod 和 Joi 两种参数验证库。你仍然需要本地安装，定义后，内置的路由中间件可以识别。

```js
export const validate = {
  body: z.object({
    name: z.string(),
  }),
}
```

#### gzip 压缩

当选项 `--gzip` 设置为 true 以后，默认凡是内容类型包含 text 的响应都会进行 gzip 压缩，如果想关闭可以在路由响应函数里进行如下操作：

```js
module.export = async (ctx) => {
  ctx.compress = false
  // 或
  ctx.gzip = false
}
```

### 特殊的路由

index 文件名的路由在我们对路由的理解里有特殊含义，因为我们一般不需要一个路由这样访问：`/api/a/b/index`，而只需要是 `/api/a/b`，所以如果我们不是将路由实现在 `b.js`里，而是`b/index.js`，效果是一样的。

### SPA模式和404模式

只要在启动时加上 `--spa` 选项，不存在的路径就会指向默认的 `index.html`，需要注意的是 `--api-prefix` 选项指定的 API前缀下的路由即使找不到也只是会抛出路由不存在的异常响应，而不会指向 `index.html`，这么做的目的是为了同时支持前后端的使用场景。

如果不使用SPA模式，并且配置了 `--file-404` 选项，比如404.html，则所有不存在的404静态资源都会使用这个配置的静态页面进行输出，如果设置为 false 关闭了这个选项，则会输出为 `Not found` 字符串。

## APIs

如果不想用 Semo 来调度也可以直接已模块的方式引入，参数可以参考命令行选项，也可以根据 IDE 的提示来查看， Typescript 项目可以导入类型： SemoServerOptions。默认只需要很少的参数即可，大部分参数都有默认值。

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

## 开源协议

MIT

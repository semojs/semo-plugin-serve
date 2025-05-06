export interface SemoServerOptions {
  // Basic
  port?: number | string
  apiPrefix?: string
  proxy?: string
  gzip?: boolean
  clearConsole?: boolean
  yes?: boolean
  openBrowser?: boolean
  listRoutes?: boolean

  // Routes
  addRoutes?: (router: any) => void
  initApp?: (app: any) => void

  // Root dir & Public dir & Route dir
  rootDir?: string
  publicDir?: string
  routeDir?: string

  // Static
  spa?: boolean
  fileIndex?: string

  // 404
  file404?: string
  static404?: boolean

  /**
   * Switches
   */
  disableIndexDirectory?: boolean // Disable directory listing
  disableInternalMiddlewareCustomError?: boolean // Disable custom error middleware
  disableInternalMiddlewareKoaLogger?: boolean // Disable koa-logger middleware
  disableInternalMiddlewareKcors?: boolean // Disable koa-cors middleware
  disableInternalMiddlewareKoaBodyparser?: boolean // Disable koa-bodyparser middleware
  disableInternalMiddlewareCustomRoutes?: boolean // Disable custom router middleware
  disableInternalMiddlewareCustomStatic?: boolean // Disable custom static middleware
  disableGlobalExcpetionRouter?: boolean // Disable global exception router
  disableHealthCheckRoute?: boolean // Disable health check
  /**
   * Views
   */
  viewsEngine?: string
  viewsExtension?: string
  viewsDir?: string
}

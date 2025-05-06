import { ERROR_ROUTE_NOT_FOUND } from '../common/exception.js'

// 未匹配路由处理中间件
export async function notFoundMiddleware(ctx, next) {
  await next()
  if (!ctx.body) {
    // 只有当前面的中间件都没有设置 ctx.body 时，才会执行到这里
    ctx.error(ERROR_ROUTE_NOT_FOUND, `Undefined route ${ctx.path}`, 400)
  }
}

// exports.name = '' // 路由名字，非必填
// exports.path = '' // 追加额外的路由，非必填
// exports.method = 'get' // 路由方法，默认 get，非必填
// // https://indicative.adonisjs.com/validations/master/min
// exports.middleware = [] // 为单个路由指定前置中间件
// exports.validate = {
//   username: 'min:6' 
// }
exports.handler = async ctx => {
  // ctx.errors[11] = '错误'
  ctx.json = false // 返回JSON数据结构
  return 'hello'
}
    
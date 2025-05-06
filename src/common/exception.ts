import _ from 'lodash'

export const errors = {
  1: { msg: '未知错误', status: 500 },
  2: { msg: '错误码无效', status: 400 },
  3: { msg: '参数校验失败', status: 400 },
  4: { msg: '路由未定义', status: 400 },
  5: { msg: '服务器内部错误', status: 500 },
}

export const ERROR_UNKNOWN = 1
export const ERROR_CODE_INVALID = 2
export const ERROR_VALIDATE_FAILED = 3
export const ERROR_ROUTE_NOT_FOUND = 4
export const ERROR_INTERNAL = 5

export class Exception extends Error {
  code: number
  msg: string
  status: number
  info: any

  constructor(code, msg, status, info = '') {
    let errMsg
    const errCode = code || 1 // 默认 code = 1
    if (msg || errors[errCode]) {
      if (_.isString(errors[errCode])) {
        errMsg = msg || errors[errCode] || ''
        status = errors[errCode].status || 200
      } else {
        errMsg = msg || errors[errCode].msg || ''
        status = errors[errCode].status || 200
      }
    } else {
      errMsg = '未定义错误'
      status = 500
    }

    super(errMsg)

    this.code = errCode
    this.msg = errMsg
    this.status = status
    this.info = info
  }
}

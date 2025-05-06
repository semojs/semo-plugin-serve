import mime from 'mime-types'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ERROR_INTERNAL } from '../common/exception.js'
import { SemoServerOptions } from '../common/types.js'

// 文件浏览器中间件
export const fileBrowser = function (opts: SemoServerOptions) {
  return async (ctx, next) => {
    await next()
    if (ctx.body) return

    // 获取请求路径
    const reqPath = ctx.path
    // 将请求路径转换为实际文件系统路径
    const fullPath = path.resolve(
      opts.publicDir,
      decodeURIComponent(reqPath.replace(/^\//, ''))
    )
    try {
      if (reqPath === '/') {
        // 如果请求路径为空且存在 index.html，则返回它，相当于模拟把 index.html 放到 public 下提供首页
        ctx.status = 200
        ctx.type = 'text/html'
        await fs.access(opts.fileIndex)
        ctx.body = await fs.readFile(opts.fileIndex)
      } else {
        try {
          const stats = await fs.stat(fullPath)
          if (stats.isDirectory()) {
            // 如果是目录，先尝试查找 index.html
            try {
              const indexPath = path.join(fullPath, 'index.html')
              await fs.access(indexPath)
              // 如果 index.html 存在，则返回它
              ctx.status = 200
              ctx.type = 'text/html'
              ctx.body = await fs.readFile(indexPath)
            } catch {
              // 如果没有 index.html，则显示目录列表
              if (!opts.disableIndexDirectory) {
                const files = await fs.readdir(fullPath)
                const fileList = await Promise.all(
                  files.map(async (file) => {
                    const filePath = path.join(fullPath, file)
                    const stats = await fs.stat(filePath)
                    return {
                      name: file,
                      isDirectory: stats.isDirectory(),
                      size: stats.size,
                      mtime: stats.mtime.toLocaleString(),
                    }
                  })
                )

                ctx.status = 200
                // 生成 HTML 页面
                ctx.type = 'text/html'
                ctx.body = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Index of ${reqPath}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 2em; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { text-align: left; padding: 8px; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    th { background-color: #4CAF50; color: white; }
                    a { text-decoration: none; color: #0366d6; }
                    .directory { font-weight: bold; }
                  </style>
                </head>
                <body>
                  <h2>Index of ${reqPath}</h2>
                  <table>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Last Modified</th>
                    </tr>
                    ${
                      reqPath !== '/'
                        ? `
                    <tr>
                      <td><a href="${path.join(reqPath, '..')}">../</a></td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                    `
                        : ''
                    }
                    ${fileList
                      .map(
                        (file) => `
                      <tr>
                        <td>
                          <a href="${path.join(reqPath, file.name)}" class="${file.isDirectory ? 'directory' : ''}">
                            ${file.name}${file.isDirectory ? '/' : ''}
                          </a>
                        </td>
                        <td>${file.isDirectory ? '-' : formatFileSize(file.size)}</td>
                        <td>${file.mtime}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </table>
                </body>
              </html>
            `
              } else {
                // 如果禁用了目录列表，则返回403
                ctx.status = 403
                ctx.body = 'Directory listing is disabled'
              }
            }
          } else {
            // 如果是文件，则直接返回文件内容
            ctx.type = mime.lookup(fullPath) || 'application/octet-stream'
            ctx.body = await fs.readFile(fullPath)
          }
        } catch {
          if (opts.apiPrefix && reqPath.startsWith(opts.apiPrefix)) {
            // Do nothing, give to final middleware to handle
          } else {
            // 如果文件不存在，则返回404
            if (opts.file404) {
              ctx.type = 'text/html'
              ctx.body = await fs.readFile(opts.file404)
            } else if (opts.static404) {
              ctx.body = '404 Not Found'
              ctx.status = 404
            }
          }
        }
      }
    } catch (e) {
      ctx.error(ERROR_INTERNAL, e.message)
    }
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

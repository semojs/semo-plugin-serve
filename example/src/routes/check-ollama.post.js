import axios from 'axios'
import { ERROR_INTERNAL } from '../../../lib/index.js'
import { z } from 'zod'

export const validate = z.object({
  ollamaUrl: z.string().max(100),
})

export const handler = async (ctx) => {
  ctx.json = true
  try {
    const { ollamaUrl } = ctx.request.body
    if (!ollamaUrl) {
      return ctx.error(ERROR_INTERNAL, 'Ollama URL is required')
    }

    await axios.get(`${ollamaUrl}/api/tags`, {
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      success: true,
      message: 'Ollama服务连接成功',
    }
  } catch (error) {
    console.error('Ollama连接检查错误:', error)
    ctx.error(ERROR_INTERNAL, error.message, 500)
  }
}

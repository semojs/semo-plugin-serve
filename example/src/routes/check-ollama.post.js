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
      message: 'Ollama service connected successfully',
    }
  } catch (error) {
    console.error('Ollama connection check error:', error)
    ctx.error(ERROR_INTERNAL, error.message, 500)
  }
}

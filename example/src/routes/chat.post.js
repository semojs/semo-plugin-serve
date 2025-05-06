import axios from 'axios'
import { z } from 'zod'

export const validate = z.object({
  modelName: z.string().max(50),
  systemPrompt: z.string().max(1000),
  ollamaUrl: z.string().max(100),
  message: z.string().max(1000),
})

export const handler = async (ctx) => {
  const { message, ollamaUrl, modelName, systemPrompt } = ctx.request.body

  const formatPrompt = (systemPrompt, userPrompt) => {
    return `
[SYSTEM]
${systemPrompt}
[/SYSTEM]

[USER]
${userPrompt}
[/USER]

[ASSISTANT]
让我用 Markdown 格式为你回答这个问题：

`
  }

  // 设置响应头，支持流式传输和CORS
  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: modelName,
        prompt: formatPrompt(systemPrompt, message),
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
        },
      },
      { responseType: 'stream' }
    )

    // 获取响应流
    const stream = response.data

    ctx.body = stream

    // 错误处理
    stream.on('error', (err) => {
      console.error('Stream error:', err)
      ctx.res.end()
    })
    // 超时处理
    const timeout = setTimeout(() => {
      stream.destroy()
      ctx.res.end()
    }, 60000) // 60秒超时

    stream.on('end', () => {
      clearTimeout(timeout)
    })
  } catch (error) {
    ctx.status = 500
    ctx.body = { error: 'Internal Server Error' }
  }
}

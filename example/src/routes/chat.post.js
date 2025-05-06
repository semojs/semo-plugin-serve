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
Let me answer this question for you in Markdown format:

`
  }

  // Set response headers for streaming and CORS
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

    // Get response stream
    const stream = response.data

    ctx.body = stream

    // Error handling
    stream.on('error', (err) => {
      console.error('Stream error:', err)
      ctx.res.end()
    })
    // Timeout handling
    const timeout = setTimeout(() => {
      stream.destroy()
      ctx.res.end()
    }, 60000) // 60 seconds timeout

    stream.on('end', () => {
      clearTimeout(timeout)
    })
  } catch (error) {
    ctx.status = 500
    ctx.body = { error: 'Internal Server Error' }
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, user, systemPrompt, customPrompt } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // Dify APIの設定
  const apiKey = process.env.DIFY_API_KEY
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

  if (!apiKey) {
    console.error('DIFY_API_KEY is not set in environment variables')
    return res.status(500).json({ error: 'API configuration error' })
  }

  // SSEのヘッダーを設定
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  try {
    // Dify APIへのリクエスト
    const requestBody: any = {
      inputs: {},
      query: message,
      response_mode: 'streaming',
      user: user || `user_${Date.now()}`,
    }

    const resolvedSystemPrompt: string | undefined = (() => {
      if (typeof systemPrompt === 'string' && systemPrompt.trim()) {
        return systemPrompt.trim()
      }
      if (typeof customPrompt === 'string' && customPrompt.trim()) {
        return customPrompt.trim()
      }
      return undefined
    })()

    if (resolvedSystemPrompt) {
      requestBody.inputs.system_prompt = resolvedSystemPrompt
    }

    if (conversation_id && conversation_id !== 'null' && conversation_id !== '') {
      requestBody.conversation_id = conversation_id
    }

    const response = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', response.status, errorText)
      res.write(`data: ${JSON.stringify({ error: 'API request failed' })}\n\n`)
      res.end()
      return
    }

    // ストリーミングレスポンスを中継
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No reader available')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          res.write(line + '\n')
        }
      }
      res.write('\n')
    }

    // 残りのバッファを処理
    if (buffer.trim()) {
      res.write(buffer + '\n\n')
    }

    res.write('data: [DONE]\n\n')
    res.end()

  } catch (error) {
    console.error('Streaming error:', error)
    res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`)
    res.end()
  }
}

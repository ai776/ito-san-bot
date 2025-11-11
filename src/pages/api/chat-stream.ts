import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, system_prompt } = req.body

  console.log('Streaming API - Received:', {
    message,
    conversation_id,
    has_system_prompt: !!system_prompt,
    hasApiKey: !!process.env.DIFY_API_KEY
  })

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const apiKey = process.env.DIFY_API_KEY
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

  if (!apiKey) {
    console.error('DIFY_API_KEY is not set')
    return res.status(500).json({ error: 'API configuration error' })
  }

  try {
    // SSE用のヘッダー設定
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx用のバッファリング無効化
    })

    // リクエストボディ作成
    const requestBody: any = {
      inputs: {},  // inputsは必須だが空でOK（Dify APIの仕様）
      query: message,
      response_mode: 'streaming', // ストリーミングモード
      user: 'default_user'
    }

    if (conversation_id && conversation_id !== 'null' && conversation_id !== '') {
      requestBody.conversation_id = conversation_id
    }

    console.log('Sending to Dify (Streaming):', {
      url: `${apiUrl}/chat-messages`,
      mode: 'streaming'
    })

    // Dify APIへのストリーミングリクエスト
    const response = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Dify API Error:', errorData)

      res.write(`data: ${JSON.stringify({
        event: 'error',
        message: errorData.message || 'API Error',
        code: response.status
      })}\n\n`)
      res.end()
      return
    }

    // ストリーミングレスポンスの処理
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    let buffer = ''
    let conversationIdSent = false

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log('Stream completed')
        res.write('data: [DONE]\n\n')
        res.end()
        break
      }

      // デコードしてバッファに追加
      buffer += decoder.decode(value, { stream: true })

      // 改行で分割して各行を処理
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最後の不完全な行をバッファに残す

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()

          if (data === '[DONE]') {
            continue
          }

          try {
            const parsed = JSON.parse(data)

            // クライアントに転送
            res.write(`data: ${JSON.stringify({
              event: parsed.event || 'message',
              answer: parsed.answer || '',
              conversation_id: parsed.conversation_id,
              message_id: parsed.message_id,
              created_at: parsed.created_at
            })}\n\n`)

            // conversation_idを初回のみ送信
            if (parsed.conversation_id && !conversationIdSent) {
              conversationIdSent = true
              console.log('Conversation ID:', parsed.conversation_id)
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, 'Raw:', data)
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Streaming Error:', error)

    // エラーイベントを送信
    res.write(`data: ${JSON.stringify({
      event: 'error',
      message: error.message || 'Streaming failed'
    })}\n\n`)
    res.end()
  }
}

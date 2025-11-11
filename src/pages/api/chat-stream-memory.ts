import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, user, system_prompt, files } = req.body

  console.log('Memory API - Received:', {
    message,
    conversation_id,
    user,  // ユーザーIDはメモリ機能の重要な要素
    has_system_prompt: !!system_prompt,
    hasApiKey: !!process.env.DIFY_API_KEY,
    files_count: files?.length || 0
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
      'X-Accel-Buffering': 'no',
    })

    // リクエストボディ作成（メモリ機能対応）
    // テストで確認した動作する形式を使用
    const requestBody: any = {
      inputs: {},  // inputsは必須だが空でOK
      query: message,
      response_mode: 'streaming',
      user: user || 'default_user'  // ユーザー識別子（メモリ機能で重要）
    }

    // conversation_idがある場合のみ追加（継続的な会話）
    if (conversation_id && conversation_id !== 'null' && conversation_id !== '') {
      requestBody.conversation_id = conversation_id
    }

    console.log('Sending to Dify (Memory Mode):', {
      url: `${apiUrl}/chat-messages`,
      mode: 'streaming',
      user: requestBody.user,
      has_conversation_id: !!requestBody.conversation_id
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
    let messageIdSent = false

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

            // メモリ機能に関連する重要な情報をログ
            if (parsed.conversation_id && !conversationIdSent) {
              console.log('Conversation ID (for memory):', parsed.conversation_id)
              conversationIdSent = true
            }

            if (parsed.message_id && !messageIdSent) {
              console.log('Message ID:', parsed.message_id)
              messageIdSent = true
            }

            // クライアントに転送
            res.write(`data: ${JSON.stringify({
              event: parsed.event || 'message',
              answer: parsed.answer || '',
              conversation_id: parsed.conversation_id,
              message_id: parsed.message_id,
              created_at: parsed.created_at,
              // メタデータ（メモリ機能関連）
              metadata: {
                user: user,
                memory_window: 10,  // Difyの設定値
                has_memory: true
              }
            })}\n\n`)
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

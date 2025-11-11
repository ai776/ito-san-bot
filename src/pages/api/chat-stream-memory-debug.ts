import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, user, system_prompt, files } = req.body

  // 詳細なデバッグログ
  const debugInfo = {
    timestamp: new Date().toISOString(),
    message,
    conversation_id,
    user,
    has_system_prompt: !!system_prompt,
    system_prompt_length: system_prompt?.length || 0,
    hasApiKey: !!process.env.DIFY_API_KEY,
    apiKeyPrefix: process.env.DIFY_API_KEY?.substring(0, 10) + '...',
    files_count: files?.length || 0
  }

  console.log('🔍 DEBUG - Memory API Request:', JSON.stringify(debugInfo, null, 2))

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const apiKey = process.env.DIFY_API_KEY
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

  if (!apiKey) {
    console.error('❌ DIFY_API_KEY is not set')
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
      user: user || `user_${Date.now()}`,  // ユーザー識別子（メモリ機能で重要）
    }

    // conversation_idがある場合のみ追加（継続的な会話）
    if (conversation_id && conversation_id !== 'null' && conversation_id !== '') {
      requestBody.conversation_id = conversation_id
    }

    // filesパラメータは不要（テストで確認済み）

    console.log('📤 Sending to Dify:', {
      url: `${apiUrl}/chat-messages`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody, null, 2)
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

    console.log('📥 Dify Response Status:', response.status)
    console.log('📥 Dify Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Dify API Error:', JSON.stringify(errorData, null, 2))

      res.write(`data: ${JSON.stringify({
        event: 'error',
        message: errorData.message || 'API Error',
        code: response.status,
        details: errorData
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
    let totalChars = 0

    console.log('🔄 Starting stream processing...')

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        console.log('✅ Stream completed. Total chars received:', totalChars)
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
            console.log('📍 Received [DONE] signal')
            continue
          }

          try {
            const parsed = JSON.parse(data)

            // デバッグ: 受信したデータの構造を確認
            if (!conversationIdSent && parsed.conversation_id) {
              console.log('💾 Conversation ID (for memory):', parsed.conversation_id)
              console.log('   This ID should be used for continuing the conversation')
              conversationIdSent = true
            }

            if (!messageIdSent && parsed.message_id) {
              console.log('📝 Message ID:', parsed.message_id)
              messageIdSent = true
            }

            if (parsed.answer) {
              totalChars += parsed.answer.length
              console.log(`📊 Chunk received: ${parsed.answer.length} chars (Total: ${totalChars})`)
            }

            // クライアントに転送
            res.write(`data: ${JSON.stringify({
              event: parsed.event || 'message',
              answer: parsed.answer || '',
              conversation_id: parsed.conversation_id,
              message_id: parsed.message_id,
              created_at: parsed.created_at,
              // デバッグ用のメタデータ
              metadata: {
                user: user,
                memory_window: 10,
                has_memory: true,
                debug: true
              }
            })}\n\n`)
          } catch (e) {
            console.error('❌ Failed to parse SSE data:', e, 'Raw:', data)
          }
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Streaming Error:', error)
    console.error('Stack trace:', error.stack)

    // エラーイベントを送信
    res.write(`data: ${JSON.stringify({
      event: 'error',
      message: error.message || 'Streaming failed',
      stack: error.stack
    })}\n\n`)
    res.end()
  }
}

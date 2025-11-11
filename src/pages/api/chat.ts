import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, system_prompt } = req.body

  // デバッグログ
  console.log('Received request:', {
    message,
    conversation_id,
    has_system_prompt: !!system_prompt,
    hasApiKey: !!process.env.DIFY_API_KEY,
    apiKeyLength: process.env.DIFY_API_KEY?.length
  })

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const apiKey = process.env.DIFY_API_KEY
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

  if (!apiKey) {
    console.error('DIFY_API_KEY is not set in environment variables')
    return res.status(500).json({ error: 'API configuration error' })
  }

  try {
    // リクエストボディを作成
    const inputs: Record<string, string> = {}

    if (typeof system_prompt === 'string' && system_prompt.trim() !== '') {
      inputs.system_prompt = system_prompt.trim()
    }

    const requestBody: any = {
      inputs,
      query: message,
      response_mode: 'blocking',
      user: 'default_user' // 固定のユーザー識別子
    }

    // conversation_idがある場合のみ追加
    if (conversation_id && conversation_id !== 'null' && conversation_id !== '') {
      requestBody.conversation_id = conversation_id
    }

    console.log('Sending to Dify API:', {
      url: `${apiUrl}/chat-messages`,
      body: requestBody
    })

    // Dify APIへのリクエスト
    const response = await axios.post(
      `${apiUrl}/chat-messages`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // レスポンスの形式を確認してデータを抽出
    console.log('Dify API Response:', {
      status: response.status,
      data: response.data
    })

    const answer = response.data.answer || response.data.message || 'すみません、応答を生成できませんでした。'
    const responseConversationId = response.data.conversation_id

    res.status(200).json({
      answer: answer,
      conversation_id: responseConversationId
    })
  } catch (error: any) {
    console.error('Dify API Error:', error.response?.data || error.message)

    // エラーメッセージをより詳細に
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'APIキーが無効です。環境変数を確認してください。' })
    }

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'APIエンドポイントが見つかりません。URLを確認してください。' })
    }

    res.status(500).json({
      error: 'チャットボットとの通信に失敗しました。',
      details: error.response?.data?.message || error.message
    })
  }
}

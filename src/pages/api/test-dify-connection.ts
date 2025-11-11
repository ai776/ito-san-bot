import type { NextApiRequest, NextApiResponse } from 'next'

// Dify API接続テスト用のエンドポイント
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiKey = process.env.DIFY_API_KEY
  const apiUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1'

  console.log('🔍 === Dify API接続テスト ===')
  console.log('API Key exists:', !!apiKey)
  console.log('API Key length:', apiKey?.length)
  console.log('API Key prefix:', apiKey?.substring(0, 8) + '...')
  console.log('API URL:', apiUrl)

  if (!apiKey) {
    return res.status(500).json({
      error: 'DIFY_API_KEY is not set',
      solution: 'Vercelの環境変数にDIFY_API_KEYを設定してください'
    })
  }

  // テスト1: 最小限のリクエスト
  const minimalRequest = {
    inputs: {},
    query: "こんにちは",
    response_mode: "blocking",
    user: "test_user"
  }

  console.log('📤 Test 1 - Minimal request:', JSON.stringify(minimalRequest, null, 2))

  try {
    const response1 = await fetch(`${apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalRequest)
    })

    const result1 = await response1.json()

    if (!response1.ok) {
      console.error('❌ Test 1 failed:', result1)

      // エラーの詳細を分析
      if (result1.message?.includes('validation')) {
        console.log('📝 Validation error details:', result1)

        // テスト2: filesを追加
        const withFilesRequest = {
          ...minimalRequest,
          files: []
        }

        console.log('📤 Test 2 - With files:', JSON.stringify(withFilesRequest, null, 2))

        const response2 = await fetch(`${apiUrl}/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(withFilesRequest)
        })

        const result2 = await response2.json()

        if (!response2.ok) {
          console.error('❌ Test 2 also failed:', result2)

          // テスト3: 別の形式を試す
          const alternativeRequest = {
            query: "こんにちは",
            user: "test_user",
            response_mode: "blocking",
            inputs: {}
          }

          console.log('📤 Test 3 - Alternative format:', JSON.stringify(alternativeRequest, null, 2))

          const response3 = await fetch(`${apiUrl}/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(alternativeRequest)
          })

          const result3 = await response3.json()

          return res.status(200).json({
            status: 'error',
            message: 'All tests failed',
            tests: {
              test1: { request: minimalRequest, response: result1, status: response1.status },
              test2: { request: withFilesRequest, response: result2, status: response2.status },
              test3: { request: alternativeRequest, response: result3, status: response3.status }
            },
            possibleIssues: [
              'APIキーが正しくない可能性',
              'Difyアプリの設定が不適切な可能性',
              'APIエンドポイントが間違っている可能性',
              'リクエスト形式がDifyのバージョンと合わない可能性'
            ]
          })
        } else {
          console.log('✅ Test 2 succeeded!')
          return res.status(200).json({
            status: 'success',
            message: 'Files parameter is required',
            workingFormat: withFilesRequest,
            response: result2
          })
        }
      }
    } else {
      console.log('✅ Test 1 succeeded!')
      return res.status(200).json({
        status: 'success',
        message: 'Minimal request works',
        workingFormat: minimalRequest,
        response: result1
      })
    }
  } catch (error: any) {
    console.error('❌ Connection error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Dify API',
      error: error.message,
      possibleIssues: [
        'ネットワークエラー',
        'APIエンドポイントが間違っている',
        'Difyサービスがダウンしている可能性'
      ]
    })
  }
}

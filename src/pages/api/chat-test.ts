import type { NextApiRequest, NextApiResponse } from 'next'

// テスト用のモックAPI（開発環境での動作確認用）
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, system_prompt } = req.body

  console.log('テストAPI - 受信:', {
    message,
    conversation_id,
    has_system_prompt: !!system_prompt
  })

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // モックレスポンスの生成
  const mockResponses: { [key: string]: string } = {
    'こんにちは': 'こんにちは、伊藤です。\n\n今日はどんなテーマで話しましょうか？ビジネスの仕組み化、外注の使い方、マーケティング、どんなことでも、僕が現場で培ったリアルなノウハウでお答えします。',
    '外注': '外注を活用することは、ビジネスをスケールさせる上で重要なポイントです。\n\n1. **作業の棚卸し**\n   まず自分がやっている作業を全て書き出して、どれが外注できるか判断します。\n\n2. **マニュアル化**\n   外注する作業は必ずマニュアル化します。動画や画像を使って誰でも理解できるようにすることが大切です。\n\n3. **採用と教育**\n   最初は時間がかかりますが、しっかり教育することで長期的に大きなリターンが得られます。',
    '副業': '副業を始めたいという方は多いですね。\n\n重要なのは「理屈より実践」です。まず小さく始めて、実際にやってみることが大切です。\n\n例えば、外注で優秀な人材をどうやって見つけるのか？実際に利益が出る仕組みをどう作るのか？など、リアルな話が得意ですよ。',
    default: `なるほど、「${message}」についてですね。\n\n僕の経験から言えることは、ビジネスで成功するには「実践」と「仕組み化」が重要だということです。\n\n具体的にどんなことでお困りですか？もっと詳しく教えていただければ、より具体的なアドバイスができます。`
  }

  // メッセージに応じたレスポンスを選択
  let answer = mockResponses.default
  for (const key in mockResponses) {
    if (message.includes(key)) {
      answer = mockResponses[key]
      break
    }
  }

  // 会話IDの生成または継続
  const responseConversationId = conversation_id || `conv_${Date.now()}`

  // 1秒の遅延をシミュレート
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log('テストAPI - 応答:', {
    answer: answer.substring(0, 50) + '...',
    conversation_id: responseConversationId
  })

  res.status(200).json({
    answer: answer,
    conversation_id: responseConversationId
  })
}

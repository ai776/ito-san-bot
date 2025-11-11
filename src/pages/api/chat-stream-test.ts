import type { NextApiRequest, NextApiResponse } from 'next'

// テスト用のストリーミングモックAPI
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, conversation_id, system_prompt } = req.body

  console.log('Test Streaming API - 受信:', {
    message,
    conversation_id,
    has_system_prompt: !!system_prompt
  })

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  // SSE用のヘッダー設定
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // モックレスポンスの生成
  const mockResponses: { [key: string]: string } = {
    'こんにちは': 'こんにちは、伊藤です。\n\n今日はどんなテーマで話しましょうか？ビジネスの仕組み化、外注の使い方、マーケティング、どんなことでも、僕が現場で培ったリアルなノウハウでお答えします。\n\n特に最近は、AIツールを活用した業務効率化や、少人数でも大きな成果を出すための組織作りについてよく相談を受けます。\n\nあなたが今、一番困っていることは何ですか？',
    '外注': '外注を活用することは、ビジネスをスケールさせる上で最重要ポイントの一つです。\n\n僕自身、200以上の事業を同時に回せているのは、外注パートナーの力があってこそです。\n\n## 外注活用の3ステップ\n\n### 1. 作業の棚卸しと切り分け\nまず自分がやっている作業を全て書き出します。そして以下の基準で分類：\n- **自分でやるべき作業**：戦略立案、重要な意思決定\n- **外注できる作業**：データ入力、記事作成、画像編集など\n\n### 2. マニュアル化の徹底\n外注する作業は必ずマニュアル化します。\n- **動画マニュアル**：Loomなどで実際の作業を録画\n- **チェックリスト**：作業手順を箇条書きに\n- **FAQ**：よくある質問と回答をまとめる\n\n### 3. 採用と教育のサイクル\n- **最初は少人数から**：いきなり大人数は管理が大変\n- **フィードバックを密に**：最初の1週間は毎日チェック\n- **できる人を見極める**：3ヶ月で戦力化できない人は交代\n\n実際、僕の会社では外注パートナーが300名以上いますが、全員がこのプロセスを経て育っています。',
    '副業': '副業から始めて、最終的に独立・法人化を目指す。\n\nこれは僕が最も推奨するルートです。\n\n## なぜ副業から始めるべきか\n\n### リスクを最小化できる\n本業の収入があるうちに、ビジネスモデルを検証できます。僕も最初は会社員をしながら副業で月100万円を達成してから独立しました。\n\n### 副業で月100万円を目指すステップ\n\n1. **スキルの棚卸し**\n   - 本業で培ったスキルは何か？\n   - そのスキルを欲しがる人は誰か？\n\n2. **小さくテスト販売**\n   - ココナラやランサーズで3件受注してみる\n   - 価格は相場の7割からスタート\n\n3. **仕組み化と外注化**\n   - 月30万円を超えたら外注を検討\n   - 自分は営業と品質管理に専念\n\n4. **法人化のタイミング**\n   - 月収100万円を3ヶ月継続\n   - 年商1,200万円が見込める\n   - 節税メリットが出てくる\n\n実際、僕のコンサル生の8割はこのルートで独立しています。',
    default: `なるほど、「${message}」についてですね。\n\n僕の経験から言えることは、ビジネスで成功するには「実践」と「仕組み化」、そして「外注化」が重要だということです。\n\n## 具体的なアドバイス\n\nまず、あなたの現在の状況を教えてください：\n- 今のビジネスの規模は？\n- 何人で運営していますか？\n- 一番の課題は何ですか？\n\nこれらが分かれば、もっと具体的で実践的なアドバイスができます。\n\n僕は年商40億まで事業を成長させてきましたが、最初は一人で始めました。その経験から、どんな段階の経営者にも役立つアドバイスができると思います。`
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

  // ストリーミングシミュレーション
  const words = answer.split('')
  const chunkSize = 5 // 5文字ずつ送信（より自然な速度）
  let currentIndex = 0
  let isCompleted = false

  // 初回のconversation_id送信
  res.write(`data: ${JSON.stringify({
    event: 'message_start',
    conversation_id: responseConversationId,
    message_id: `msg_${Date.now()}`,
    created_at: new Date().toISOString()
  })}\n\n`)

  // テキストをチャンクごとに送信
  const streamInterval = setInterval(() => {
    if (isCompleted) {
      return
    }

    if (currentIndex >= words.length) {
      // 完了通知
      res.write(`data: ${JSON.stringify({
        event: 'message_end',
        conversation_id: responseConversationId,
        answer: '',
        message_id: `msg_${Date.now()}`,
        created_at: new Date().toISOString()
      })}\n\n`)

      res.write('data: [DONE]\n\n')
      res.end()
      clearInterval(streamInterval)
      isCompleted = true
      return
    }

    const chunk = words.slice(currentIndex, currentIndex + chunkSize).join('')
    currentIndex += chunkSize

    try {
      res.write(`data: ${JSON.stringify({
        event: 'message',
        answer: chunk,
        conversation_id: responseConversationId,
        message_id: `msg_${Date.now()}`,
        created_at: new Date().toISOString()
      })}\n\n`)
    } catch (error) {
      console.error('Error writing to stream:', error)
      clearInterval(streamInterval)
      isCompleted = true
    }
  }, 40) // 40msごとに送信（安定性向上）

  // タイムアウト設定（60秒で強制終了）
  setTimeout(() => {
    if (!isCompleted) {
      clearInterval(streamInterval)
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n')
        res.end()
      }
      isCompleted = true
    }
  }, 60000)

  // クライアント切断時の処理
  req.on('close', () => {
    if (!isCompleted) {
      clearInterval(streamInterval)
      isCompleted = true
      console.log('Client disconnected')
    }
  })
}

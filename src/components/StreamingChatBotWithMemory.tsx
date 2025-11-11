import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isStreaming?: boolean
}

const DEFAULT_SYSTEM_PROMPT = `# 🧭 カスタムプロンプト設定：「代理店戦略の専門家」伊藤

## ■ キャラクター設定：

- **伊藤**は、SaaS／DX／サブスクリプション領域に特化した「代理店戦略の専門家」。

- 元・大手ITベンダーのパートナー営業本部長。20年以上にわたり**直販→代理店→OEM→JV**と、あらゆる販路戦略を設計・運用してきた実務派。

- 現在は、SaaS企業やスタートアップ向けに**「0→1のパートナービジネス立ち上げ」**と**「1→10のスケール設計」**を支援。

- 現場での泥臭い営業経験と、体系的な戦略設計を両立。会話では理論と実務の両輪で導く。

- 口調は**冷静・論理的だが親身**。失敗談も交えながら現場に即したアドバイスをする。

---

## ■ 出力の文字数：

- **基本は1,000〜1,500文字程度（約1〜2分で読める）**

- それ以上になる場合は**マークダウン表・箇条書き**で整理。

- 深掘り依頼があった場合のみ**最大3,000文字**まで拡張。

---

## ■ 出力ルール：

- **マークダウン形式**で構成（見出し・箇条書き・表を活用）

- **具体的・事例ベース**で説明

- フレームワーク（PEST/3C/STP/KPIマップ/THE MODELなど）は、**実務的な使い方**を交えて提示

- 最後に「30日以内の具体アクション」も提案する

---

## ■ ユーザーが知りたい内容（想定）：

- SaaS企業や代理店事業の**立ち上げ・拡大の戦略設計**

- **代理店の育成・評価・支援スキーム**の作り方

- **KPI／パートナープログラム／オンボーディング**の体系設計

- **直販との棲み分け／アライアンス構築／OEM／共同マーケ**などの実務事例

- 3ヶ月で「一人目の成功者」を生み出すための最短ルート

---

## ■ 想定されるユーザー：

- 自社プロダクトを代理店経由で拡販したい**SaaS／DX企業の経営者・事業責任者**

- パートナービジネスを立ち上げたい**スタートアップ創業者**

- 既存代理店の**稼働率・LTVを高めたいマネージャー**

- 「契約したのに売れない」構造を変えたい営業企画担当者

---

## ■ ゴール：

ユーザーが**「再現性のある代理店スキーム」を設計・運用できる状態**になること。

伊藤は単なる解説者ではなく、**「現場で伴走する先輩コンサル」**として導く。

---

## ■ 構成テンプレート（出力例）：

### 【タイトル】

例：SaaS企業が3ヶ月で成果を出す代理店立ち上げ戦略

---

### 【1. 背景と課題】

現状の市場環境、SaaSモデル特有の課題（LTV、チャーン、リーチ拡大など）を整理。

### 【2. 伊藤の見立て】

PEST/3C/STPなどの観点から要因を分析し、どのフェーズでボトルネックが生じているかを明示。

### 【3. 戦略の柱】

戦略を3〜5軸で定義（例：「THE MODEL連動型代理店運用」「CS主導のチャネル拡張」など）。

### 【4. 実務施策（チェックリスト形式）】

- 募集LPと提案資料v1を整備

- KPIマップ（開拓→活動→案件→KGI）を運用

- 一人目の成功者を生むための「90日プラン」設計

- 研修動画／FAQ／提案書テンプレを共通化

### 【5. 成功KPI】

| フェーズ | KPI例 | 指標 |
|-----------|--------|------|
| 開拓 | 契約社数・注力度 | 月3社 |
| 育成 | 研修完了率・案件創出 | 70%以上 |
| 営業支援 | トスアップ数・商談CVR | 20%以上 |
| KGI | 受注・ARR貢献 | 3ヶ月で1件 |

### 【6. 30日アクション】

- 直販/代理店別のファネル基準値を定義

- 注力5社を選定し、初回研修＋勉強会を開催

- SLA・責任分界・報酬条件を合意

- パートナーサクセス担当を任命し、KPIダッシュボードを稼働

---

## ■ 伊藤の語り口（トーン例）：

> 「契約数を増やす前に、"一人目の成功者"を出すこと。これがパートナービジネス立ち上げの鉄則だ。

>  3ヶ月で1件受注という小さな成功を、どうやって再現性のある型に落とすか。

>  その設計図が"代理店戦略"なんだ。」`

export default function StreamingChatBotWithMemory() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [userId, setUserId] = useState('')
  const [useTestApi, setUseTestApi] = useState(false) // デフォルトで本番APIを使用
  const [showSettings, setShowSettings] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tempSystemPrompt, setTempSystemPrompt] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentMessageRef = useRef<string>('')
  const animationFrameRef = useRef<number | null>(null)

  // 初期化時にユーザーIDとプロンプトを設定
  useEffect(() => {
    // ユーザーIDを生成または取得（ローカルストレージに保存）
    let storedUserId = localStorage.getItem('dify_user_id')
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('dify_user_id', storedUserId)
    }
    setUserId(storedUserId)

    // 会話IDを取得（セッション単位で管理）
    const storedConversationId = sessionStorage.getItem('dify_conversation_id')
    if (storedConversationId) {
      setConversationId(storedConversationId)
    }

    // システムプロンプトを読み込む
    const savedPrompt = localStorage.getItem('systemPrompt')
    const prompt = savedPrompt || DEFAULT_SYSTEM_PROMPT
    setSystemPrompt(prompt)
    setTempSystemPrompt(prompt)
  }, [])

  // 会話IDが更新されたらセッションストレージに保存
  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem('dify_conversation_id', conversationId)
    }
  }, [conversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // ボットメッセージの初期化
    const botMessageId = (Date.now() + 1).toString()
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isStreaming: true
    }
    setMessages(prev => [...prev, botMessage])
    currentMessageRef.current = ''

    try {
      abortControllerRef.current = new AbortController()

      // デバッグモードを使用
      const apiEndpoint = useTestApi ? '/api/chat-stream-test' : '/api/chat-stream-memory-debug'
      console.log('🔍 === デバッグ情報 ===')
      console.log('📍 使用API:', apiEndpoint)
      console.log('👤 User ID:', userId)
      console.log('💬 Conversation ID:', conversationId || '新規会話')
      console.log('🧠 メモリ機能:', useTestApi ? '無効（テストモード）' : '有効（本番モード）')
      console.log('====================')

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          conversation_id: conversationId,
          user: userId,  // ユーザーIDを送信（メモリ機能で重要）
          system_prompt: systemPrompt,
          files: []  // ファイルアップロード対応（将来の拡張用）
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let buffer = ''
      let targetText = ''
      let currentIndex = 0

      // アニメーション関数
      const animateText = () => {
        if (currentIndex < targetText.length) {
          const speed = Math.min(3, Math.ceil((targetText.length - currentIndex) / 10))
          const nextChunk = targetText.slice(currentIndex, currentIndex + speed)
          currentIndex += speed
          currentMessageRef.current += nextChunk

          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, text: currentMessageRef.current }
              : msg
          ))

          animationFrameRef.current = requestAnimationFrame(animateText)
        } else {
          animationFrameRef.current = null
        }
      }

      // ストリーミング読み取り
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('Stream completed')
          // 残りのテキストを全て表示
          if (currentIndex < targetText.length) {
            currentMessageRef.current = targetText
            setMessages(prev => prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, text: targetText, isStreaming: false }
                : msg
            ))
          } else {
            setMessages(prev => prev.map(msg =>
              msg.id === botMessageId
                ? { ...msg, isStreaming: false }
                : msg
            ))
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (data === '[DONE]') {
              console.log('Received [DONE] signal')
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.event === 'error') {
                console.error('Stream error:', parsed)
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: 'エラーが発生しました: ' + parsed.message, isStreaming: false }
                    : msg
                ))
                if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current)
                  animationFrameRef.current = null
                }
                return
              }

              // テキストを追加
              if (parsed.answer) {
                targetText += parsed.answer
                console.log('Received chunk:', parsed.answer.length, 'chars, total:', targetText.length)

                // アニメーションが動いていない場合は開始
                if (!animationFrameRef.current) {
                  animationFrameRef.current = requestAnimationFrame(animateText)
                }
              }

              // conversation_idを更新（重要：メモリ機能の継続性）
              if (parsed.conversation_id) {
                if (!conversationId || conversationId !== parsed.conversation_id) {
                  setConversationId(parsed.conversation_id)
                  console.log('💾 Conversation ID updated:', parsed.conversation_id)
                  console.log('   メモリ機能が有効になりました。過去の会話を記憶します。')
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Raw data:', data)
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)

      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: 'エラーが発生しました。もう一度お試しください。', isStreaming: false }
            : msg
        ))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing) {
        return
      }
      if (!e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }
  }

  const resetConversation = () => {
    setMessages([])
    setConversationId('')
    sessionStorage.removeItem('dify_conversation_id')
    currentMessageRef.current = ''
    console.log('会話をリセットしました（メモリはユーザーIDに紐付いて保持）')
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
    if (!showSettings) {
      setTempSystemPrompt(systemPrompt)
    }
  }

  const saveSettings = () => {
    setSystemPrompt(tempSystemPrompt)
    localStorage.setItem('systemPrompt', tempSystemPrompt)
    setShowSettings(false)
    // 会話をリセット（新しいプロンプトで開始）
    resetConversation()
  }

  const resetToDefault = () => {
    setTempSystemPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  const cancelSettings = () => {
    setTempSystemPrompt(systemPrompt)
    setShowSettings(false)
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100 relative">
      {/* ヘッダー */}
      <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md z-20 relative">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">伊藤</h1>
          <span className="ml-2 text-xs bg-purple-500 px-2 py-1 rounded">メモリ機能付き</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleSettings} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="absolute inset-0 z-30 bg-white flex flex-col">
          <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md">
            <h2 className="text-lg font-semibold">設定</h2>
            <button onClick={cancelSettings} className="p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">メモリ機能情報</h3>
              <div className="bg-gray-100 p-3 rounded-lg text-xs">
                <div className="mb-1">👤 ユーザーID: {userId}</div>
                <div className="mb-1">💬 会話ID: {conversationId || '新規'}</div>
                <div className="mb-1">🧠 メモリ: 最大10メッセージ保持</div>
                <div>📌 会話履歴はユーザーIDに紐付いて保存されます</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                システムプロンプト
              </label>
              <textarea
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-line-blue"
                placeholder="AIの振る舞いを定義..."
              />
            </div>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={saveSettings}
                className="flex-1 bg-line-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                保存して適用
              </button>
              <button
                onClick={resetToDefault}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                デフォルトに戻す
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setUseTestApi(!useTestApi)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                API: {useTestApi ? 'テストモード' : '本番モード'}
              </button>
              <button
                onClick={resetConversation}
                className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
              >
                会話リセット
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>メモリ機能について：</strong><br />
                • 過去10件の会話を記憶します<br />
                • ユーザーIDごとに会話履歴が保存されます<br />
                • 会話リセットで新しい会話を開始できます<br />
                • ブラウザを閉じても会話履歴は保持されます
              </p>
            </div>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="flex items-end mr-2">
                <div className="w-10 h-10 bg-line-blue rounded-full flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            <div
              className={`max-w-xs px-4 py-3 rounded-2xl ${message.sender === 'user'
                ? 'bg-message-yellow text-gray-800'
                : 'bg-white text-gray-800 border border-gray-200'
                }`}
              style={{
                borderRadius: message.sender === 'user'
                  ? '18px 18px 4px 18px'
                  : '4px 18px 18px 18px'
              }}
            >
              <p className="text-sm whitespace-pre-wrap">
                {message.text}
                {message.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse" />}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center space-x-2">
          <textarea
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-line-blue resize-none"
            disabled={isLoading}
            style={{ position: 'relative', zIndex: 10, minHeight: '44px' }}
          />
          {isLoading ? (
            <button
              onClick={cancelStreaming}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="ストリーミングを停止"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="p-2 bg-line-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

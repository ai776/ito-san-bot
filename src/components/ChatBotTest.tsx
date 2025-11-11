import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const DEFAULT_SYSTEM_PROMPT = `あなたは「ビジネスサイボーグ」伊藤としてふるまってください。

■キャラクター設定：
・年商40億の実業家
・200以上の事業を同時展開中
・外注や業務委託を駆使したクラウドDX経営の専門家
・出版マーケティング、SNS運用、営業代行、外注組織化が得意
・実績と現場感のあるアドバイスを重視

■出力の文字数：
・**基本は1,000〜1,500文字程度**でまとめる（約1〜2分で読めるボリューム）
・それ以上になる場合は**マークダウンの表・箇条書き**を使って視認性を高める
・ユーザーが深堀りを求めた場合のみ、長文（最大3,000文字）で展開してよい

■出力ルール：
・基本はマークダウン形式（表や箇条書きも可）
・情報はできるだけ具体的に、かつ事例ベースで伝える

■ユーザーが知りたい内容（想定）：
・出版マーケティングの手順や仕組み
・外注組織の作り方・育成方法
・低リスクで始める新規事業アイデア
・クラウドディレクターの採用・教育方法
・外注で利益を残す価格設計
・SNS運用や広告運用の代行体制の作り方

■想定されるユーザー：
・これから起業したい個人
・社員数1〜3名の小規模経営者
・3名以上の従業員を持つ経営者
・副業から脱却し法人化を目指す人

■ゴール：
ユーザーが「すぐに行動できるような現場レベルのアドバイス」を届けること。チャットボットではなく"伊藤という実在のビジネスの先輩"として導いてください。`

export default function ChatBotTest() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [useTestApi, setUseTestApi] = useState(true) // テストモード切り替え
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    try {
      console.log('送信中 - conversation_id:', conversationId)
      console.log('使用API:', useTestApi ? '/api/chat-test' : '/api/chat')

      const response = await axios.post(useTestApi ? '/api/chat-test' : '/api/chat', {
        message: inputText,
        conversation_id: conversationId,
        system_prompt: systemPrompt
      })

      console.log('APIレスポンス:', response.data)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.answer,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])

      if (response.data.conversation_id) {
        console.log('conversation_id更新:', response.data.conversation_id)
        setConversationId(response.data.conversation_id)
      }
    } catch (error: any) {
      console.error('エラー:', error)
      console.error('エラー詳細:', error.response?.data)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'エラーが発生しました。もう一度お試しください。',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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
    console.log('会話をリセットしました')
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-line-blue text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">伊藤</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUseTestApi(!useTestApi)}
            className="px-3 py-1 bg-white/20 rounded text-xs"
          >
            {useTestApi ? 'テストAPI' : '本番API'}
          </button>
          <button
            onClick={resetConversation}
            className="px-3 py-1 bg-white/20 rounded text-xs"
          >
            リセット
          </button>
          <button>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* デバッグ情報 */}
      <div className="bg-yellow-100 p-2 text-xs">
        <div>会話ID: {conversationId || '(新規)'}</div>
        <div>メッセージ数: {messages.length}</div>
        <div>API: {useTestApi ? 'テストモード' : '本番モード'}</div>
      </div>

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
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end mr-2">
              <div className="w-10 h-10 bg-line-blue rounded-full flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl border border-gray-200" style={{ borderRadius: '4px 18px 18px 18px' }}>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
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
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputText.trim()}
            className="p-2 bg-line-blue text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Twitter, Facebook, User, Settings, Send, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import SettingsModal from './SettingsModal'

// ボットタイプの定義
export type BotType = 'yamamoto' | 'x' | 'facebook' | 'profile'

interface Bot {
  id: BotType
  name: string
  icon: React.ReactNode
  description: string
  placeholder: string
  apiEndpoint: string
}

// 利用可能なボット一覧
const AVAILABLE_BOTS: Bot[] = [
  {
    id: 'yamamoto',
    name: '伊藤さんボット',
    icon: <MessageCircle className="w-6 h-6" />,
    description: 'AIチャットボット',
    placeholder: 'メッセージを入力してください...',
    apiEndpoint: '/api/multi-bot/yamamoto'
  },
  {
    id: 'x',
    name: 'X投稿',
    icon: <Twitter className="w-6 h-6" />,
    description: 'X（旧Twitter）投稿文作成',
    placeholder: '投稿したい内容を入力してください...',
    apiEndpoint: '/api/multi-bot/x'
  },
  {
    id: 'facebook',
    name: 'Facebook投稿',
    icon: <Facebook className="w-6 h-6" />,
    description: 'Facebook投稿文作成',
    placeholder: '投稿したい内容を入力してください...',
    apiEndpoint: '/api/multi-bot/facebook'
  },
  {
    id: 'profile',
    name: '自己プロフィール',
    icon: <User className="w-6 h-6" />,
    description: '自己紹介文作成',
    placeholder: 'プロフィールに含めたい要素を入力してください...',
    apiEndpoint: '/api/multi-bot/profile'
  }
]

const BASE_SYSTEM_PROMPTS: Record<BotType, string> = {
  yamamoto: `あなたは「ビジネスサイボーグ」伊藤として振る舞ってください。
提供されているナレッジベースおよび過去の会話内容を最優先で参照し、事実に基づいたアドバイスを提示してください。
回答は実践的で、必要に応じてステップ・チェックリスト・テンプレート例を添えてください。`,
  x: `あなたはX（旧Twitter）の投稿を作成する専門ライターです。
ナレッジベースに登録された情報やトピックを踏まえ、140文字前後で高いエンゲージメントを狙える投稿案を提示してください。
必要に応じて適切なハッシュタグ案も含めてください。`,
  facebook: `あなたはFacebook投稿の編集者です。
ユーザーが伝えたいポイントとナレッジベースの内容を整理し、読者の共感と行動を促す構成で投稿文を作成してください。
CTAや質問文があれば明確に提案してください。`,
  profile: `あなたは自己紹介文の作成を支援するストーリーテラーです。
提供されたナレッジベースや入力情報から強み・実績・人となりを抽出し、信頼感と親近感が伝わるプロフィール文を作成してください。
読みやすい段落構成と具体的な成果の言及を心掛けてください。`
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  botType: BotType
}

export default function MultiBotSelector() {
  const [selectedBot, setSelectedBot] = useState<BotType>('yamamoto')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isBotSelectorOpen, setIsBotSelectorOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const baseHeight = 44
    const viewportCap = typeof window !== 'undefined' ? window.innerHeight * 0.45 : 0
    const maxHeight = Math.max(baseHeight, Math.min(420, viewportCap || 420))

    textarea.style.height = 'auto'
    const measuredHeight = Math.max(textarea.scrollHeight, baseHeight)
    const clampedHeight = Math.min(measuredHeight, maxHeight)

    textarea.style.height = `${clampedHeight}px`
    textarea.style.overflowY = measuredHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  // ユーザーIDの初期化（メモリ機能用）
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (!storedUserId) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', newUserId)
      setUserId(newUserId)
    } else {
      setUserId(storedUserId)
    }
  }, [])

  // ボット切り替え時の処理
  useEffect(() => {
    // ボットごとに異なるconversation_idを管理
    const botConversationKey = `conversationId_${selectedBot}`
    const storedConversationId = sessionStorage.getItem(botConversationKey)
    setConversationId(storedConversationId)

    // カスタムプロンプトを読み込み
    const savedPrompt = localStorage.getItem(`customPrompt_${selectedBot}`)
    if (savedPrompt) {
      setCustomPrompt(savedPrompt)
    } else {
      setCustomPrompt('')
    }
  }, [selectedBot])

  // 現在選択されているボットの情報を取得
  const currentBot = AVAILABLE_BOTS.find(bot => bot.id === selectedBot)!

  // スクロール制御
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, selectedBot, adjustTextareaHeight])

  // メッセージ送信処理
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      botType: selectedBot
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 新しいAbortControllerを作成
    abortControllerRef.current = new AbortController()

    // ストリーミング中のメッセージを追加（空の状態で）
    const streamingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      botType: selectedBot
    }
    setMessages(prev => [...prev, streamingMessage])
    const streamingMessageIndex = messages.length + 1 // userMessage追加後のインデックス

    try {
      const trimmedCustomPrompt = customPrompt.trim()
      const systemPromptPayload = [
        BASE_SYSTEM_PROMPTS[selectedBot],
        trimmedCustomPrompt
      ]
        .filter(Boolean)
        .join('\n\n')

      const response = await fetch(currentBot.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
          user: userId,
          botType: selectedBot,
          systemPrompt: systemPromptPayload
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let buffer = ''
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              continue
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.event === 'message') {
                accumulatedText += parsed.answer || ''

                // ストリーミング中のメッセージを更新
                setMessages(prev => {
                  const newMessages = [...prev]
                  if (newMessages[streamingMessageIndex]) {
                    newMessages[streamingMessageIndex] = {
                      ...newMessages[streamingMessageIndex],
                      content: accumulatedText
                    }
                  }
                  return newMessages
                })
              } else if (parsed.event === 'message_end') {
                // conversation_idを保存（ボットごとに）
                if (parsed.conversation_id) {
                  const botConversationKey = `conversationId_${selectedBot}`
                  sessionStorage.setItem(botConversationKey, parsed.conversation_id)
                  setConversationId(parsed.conversation_id)
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }

      // 最終的なメッセージを確定
      if (accumulatedText) {
        setMessages(prev => {
          const newMessages = [...prev]
          if (newMessages[streamingMessageIndex]) {
            newMessages[streamingMessageIndex] = {
              ...newMessages[streamingMessageIndex],
              content: accumulatedText
            }
          }
          return newMessages
        })
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
        // キャンセル時は空のメッセージを削除
        setMessages(prev => prev.filter((_, index) => index !== streamingMessageIndex))
      } else {
        console.error('Error:', error)
        // エラー時はメッセージを更新
        setMessages(prev => {
          const newMessages = [...prev]
          if (newMessages[streamingMessageIndex]) {
            newMessages[streamingMessageIndex] = {
              ...newMessages[streamingMessageIndex],
              content: 'エラーが発生しました。もう一度お試しください。'
            }
          }
          return newMessages
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 会話リセット
  const resetConversation = () => {
    const botConversationKey = `conversationId_${selectedBot}`
    sessionStorage.removeItem(botConversationKey)
    setConversationId(null)
    setMessages([])
  }

  // 現在のボットのメッセージのみをフィルタリング
  const filteredMessages = messages.filter(msg => msg.botType === selectedBot)

  // カスタムプロンプトの保存処理
  const handleSaveCustomPrompt = (prompt: string) => {
    setCustomPrompt(prompt)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー：ボット選択 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsBotSelectorOpen(!isBotSelectorOpen)}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
            >
              <h1 className="text-lg md:text-2xl font-bold">
                {currentBot.name}
              </h1>
              {isBotSelectorOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="カスタムプロンプト設定"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </button>
          </div>

          {/* 開閉可能なボット選択エリア */}
          {isBotSelectorOpen && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-slide-in-from-top">
              {AVAILABLE_BOTS.map((bot) => (
                <button
                  key={bot.id}
                  onClick={() => {
                    setSelectedBot(bot.id)
                    setIsBotSelectorOpen(false) // 選択後は自動で閉じる
                  }}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all ${selectedBot === bot.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <div className={`${selectedBot === bot.id ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {bot.icon}
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-900">
                      {bot.name}
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {bot.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* チャットエリア */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* メッセージ表示エリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <div className="mb-4">{currentBot.icon}</div>
                <p className="text-lg font-medium">{currentBot.name}へようこそ</p>
                <p className="text-sm mt-2">{currentBot.description}</p>
              </div>
            )}

            {filteredMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`max-w-2xl px-4 py-2 rounded-lg ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}


            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="border-t bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentBot.placeholder}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  title="送信"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden md:inline">{isLoading ? '送信中...' : '送信'}</span>
                </button>
                <button
                  onClick={resetConversation}
                  className="p-2 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  title="会話をリセット"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="hidden md:inline">リセット</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        botType={selectedBot}
        onSave={handleSaveCustomPrompt}
      />
    </div>
  )
}

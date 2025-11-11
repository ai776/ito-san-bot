import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Save, RotateCcw, Sparkles, Pencil, Undo2 } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  botType: string
  onSave: (prompt: string) => void
}

interface Preset {
  name: string
  prompt: string
}

type PresetMap = Record<string, Preset>

interface StoredSettings {
  presetKey?: string | null
  personality?: string
  customInstructions?: string
  nickname?: string
  occupation?: string
  about?: string
}

const DEFAULT_PRESETS: Record<string, PresetMap> = {
  yamamoto: {
    default: {
      name: 'デフォルト',
      prompt:
        'あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問に対して、正確で役立つ情報を提供してください。'
    },
    professional: {
      name: 'プロフェッショナル',
      prompt:
        'あなたはビジネスの専門家です。フォーマルで専門的な口調で、ビジネスに関する質問に答えてください。敬語を使い、具体的なアドバイスを提供してください。'
    },
    friendly: {
      name: 'フレンドリー',
      prompt:
        'あなたは親しみやすい友人のようなアシスタントです。カジュアルな口調で、絵文字も使いながら楽しく会話してください。😊'
    },
    teacher: {
      name: '先生モード',
      prompt:
        'あなたは優秀な教師です。物事をわかりやすく説明し、例を使って理解を助けてください。生徒の学習を促進するような質問も投げかけてください。'
    },
    creative: {
      name: 'クリエイティブ',
      prompt:
        'あなたは創造的なアイデアを生み出すアシスタントです。独創的で革新的な提案をし、既成概念にとらわれない発想で回答してください。'
    },
    technical: {
      name: 'テクニカル',
      prompt:
        'あなたは技術の専門家です。プログラミング、IT、エンジニアリングに関する質問に、技術的な詳細を含めて正確に回答してください。コード例も提供してください。'
    }
  },
  x: {
    viral: {
      name: 'バズ狙い',
      prompt:
        'バズりやすいX（Twitter）の投稿を作成してください。トレンドを意識し、共感を呼ぶ内容で、リツイートされやすい文章を心がけてください。適切なハッシュタグも提案してください。'
    },
    business: {
      name: 'ビジネス告知',
      prompt:
        'ビジネス向けのプロフェッショナルなX投稿を作成してください。情報を簡潔にまとめ、CTAを含め、フォロワーのエンゲージメントを促進する内容にしてください。'
    },
    casual: {
      name: 'カジュアル',
      prompt:
        'カジュアルで親しみやすいX投稿を作成してください。日常的な話題で、フォロワーとの距離を縮めるような内容にしてください。'
    }
  },
  facebook: {
    engagement: {
      name: 'エンゲージメント重視',
      prompt:
        'Facebookでエンゲージメントを高める投稿を作成してください。質問を投げかけ、コメントを促し、「いいね」やシェアをしてもらいやすい内容にしてください。'
    },
    storytelling: {
      name: 'ストーリーテリング',
      prompt:
        'ストーリー性のあるFacebook投稿を作成してください。読者の感情に訴えかけ、共感を呼ぶような物語形式で書いてください。'
    },
    informative: {
      name: '情報提供',
      prompt:
        '有益な情報を提供するFacebook投稿を作成してください。読者にとって価値のある知識やTipsを、わかりやすく整理して伝えてください。'
    }
  },
  profile: {
    professional: {
      name: 'プロフェッショナル',
      prompt:
        'LinkedInやビジネス向けのプロフェッショナルな自己紹介文を作成してください。実績、スキル、経験を強調し、信頼性を高める内容にしてください。'
    },
    creative: {
      name: 'クリエイティブ',
      prompt:
        '創造的で個性的な自己紹介文を作成してください。独自性を前面に出し、記憶に残るプロフィールにしてください。'
    },
    concise: {
      name: '簡潔',
      prompt:
        '簡潔で要点をまとめた自己紹介文を作成してください。最も重要な情報だけを含め、読みやすい形式にしてください。'
    }
  }
}

const PERSONALITY_OPTIONS = [
  {
    value: 'default',
    label: 'デフォルト',
    description: '状況に合わせてバランスよく対応する標準的なトーンです。'
  },
  {
    value: 'professional',
    label: 'プロフェッショナル',
    description: '論理的かつフォーマルに、ビジネス向けの表現で回答します。'
  },
  {
    value: 'friendly',
    label: 'フレンドリー',
    description: '親しみやすく柔らかな言い回しで、会話するように回答します。'
  },
  {
    value: 'direct',
    label: '率直',
    description: '遠回しな表現を避け、端的でストレートな意見を伝えます。'
  },
  {
    value: 'creative',
    label: 'クリエイティブ',
    description: '発想を広げる提案やアイデアを積極的に提示します。'
  },
  {
    value: 'motivator',
    label: '励まし',
    description: '前向きになれる言葉を添えて、行動を後押しします。'
  }
]

const INSTRUCTION_TEMPLATES = [
  { label: 'おしゃべり', text: 'カジュアルに雑談を交えながら回答してください。' },
  { label: '機知に富む', text: 'ウィットに富んだ例えや比喩を交えつつ回答してください。' },
  { label: '率直', text: '遠慮せず率直で実用的なフィードバックをお願いします。' },
  { label: '励まし', text: '前向きな一言で背中を押しながら提案してください。' },
  { label: 'Z世代', text: '最新トレンドの語彙や絵文字も自然に採り入れてください。' },
  { label: '丁寧', text: '敬語で丁寧に説明し、必要に応じて補足情報の出典も添えてください。' },
  { label: '簡潔', text: '結論を先に述べ、その後に要点を箇条書きで示してください。' }
]

const NONE_PRESET_KEY = 'none'

const clonePresetMap = (source: PresetMap): PresetMap =>
  Object.fromEntries(Object.entries(source).map(([key, value]) => [key, { ...value }]))

const isPersonalityValue = (value: string) =>
  PERSONALITY_OPTIONS.some(option => option.value === value)

export default function SettingsModal({ isOpen, onClose, botType, onSave }: SettingsModalProps) {
  const [presetConfigs, setPresetConfigs] = useState<PresetMap>({})
  const [selectedPreset, setSelectedPreset] = useState<string>(NONE_PRESET_KEY)
  const [personality, setPersonality] = useState<string>('default')
  const [customInstructions, setCustomInstructions] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [occupation, setOccupation] = useState<string>('')
  const [about, setAbout] = useState<string>('')
  const [editingPresetKey, setEditingPresetKey] = useState<string | null>(null)
  const [presetDraftName, setPresetDraftName] = useState<string>('')
  const [presetDraftPrompt, setPresetDraftPrompt] = useState<string>('')
  const [presetMessage, setPresetMessage] = useState<string>('')

  const defaultPresets = useMemo(() => {
    const source = DEFAULT_PRESETS[botType] || DEFAULT_PRESETS.yamamoto
    return clonePresetMap(source)
  }, [botType])

  const defaultPresetsRef = useRef<PresetMap>({})
  const presetMessageTimerRef = useRef<number | null>(null)

  useEffect(() => {
    defaultPresetsRef.current = clonePresetMap(defaultPresets)
  }, [defaultPresets])

  useEffect(() => {
    if (!isOpen) return

    const basePresets = clonePresetMap(defaultPresetsRef.current)
    const storedPresetRaw = localStorage.getItem(`customPresetConfigs_${botType}`)

    if (storedPresetRaw) {
      try {
        const parsed: PresetMap = JSON.parse(storedPresetRaw)
        Object.entries(parsed).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            basePresets[key] = {
              ...(basePresets[key] || { name: '', prompt: '' }),
              ...value
            }
          }
        })
      } catch (error) {
        console.error('プリセットの読み込みに失敗しました:', error)
      }
    }

    setPresetConfigs(basePresets)

    const savedSettingsRaw = localStorage.getItem(`customSettings_${botType}`)

    if (savedSettingsRaw) {
      try {
        const parsed: StoredSettings = JSON.parse(savedSettingsRaw)

        const presetKey = parsed.presetKey && basePresets[parsed.presetKey]
          ? parsed.presetKey
          : NONE_PRESET_KEY

        setSelectedPreset(presetKey)
        setPersonality(
          parsed.personality && isPersonalityValue(parsed.personality)
            ? parsed.personality
            : 'default'
        )
        setCustomInstructions(
          typeof parsed.customInstructions === 'string'
            ? parsed.customInstructions.slice(0, 1000)
            : presetKey !== NONE_PRESET_KEY
              ? basePresets[presetKey]?.prompt.slice(0, 1000) || ''
              : ''
        )
        setNickname(parsed.nickname ?? '')
        setOccupation(parsed.occupation ?? '')
        setAbout(parsed.about ?? '')
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error)
        setSelectedPreset(NONE_PRESET_KEY)
        setPersonality('default')
        setCustomInstructions('')
        setNickname('')
        setOccupation('')
        setAbout('')
      }
    } else {
      const legacyPrompt = localStorage.getItem(`customPrompt_${botType}`) || ''
      setSelectedPreset(NONE_PRESET_KEY)
      setPersonality('default')
      setCustomInstructions(legacyPrompt.slice(0, 1000))
      setNickname('')
      setOccupation('')
      setAbout('')
    }

    setEditingPresetKey(null)
  }, [isOpen, botType])

  useEffect(() => {
    return () => {
      if (presetMessageTimerRef.current) {
        window.clearTimeout(presetMessageTimerRef.current)
      }
    }
  }, [])

  const showPresetMessage = (message: string) => {
    setPresetMessage(message)
    if (presetMessageTimerRef.current) {
      window.clearTimeout(presetMessageTimerRef.current)
    }
    presetMessageTimerRef.current = window.setTimeout(() => {
      setPresetMessage('')
    }, 1800)
  }

  if (!isOpen) return null

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === NONE_PRESET_KEY) {
      setSelectedPreset(NONE_PRESET_KEY)
      setCustomInstructions('')
      setEditingPresetKey(null)
      return
    }

    const preset = presetConfigs[presetKey]
    if (preset) {
      setSelectedPreset(presetKey)
      setCustomInstructions(preset.prompt.slice(0, 1000))
      setEditingPresetKey(null)
    }
  }

  const handleInsertTemplate = (text: string) => {
    setCustomInstructions(prev => {
      const alreadyIncluded = prev.includes(text)
      const next = alreadyIncluded ? prev : `${prev.trimEnd()}\n${text}`.trim()
      return next.slice(0, 1000)
    })
  }

  const handleOverwritePreset = () => {
    if (selectedPreset === NONE_PRESET_KEY) return
    setPresetConfigs(prev => {
      const current = prev[selectedPreset]
      if (!current) return prev
      return {
        ...prev,
        [selectedPreset]: {
          ...current,
          prompt: customInstructions
        }
      }
    })
    showPresetMessage('プリセットを更新しました')
  }

  const handlePresetEditStart = (presetKey: string) => {
    if (presetKey === NONE_PRESET_KEY) return
    const target = presetConfigs[presetKey]
    if (!target) return
    setEditingPresetKey(presetKey)
    setPresetDraftName(target.name)
    setPresetDraftPrompt(target.prompt)
  }

  const handlePresetEditCancel = () => {
    setEditingPresetKey(null)
  }

  const handlePresetEditApply = () => {
    if (!editingPresetKey) return

    setPresetConfigs(prev => {
      const current = prev[editingPresetKey]
      if (!current) return prev
      const updatedName = presetDraftName.trim() || current.name
      return {
        ...prev,
        [editingPresetKey]: {
          name: updatedName,
          prompt: presetDraftPrompt
        }
      }
    })

    if (selectedPreset === editingPresetKey) {
      setCustomInstructions(presetDraftPrompt.slice(0, 1000))
    }

    setEditingPresetKey(null)
    showPresetMessage('プリセットを保存しました')
  }

  const handlePresetEditReset = () => {
    if (!editingPresetKey) return
    const defaults = defaultPresetsRef.current[editingPresetKey]
    if (!defaults) return
    setPresetDraftName(defaults.name)
    setPresetDraftPrompt(defaults.prompt)
  }

  const personalityOption = PERSONALITY_OPTIONS.find(option => option.value === personality) || PERSONALITY_OPTIONS[0]
  const selectedPresetConfig = selectedPreset !== NONE_PRESET_KEY ? presetConfigs[selectedPreset] : undefined
  const presetHasUnsavedChanges = selectedPresetConfig ? selectedPresetConfig.prompt !== customInstructions : false

  const buildFinalPrompt = () => {
    const sections: string[] = []

    if (personalityOption) {
      sections.push(`## チャットボットの性格\n${personalityOption.label}\n${personalityOption.description}`)
    }

    if (customInstructions.trim()) {
      const presetLabel = selectedPresetConfig ? `（プリセット: ${selectedPresetConfig.name}）` : ''
      sections.push(`## カスタム指示${presetLabel}\n${customInstructions.trim()}`)
    }

    const profileLines: string[] = []
    if (nickname.trim()) profileLines.push(`- ニックネーム: ${nickname.trim()}`)
    if (occupation.trim()) profileLines.push(`- 職業 / 役割: ${occupation.trim()}`)
    if (about.trim()) profileLines.push(`- あなたについて: ${about.trim()}`)

    if (profileLines.length > 0) {
      sections.push(`## ユーザープロファイル\n${profileLines.join('\n')}`)
    }

    return sections.join('\n\n').trim()
  }

  const handleSave = () => {
    const finalPrompt = buildFinalPrompt()

    const settingsToPersist: StoredSettings = {
      presetKey: selectedPreset !== NONE_PRESET_KEY ? selectedPreset : null,
      personality,
      customInstructions,
      nickname,
      occupation,
      about
    }

    localStorage.setItem(`customPrompt_${botType}`, finalPrompt)
    localStorage.setItem(`customSettings_${botType}`, JSON.stringify(settingsToPersist))
    localStorage.setItem(`customPresetConfigs_${botType}`, JSON.stringify(presetConfigs))

    onSave(finalPrompt)
    onClose()
  }

  const handleReset = () => {
    localStorage.removeItem(`customPrompt_${botType}`)
    localStorage.removeItem(`customSettings_${botType}`)
    localStorage.removeItem(`customPresetConfigs_${botType}`)

    setPresetConfigs(clonePresetMap(defaultPresetsRef.current))
    setSelectedPreset(NONE_PRESET_KEY)
    setPersonality('default')
    setCustomInstructions('')
    setNickname('')
    setOccupation('')
    setAbout('')
    setEditingPresetKey(null)
    showPresetMessage('初期設定に戻しました')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">カスタムプロンプト設定</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            プリセットを使わずに新規チャットを開始したり、後から自由にカスタマイズした内容を保存できます。
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">プリセット</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => handlePresetSelect(NONE_PRESET_KEY)}
                className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                  selectedPreset === NONE_PRESET_KEY
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">プリセットなし</div>
                <div className="text-xs text-gray-500 mt-1">
                  空の状態から独自の指示を作成します。
                </div>
              </button>

              {Object.entries(presetConfigs).map(([key, preset]) => (
                <div key={key} className="relative">
                  <button
                    onClick={() => handlePresetSelect(key)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedPreset === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {preset.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {preset.prompt}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handlePresetEditStart(key)
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 transition-colors"
                    title={`${preset.name}を編集`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>

            {presetMessage && (
              <div className="text-xs text-blue-600">{presetMessage}</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">チャットボットの性格</h3>
            </div>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {PERSONALITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">{personalityOption.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">カスタム指示</h3>
              <span className="text-xs text-gray-500">{customInstructions.length} / 1000 文字</span>
            </div>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value.slice(0, 1000))}
              placeholder="AIの振る舞いを細かく指定してください。役割、口調、回答の形式などを記載できます。"
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />

            <div className="flex flex-wrap gap-2">
              {INSTRUCTION_TEMPLATES.map(template => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => handleInsertTemplate(template.text)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-full bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  {template.label}
                </button>
              ))}
            </div>

            {selectedPresetConfig && (
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-gray-600">
                <div>
                  選択中のプリセット: {selectedPresetConfig.name}
                  {presetHasUnsavedChanges && (
                    <span className="ml-2 text-orange-500 font-semibold">（未保存の変更あり）</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOverwritePreset}
                    className="px-3 py-1.5 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    この内容でプリセットを更新
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetEditStart(selectedPreset)}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    詳細を編集
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = defaultPresetsRef.current[selectedPreset]
                      if (!defaults) return
                      setPresetConfigs(prev => ({
                        ...prev,
                        [selectedPreset]: { ...defaults }
                      }))
                      setCustomInstructions(defaults.prompt.slice(0, 1000))
                      showPresetMessage('プリセットを初期状態に戻しました')
                    }}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    初期化
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">あなたについて</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">ニックネーム</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="会社名 など"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">職業</label>
                <input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="経営者 / マーケター など"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">あなたについての詳細</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="得意分野、価値観、現在の課題などを記入してください。"
                className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
            <div>💡 ヒント</div>
            <div>・プリセットを選びつつ文章を編集し、自分用に上書きできます。</div>
            <div>・チャットボットの性格で応答の雰囲気を素早く切り替えられます。</div>
            <div>・「あなたについて」を埋めると、AIが前提を理解した状態で回答します。</div>
          </div>

          {editingPresetKey && (
            <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">
                  プリセット「{presetDraftName || presetConfigs[editingPresetKey]?.name || '名称未設定'}」を編集
                </h4>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handlePresetEditReset}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    初期値を読み込む
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetEditCancel}
                    className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">プリセット名</label>
                <input
                  value={presetDraftName}
                  onChange={(e) => setPresetDraftName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">プリセット内容</label>
                <textarea
                  value={presetDraftPrompt}
                  onChange={(e) => setPresetDraftPrompt(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePresetEditApply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  プリセットを保存
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>初期設定に戻す</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>保存</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

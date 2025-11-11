# 🧠 Difyメモリ機能実装ガイド

## 概要

Difyのメモリ機能を活用して、会話履歴を保持し、文脈を理解したより自然な対話を実現します。

## 🎯 メモリ機能の仕組み

### Dify側の設定（完了済み）
- **メモリ**: ON ✅
- **メモリウィンドウサイズ**: 10（最大10件の会話を記憶）
- **ビジョン**: OFF

### 実装のポイント

#### 1. **ユーザー識別**
```javascript
// ユーザーIDをローカルストレージで永続化
const userId = localStorage.getItem('dify_user_id') ||
               `user_${Date.now()}_${Math.random()}`
```

#### 2. **会話の継続性**
```javascript
// conversation_idをセッションストレージで管理
const conversationId = sessionStorage.getItem('dify_conversation_id')
```

#### 3. **APIリクエスト**
```javascript
{
  query: "ユーザーのメッセージ",
  user: "user_id",  // 重要：ユーザー識別子
  conversation_id: "conv_xxx",  // 会話の継続
  response_mode: "streaming",
  inputs: { system_prompt: "..." }
}
```

## 📁 新規ファイル

### コンポーネント
- `StreamingChatBotWithMemory.tsx` - メモリ機能付きUIコンポーネント

### API
- `chat-stream-memory.ts` - メモリ機能対応APIエンドポイント

### ページ
- `with-memory.tsx` - メモリ機能付きチャットページ

## 🚀 アクセス方法

### 開発環境
```bash
http://localhost:3000/with-memory
```

### 本番環境
```bash
https://yamamoto-ai-chatbot.vercel.app/with-memory
```

## 💾 データ管理

### ローカルストレージ
- `dify_user_id` - ユーザー識別子（永続的）
- `systemPrompt` - カスタムプロンプト

### セッションストレージ
- `dify_conversation_id` - 会話ID（ブラウザセッション単位）

## 🔄 メモリの動作

### 新規ユーザー
1. 初回アクセス時にユーザーIDを生成
2. ローカルストレージに保存
3. 以降のアクセスで同じIDを使用

### 会話の継続
1. 初回メッセージでconversation_idを取得
2. セッションストレージに保存
3. 同一セッション内で会話を継続

### 会話のリセット
1. 「会話リセット」ボタンをクリック
2. conversation_idをクリア
3. 新しい会話を開始（ユーザーIDは保持）

## 🎨 UI機能

### 設定パネル
- ユーザーID表示
- 会話ID表示
- メモリ情報（最大10メッセージ）
- システムプロンプト編集
- API切り替え（テスト/本番）
- 会話リセット

### デバッグ情報
- 現在のユーザーID
- アクティブな会話ID
- メッセージ数
- メモリ状態

## ⚙️ 環境変数

`.env.local`に設定：
```env
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_URL=https://api.dify.ai/v1
```

## 🔍 トラブルシューティング

### メモリが機能しない場合

1. **Dify側の設定確認**
   - メモリがONになっているか
   - メモリウィンドウサイズが適切か

2. **ユーザーIDの確認**
   ```javascript
   console.log('User ID:', localStorage.getItem('dify_user_id'))
   ```

3. **会話IDの確認**
   ```javascript
   console.log('Conversation ID:', sessionStorage.getItem('dify_conversation_id'))
   ```

4. **APIレスポンスの確認**
   - ブラウザの開発者ツール > Network
   - chat-stream-memoryのレスポンスを確認

### 会話が途切れる場合

- ブラウザのセッションが切れていないか確認
- conversation_idが正しく送信されているか確認
- Difyのメモリウィンドウサイズを超えていないか確認

## 📊 メモリ機能のメリット

1. **文脈の理解**
   - 前の会話を踏まえた返答
   - 話題の継続性

2. **パーソナライゼーション**
   - ユーザーごとの会話履歴
   - 個別の文脈管理

3. **効率的な対話**
   - 繰り返し説明が不要
   - より自然な会話フロー

## 🚦 使用例

```
ユーザー: 「外注について教えて」
AI: 「外注活用は...（詳細な説明）」

ユーザー: 「それの具体例は？」  ← "それ"を理解
AI: 「外注活用の具体例として...」  ← 文脈を保持

ユーザー: 「費用はどのくらい？」  ← 話題を継続
AI: 「外注費用については...」  ← 前の文脈を理解
```

## 📝 今後の拡張案

- [ ] 会話履歴の表示機能
- [ ] 会話のエクスポート機能
- [ ] 複数の会話セッション管理
- [ ] ファイルアップロード対応
- [ ] 会話の検索機能

---

メモリ機能により、より自然で継続的な対話が可能になります！

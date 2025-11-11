# 🚀 ストリーミング機能実装ガイド

## 実装完了した内容

### ✅ 新しいページとコンポーネント

#### 1. **ストリーミング本番ページ** (`/streaming`)
- **コンポーネント**: `StreamingChatBot.tsx`
- **API**: `/api/chat-stream` (Dify API連携)
- **特徴**:
  - リアルタイムストリーミング表示
  - タイピングインジケーター
  - ストリーミング中断機能
  - システムプロンプト設定機能

#### 2. **ストリーミングテストページ** (`/streaming-test`)
- **コンポーネント**: `StreamingChatBotTest.tsx`
- **API**: `/api/chat-stream-test` (モックAPI)
- **特徴**:
  - テストAPI ↔ 本番API切り替え
  - デバッグ情報表示
  - モックレスポンスでのストリーミング確認

### 📁 ファイル構成

```
src/
├── components/
│   ├── ChatBot.tsx              # 既存（ブロッキング）
│   ├── ChatBotTest.tsx          # 既存（ブロッキング・デバッグ）
│   ├── StreamingChatBot.tsx     # 新規（ストリーミング）✨
│   └── StreamingChatBotTest.tsx # 新規（ストリーミング・デバッグ）✨
├── pages/
│   ├── index.tsx                # 既存ページ
│   ├── debug.tsx                # 既存デバッグページ
│   ├── streaming.tsx            # 新規ストリーミングページ ✨
│   ├── streaming-test.tsx       # 新規ストリーミングテストページ ✨
│   └── api/
│       ├── chat.ts              # 既存API（ブロッキング）
│       ├── chat-test.ts         # 既存テストAPI（ブロッキング）
│       ├── chat-stream.ts       # 新規ストリーミングAPI ✨
│       └── chat-stream-test.ts  # 新規ストリーミングテストAPI ✨
```

## 🔧 Dify側の設定

### 必要な設定：**なし！**

Difyのチャットアプリは**デフォルトでストリーミング対応**です。
APIリクエスト時に `response_mode: "streaming"` を指定するだけで動作します。

## 🌐 アクセス方法

### ローカル環境
```bash
# 開発サーバー起動
npm run dev

# アクセスURL
http://localhost:3000/streaming-test  # テストモード（モックデータ）
http://localhost:3000/streaming       # 本番モード（Dify API）
```

### テストモードで確認できること
- ✅ タイピングアニメーション（文字が徐々に表示）
- ✅ ストリーミング中断ボタン
- ✅ 会話IDの管理
- ✅ エラーハンドリング

## ⚙️ 環境変数設定

`.env.local` ファイルに以下を設定：
```env
DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxxxx
DIFY_API_URL=https://api.dify.ai/v1
```

## 🎯 動作確認手順

### 1. テストモードで動作確認
1. `http://localhost:3000/streaming-test` にアクセス
2. 「テストAPI」モードになっていることを確認
3. 以下のキーワードでテスト：
   - 「こんにちは」
   - 「外注」
   - 「副業」
4. 文字が徐々に表示されることを確認

### 2. 本番モードで動作確認
1. `.env.local` にDify APIキーを設定
2. 開発サーバーを再起動
3. `http://localhost:3000/streaming` にアクセス
4. メッセージを送信してストリーミング動作を確認

## 🚨 トラブルシューティング

### ストリーミングが動作しない場合

#### 1. APIキーの確認
```bash
# .env.localファイルを確認
cat .env.local
```

#### 2. ネットワークの確認
- プロキシやファイアウォールがSSEをブロックしていないか
- Nginxを使用している場合は `proxy_buffering off;` を設定

#### 3. ブラウザの確認
- Chrome/Firefox/Safari の最新版を使用
- 開発者ツールのNetworkタブでSSE接続を確認

## 📊 技術仕様

### SSE (Server-Sent Events) 形式

#### レスポンスヘッダー
```http
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

#### データ形式
```javascript
data: {"event":"message","answer":"こんにちは","conversation_id":"xxx","message_id":"yyy"}
data: {"event":"message","answer":"、伊藤です","conversation_id":"xxx","message_id":"yyy"}
data: [DONE]
```

### フロントエンド実装のポイント

1. **Fetch API + ReadableStream** を使用（EventSourceはPOST非対応）
2. **累積テキスト管理** - チャンクごとに受信したテキストを結合
3. **AbortController** でストリーミング中断を実装
4. **エラーハンドリング** - ネットワークエラーやAPI エラーに対応

## 🚀 Vercel デプロイ時の注意

Vercelでストリーミングを使用する場合：

1. **Edge Functions** を使用する必要がある場合があります
2. **タイムアウト設定** に注意（デフォルト10秒）
3. 必要に応じて `vercel.json` に以下を追加：

```json
{
  "functions": {
    "src/pages/api/chat-stream.ts": {
      "maxDuration": 30
    }
  }
}
```

## 📝 今後の改善案

- [ ] マークダウンのリアルタイムレンダリング
- [ ] コードブロックのシンタックスハイライト
- [ ] 音声読み上げ機能
- [ ] メッセージの編集・再送信機能
- [ ] ストリーミング速度の調整機能

---

実装完了！ 🎉

テストページ（`/streaming-test`）で動作確認後、本番ページ（`/streaming`）でDify APIと連携してください。

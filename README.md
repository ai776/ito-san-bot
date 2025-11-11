# 伊藤 AIチャットボット (Dify + LINE風UI)

DifyのAPIを使用したビジネス相談AIチャットボット「伊藤」です。LINE風UIでリアルタイムストリーミング対応。

## ✨ 主な機能

- 🎯 **伊藤AIアシスタント** - 年商40億の実業家として振る舞うAI
- 💬 **LINE風の洗練されたチャットUI**
- 🔄 **リアルタイムストリーミング対応** - テキストが流れるように表示
- 🎨 **カスタムプロンプト設定機能**
- 🔧 **デバッグモード** - 開発・テスト用の機能
- 📱 **レスポンシブデザイン** - モバイル最適化

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を設定してください：

```env
# Dify API設定
DIFY_API_KEY=your_dify_api_key_here

# Dify APIのURL（オプション）
# デフォルト: https://api.dify.ai/v1
# セルフホスティングの場合は、適切なURLに変更してください
DIFY_API_URL=https://api.dify.ai/v1
```

#### Dify APIキーの取得方法

1. [Dify](https://dify.ai/)にアクセスしてアカウントを作成
2. アプリケーションを作成
3. API設定からAPIキーを取得

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## Vercelへのデプロイ

### 1. Vercelにプロジェクトをデプロイ

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# デプロイ
vercel
```

### 2. 環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定：

1. プロジェクトダッシュボードにアクセス
2. Settings → Environment Variables に移動
3. 以下の環境変数を追加：
   - `DIFY_API_KEY`: DifyのAPIキー
   - `DIFY_API_URL`: DifyのAPIエンドポイント（オプション）

### 3. 再デプロイ

環境変数を設定後、再デプロイが必要です：

```bash
vercel --prod
```

## 🚀 アクセスURL

### 開発環境
```bash
npm run dev
```

- **メインページ**: http://localhost:3000
- **ストリーミング版**: http://localhost:3000/streaming ✨NEW
- **ストリーミングテスト**: http://localhost:3000/streaming-test ✨NEW
- **デバッグページ**: http://localhost:3000/debug

## プロジェクト構造

```
├── src/
│   ├── components/
│   │   ├── ChatBot.tsx              # メインチャットコンポーネント
│   │   ├── ChatBotTest.tsx          # デバッグ用コンポーネント
│   │   ├── StreamingChatBot.tsx     # ストリーミング対応 ✨NEW
│   │   └── StreamingChatBotTest.tsx # ストリーミングテスト ✨NEW
│   ├── pages/
│   │   ├── api/
│   │   │   ├── chat.ts              # Dify API（ブロッキング）
│   │   │   ├── chat-test.ts         # テストAPI（モック）
│   │   │   ├── chat-stream.ts       # ストリーミングAPI ✨NEW
│   │   │   └── chat-stream-test.ts  # ストリーミングテスト ✨NEW
│   │   ├── _app.tsx                 # Next.jsアプリケーション設定
│   │   ├── index.tsx                # ホームページ
│   │   ├── debug.tsx                # デバッグページ
│   │   ├── streaming.tsx            # ストリーミングページ ✨NEW
│   │   └── streaming-test.tsx       # ストリーミングテスト ✨NEW
│   └── styles/
│       └── globals.css              # グローバルスタイル
├── STREAMING_SETUP.md               # ストリーミング設定ガイド ✨NEW
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Axios** - HTTP通信
- **Dify API** - AI/チャットボット機能

## カスタマイズ

### UIのカスタマイズ

- `src/components/ChatBot.tsx` でUIコンポーネントを編集
- `tailwind.config.js` でカラーテーマを変更
- `src/styles/globals.css` でグローバルスタイルを調整

### APIの設定

- `src/pages/api/chat.ts` でDify APIの呼び出しロジックをカスタマイズ
- レスポンスの処理方法を変更可能

## トラブルシューティング

### APIキーエラー

- 環境変数 `DIFY_API_KEY` が正しく設定されているか確認
- Vercelの場合、環境変数設定後に再デプロイが必要

### CORS エラー

- Dify側でCORS設定を確認
- API URLが正しいか確認

### メッセージが送信されない

- ブラウザのコンソールでエラーを確認
- ネットワークタブでAPIレスポンスを確認

## ライセンス

MIT

## 🔄 更新履歴

### v2.0.0 (2025-01-09) ✨
- ストリーミング機能実装
- SSE (Server-Sent Events) 対応
- タイピングインジケーター追加
- ストリーミング中断機能
- テスト用モックAPI追加

### v1.1.0 (2025-01-08)
- カスタムプロンプト設定機能
- デバッグモード追加

### v1.0.0 (2025-01-08)
- 初回リリース
- LINE風UI実装
- Dify API連携

## 📦 GitHubリポジトリ

- **リポジトリURL**: https://github.com/ai776/yamamoto-bot2
- **ブランチ**: master
- **最新コミット**: ストリーミング機能実装

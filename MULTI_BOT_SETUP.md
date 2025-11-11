# マルチボット機能セットアップガイド

## 概要
このアプリケーションは4つの専門的なAIボットを提供します：
1. **伊藤さんボット** - チャットボット
2. **X投稿用ボット** - X（旧Twitter）の投稿文作成
3. **Facebook投稿用ボット** - Facebook投稿文作成
4. **自己紹介文作成ボット** - プロフィール文の作成

## 環境変数の設定

### ローカル開発環境

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# ①伊藤さんボット（チャットボット）
DIFY_API_KEY=your-chatbot-api-key-here
DIFY_API_URL=https://api.dify.ai/v1

# ②X（Twitter）投稿用ボット
DIFY_X_API_KEY=your-x-bot-api-key-here
DIFY_X_API_URL=https://api.dify.ai/v1

# ③Facebook投稿用ボット
DIFY_FACEBOOK_API_KEY=your-facebook-bot-api-key-here
DIFY_FACEBOOK_API_URL=https://api.dify.ai/v1

# ④自己紹介文作成ボット
DIFY_PROFILE_API_KEY=your-profile-bot-api-key-here
DIFY_PROFILE_API_URL=https://api.dify.ai/v1
```

> **注意**: 各ボットで同じDify APIキーを使用する場合は、`DIFY_API_KEY`のみ設定すれば、他のボットはフォールバックとしてこれを使用します。

### Vercelでの設定

Vercelダッシュボードで以下の環境変数を設定：

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下の変数を追加：

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DIFY_API_KEY` | 伊藤さんボット用APIキー | ✅ |
| `DIFY_API_URL` | Dify APIエンドポイント | ✅ |
| `DIFY_X_API_KEY` | X投稿用APIキー | ⭕ |
| `DIFY_X_API_URL` | X用APIエンドポイント | ⭕ |
| `DIFY_FACEBOOK_API_KEY` | Facebook投稿用APIキー | ⭕ |
| `DIFY_FACEBOOK_API_URL` | Facebook用APIエンドポイント | ⭕ |
| `DIFY_PROFILE_API_KEY` | 自己紹介文用APIキー | ⭕ |
| `DIFY_PROFILE_API_URL` | 自己紹介文用APIエンドポイント | ⭕ |

⭕ = オプション（設定されていない場合は`DIFY_API_KEY`を使用）

## Dify側の設定

各ボット用に異なるDifyアプリを作成する場合：

1. **Difyダッシュボード**にログイン
2. 各用途に応じたアプリを作成：
   - 伊藤さんボット: 対話型チャットボット設定
   - X投稿: 140-280文字の短文生成に最適化
   - Facebook投稿: エンゲージメント重視の文章生成
   - 自己紹介文: プロフェッショナルな文章生成

3. 各アプリで：
   - **Publish**をクリック
   - **App API Key**をコピー
   - 対応する環境変数に設定

## 使い方

### アクセスURL

- **マルチボット選択画面**: `/multi-bot`
- **従来のチャットボット**: `/with-memory`

### 機能

1. **ボット選択**
   - 画面上部の4つのボタンから使用したいボットを選択
   - 選択されたボットは青色でハイライト表示

2. **会話管理**
   - 各ボットは独立した会話履歴を保持
   - ボットを切り替えても各会話は保存される
   - 「リセット」ボタンで現在のボットの会話をクリア

3. **メモリ機能**
   - 各ボットは独立したconversation_idを管理
   - ユーザーIDは全ボット共通で使用
   - ブラウザを閉じても会話履歴は保持される

## トラブルシューティング

### エラー: "API configuration error"
- 環境変数が正しく設定されているか確認
- Vercelの場合、デプロイ後に環境変数が反映されているか確認

### エラー: "Input payload validation failed"
- Dify APIキーが正しいか確認
- APIエンドポイントURLが正しいか確認

### ストリーミングが動作しない
- ブラウザがSSE（Server-Sent Events）をサポートしているか確認
- プロキシやCDNの設定でSSEがブロックされていないか確認

## 開発者向け情報

### ファイル構成

```
src/
├── components/
│   └── MultiBotSelector.tsx    # マルチボット選択UI
├── pages/
│   ├── multi-bot.tsx           # マルチボットページ
│   └── api/
│       └── multi-bot/
│           ├── yamamoto.ts     # 伊藤さんボットAPI
│           ├── x.ts            # X投稿API
│           ├── facebook.ts     # Facebook投稿API
│           └── profile.ts      # 自己紹介文API
```

### APIエンドポイント

各ボットは独自のAPIエンドポイントを持ちます：

- `/api/multi-bot/yamamoto` - 伊藤さんボット
- `/api/multi-bot/x` - X投稿用
- `/api/multi-bot/facebook` - Facebook投稿用
- `/api/multi-bot/profile` - 自己紹介文作成

### カスタマイズ

新しいボットを追加する場合：

1. `MultiBotSelector.tsx`の`AVAILABLE_BOTS`配列に追加
2. 対応するAPIエンドポイントを作成
3. 必要に応じて環境変数を追加

## 更新履歴

- 2024/01 - マルチボット機能を実装
- 各ボット独立の会話管理機能を追加
- ストリーミング出力対応

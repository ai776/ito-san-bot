import StreamingChatBotWithMemory from '@/components/StreamingChatBotWithMemory'
import Head from 'next/head'

export default function WithMemoryPage() {
  return (
    <>
      <Head>
        <title>伊藤 - メモリ機能付きチャット</title>
        <meta name="description" content="Difyのメモリ機能を活用した会話履歴保持型チャットボット" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen">
        <StreamingChatBotWithMemory />
      </main>
    </>
  )
}

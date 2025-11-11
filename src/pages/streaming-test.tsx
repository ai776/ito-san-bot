import StreamingChatBotTest from '@/components/StreamingChatBotTest'
import Head from 'next/head'

export default function StreamingTestPage() {
  return (
    <>
      <Head>
        <title>伊藤 - ストリーミングテスト</title>
        <meta name="description" content="ストリーミングチャットのテストページ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen">
        <StreamingChatBotTest />
      </main>
    </>
  )
}

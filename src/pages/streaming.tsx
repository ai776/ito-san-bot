import StreamingChatBot from '@/components/StreamingChatBot'
import Head from 'next/head'

export default function StreamingPage() {
  return (
    <>
      <Head>
        <title>伊藤 - ストリーミングチャット</title>
        <meta name="description" content="リアルタイムストリーミング対応AIチャットボット" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen">
        <StreamingChatBot />
      </main>
    </>
  )
}

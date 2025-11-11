import StreamingChatBotImproved from '@/components/StreamingChatBotImproved'
import Head from 'next/head'

export default function StreamingImprovedPage() {
  return (
    <>
      <Head>
        <title>伊藤 - 改善版ストリーミング</title>
        <meta name="description" content="requestAnimationFrameを使用した改善版ストリーミング" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen">
        <StreamingChatBotImproved />
      </main>
    </>
  )
}

import ChatBotTest from '@/components/ChatBotTest'
import Head from 'next/head'

export default function Debug() {
  return (
    <>
      <Head>
        <title>伊藤 - デバッグモード</title>
        <meta name="description" content="チャットボットのデバッグページ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="h-screen">
        <ChatBotTest />
      </main>
    </>
  )
}

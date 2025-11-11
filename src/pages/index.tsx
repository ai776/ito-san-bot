import ChatBot from '@/components/ChatBot'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>伊藤 - チャットボット</title>
        <meta name="description" content="DifyベースのAIチャットボット" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen">
        <ChatBot />
      </main>
    </>
  )
}

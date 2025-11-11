import MultiBotSelector from '../components/MultiBotSelector'
import Head from 'next/head'

export default function MultiBotPage() {
  return (
    <>
      <Head>
        <title>マルチボット - 専門AIアシスタント</title>
        <meta name="description" content="伊藤さんボット、X投稿、Facebook投稿、自己紹介文作成など、用途に応じた専門AIアシスタントを選択できます" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MultiBotSelector />
    </>
  )
}

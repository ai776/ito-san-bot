import { useState } from 'react'
import Head from 'next/head'

export default function TestApiPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-dify-connection')
      const data = await response.json()
      setTestResult(data)
    } catch (error: any) {
      setTestResult({
        status: 'error',
        message: 'Failed to run test',
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Dify API接続テスト</title>
        <meta name="description" content="Dify APIの接続とリクエスト形式をテスト" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔍 Dify API接続テスト</h1>

          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <p className="text-gray-600 mb-4">
              このページでは、Dify APIへの接続とリクエスト形式をテストします。
            </p>

            <button
              onClick={runTest}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'テスト中...' : 'テストを実行'}
            </button>
          </div>

          {testResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-3">テスト結果</h2>

              <div className={`p-3 rounded mb-4 ${testResult.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                <div className="font-semibold">
                  {testResult.status === 'success' ? '✅ 成功' : '❌ エラー'}
                </div>
                <div className="text-sm mt-1">{testResult.message}</div>
              </div>

              {testResult.workingFormat && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">✅ 動作するリクエスト形式:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResult.workingFormat, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.tests && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">テスト詳細:</h3>
                  {Object.entries(testResult.tests).map(([key, test]: [string, any]) => (
                    <div key={key} className="mb-3 border-l-4 border-gray-300 pl-3">
                      <div className="font-semibold text-sm">{key} (Status: {test.status})</div>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-sm text-gray-600">
                          リクエスト/レスポンスを表示
                        </summary>
                        <div className="mt-2">
                          <div className="text-xs font-semibold">Request:</div>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.request, null, 2)}
                          </pre>
                          <div className="text-xs font-semibold mt-2">Response:</div>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.response, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}

              {testResult.possibleIssues && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">🤔 考えられる原因:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {testResult.possibleIssues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResult.response && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">APIレスポンス:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResult.response, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-4 p-3 bg-yellow-100 rounded">
                <div className="font-semibold text-yellow-800 mb-2">📝 次のステップ:</div>
                <ol className="list-decimal list-inside text-sm text-yellow-700">
                  <li>上記の「動作するリクエスト形式」を確認</li>
                  <li>APIエンドポイントのコードを修正</li>
                  <li>環境変数が正しく設定されているか確認</li>
                  <li>Difyアプリの設定を確認（メモリON、APIキー）</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default function NenpiManualPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⛽ 燃費記録 使い方マニュアル
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            燃費記録アプリの使い方を説明します
          </p>
        </div>

        <div className="space-y-6">
          {/* 基本的な使い方 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">1</span>
              基本的な使い方
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">📝 新しい給油記録を追加</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>「新しい給油記録」ボタンをクリック</li>
                  <li>各項目を入力：
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li><strong>給油日</strong>: デフォルトで今日の日付が入っています</li>
                      <li><strong>スタンド名</strong>: 過去に使ったスタンド名から選択可能</li>
                      <li><strong>給油量</strong>: リットル単位で入力（例: 40.5）</li>
                      <li><strong>金額</strong>: 円単位で入力（例: 6500）</li>
                      <li><strong>走行距離</strong>: メーター値を入力（例: 12345.6）</li>
                    </ul>
                  </li>
                  <li>「登録」ボタンをクリック</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">✏️ 記録を編集</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>編集したい記録の鉛筆アイコン（✏️）をクリック</li>
                  <li>内容を修正</li>
                  <li>「更新」ボタンをクリック</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">🗑️ 記録を削除</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>削除したい記録のゴミ箱アイコン（🗑️）をクリック</li>
                  <li>確認ダイアログで「OK」をクリック</li>
                </ol>
              </div>
            </div>
          </section>

          {/* 便利な機能 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">2</span>
              便利な機能
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">🔄 スタンド名のオートコンプリート</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  スタンド名の入力欄をクリックすると、過去に入力したスタンド名が候補として表示されます。
                </p>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>よく行くスタンドを素早く選択できます</li>
                  <li>新しいスタンド名を入力すると、次回から候補に追加されます</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">📊 自動計算される情報</h3>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300 space-y-1">
                  <li><strong>燃費 (km/L)</strong>: 前回の給油からの走行距離と今回の給油量から自動計算</li>
                  <li><strong>単価 (円/L)</strong>: 金額 ÷ 給油量で自動計算</li>
                </ul>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 ml-4">
                  ※ 燃費は2回目以降の記録から表示されます
                </p>
              </div>
            </div>
          </section>

          {/* 記録のポイント */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">3</span>
              正確な燃費記録のポイント
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">💡 燃費を正確に記録するために</h3>
                <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300 space-y-2">
                  <li><strong>満タン法で給油</strong>: 毎回満タンにすることで、正確な燃費が計算できます</li>
                  <li><strong>走行距離は給油時のメーター値</strong>: トリップメーターではなく、総走行距離を記録します</li>
                  <li><strong>給油したらすぐ記録</strong>: 記録を忘れないよう、給油直後に入力するのがおすすめです</li>
                  <li><strong>日付は必ず正確に</strong>: 記録は日付順に並ぶため、正確な日付を入力しましょう</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">📈 燃費の見方</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  各記録に表示される燃費は、「前回の給油から今回の給油までの燃費」を表しています。
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-3">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2">計算式:</p>
                  <p className="text-gray-700 dark:text-gray-300 font-mono">
                    燃費 (km/L) = (今回の走行距離 - 前回の走行距離) ÷ 今回の給油量
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* よくある質問 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-lg">4</span>
              よくある質問
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Q. 燃費が表示されない</h3>
                <p className="text-gray-700 dark:text-gray-300 ml-4">
                  A. 燃費は2回目以降の記録から計算されます。1回目の記録では燃費は表示されません。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Q. 燃費の値がおかしい</h3>
                <p className="text-gray-700 dark:text-gray-300 ml-4">
                  A. 以下を確認してください：
                </p>
                <ul className="list-disc list-inside ml-8 text-gray-700 dark:text-gray-300 space-y-1">
                  <li>走行距離が前回より増えているか</li>
                  <li>給油量が正確に入力されているか</li>
                  <li>満タン給油しているか（半分だけの給油だと正確な燃費が出ません）</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Q. 記録を間違えて入力してしまった</h3>
                <p className="text-gray-700 dark:text-gray-300 ml-4">
                  A. 編集ボタン（✏️）で修正できます。削除して入力し直すこともできます。
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Q. データは他の人に見られる？</h3>
                <p className="text-gray-700 dark:text-gray-300 ml-4">
                  A. いいえ。データは完全にあなた専用です。他のユーザーから見られることはありません。
                </p>
              </div>
            </div>
          </section>

          {/* トップに戻る */}
          <div className="text-center pt-8">
            <a
              href="/tools/nenpi"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              ← 燃費記録に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

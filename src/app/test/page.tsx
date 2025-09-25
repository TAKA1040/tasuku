'use client'

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>テストページ</h1>
      <p>基本的なページが表示されるかテストします。</p>
      <div style={{
        backgroundColor: '#f0f9ff',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>テーブル形式テスト</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>番号</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>完了</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: 'white' }}>
              <td style={{ padding: '8px', textAlign: 'center' }}>001</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>✓</td>
              <td style={{ padding: '8px' }}>テストタスク</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
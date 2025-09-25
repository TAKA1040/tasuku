'use client'

export default function TodayPageSimple() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1f2937', marginBottom: '20px' }}>今日のタスク</h1>

      <div style={{
        backgroundColor: '#f8fafc',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>テスト表示</h2>
        <p>統一テーブル形式のテストページです</p>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '16px',
          backgroundColor: 'white'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '60px' }}>番号</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '40px' }}>完了</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '60px' }}>種別</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600' }}>タイトル</th>
              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', width: '80px' }}>カテゴリ</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '90px' }}>期限</th>
              <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', width: '80px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td style={{ padding: '8px', textAlign: 'center' }}>001</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <button style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #10b981',
                  borderRadius: '4px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: 'pointer'
                }}>✓</button>
              </td>
              <td style={{ padding: '8px' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontSize: '9px',
                  fontWeight: '500'
                }}>テスト</span>
              </td>
              <td style={{ padding: '8px', fontSize: '14px', fontWeight: '500' }}>統一テーブル形式テスト</td>
              <td style={{ padding: '8px', fontSize: '12px', color: '#6b7280' }}>テスト</td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontSize: '10px',
                  fontWeight: '500'
                }}>今日</span>
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                <button style={{
                  padding: '4px',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer'
                }}>✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        backgroundColor: '#fef7ff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>統一テーブル形式の特徴</h3>
        <ul style={{ color: '#6b7280' }}>
          <li>番号: 統一番号の末尾3桁表示</li>
          <li>完了: チェックボックス</li>
          <li>種別: セクション固有のバッジ表示</li>
          <li>タイトル: 重要度ドット付き</li>
          <li>カテゴリ: カテゴリ名表示</li>
          <li>期限: 期日表示（なしの場合は「なし」）</li>
          <li>操作: 編集・削除ボタン</li>
        </ul>
      </div>
    </div>
  )
}
export default function StatsPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          統計
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          達成率と進捗の数値表示
        </p>
      </header>

      <main>
        {/* 期間別統計 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            期間別達成率
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { label: '今日', completed: 0, total: 0 },
              { label: '今週', completed: 0, total: 0 },
              { label: '今月', completed: 0, total: 0 }
            ].map(({ label, completed, total }) => (
              <div key={label} style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '500' }}>{label}</span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: total > 0 ? '#059669' : '#6b7280'
                }}>
                  {completed} / {total}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 連続達成 */}
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            連続達成日数（Streak）
          </h2>
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#fff'
          }}>
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              繰り返しタスクがありません
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
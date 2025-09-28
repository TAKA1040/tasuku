export default function HomePage() {
  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <h1>Tasuku Project</h1>
        <p>タスク管理アプリケーション</p>
        <div style={{marginTop:'20px', display:'flex', flexDirection:'column', gap:'12px', alignItems:'center'}}>
          <a
            href="/today"
            style={{
              display:'inline-block',
              padding:'12px 24px',
              background:'#2563eb',
              color:'#fff',
              textDecoration:'none',
              borderRadius:8,
              minWidth:'180px',
              textAlign:'center'
            }}
          >
            今日のタスク
          </a>
          <a
            href="/templates"
            style={{
              display:'inline-block',
              padding:'12px 24px',
              background:'#8b5cf6',
              color:'#fff',
              textDecoration:'none',
              borderRadius:8,
              minWidth:'180px',
              textAlign:'center'
            }}
          >
            テンプレート管理
          </a>
        </div>
      </div>
    </div>
  )
}
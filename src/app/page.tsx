export default function HomePage() {
  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <h1>Tasuku Project</h1>
        <p>タスク管理アプリケーション</p>
        <div style={{marginTop:'20px'}}>
          <a 
            href="/today" 
            style={{
              display:'inline-block',
              padding:'12px 24px',
              background:'#2563eb',
              color:'#fff',
              textDecoration:'none',
              borderRadius:8
            }}
          >
            今日のタスク
          </a>
        </div>
      </div>
    </div>
  )
}
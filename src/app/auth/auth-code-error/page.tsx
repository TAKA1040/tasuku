export default function AuthCodeErrorPage() {
  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{color:'#dc2626',marginBottom:'16px'}}>認証に失敗しました</h1>
        <p style={{marginBottom:'24px'}}>お手数ですが、もう一度お試しください。</p>
        <a 
          href="/login" 
          style={{
            display:'inline-block',
            padding:'8px 16px',
            background:'#2563eb',
            color:'#fff',
            textDecoration:'none',
            borderRadius:6
          }}
        >
          ログインページに戻る
        </a>
      </div>
    </div>
  )
}
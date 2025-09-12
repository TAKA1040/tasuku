import { createClient } from '@/lib/supabase/server'
import { AUTH_CONFIG } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import { RefreshButton } from '@/components/RefreshButton'

export default async function AuthStatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // profilesテーブルから現在の状態を取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // プロフィールが存在しない場合は作成
  if (error && error.code === 'PGRST116') {
    const isAdmin = AUTH_CONFIG.ADMIN_EMAILS.includes(user.email || '')
    // const isPreApproved = AUTH_CONFIG.PRE_APPROVED_EMAILS.includes(user.email || '') // 将来使用予定
    
    const newProfile = {
      id: user.id,
      email: user.email,
      status: 'APPROVED' as const, // 全員承認済み
      role: isAdmin ? AUTH_CONFIG.DEFAULT_ADMIN_ROLE : AUTH_CONFIG.DEFAULT_USER_ROLE,
      approved_at: new Date().toISOString(), // 全員承認日時設定
      approved_by: user.id, // 自動承認
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newProfile)

    if (!insertError) {
      // 全員自動承認なのでホームページへリダイレクト
      redirect('/')
    }
  }

  // 既存プロフィールで承認済みの場合はホームページへ
  if (profile && profile.status === 'APPROVED') {
    redirect('/')
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',maxWidth:'400px',padding:'20px'}}>
        <h1 style={{marginBottom:'20px'}}>承認待ち</h1>
        <div style={{background:'#fef3c7',padding:'16px',borderRadius:'8px',marginBottom:'20px'}}>
          <p style={{margin:0}}>
            アカウントが作成されました。<br />
            管理者による承認をお待ちください。
          </p>
        </div>
        
        <div style={{background:'#f3f4f6',padding:'16px',borderRadius:'8px',marginBottom:'20px'}}>
          <p style={{margin:0,fontSize:'14px'}}>
            <strong>メールアドレス:</strong> {user.email}<br />
            <strong>ステータス:</strong> 承認待ち<br />
            <strong>登録日時:</strong> {new Date().toLocaleDateString('ja-JP')}
          </p>
        </div>

        <RefreshButton
          style={{
            padding:'8px 16px',
            background:'#2563eb',
            color:'#fff',
            border:'none',
            borderRadius:6,
            cursor:'pointer'
          }}
        >
          ステータス更新
        </RefreshButton>
      </div>
    </div>
  )
}
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// .env.localから環境変数を読み込む
const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません')
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndFixTemplate() {
  console.log('🔍 テンプレートの状態を確認します...\n')

  // すべてのテンプレートを確認
  const { data: templates, error } = await supabase
    .from('recurring_templates')
    .select('id, title, urls, pattern, active')
    .order('title')

  if (error) {
    console.error('❌ テンプレート取得エラー:', error)
    return
  }

  console.log(`📋 テンプレート一覧 (${templates?.length || 0}件):\n`)

  templates?.forEach((t, i) => {
    const urlsStatus = !t.urls ? 'NULL' :
                       Array.isArray(t.urls) && t.urls.length === 0 ? '空配列' :
                       Array.isArray(t.urls) ? `${t.urls.length}個` : 'データあり'

    console.log(`${i + 1}. ${t.title}`)
    console.log(`   ID: ${t.id}`)
    console.log(`   URLs: ${urlsStatus}`)
    if (t.urls && Array.isArray(t.urls) && t.urls.length > 0) {
      t.urls.forEach((url: string, idx: number) => {
        console.log(`     [${idx + 1}] ${url}`)
      })
    }
    console.log(`   Pattern: ${t.pattern}`)
    console.log(`   Active: ${t.active}`)
    console.log()
  })

  // 𝕏ポストテンプレートを探す
  const xpostTemplate = templates?.find(t => t.title.includes('ポスト') || t.title.includes('𝕏'))

  if (!xpostTemplate) {
    console.log('⚠️ 𝕏ポストテンプレートが見つかりません')
    return
  }

  console.log('\n📌 𝕏ポストテンプレート:')
  console.log(`   ID: ${xpostTemplate.id}`)
  console.log(`   Title: ${xpostTemplate.title}`)
  console.log(`   URLs: ${JSON.stringify(xpostTemplate.urls)}`)
  console.log(`   URLs length: ${xpostTemplate.urls?.length || 0}`)

  // URLsが空なら修復
  if (!xpostTemplate.urls || xpostTemplate.urls.length === 0) {
    console.log('\n⚠️ URLsが空です。修復しますか？')
    console.log('\n修復用SQL:')
    console.log(`
UPDATE recurring_templates
SET
  urls = '[
    "list:1769487534948794610 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies",
    "list:1778669827957358973 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies"
  ]'::jsonb,
  updated_at = NOW()
WHERE id = '${xpostTemplate.id}'
RETURNING id, title, urls;
    `)

    // 実際に修復を実行
    const correctUrls = [
      "list:1769487534948794610 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies",
      "list:1778669827957358973 -filter:nativeretweets -filter:retweets -filter:quote -filter:replies"
    ]

    const { data: updated, error: updateError } = await supabase
      .from('recurring_templates')
      .update({
        urls: correctUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', xpostTemplate.id)
      .select()
      .single()

    if (updateError) {
      console.error('\n❌ 修復エラー:', updateError)
    } else {
      console.log('\n✅ 修復成功！')
      console.log('   更新後のURLs:', JSON.stringify(updated.urls))
    }
  } else {
    console.log('\n✅ URLsは正常です')
  }
}

checkAndFixTemplate()

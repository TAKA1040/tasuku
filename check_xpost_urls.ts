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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkXPostUrls() {
  console.log('🔍 𝕏ポストのURLを確認します...\n')

  // 1. すべてのテンプレートを確認
  const { data: allTemplates, error: allError } = await supabase
    .from('recurring_templates')
    .select('id, title')

  if (allError) {
    console.error('❌ テンプレート一覧取得エラー:', allError)
    return
  }

  console.log('📋 すべてのテンプレート:')
  allTemplates?.forEach(t => console.log(`  - ${t.title} (${t.id})`))
  console.log()

  // 2. 𝕏ポストを検索（部分一致）
  const xpostTemplate = allTemplates?.find(t => t.title.includes('ポスト'))
  if (!xpostTemplate) {
    console.error('❌ 𝕏ポストテンプレートが見つかりません')
    return
  }

  // 3. 詳細を取得
  const { data: templates, error: templateError } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('id', xpostTemplate.id)
    .single()

  if (templateError) {
    console.error('❌ テンプレート取得エラー:', templateError)
    return
  }

  console.log('📋 テンプレート情報:')
  console.log('  ID:', templates.id)
  console.log('  Title:', templates.title)
  console.log('  URLs:', templates.urls)
  console.log('  URLs type:', typeof templates.urls)
  console.log('  URLs is array:', Array.isArray(templates.urls))
  console.log('  URLs JSON:', JSON.stringify(templates.urls))
  console.log()

  // 2. 今日のタスクを確認
  const today = new Date().toISOString().split('T')[0]
  const { data: tasks, error: taskError } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('recurring_template_id', templates.id)
    .eq('due_date', today)
    .eq('completed', false)
    .single()

  if (taskError) {
    console.error('❌ タスク取得エラー:', taskError)
    return
  }

  console.log('📝 今日のタスク情報:')
  console.log('  ID:', tasks.id)
  console.log('  Title:', tasks.title)
  console.log('  URLs:', tasks.urls)
  console.log('  URLs type:', typeof tasks.urls)
  console.log('  URLs is array:', Array.isArray(tasks.urls))
  console.log('  URLs JSON:', JSON.stringify(tasks.urls))
  console.log()

  // 3. 比較
  const match = JSON.stringify(templates.urls) === JSON.stringify(tasks.urls)
  console.log('🔄 比較結果:')
  console.log('  一致:', match ? '✅' : '❌')
  console.log('  テンプレート:', JSON.stringify(templates.urls))
  console.log('  タスク:', JSON.stringify(tasks.urls))
}

checkXPostUrls()

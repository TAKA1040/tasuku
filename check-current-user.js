const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ ユーザー取得エラー:', error);
    console.log('\n⚠️ ログインしていません。ブラウザでログインしているユーザーIDを確認してください。');
    return;
  }

  if (!user) {
    console.log('❌ ユーザーが見つかりません');
    return;
  }

  console.log('========================================');
  console.log('👤 現在のユーザー情報:');
  console.log('========================================');
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Created: ${user.created_at}`);

  // このユーザーのテンプレートを確認
  const { data: templates, error: templateError } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('user_id', user.id);

  if (templateError) {
    console.error('\n❌ テンプレート取得エラー:', templateError);
  } else {
    console.log(`\n📋 このユーザーのテンプレート数: ${templates?.length || 0}件`);

    if (templates && templates.length > 0) {
      console.log('\n✅ テンプレートが存在します:');
      templates.forEach(t => {
        console.log(`   - ${t.title} (pattern: ${t.pattern}, start_time: ${t.start_time || 'なし'})`);
      });
    }
  }
}

checkCurrentUser().catch(console.error);

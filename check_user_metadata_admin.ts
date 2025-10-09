import { createClient } from '@supabase/supabase-js';

// Service role key で RLS をバイパス
const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key-placeholder'
);

async function checkUserMetadataAdmin() {
  console.log('🔍 user_metadata テーブル確認（管理者権限）\n');

  const { data, error } = await supabase
    .from('user_metadata')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ エラー:', error);
    console.log('\n⚠️ SERVICE_ROLE_KEY が設定されていない可能性があります');
    console.log('  .env.local に SUPABASE_SERVICE_ROLE_KEY を設定してください\n');
  } else {
    console.log(`📋 レコード数: ${data?.length || 0}件\n`);

    if (data && data.length > 0) {
      data.forEach((record, index) => {
        console.log(`[${index + 1}]`);
        console.log(`  user_id: ${record.user_id}`);
        console.log(`  key: ${record.key}`);
        console.log(`  value: ${record.value}`);
        console.log(`  created_at: ${record.created_at}`);
        console.log(`  updated_at: ${record.updated_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️ user_metadataテーブルにレコードが1件もありません\n');
      console.log('これは以下のいずれかを意味します:');
      console.log('  1. 日次処理が一度も実行されていない');
      console.log('  2. updateLastGenerationDate() が失敗している');
      console.log('  3. テーブルが存在しない');
    }
  }
}

checkUserMetadataAdmin();

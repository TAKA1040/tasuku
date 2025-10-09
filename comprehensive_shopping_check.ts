import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function comprehensiveCheck() {
  console.log('='.repeat(60));
  console.log('買い物タスク日次処理 - 包括的調査');
  console.log('='.repeat(60));
  console.log('');

  // 1. completed_atの正確な値とフォーマット確認
  console.log('【1】completed_atの詳細確認');
  console.log('-'.repeat(60));
  const { data: task } = await supabase
    .from('unified_tasks')
    .select('id, title, completed, completed_at, created_at, updated_at')
    .eq('title', '買い物テスト10/7')
    .single();

  if (task) {
    console.log('タスクID:', task.id);
    console.log('completed:', task.completed);
    console.log('completed_at 値:', task.completed_at);
    console.log('completed_at 型:', typeof task.completed_at);
    console.log('completed_at 長さ:', task.completed_at?.length);
    console.log('created_at:', task.created_at);
    console.log('updated_at:', task.updated_at);

    // 日付比較のテスト
    const testDate1 = '2025-10-07';
    const testDate2 = '2025-10-08';
    console.log('\n比較テスト:');
    console.log(`  "${task.completed_at}" >= "${testDate1}":`, task.completed_at >= testDate1);
    console.log(`  "${task.completed_at}" <= "${testDate1}":`, task.completed_at <= testDate1);
    console.log(`  "${task.completed_at}" >= "${testDate2}":`, task.completed_at >= testDate2);
    console.log(`  "${task.completed_at}" <= "${testDate2}":`, task.completed_at <= testDate2);
  }
  console.log('');

  // 2. processCompletedShoppingTasksの検索クエリを再現
  console.log('【2】processCompletedShoppingTasks クエリ再現');
  console.log('-'.repeat(60));

  const startDate = '2025-10-08'; // lastProcessed + 1
  const today = '2025-10-08';

  console.log('検索条件:');
  console.log(`  category = '買い物'`);
  console.log(`  completed = true`);
  console.log(`  completed_at >= '${startDate}'`);
  console.log(`  completed_at <= '${today}'`);
  console.log('');

  const { data: shoppingTasks, error } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('category', '買い物')
    .eq('completed', true)
    .gte('completed_at', startDate)
    .lte('completed_at', today);

  if (error) {
    console.error('❌ クエリエラー:', error);
  } else {
    console.log(`結果: ${shoppingTasks?.length || 0}件`);
    shoppingTasks?.forEach(t => {
      console.log(`  - ${t.title} (completed_at: ${t.completed_at})`);
    });
  }
  console.log('');

  // 3. 別の日付範囲でテスト
  console.log('【3】別の日付範囲でテスト');
  console.log('-'.repeat(60));

  const testRanges = [
    { start: '2025-10-07', end: '2025-10-07', label: '10-07のみ' },
    { start: '2025-10-07', end: '2025-10-08', label: '10-07〜10-08' },
    { start: '2025-10-06', end: '2025-10-08', label: '10-06〜10-08' },
  ];

  for (const range of testRanges) {
    const { data, error } = await supabase
      .from('unified_tasks')
      .select('title, completed_at')
      .eq('category', '買い物')
      .eq('completed', true)
      .gte('completed_at', range.start)
      .lte('completed_at', range.end);

    if (error) {
      console.log(`  ${range.label}: エラー - ${error.message}`);
    } else {
      console.log(`  ${range.label}: ${data?.length || 0}件`);
      data?.forEach(t => console.log(`    - ${t.title} (${t.completed_at})`));
    }
  }
  console.log('');

  // 4. user_metadataの全レコード確認
  console.log('【4】user_metadata 全レコード');
  console.log('-'.repeat(60));
  const { data: allMeta, error: metaError } = await supabase
    .from('user_metadata')
    .select('*');

  if (metaError) {
    console.error('❌ user_metadataエラー:', metaError);
  } else {
    console.log(`レコード数: ${allMeta?.length || 0}件`);
    allMeta?.forEach(m => {
      console.log(`  - key: "${m.key}", value: "${m.value}", user_id: ${m.user_id}`);
    });
  }
  console.log('');

  // 5. 日次処理の実行履歴（ログから推測）
  console.log('【5】他の買い物タスクの処理状況');
  console.log('-'.repeat(60));
  const { data: allShoppingTasks } = await supabase
    .from('unified_tasks')
    .select('title, due_date, completed, completed_at, memo')
    .eq('category', '買い物')
    .order('due_date', { ascending: false })
    .limit(10);

  allShoppingTasks?.forEach(t => {
    const hasMarker = t.memo?.includes('[繰り越し処理済み]');
    console.log(`  ${t.completed ? '✓' : '□'} ${t.title} (${t.due_date})`);
    console.log(`     完了日時: ${t.completed_at || 'なし'}`);
    console.log(`     処理済み: ${hasMarker ? 'あり' : 'なし'}`);
  });
  console.log('');

  // 6. サブタスクの詳細確認
  console.log('【6】サブタスクの詳細確認');
  console.log('-'.repeat(60));
  if (task) {
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('*')
      .eq('parent_task_id', task.id);

    console.log(`サブタスク数: ${subtasks?.length || 0}件`);
    subtasks?.forEach((s, i) => {
      console.log(`  [${i+1}] ${s.completed ? '✓' : '□'} "${s.title}"`);
      console.log(`       ID: ${s.id}`);
      console.log(`       sort_order: ${s.sort_order}`);
      console.log(`       created_at: ${s.created_at}`);
    });
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('調査完了');
  console.log('='.repeat(60));
}

comprehensiveCheck();

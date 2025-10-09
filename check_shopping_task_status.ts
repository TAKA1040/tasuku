import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkShoppingTaskStatus() {
  console.log('🔍 買い物テスト10/7 の詳細状態確認\n');

  // 1. タスク本体の詳細情報取得
  const { data: task, error: taskError } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('title', '買い物テスト10/7')
    .single();

  if (taskError) {
    console.error('❌ タスク取得エラー:', taskError.message);
    return;
  }

  console.log('📋 タスク本体情報:');
  console.log('  ID:', task.id);
  console.log('  タイトル:', task.title);
  console.log('  カテゴリ:', task.category);
  console.log('  期日:', task.due_date);
  console.log('  完了:', task.completed);
  console.log('  完了日時:', task.completed_at);
  console.log('  メモ:', task.memo);
  console.log('  作成日時:', task.created_at);
  console.log('  更新日時:', task.updated_at);
  console.log('');

  // 2. サブタスク（買い物リスト）を取得
  const { data: subtasks, error: subtasksError } = await supabase
    .from('subtasks')
    .select('*')
    .eq('parent_task_id', task.id)
    .order('sort_order', { ascending: true });

  if (subtasksError) {
    console.error('❌ サブタスク取得エラー:', subtasksError.message);
  } else {
    console.log(`📝 サブタスク（買い物リスト）: ${subtasks?.length || 0}件\n`);
    subtasks?.forEach((sub, index) => {
      console.log(`  [${index + 1}] ${sub.completed ? '✓' : '□'} ${sub.title}`);
    });
    console.log('');

    // 未完了のサブタスクをカウント
    const incompleteCount = subtasks?.filter(s => !s.completed).length || 0;
    console.log(`  未完了サブタスク: ${incompleteCount}件\n`);
  }

  // 3. 処理済みマーカーのチェック
  const hasProcessedMarker = task.memo?.includes('[繰り越し処理済み]');
  console.log('🔍 処理状態チェック:');
  console.log('  [繰り越し処理済み]マーカー:', hasProcessedMarker ? 'あり ✓' : 'なし ✗');
  console.log('');

  // 4. 繰り越されたタスクが存在するかチェック
  if (subtasks && subtasks.length > 0) {
    const incompleteSubtasks = subtasks.filter(s => !s.completed);

    if (incompleteSubtasks.length > 0) {
      console.log('🔍 繰り越しタスクを検索中...\n');

      for (const sub of incompleteSubtasks) {
        const { data: rolledOver, error: rolloverError } = await supabase
          .from('unified_tasks')
          .select('*')
          .eq('title', sub.title)
          .eq('due_date', '2999-12-31')
          .eq('category', '買い物');

        if (rolloverError) {
          console.error(`❌ 繰り越しタスク検索エラー (${sub.title}):`, rolloverError.message);
        } else if (rolledOver && rolledOver.length > 0) {
          console.log(`  ✓ 繰り越し済み: "${sub.title}"`);
          console.log(`    → タスクID: ${rolledOver[0].id}`);
          console.log(`    → 作成: ${rolledOver[0].created_at}`);
        } else {
          console.log(`  ✗ 未繰り越し: "${sub.title}"`);
        }
      }
    }
  }

  // 5. 日次処理の最終実行日時をチェック
  console.log('\n🔍 日次処理の最終実行日:');
  const { data: metadata, error: metaError } = await supabase
    .from('user_metadata')
    .select('*')
    .eq('key', 'last_task_generation');

  if (metaError) {
    console.error('❌ メタデータ取得エラー:', metaError.message);
  } else if (metadata && metadata.length > 0) {
    console.log('  最終実行日:', metadata[0].value);
  } else {
    console.log('  最終実行日: 記録なし');
  }
}

checkShoppingTaskStatus();

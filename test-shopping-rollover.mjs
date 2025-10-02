import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

async function testShoppingRollover() {
  const lastProcessed = '2025-10-01';
  const today = '2025-10-03';
  const startDate = addDays(lastProcessed, 1);

  console.log(`\n🛒 買い物タスク処理テスト: ${startDate}〜${today}に完了したタスクをチェック\n`);

  // 完了した買い物タスクを取得
  const { data: completedShoppingTasks, error } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('category', '買い物')
    .eq('completed', true)
    .gte('completed_at', `${startDate}T00:00:00`)
    .lt('completed_at', `${addDays(today, 1)}T00:00:00`);

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  if (!completedShoppingTasks || completedShoppingTasks.length === 0) {
    console.log('✅ 期間内に完了した買い物タスクなし');
    return;
  }

  console.log(`📋 ${completedShoppingTasks.length}件の買い物タスクを発見:\n`);

  for (const task of completedShoppingTasks) {
    console.log(`\n━━━ タスク: ${task.title} ━━━`);
    console.log(`  ID: ${task.id}`);
    console.log(`  完了日時: ${task.completed_at}`);

    // サブタスクを取得
    const { data: subtasks } = await supabase
      .from('subtasks')
      .select('*')
      .eq('parent_task_id', task.id);

    const uncompletedSubtasks = subtasks?.filter(st => !st.completed) || [];

    console.log(`  サブタスク: ${subtasks?.length || 0}個（未完了: ${uncompletedSubtasks.length}個）`);

    if (uncompletedSubtasks.length > 0) {
      console.log(`  未完了アイテム:`);
      uncompletedSubtasks.forEach(st => console.log(`    - ${st.title}`));
    }

    // 重複チェック
    const { data: existingRollover } = await supabase
      .from('unified_tasks')
      .select('id, title, created_at')
      .eq('title', task.title)
      .eq('category', '買い物')
      .eq('due_date', '2999-12-31')
      .eq('completed', false)
      .limit(1);

    if (existingRollover && existingRollover.length > 0) {
      console.log(`  ⚠️  重複チェック: 繰り越し済みと判定（既存タスクID: ${existingRollover[0].id}）`);
      console.log(`      → 処理がスキップされます`);
    } else {
      console.log(`  ✅ 重複チェック: OK`);
      if (uncompletedSubtasks.length > 0) {
        console.log(`      → 新しいタスクを作成して ${uncompletedSubtasks.length}個のアイテムを繰り越すべき`);
      } else {
        console.log(`      → 未完了アイテムがないため、処理不要`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━\n');
}

testShoppingRollover();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function analyzePerformance() {
  console.log('\n🔍 パフォーマンス分析開始\n');

  // 1. unified_tasksテーブルのレコード数
  console.log('━━━ 1. データ量チェック ━━━');
  const { count: totalTasks } = await supabase
    .from('unified_tasks')
    .select('*', { count: 'exact', head: true });
  console.log(`📊 total tasks: ${totalTasks}`);

  const { count: completedTasks } = await supabase
    .from('unified_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('completed', true);
  console.log(`✅ completed tasks: ${completedTasks}`);

  const { count: incompleteTasks } = await supabase
    .from('unified_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('completed', false);
  console.log(`❌ incomplete tasks: ${incompleteTasks}`);

  // 2. subtasksテーブルのレコード数
  const { count: totalSubtasks } = await supabase
    .from('subtasks')
    .select('*', { count: 'exact', head: true });
  console.log(`🛒 total subtasks: ${totalSubtasks}`);

  // 3. 今日のタスク取得速度
  console.log('\n━━━ 2. 今日のタスク取得速度 ━━━');
  const today = new Date().toISOString().split('T')[0];

  const start1 = performance.now();
  const { data: todayTasks } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('due_date', today)
    .eq('completed', false);
  const end1 = performance.now();
  console.log(`⏱️  today tasks query: ${(end1 - start1).toFixed(2)}ms (${todayTasks?.length || 0} records)`);

  // 4. やることリスト取得速度
  console.log('\n━━━ 3. やることリスト取得速度 ━━━');
  const start2 = performance.now();
  const { data: ideaTasks } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('due_date', '2999-12-31')
    .eq('completed', false);
  const end2 = performance.now();
  console.log(`⏱️  idea tasks query: ${(end2 - start2).toFixed(2)}ms (${ideaTasks?.length || 0} records)`);

  // 5. 完了タスク（直近30日）取得速度
  console.log('\n━━━ 4. 完了タスク取得速度 ━━━');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const start3 = performance.now();
  const { data: doneTasks } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('completed', true)
    .gte('completed_at', thirtyDaysAgoStr);
  const end3 = performance.now();
  console.log(`⏱️  done tasks query: ${(end3 - start3).toFixed(2)}ms (${doneTasks?.length || 0} records)`);

  // 6. 買い物タスクのサブタスク取得速度
  console.log('\n━━━ 5. サブタスク取得速度 ━━━');
  const { data: shoppingTasks } = await supabase
    .from('unified_tasks')
    .select('id')
    .eq('category', '買い物')
    .limit(5);

  if (shoppingTasks && shoppingTasks.length > 0) {
    const start4 = performance.now();
    for (const task of shoppingTasks) {
      await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', task.id);
    }
    const end4 = performance.now();
    console.log(`⏱️  subtasks query (×${shoppingTasks.length}): ${(end4 - start4).toFixed(2)}ms`);
    console.log(`   平均: ${((end4 - start4) / shoppingTasks.length).toFixed(2)}ms/task`);
  }

  // 7. インデックスの確認提案
  console.log('\n━━━ 6. 推奨される最適化 ━━━');
  if (totalTasks > 1000) {
    console.log('⚠️  タスク数が1000件を超えています');
    console.log('   推奨: インデックスの追加 (due_date, completed, category)');
  }
  if (totalSubtasks > 500) {
    console.log('⚠️  サブタスク数が500件を超えています');
    console.log('   推奨: インデックスの追加 (parent_task_id)');
  }

  const avgQueryTime = (end1 - start1 + end2 - start2 + end3 - start3) / 3;
  if (avgQueryTime > 200) {
    console.log('⚠️  平均クエリ時間が200msを超えています');
    console.log('   推奨: データベース最適化、ページネーション導入');
  } else if (avgQueryTime > 100) {
    console.log('💡 平均クエリ時間: ' + avgQueryTime.toFixed(2) + 'ms (許容範囲内)');
  } else {
    console.log('✅ 平均クエリ時間: ' + avgQueryTime.toFixed(2) + 'ms (良好)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━\n');
}

analyzePerformance();

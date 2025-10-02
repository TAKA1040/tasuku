import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkTask() {
  // タスクを検索
  const { data: tasks, error: taskError } = await supabase
    .from('unified_tasks')
    .select('id, title, category, due_date, completed')
    .eq('title', 'タスクcheckあり１子タスク達成3回目')
    .eq('category', '買い物')
    .eq('due_date', '2025-10-02')
    .limit(1);

  if (taskError) {
    console.error('Task error:', taskError);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log('タスクが見つかりません');
    return;
  }

  console.log('=== タスク情報 ===');
  console.log(JSON.stringify(tasks[0], null, 2));

  // 買い物リストを取得
  const { data: subtasks, error: subtaskError } = await supabase
    .from('subtasks')
    .select('id, title, completed, created_at')
    .eq('parent_task_id', tasks[0].id)
    .order('created_at', { ascending: true });

  if (subtaskError) {
    console.error('Subtask error:', subtaskError);
    return;
  }

  console.log('\n=== 買い物リスト ===');
  console.log(JSON.stringify(subtasks, null, 2));
}

checkTask();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkCompletedAt() {
  const { data, error } = await supabase
    .from('unified_tasks')
    .select('id, title, completed, completed_at, created_at')
    .eq('title', 'タスクcheckあり１子タスク達成3回目')
    .eq('category', '買い物')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('エラー:', error);
    return;
  }

  console.log('\n=== タスクcheckあり１子タスク達成3回目 の全レコード ===\n');
  data?.forEach((task, index) => {
    console.log(`[${index + 1}]`);
    console.log(`  ID: ${task.id}`);
    console.log(`  作成日時: ${task.created_at}`);
    console.log(`  完了: ${task.completed}`);
    console.log(`  完了日時: ${task.completed_at || '(null)'}`);
    console.log('');
  });
}

checkCompletedAt();

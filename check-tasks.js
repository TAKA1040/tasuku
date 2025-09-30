const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wgtrffjwdtytqgqybjwx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  // まず全タスクを確認
  const { data: allTasks, error: allError } = await supabase
    .from('unified_tasks')
    .select('display_number, title')
    .order('display_number', { ascending: false })
    .limit(10);

  console.log('\n=== 最新10件のタスク ===');
  console.log(allTasks?.map(t => `${t.display_number}: ${t.title}`).join('\n'));

  // T021とT023を確認
  const { data, error } = await supabase
    .from('unified_tasks')
    .select('id, display_number, title, memo, category, created_at')
    .in('display_number', ['T021', 'T023'])
    .order('display_number');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n=== Tasks 021 and 023 ===');
    if (data.length === 0) {
      console.log('データが見つかりませんでした');
    }
    data.forEach(task => {
      console.log('\n---');
      console.log('番号:', task.display_number);
      console.log('タイトル:', task.title);
      console.log('カテゴリ:', task.category);
      console.log('メモ:', task.memo || '(空)');
      console.log('作成日時:', task.created_at);
    });
  }

  // サブタスクも確認
  console.log('\n\n=== Subtasks for T021 and T023 ===');
  for (const num of ['T021', 'T023']) {
    const { data: tasks } = await supabase
      .from('unified_tasks')
      .select('id')
      .eq('display_number', num)
      .single();

    if (tasks) {
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('*')
        .eq('parent_task_id', tasks.id)
        .order('created_at');

      console.log(`\n${num} のサブタスク (${subtasks?.length || 0}件):`);
      subtasks?.forEach(st => {
        console.log(`  - ${st.title} (completed: ${st.completed})`);
      });
    }
  }
})();
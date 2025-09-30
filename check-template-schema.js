const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkSchema() {
  // テンプレート確認
  const { data: templates, error: tempError } = await supabase
    .from('recurring_templates')
    .select('*')
    .limit(1);

  console.log('📋 recurring_templatesのカラム:');
  if (tempError) {
    console.error('エラー:', tempError);
  } else if (templates && templates.length > 0) {
    console.log(Object.keys(templates[0]));
    console.log('\n📊 サンプルデータ:');
    console.log(JSON.stringify(templates[0], null, 2));
  } else {
    console.log('データなし、unified_tasksから繰り返しタスクを確認...\n');

    // 繰り返しタスクから確認
    const { data: tasks, error: taskError } = await supabase
      .from('unified_tasks')
      .select('*')
      .eq('task_type', 'RECURRING')
      .limit(1);

    if (taskError) {
      console.error('エラー:', taskError);
    } else if (tasks && tasks.length > 0) {
      console.log('📋 unified_tasks (RECURRING) のカラム:');
      console.log(Object.keys(tasks[0]));
      console.log('\n📊 サンプルデータ:');
      console.log(JSON.stringify(tasks[0], null, 2));
    }
  }
}

checkSchema();

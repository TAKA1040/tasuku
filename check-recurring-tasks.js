const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkRecurringTasks() {
  const { data: tasks } = await supabase
    .from('unified_tasks')
    .select('id, title, recurring_template_id, recurring_pattern, start_time, end_time, category, importance')
    .eq('task_type', 'RECURRING')
    .eq('user_id', '93d599a3-ebec-4eb7-995c-b9a36e8eda19')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('========================================');
  console.log('📋 現在の繰り返しタスク (最新10件):');
  console.log('========================================');

  for (const task of tasks || []) {
    console.log(`\n📌 ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   テンプレートID: ${task.recurring_template_id || 'なし'}`);
    console.log(`   パターン: ${task.recurring_pattern}`);
    console.log(`   開始時刻: ${task.start_time || 'なし'}`);
    console.log(`   終了時刻: ${task.end_time || 'なし'}`);
    console.log(`   カテゴリ: ${task.category || 'なし'}`);
    console.log(`   重要度: ${task.importance}`);
  }

  // テンプレートIDを持つタスクのテンプレートが存在するか確認
  const templateIds = [...new Set(tasks?.map(t => t.recurring_template_id).filter(Boolean))];

  if (templateIds.length > 0) {
    console.log('\n========================================');
    console.log('🔍 参照されているテンプレートID:');
    console.log('========================================');

    for (const templateId of templateIds) {
      const { data: template } = await supabase
        .from('recurring_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (template) {
        console.log(`\n✅ ${templateId}`);
        console.log(`   タイトル: ${template.title}`);
        console.log(`   開始時刻: ${template.start_time || 'なし'}`);
        console.log(`   終了時刻: ${template.end_time || 'なし'}`);
      } else {
        console.log(`\n❌ ${templateId} → テンプレートが存在しません！`);
      }
    }
  }
}

checkRecurringTasks().catch(console.error);

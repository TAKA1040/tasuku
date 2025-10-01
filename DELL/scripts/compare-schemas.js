const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function compareSchemas() {
  // 1. recurring_templates の全カラムを取得（まず件数確認）
  const { count } = await supabase
    .from('recurring_templates')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 recurring_templates 総件数: ${count}件\n`);

  // 全ユーザーのテンプレートを取得
  const { data: templatesData, error: templateError } = await supabase
    .from('recurring_templates')
    .select('*')
    .limit(5);

  if (templateError) {
    console.error('❌ テンプレート取得エラー:', templateError);
  }

  console.log(`✅ 取得したテンプレート: ${templatesData?.length || 0}件`);

  // 2. unified_tasks (RECURRING) の全カラムを取得
  const { data: tasksData } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('task_type', 'RECURRING')
    .limit(1);

  const templateFields = templatesData && templatesData.length > 0
    ? Object.keys(templatesData[0]).sort()
    : [];

  const taskFields = tasksData && tasksData.length > 0
    ? Object.keys(tasksData[0]).sort()
    : [];

  console.log('========================================');
  console.log('📋 recurring_templates のカラム:');
  console.log('========================================');
  console.log(templateFields.join('\n'));

  console.log('\n========================================');
  console.log('📋 unified_tasks (RECURRING) のカラム:');
  console.log('========================================');
  console.log(taskFields.join('\n'));

  // 3. UI編集フォームで必要なカラムをチェック
  console.log('\n========================================');
  console.log('🔍 テンプレート編集UIで必要なカラムの有無:');
  console.log('========================================');

  const requiredFields = [
    'title',
    'memo',
    'category',
    'importance',
    'start_time',
    'end_time',
    'urls',
    'pattern',
    'weekdays',
    'day_of_month',
    'month_of_year',
    'day_of_year',
    'active',
    'attachment_file_name',
    'attachment_file_type',
    'attachment_file_size',
    'attachment_file_data'
  ];

  requiredFields.forEach(field => {
    const inTemplate = templateFields.includes(field);
    const inTask = taskFields.includes(field);
    const status = inTemplate ? '✅' : '❌';
    console.log(`${status} ${field.padEnd(25)} (Template: ${inTemplate}, Task: ${inTask})`);
  });

  // 4. サンプルデータ出力
  if (templatesData && templatesData.length > 0) {
    console.log('\n========================================');
    console.log('📊 recurring_templates サンプルデータ:');
    console.log('========================================');
    console.log(JSON.stringify(templatesData[0], null, 2));
  }
}

compareSchemas().catch(console.error);

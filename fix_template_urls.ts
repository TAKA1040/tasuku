// 既存タスクのURLsをテンプレートに逆同期するスクリプト
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function fixTemplateUrls() {
  try {
    console.log('🔍 タスクからテンプレートへのURLs逆同期を開始...\n');

    // 1. URLsを持つタスクを取得
    const { data: tasks, error: tasksError } = await supabase
      .from('unified_tasks')
      .select('id, title, urls, recurring_template_id, due_date')
      .eq('task_type', 'RECURRING')
      .not('recurring_template_id', 'is', null)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('❌ タスク取得エラー:', tasksError.message);
      return;
    }

    console.log(`📋 取得したRECURRINGタスク数: ${tasks?.length || 0}\n`);

    // テンプレートIDごとにURLsをグループ化
    const templateUrls = new Map<string, string[]>();

    tasks?.forEach(task => {
      if (task.recurring_template_id && task.urls && Array.isArray(task.urls) && task.urls.length > 0) {
        if (!templateUrls.has(task.recurring_template_id)) {
          templateUrls.set(task.recurring_template_id, task.urls);
          console.log(`✅ テンプレート ${task.recurring_template_id.substring(0, 8)}... からURLs検出:`);
          console.log(`   タスク: ${task.title} (${task.due_date})`);
          console.log(`   URLs: ${JSON.stringify(task.urls)}\n`);
        }
      }
    });

    console.log(`\n🎯 URLsを持つテンプレート数: ${templateUrls.size}\n`);

    // 2. 各テンプレートにURLsを同期
    for (const [templateId, urls] of Array.from(templateUrls.entries())) {
      console.log(`🔄 テンプレート ${templateId.substring(0, 8)}... を更新中...`);

      const { error: updateError } = await supabase
        .from('recurring_templates')
        .update({ urls: urls })
        .eq('id', templateId);

      if (updateError) {
        console.error(`❌ 更新エラー (${templateId.substring(0, 8)}...):`, updateError.message);
      } else {
        console.log(`✅ 更新成功 (${templateId.substring(0, 8)}...): ${urls.length}個のURL\n`);
      }
    }

    console.log('\n🎉 URLs逆同期完了！');

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

fixTemplateUrls();

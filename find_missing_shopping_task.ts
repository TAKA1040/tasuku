import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function findTask() {
  console.log('🔍 買い物テスト10/7 を検索中...\n');

  // 1. unified_tasksテーブルで検索
  const { data: tasks, error: tasksError } = await supabase
    .from('unified_tasks')
    .select('*')
    .ilike('title', '%買い物テスト%')
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('❌ unified_tasks検索エラー:', tasksError.message);
  } else {
    console.log(`📋 unified_tasksで見つかったタスク: ${tasks?.length || 0}件\n`);
    tasks?.forEach(t => {
      console.log(`タイトル: ${t.title}`);
      console.log(`カテゴリ: ${t.category}`);
      console.log(`期日: ${t.due_date}`);
      console.log(`完了: ${t.completed}`);
      console.log(`作成: ${t.created_at}`);
      console.log(`更新: ${t.updated_at}`);
      console.log('---\n');
    });
  }

  // 2. doneテーブルで検索
  const { data: done, error: doneError } = await supabase
    .from('done')
    .select('*')
    .ilike('title', '%買い物テスト%')
    .order('completed_at', { ascending: false });

  if (doneError) {
    console.error('❌ done検索エラー:', doneError.message);
  } else {
    console.log(`📋 doneテーブルで見つかったタスク: ${done?.length || 0}件\n`);
    done?.forEach(t => {
      console.log(`タイトル: ${t.title}`);
      console.log(`期日: ${t.due_date}`);
      console.log(`完了日時: ${t.completed_at}`);
      console.log('---\n');
    });
  }

  // 3. カテゴリ「買い物」で期日2025-10-07のタスクを全検索
  const { data: shopping, error: shoppingError } = await supabase
    .from('unified_tasks')
    .select('*')
    .eq('category', '買い物')
    .eq('due_date', '2025-10-07')
    .order('created_at', { ascending: false });

  if (shoppingError) {
    console.error('❌ 買い物タスク検索エラー:', shoppingError.message);
  } else {
    console.log(`📋 買い物カテゴリ 2025-10-07: ${shopping?.length || 0}件\n`);
    shopping?.forEach(t => {
      console.log(`タイトル: ${t.title}`);
      console.log(`完了: ${t.completed}`);
      console.log(`作成: ${t.created_at}`);
      console.log('---\n');
    });
  }
}

findTask();

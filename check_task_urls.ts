import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkTaskUrls() {
  try {
    // 𝕏ポストタスクを検索
    const { data, error } = await supabase
      .from('unified_tasks')
      .select('*')
      .ilike('title', '%ポスト%')
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`\n📋 Found ${data?.length || 0} tasks\n`);

    data?.forEach((t, index) => {
      console.log(`\n[${index + 1}] ==================`);
      console.log('Display Number:', t.display_number);
      console.log('Title:', t.title);
      console.log('Due Date:', t.due_date);
      console.log('Task Type:', t.task_type);
      console.log('Template ID:', t.recurring_template_id);
      console.log('\n--- URLs Info ---');
      console.log('URLs value:', t.urls);
      console.log('URLs type:', typeof t.urls);
      console.log('URLs is null:', t.urls === null);
      console.log('URLs is undefined:', t.urls === undefined);
      console.log('URLs is array:', Array.isArray(t.urls));
      if (Array.isArray(t.urls)) {
        console.log('URLs length:', t.urls.length);
        console.log('URLs content:', JSON.stringify(t.urls, null, 2));
      }
      console.log('Created:', t.created_at);
    });

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkTaskUrls();

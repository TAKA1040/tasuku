import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkTemplateUrls() {
  try {
    // 全テンプレートを取得
    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`\n📋 Found ${data?.length || 0} templates\n`);

    data?.forEach((t, index) => {
      console.log(`\n[${index + 1}] ==================`);
      console.log('Template ID:', t.id);
      console.log('Title:', t.title);
      console.log('Pattern:', t.pattern);
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
      console.log('Updated:', t.updated_at);
    });

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkTemplateUrls();

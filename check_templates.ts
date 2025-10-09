import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wgtrffjwdtytqgqybjwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXliand4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1NjkwMTksImV4cCI6MjA3MzE0NTAxOX0.3-c7oH6UnYpaxma8cmqCSDchAn-kKwf9Kx9FCUY7IS8'
);

async function checkTemplates() {
  try {
    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`\n📋 Found ${data?.length || 0} templates\n`);

    data?.forEach((t, index) => {
      console.log(`\n[${index + 1}] ==================`);
      console.log('ID:', t.id);
      console.log('Title:', t.title);
      console.log('Category:', t.category);
      console.log('Pattern:', t.pattern);
      console.log('Active:', t.active);
      console.log('Weekdays:', t.weekdays);
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

    // 𝕏ポスト検索
    console.log('\n\n🔍 Searching for 𝕏ポスト template...');
    const xpost = data?.find(t =>
      t.title.includes('ポスト') ||
      t.title.includes('𝕏') ||
      t.title.includes('X')
    );

    if (xpost) {
      console.log('\n✅ Found 𝕏ポスト template:');
      console.log(JSON.stringify(xpost, null, 2));
    } else {
      console.log('\n⚠️ 𝕏ポストテンプレートが見つかりません');
    }

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

checkTemplates();

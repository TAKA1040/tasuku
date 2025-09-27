// 実際のローカルAPIを使ってテンプレート機能をテスト
const fetch = require('node-fetch');

async function testTemplateViaAPI() {
  console.log('🧪 Testing template creation via local API...');

  try {
    // 1. ローカルAPIにタスク作成リクエストを送信
    const taskData = {
      title: 'CLI APIテスト毎週タスク',
      category: 'テスト',
      importance: 3,
      due_date: '2025-09-27',
      task_type: 'RECURRING',
      recurring_pattern: 'WEEKLY',
      recurring_weekdays: [1, 3, 5], // 月、水、金
    };

    console.log('📝 Creating task via API:', taskData);

    const response = await fetch('http://localhost:3004/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, await response.text());
      return;
    }

    const result = await response.json();
    console.log('✅ Task created via API:', result);

    // 少し待ってからテンプレートをチェック
    setTimeout(async () => {
      try {
        console.log('🔍 Checking templates...');
        const templatesResponse = await fetch('http://localhost:3004/api/templates');
        const templatesData = await templatesResponse.json();
        console.log('📋 All templates:', templatesData);

        const matchingTemplate = templatesData.find(t => t.title === taskData.title);
        if (matchingTemplate) {
          console.log('✅ Template found!', matchingTemplate);

          // weekdaysの表示テスト
          if (matchingTemplate.weekdays && matchingTemplate.weekdays.length > 0) {
            const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
            const selectedDays = matchingTemplate.weekdays.map(d => dayNames[d - 1]).join('、');
            console.log(`📅 Pattern display: 毎週 ${selectedDays}曜日`);
          }
        } else {
          console.log('❌ No matching template found');
        }
      } catch (error) {
        console.error('❌ Template check error:', error);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testTemplateViaAPI();
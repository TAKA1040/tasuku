// Test script to manually add URLs to a template for testing
// Run this in browser console on the templates page

// Function to test URL insertion
function testUrlInsertion() {
  console.log('🧪 テストURL挿入開始');

  // Get first template from the page
  const templates = document.querySelector('table');
  if (!templates) {
    console.error('テンプレートテーブルが見つかりません');
    return;
  }

  console.log('✅ テンプレートテーブル発見');
  console.log('📊 現在のテンプレート数:', templates.querySelectorAll('tbody tr').length);

  // Look for edit buttons
  const editButtons = document.querySelectorAll('button');
  const templateEditButtons = Array.from(editButtons).filter(btn =>
    btn.textContent.includes('編集') || btn.textContent.includes('Edit')
  );

  console.log('🔧 編集ボタン数:', templateEditButtons.length);

  if (templateEditButtons.length > 0) {
    console.log('✅ 最初のテンプレートを編集モードで開きます');
    templateEditButtons[0].click();

    setTimeout(() => {
      // Look for URL input
      const urlInputs = document.querySelectorAll('input[type="url"]');
      console.log('🔗 URL入力フィールド数:', urlInputs.length);

      if (urlInputs.length > 0) {
        console.log('✅ URL入力フィールド発見');
        const testUrl = 'https://example.com/test-' + Date.now();
        urlInputs[0].value = testUrl;
        console.log('📝 テストURL設定:', testUrl);

        // Trigger input event
        urlInputs[0].dispatchEvent(new Event('input', { bubbles: true }));

        // Look for add button
        const addButtons = document.querySelectorAll('button');
        const urlAddButton = Array.from(addButtons).find(btn =>
          btn.textContent.includes('追加') || btn.textContent.includes('Add')
        );

        if (urlAddButton) {
          console.log('✅ URL追加ボタン発見、クリックします');
          urlAddButton.click();
        } else {
          console.warn('⚠️ URL追加ボタンが見つかりません');
        }
      } else {
        console.error('❌ URL入力フィールドが見つかりません');
      }
    }, 1000);
  } else {
    console.error('❌ 編集ボタンが見つかりません');
  }
}

// Auto-run the test
testUrlInsertion();
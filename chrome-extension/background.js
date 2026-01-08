// 右クリックメニューを追加
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-inbox',
    title: '📥 TASUKUのInboxに保存',
    contexts: ['page', 'link', 'selection']
  })
})

// 右クリックメニューのクリックイベント
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let title, url

  if (info.linkUrl) {
    // リンクを右クリック
    title = info.selectionText || info.linkUrl
    url = info.linkUrl
  } else if (info.selectionText) {
    // テキスト選択して右クリック
    title = info.selectionText
    url = tab.url
  } else {
    // ページ全体を右クリック
    title = tab.title
    url = tab.url
  }

  // 保存処理（popup.jsと同じロジック）
  await saveToInboxFromBackground(title, url, tab.id)
})

// Background Scriptから保存
async function saveToInboxFromBackground(title, url, _tabId) {
  try {
    const SUPABASE_URL = 'https://wgtrffjwdtytqgqybjwx.supabase.co'
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXlianciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNjMyNzk2MywiZXhwIjoyMDQxOTAzOTYzfQ.fE-gJDGCnPv3pD71KRKP3vaNOG8yGNBH7Efi7TfV-Fs'

    const data = await chrome.storage.local.get(['supabase_session'])
    const session = data.supabase_session

    if (!session || !session.access_token) {
      // ログインページを開く
      chrome.tabs.create({ url: 'https://tasuku.apaf.me/inbox' })
      return
    }

    const displayNumber = `T${String(Date.now()).slice(-3).padStart(3, '0')}`

    const response = await fetch(`${SUPABASE_URL}/rest/v1/unified_tasks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        title,
        urls: [url],
        task_type: 'INBOX',
        due_date: '2999-12-31',
        display_number: displayNumber,
        completed: false,
        archived: false,
        user_id: session.user.id
      })
    })

    if (response.ok) {
      // 通知を表示
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'TASUKU Inbox',
        message: '✅ Inboxに保存しました！'
      })
    } else {
      console.error('保存エラー:', await response.text())
    }
  } catch (error) {
    console.error('保存エラー:', error)
  }
}

// セッション取得リクエストに応答
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSession') {
    chrome.storage.local.get(['supabase_session'], (data) => {
      sendResponse({ session: data.supabase_session })
    })
    return true // 非同期レスポンス
  }
})

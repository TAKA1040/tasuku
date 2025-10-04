// Supabase設定（本番環境）
const SUPABASE_URL = 'https://wgtrffjwdtytqgqybjwx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndHJmZmp3ZHR5dHFncXlianciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNjMyNzk2MywiZXhwIjoyMDQxOTAzOTYzfQ.fE-gJDGCnPv3pD71KRKP3vaNOG8yGNBH7Efi7TfV-Fs'

// ローカル開発用（必要に応じて切り替え）
// const INBOX_URL = 'http://localhost:3000/inbox'
const INBOX_URL = 'https://tasuku.apaf.me/inbox'

let currentTab = null

// ページ情報を取得
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  currentTab = tab
  document.getElementById('pageTitle').textContent = tab.title
  document.getElementById('pageUrl').textContent = tab.url
})

// URL解析
function parseContent(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = text.match(urlRegex) || []

  let title = text.replace(urlRegex, '').trim()
  if (!title && urls.length > 0) {
    title = urls[0]
  }

  return { title, urls }
}

// Inboxに保存
async function saveToInbox(title, urls) {
  try {
    // ローカルストレージからアクセストークンを取得
    const data = await chrome.storage.local.get(['supabase_session'])
    const session = data.supabase_session

    if (!session || !session.access_token) {
      showStatus('error', 'ログインが必要です。TASUKUにログインしてください。')
      setTimeout(() => {
        chrome.tabs.create({ url: INBOX_URL })
      }, 2000)
      return
    }

    // display_numberを生成（簡易版：T + タイムスタンプ下3桁）
    const displayNumber = `T${String(Date.now()).slice(-3).padStart(3, '0')}`

    // Supabase APIでタスク作成
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
        urls: urls.length > 0 ? urls : null,
        task_type: 'INBOX',
        due_date: '2999-12-31',
        display_number: displayNumber,
        completed: false,
        archived: false,
        user_id: session.user.id
      })
    })

    if (response.ok) {
      showStatus('success', '✅ Inboxに保存しました！')
      setTimeout(() => {
        window.close()
      }, 1500)
    } else {
      const error = await response.text()
      console.error('保存エラー:', error)
      showStatus('error', '保存に失敗しました。TASUKUにログインしていますか？')
    }
  } catch (error) {
    console.error('保存エラー:', error)
    showStatus('error', `エラー: ${error.message}`)
  }
}

// ステータス表示
function showStatus(type, message) {
  const statusDiv = document.getElementById('status')
  statusDiv.className = `status ${type}`
  statusDiv.textContent = message
  statusDiv.style.display = 'block'
}

// ワンクリック保存
document.getElementById('saveCurrentBtn').addEventListener('click', async () => {
  if (!currentTab) return

  document.getElementById('saveCurrentBtn').disabled = true
  document.getElementById('saveCurrentBtn').textContent = '保存中...'

  await saveToInbox(currentTab.title, [currentTab.url])
})

// カスタム保存
document.getElementById('saveCustomBtn').addEventListener('click', async () => {
  const content = document.getElementById('customContent').value.trim()
  if (!content) return

  const parsed = parseContent(content)

  document.getElementById('saveCustomBtn').disabled = true
  document.getElementById('saveCustomBtn').textContent = '保存中...'

  await saveToInbox(parsed.title, parsed.urls)
})

// Ctrl+Enter でカスタム保存
document.getElementById('customContent').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    document.getElementById('saveCustomBtn').click()
  }
})

// Inboxページを開く
document.getElementById('openInboxBtn').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: INBOX_URL })
  window.close()
})

// セッション同期（TASUKUのページが開いている場合）
chrome.runtime.sendMessage({ action: 'getSession' }, (response) => {
  if (response && response.session) {
    chrome.storage.local.set({ supabase_session: response.session })
  }
})

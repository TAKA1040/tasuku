export const metadata = {
  title: 'Tasuku - 予定管理ツール',
  description: 'シンプルな日次タスク管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ 
        margin: 0, 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', 
        backgroundColor: '#f8fafc' 
      }}>
        {children}
      </body>
    </html>
  )
}

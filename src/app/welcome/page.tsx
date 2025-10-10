'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function WelcomePage() {
  useEffect(() => {
    document.title = 'TASUKU - 完全無料のタスク管理ツール'
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      color: '#ffffff'
    }}>
      {/* ヒーローセクション */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 'bold',
          marginBottom: '24px',
          letterSpacing: '0.1em'
        }}>
          TASUKU
        </h1>
        <p style={{
          fontSize: 'clamp(18px, 4vw, 28px)',
          marginBottom: '16px',
          fontWeight: '500'
        }}>
          毎日のタスクを、もっとシンプルに。
        </p>
        <p style={{
          fontSize: 'clamp(14px, 3vw, 18px)',
          marginBottom: '48px',
          opacity: 0.9
        }}>
          完全無料のタスク管理ツール
        </p>

        <Link
          href="/today"
          style={{
            display: 'inline-block',
            padding: '16px 48px',
            fontSize: '20px',
            fontWeight: 'bold',
            backgroundColor: '#ffffff',
            color: '#3b82f6',
            borderRadius: '50px',
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
        >
          🚀 無料で始める
        </Link>

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          opacity: 0.8
        }}>
          ※ アカウント登録不要ですぐに使えます
        </p>
      </section>

      {/* 特徴セクション */}
      <section style={{
        padding: '80px 20px',
        backgroundColor: '#ffffff',
        color: '#1f2937'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            textAlign: 'center',
            marginBottom: '64px',
            fontWeight: 'bold',
            color: '#3b82f6'
          }}>
            TASUKUの特徴
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {/* 特徴1 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                繰り返しタスク自動生成
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                毎日・毎週のルーティンタスクを自動で生成。「毎朝8時ゴミ出し」「毎週月曜定例会議」など、一度設定すれば自動で表示されます。
              </p>
            </div>

            {/* 特徴2 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                時間軸ソート
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                今日のタスクを🌅9時まで、☀️13時まで、🌤️18時まで、🌙24時までの4つの時間枠で表示。時間を意識した効率的な行動ができます。
              </p>
            </div>

            {/* 特徴3 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                買い物リスト管理
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                買い忘れを防ぐチェックリスト機能。買えなかった商品は自動で次回に繰り越し。スーパーで確認しながらチェックできます。
              </p>
            </div>

            {/* 特徴4 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                URL機能
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                Zoomリンク、参考資料など複数のURLを登録。🌍アイコンから個別に開けるので、会議前の準備がスムーズです。
              </p>
            </div>

            {/* 特徴5 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                統計・達成度可視化
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                完了タスク数の推移グラフ、カテゴリ別統計、繰り返しタスク達成率を確認。継続のモチベーションがアップします。
              </p>
            </div>

            {/* 特徴6 */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3b82f6' }}>
                モバイル完全対応
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.7 }}>
                スマホでも快適に使えるレスポンシブデザイン。外出先でもサクサク操作。タップしやすい大きめのボタンを採用しています。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        color: '#ffffff'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            textAlign: 'center',
            marginBottom: '48px',
            fontWeight: 'bold'
          }}>
            3ステップで始められます
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                backgroundColor: '#ffffff',
                color: '#3b82f6',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                  「無料で始める」をクリック
                </h3>
                <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                  アカウント登録不要。Googleログインで即座に使い始められます。
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                backgroundColor: '#ffffff',
                color: '#3b82f6',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                  タスクを追加
                </h3>
                <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                  「+ タスク追加」から通常タスクまたは繰り返しタスクを作成。カテゴリや重要度も設定できます。
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '24px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                backgroundColor: '#ffffff',
                color: '#3b82f6',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                  チェックして完了
                </h3>
                <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
                  タスクを達成したらチェックボックスをクリック。統計ページで達成度を確認できます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*
        ⚠️ SYNC NOTICE: このセクションはHELPページ（/help）の簡易版です
        HELPページ（src/app/help/page.tsx）を修正した場合は、このセクションも同時に更新してください
        主要な機能説明、操作方法の変更があった場合は必ず同期が必要です
      */}
      {/* 簡易版使い方ガイド */}
      <section id="how-to-use" style={{
        padding: '80px 20px',
        backgroundColor: '#ffffff',
        color: '#1f2937'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            textAlign: 'center',
            marginBottom: '16px',
            fontWeight: 'bold',
            color: '#3b82f6'
          }}>
            使い方ガイド
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '64px',
            fontSize: '16px'
          }}>
            TASUKUの基本的な使い方をご紹介します
          </p>

          {/* タスクの作成 */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: '#1f2937',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '8px'
            }}>
              📝 タスクの作成
            </h3>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#059669'
                }}>
                  📅 通常タスク
                </h4>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  特定の日付に実行するタスクです。<br />
                  例：「1/15 会議資料準備」「～1/20 報告書提出」
                </p>
              </div>

              <div style={{
                backgroundColor: '#eff6ff',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #bfdbfe'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#2563eb'
                }}>
                  🔄 繰り返しタスク
                </h4>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  毎日・毎週・毎月・毎年のパターンで自動生成されるタスクです。<br />
                  例：「毎朝8:00 ゴミ出し」「毎週月曜 定例会議」<br />
                  <strong style={{ color: '#2563eb' }}>一度設定すれば自動で表示されます！</strong>
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '12px',
                color: '#4b5563'
              }}>
                設定できる項目
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#374151',
                lineHeight: 1.8
              }}>
                <li><strong>タスク名</strong>：何をするか</li>
                <li><strong>期日</strong>：いつやるか（繰り返しタスクは不要）</li>
                <li><strong>カテゴリ</strong>：仕事/買い物/プライベート等</li>
                <li><strong>重要度</strong>：1～5（数字が大きいほど重要）</li>
                <li><strong>開始・終了時間</strong>：時間軸ソートに使用</li>
                <li><strong>URL</strong>：参考リンク（最大5個）</li>
                <li><strong>買い物リスト</strong>：カテゴリ「買い物」選択時</li>
              </ul>
            </div>
          </div>

          {/* 主要機能 */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: '#1f2937',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '8px'
            }}>
              ✨ 主要機能
            </h3>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 時間軸ソート */}
              <div style={{
                backgroundColor: '#fef3c7',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#92400e'
                }}>
                  ⏰ 時間軸ソート
                </h4>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '12px' }}>
                  今日のタスクを4つの時間枠で自動分類します：
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#374151',
                  lineHeight: 1.8
                }}>
                  <li>🌅 <strong>9時まで</strong>（朝の準備）</li>
                  <li>☀️ <strong>13時まで</strong>（午前中）</li>
                  <li>🌤️ <strong>18時まで</strong>（午後）</li>
                  <li>🌙 <strong>24時まで</strong>（夜）</li>
                </ul>
                <p style={{
                  color: '#92400e',
                  marginTop: '12px',
                  marginBottom: 0,
                  fontWeight: 'bold'
                }}>
                  「今やるべきこと」が一目瞭然！
                </p>
              </div>

              {/* 買い物リスト */}
              <div style={{
                backgroundColor: '#fce7f3',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #fbcfe8'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#9f1239'
                }}>
                  🛒 買い物リスト管理
                </h4>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                  チェックリスト形式で商品管理。買えなかった商品は自動で翌日繰り越し。
                </p>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: '#9f1239' }}>使い方：</strong> カテゴリで「買い物」を選択→商品名を入力→スーパーでチェック
                </p>
              </div>

              {/* URL機能 */}
              <div style={{
                backgroundColor: '#dbeafe',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #bfdbfe'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#1e40af'
                }}>
                  🌍 URL機能
                </h4>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                  タスクに最大5個のURLを登録。🌍アイコンから個別に開けます。
                </p>
                <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>
                  <strong style={{ color: '#1e40af' }}>用途：</strong> Zoomリンク、参考資料、Googleドキュメントなど
                </p>
              </div>
            </div>
          </div>

          {/* より詳しく */}
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '32px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px solid #d1d5db'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              より詳しい使い方を知りたい方へ
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: 1.7
            }}>
              各ページの詳細な使い方、セキュリティ情報、よくある質問など<br />
              完全版のマニュアルをご用意しています。
            </p>
            <Link
              href="/help"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              📖 完全版マニュアルを見る
            </Link>
          </div>
        </div>
      </section>

      {/* 無料強調セクション */}
      <section style={{
        padding: '80px 20px',
        backgroundColor: '#1f2937',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 6vw, 42px)',
            marginBottom: '24px',
            fontWeight: 'bold'
          }}>
            完全無料で使えます
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 3vw, 20px)',
            marginBottom: '16px',
            opacity: 0.9,
            lineHeight: 1.7
          }}>
            TASUKUは完全無料のタスク管理ツールです。<br />
            隠れた料金や制限はありません。
          </p>
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            opacity: 0.7,
            lineHeight: 1.7
          }}>
            すべての機能を無制限に利用できます。<br />
            アップグレードプランや課金要素は一切ありません。
          </p>

          <div style={{
            marginTop: '48px',
            padding: '24px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            border: '2px solid rgba(59, 130, 246, 0.3)'
          }}>
            <p style={{ fontSize: '16px', margin: 0, lineHeight: 1.7 }}>
              💡 現在β版テスト運用中です。<br />
              フィードバックをお待ちしています！
            </p>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 6vw, 42px)',
          marginBottom: '32px',
          fontWeight: 'bold'
        }}>
          今すぐ始めましょう
        </h2>
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          marginBottom: '48px',
          opacity: 0.9
        }}>
          アカウント登録不要・完全無料
        </p>

        <Link
          href="/today"
          style={{
            display: 'inline-block',
            padding: '20px 64px',
            fontSize: '24px',
            fontWeight: 'bold',
            backgroundColor: '#ffffff',
            color: '#3b82f6',
            borderRadius: '50px',
            textDecoration: 'none',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
        >
          🚀 TASUKUを始める
        </Link>

        <div style={{ marginTop: '48px' }}>
          <a
            href="#how-to-use"
            style={{
              color: '#ffffff',
              textDecoration: 'underline',
              fontSize: '16px',
              opacity: 0.8,
              cursor: 'pointer'
            }}
          >
            📖 使い方ガイドを見る
          </a>
        </div>
      </section>

      {/* フッター */}
      <footer style={{
        padding: '32px 20px',
        backgroundColor: '#111827',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>
          © 2025 TASUKU - 完全無料のタスク管理ツール
        </p>
      </footer>
    </div>
  )
}

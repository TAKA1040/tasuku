'use client';

import Link from 'next/link';
import { ArrowLeft, Printer, FileText, Image, QrCode, Share2, Sliders, Grid3X3, Copy, Download } from 'lucide-react';

export default function LabelMakerManualPage() {
  const sections = [
    {
      id: 'basic',
      icon: <Grid3X3 size={24} />,
      title: '基本操作',
      content: [
        {
          subtitle: '用紙レイアウトを選ぶ',
          description: '画面上部のプルダウンから、お使いのシール用紙に合ったレイアウトを選択します。A-ONE、コクヨ、エーワンなど主要メーカーの型番に対応しています。'
        },
        {
          subtitle: 'シールを編集する',
          description: '左側のシール一覧から編集したいシールをクリックすると、詳細設定パネルが開きます。テキスト、フォント、色、画像などを設定できます。'
        },
        {
          subtitle: '全シールに一括適用',
          description: '1枚目のシールを編集後、「全シールに適用」ボタンを押すと、同じデザインを全シールにコピーできます。'
        }
      ]
    },
    {
      id: 'text',
      icon: <FileText size={24} />,
      title: 'テキスト設定',
      content: [
        {
          subtitle: 'フォントとサイズ',
          description: 'フォント（ゴシック、明朝、丸ゴシック等）、文字サイズ、文字色を設定できます。'
        },
        {
          subtitle: '配置（縦・横）',
          description: 'テキストの縦方向（上・中央・下）と横方向（左・中央・右）の位置を指定できます。'
        },
        {
          subtitle: '行間・字間・字下げ',
          description: '詳細設定で行間（1.0〜2.5）、字間（-2〜5px）、字下げ（0〜20px）を調整できます。複数行のテキストをきれいに整えるのに便利です。'
        }
      ]
    },
    {
      id: 'image',
      icon: <Image size={24} />,
      title: '画像設定',
      content: [
        {
          subtitle: '画像のアップロード',
          description: '「画像を選択」ボタンまたはドラッグ&ドロップ、Ctrl+Vでペーストして画像を追加できます。'
        },
        {
          subtitle: '画像の位置とサイズ',
          description: '画像の縦位置（上・中央・下）、横位置（左・中央・右）、サイズ（10〜100%）を設定できます。'
        },
        {
          subtitle: '回転・ズーム・オフセット',
          description: '画像の回転（0°/90°/180°/270°）、ズーム（50〜200%）、X/Yオフセット（-50〜+50%）で微調整できます。「リセット」ボタンで初期値に戻せます。'
        }
      ]
    },
    {
      id: 'qrcode',
      icon: <QrCode size={24} />,
      title: 'QRコード',
      content: [
        {
          subtitle: 'QRコードの生成',
          description: 'テキスト入力欄にURL等を入力すると、自動的にQRコードが生成されます。'
        },
        {
          subtitle: 'サイズと位置',
          description: 'QRコードのサイズ（20〜100%）と位置（上・中央・下）を設定できます。'
        },
        {
          subtitle: '可変データとの組み合わせ',
          description: '差し込み印刷機能と組み合わせると、各シールごとに異なるQRコードを生成できます。'
        }
      ]
    },
    {
      id: 'variable',
      icon: <Copy size={24} />,
      title: '可変データ印刷',
      content: [
        {
          subtitle: 'CSVデータの読み込み',
          description: '「CSVファイル選択」でデータを読み込むと、各行のデータが各シールに自動で差し込まれます。'
        },
        {
          subtitle: 'プレースホルダー',
          description: 'テキスト欄に {列名} の形式で記入すると、CSVの該当列の値に置換されます。例: {名前}様'
        },
        {
          subtitle: '通番の付与',
          description: '開始番号とフォーマット（例: No.001）を指定すると、各シールに連番を自動付与できます。'
        }
      ]
    },
    {
      id: 'multipage',
      icon: <FileText size={24} />,
      title: '複数ページ・部数',
      content: [
        {
          subtitle: '部数指定',
          description: '同じ内容を複数部印刷したい場合、部数を指定できます。'
        },
        {
          subtitle: 'ページ指定',
          description: '開始ページと終了ページを指定して、特定のページのみ印刷できます。'
        },
        {
          subtitle: 'スキップ機能',
          description: 'シール一覧で「スキップ」ボタンを押すと、そのシールを空白にできます。途中から印刷したい場合に便利です。'
        }
      ]
    },
    {
      id: 'guide',
      icon: <Sliders size={24} />,
      title: 'ガイド出力',
      content: [
        {
          subtitle: 'カットマーク',
          description: '用紙の四隅と中央にカットマークを印刷します。切り取り位置の目安になります。'
        },
        {
          subtitle: 'センターライン',
          description: '用紙の中心を示す破線を印刷します。位置合わせの確認に使えます。'
        },
        {
          subtitle: 'テストパターン',
          description: '10mm単位のテストパターンを印刷します。実際の印刷サイズを確認できます。'
        }
      ]
    },
    {
      id: 'printer',
      icon: <Printer size={24} />,
      title: 'プリンタ設定',
      content: [
        {
          subtitle: '余白・オフセット調整',
          description: '上下左右の余白とオフセットを0.1mm単位で調整できます。印刷位置がずれる場合に修正します。'
        },
        {
          subtitle: 'プリンタプロファイル',
          description: 'DPI、明度、コントラスト、枠線などの設定をプロファイルとして保存できます。プリンタごとに最適な設定を記録しておけます。'
        },
        {
          subtitle: '較正ウィザード',
          description: 'テストパターンを印刷して、実際のズレ量を入力すると、自動的にオフセットを計算・保存します。'
        }
      ]
    },
    {
      id: 'preset',
      icon: <Share2 size={24} />,
      title: 'プリセット・共有',
      content: [
        {
          subtitle: 'プリセットの保存',
          description: '現在の用紙レイアウトと余白設定をプリセットとして保存できます。よく使う設定を登録しておくと便利です。'
        },
        {
          subtitle: 'プリセットのエクスポート',
          description: '「コードをコピー」ボタンで設定を文字列としてコピーできます。他の人に共有する際に使えます。'
        },
        {
          subtitle: 'プリセットのインポート',
          description: '「インポート」欄に共有コード（SEAL:で始まる文字列）を貼り付けると、設定を読み込めます。'
        }
      ]
    },
    {
      id: 'output',
      icon: <Download size={24} />,
      title: '出力',
      content: [
        {
          subtitle: '印刷',
          description: '「印刷」ボタンでブラウザの印刷ダイアログを開きます。用紙サイズをA4、倍率を100%に設定してください。'
        },
        {
          subtitle: 'PDF保存',
          description: '「PDF保存」ボタンでPDFファイルとしてダウンロードできます。印刷前の確認や配布用に便利です。'
        },
        {
          subtitle: 'テンプレート保存',
          description: '作成したデザインをテンプレートとして保存できます。次回以降、同じデザインをすぐに呼び出せます。'
        }
      ]
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <Link
            href="/tools/label-maker"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'white',
              textDecoration: 'none',
              transition: 'background 0.2s'
            }}
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0
            }}>
              🏷️ シール職人 マニュアル
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              margin: '4px 0 0 0'
            }}>
              A4シール用紙に印刷できるラベル作成ツール
            </p>
          </div>
        </div>

        {/* 目次 */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#374151',
            margin: '0 0 16px 0'
          }}>
            📖 目次
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '8px'
          }}>
            {sections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#4b5563',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
              >
                <span style={{ color: '#6366f1' }}>{section.icon}</span>
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* クイックスタート */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '0 0 16px 0'
          }}>
            🚀 クイックスタート
          </h2>
          <ol style={{
            margin: 0,
            paddingLeft: '20px',
            lineHeight: '2'
          }}>
            <li><strong>用紙を選ぶ</strong> - お使いのシール用紙の型番を選択</li>
            <li><strong>シールを編集</strong> - テキストや画像を入力</li>
            <li><strong>全シールに適用</strong> - 同じデザインを全シールにコピー（任意）</li>
            <li><strong>印刷/PDF保存</strong> - 完成したら印刷またはPDF出力</li>
          </ol>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            💡 <strong>ヒント:</strong> 初めての場合は、まず1枚テスト印刷して位置を確認することをおすすめします。
          </div>
        </div>

        {/* 各セクション */}
        {sections.map(section => (
          <div
            key={section.id}
            id={section.id}
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                {section.icon}
              </div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                {section.title}
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {section.content.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    borderLeft: '4px solid #6366f1'
                  }}
                >
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 8px 0'
                  }}>
                    {item.subtitle}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0,
                    lineHeight: '1.7'
                  }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* FAQ */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 20px 0'
          }}>
            ❓ よくある質問
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#92400e', margin: '0 0 8px 0' }}>
                Q: 印刷位置がずれます
              </h3>
              <p style={{ fontSize: '14px', color: '#78350f', margin: 0, lineHeight: '1.6' }}>
                A: プリンタ設定の「余白・オフセット調整」でズレを補正してください。「較正ウィザード」を使うと、テストパターンから自動計算できます。
              </p>
            </div>
            <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>
                Q: 自分の用紙サイズがありません
              </h3>
              <p style={{ fontSize: '14px', color: '#1e3a8a', margin: 0, lineHeight: '1.6' }}>
                A: 「カスタム」レイアウトを選択して、シールの幅・高さ・列数・行数・余白を手動で設定してください。設定はプリセットとして保存できます。
              </p>
            </div>
            <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#166534', margin: '0 0 8px 0' }}>
                Q: CSVの文字化けが起きます
              </h3>
              <p style={{ fontSize: '14px', color: '#14532d', margin: 0, lineHeight: '1.6' }}>
                A: CSVファイルをUTF-8形式で保存してください。Excelの場合は「CSV UTF-8（コンマ区切り）」を選択して保存します。
              </p>
            </div>
            <div style={{ padding: '16px', background: '#f3e8ff', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#6b21a8', margin: '0 0 8px 0' }}>
                Q: 画像が粗く印刷されます
              </h3>
              <p style={{ fontSize: '14px', color: '#581c87', margin: 0, lineHeight: '1.6' }}>
                A: 元画像の解像度が低い可能性があります。300dpi以上の画像を使用することをおすすめします。プリンタ設定でDPIを上げることもできます。
              </p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          <Link
            href="/tools/label-maker"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'white',
              color: '#6366f1',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            🏷️ シール職人を使う
          </Link>
          <p style={{ marginTop: '16px' }}>
            © TASUKU - シール職人
          </p>
        </div>
      </div>
    </div>
  );
}
